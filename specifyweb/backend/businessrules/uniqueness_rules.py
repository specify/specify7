
from functools import reduce
import logging
import json
from typing import Any, TypedDict
from collections.abc import Iterable

from django.apps import apps
from django.db import connections, router, transaction
from django.db.models import Q, Count, Exists, OuterRef, F, Func
from django.db import models as dj_models
from django.db.migrations.recorder import MigrationRecorder
from django.core.exceptions import ObjectDoesNotExist, FieldDoesNotExist
from specifyweb.specify.api.crud import get_model
from specifyweb.specify.datamodel import datamodel
from specifyweb.middleware.general import serialize_django_obj
from specifyweb.specify.models import Discipline
from specifyweb.specify.utils.scoping import in_same_scope
from .orm_signal_handler import orm_signal_handler
from .exceptions import BusinessRuleException
from . import models

class JSONUniquenessRule(TypedDict): 
    rule: tuple[list[str], list[str]]
    isDatabaseConstraint: bool

DEFAULT_UNIQUENESS_RULES:  dict[str, list[JSONUniquenessRule]] = json.load(
    open('specifyweb/backend/businessrules/uniqueness_rules.json'))

UNIQUENESS_DISPATCH_UID = 'uniqueness-rules'


NO_FIELD_VALUE = {}


logger = logging.getLogger(__name__)


def resolve_model_field(model, field_path: str):
    current_model = model
    resolved_field = None
    for part in field_path.split('__'):
        try:
            resolved_field = current_model._meta.get_field(part)
        except FieldDoesNotExist:
            return None
        remote_field = getattr(resolved_field, 'remote_field', None)
        remote_model = getattr(remote_field, 'model', None) if remote_field else None
        if remote_model is not None:
            current_model = remote_model
    return resolved_field


def apply_case_sensitive_filters(queryset, model, matchable, filter_kwargs):
    annotations: dict[str, Func] = {}
    transformed_filters: dict[str, object] = {}

    case_sensitive_field_types = (
        dj_models.CharField,
        dj_models.TextField,
        dj_models.SlugField,
        dj_models.EmailField,
        dj_models.UUIDField,
    )

    for index, (field_path, value) in enumerate(matchable.items()):
        if not isinstance(value, str):
            continue
        resolved_field = resolve_model_field(model, field_path)
        if isinstance(resolved_field, case_sensitive_field_types):
            alias = f"__binary_filter__{index}"
            annotations[alias] = Func(
                F(field_path),
                function='BINARY',
                output_field=dj_models.TextField(),
            )
            transformed_filters[alias] = value
            filter_kwargs.pop(field_path, None)

    if annotations:
        queryset = queryset.annotate(**annotations)

    return queryset, transformed_filters


@orm_signal_handler('pre_save', None, dispatch_uid=UNIQUENESS_DISPATCH_UID)
def validate_unique(model, instance):
    """
    Before a model instance is saved, check whether saving the model would 
    break any uniqueness rules. 
    If the model is in violation of any rules, raise a BusinessRuleException
    """
    model_name = instance.__class__.__name__
    cannonical_model = get_model(model_name)

    if not cannonical_model:
        # The model is not a Specify Model
        # probably a Django-specific model
        # Skip logging for Migration class to not pollute migration log output
        if model_name != "Migration":
            logger.info(
                f"Skipping uniqueness rule check on non-Specify model: '{model_name}'")
        return

    applied_migrations = MigrationRecorder(
        connections['default']).applied_migrations()

    for migration in applied_migrations:
        app, migration_name = migration
        if app == 'businessrules' and migration_name == '0001_initial':
            break
    else:
        return

    # We can't directly use the main app registry in the context of migrations, which uses fake models
    registry = model._meta.apps

    UniquenessRule = registry.get_model('businessrules', 'UniquenessRule')
    UniquenessRuleField = registry.get_model(
        'businessrules', 'UniquenessRuleField')

    rules = UniquenessRule.objects.filter(modelName=model_name)
    for rule in rules:
        rule_fields = UniquenessRuleField.objects.filter(uniquenessrule=rule)
        if not rule_is_global(tuple(field.fieldPath for field in rule_fields.filter(isScope=True))) \
            and not in_same_scope(rule, instance):
            continue

        field_names = [
            field.fieldPath.lower() for field in rule_fields.filter(isScope=False)]

        _scope = rule_fields.filter(isScope=True)
        scope = None if len(_scope) == 0 else _scope[0]

        all_fields = [*field_names]

        if scope is not None:
            all_fields.append(scope.fieldPath.lower())

        def get_matchable(instance):
            def best_match_or_none(field_name: str):
                try:
                    return field_path_with_value(instance, model_name, field_name, NO_FIELD_VALUE)
                except ObjectDoesNotExist:
                    return None

            matchable = {}
            field_mapping = {}
            for field in all_fields:
                matched_or_none = best_match_or_none(field)
                if matched_or_none is not None:
                    field_mapping[field] = matched_or_none[0]
                    matchable[matched_or_none[0]] = matched_or_none[1]

            return field_mapping, matchable

        def get_exception(conflicts, matchable, field_map):
            error_message = '{} must have unique {}'.format(model_name,
                                                            join_with_and(field_names))

            response = {"table": model_name,
                        "localizationKey": "fieldNotUnique"
                        if scope is None
                        else "childFieldNotUnique",
                        "fieldName": ','.join(field_names),
                        "fieldData": serialize_multiple_django(matchable, field_map, field_names),
                        }

            if scope is not None:
                error_message += f' in {scope.fieldPath.lower()}'
                response.update({
                    "parentField": scope.fieldPath,
                    "parentData": serialize_multiple_django(matchable, field_map, [scope.fieldPath.lower()])
                })
            response['conflicting'] = list(
                conflicts.values_list('id', flat=True)[:100])
            return BusinessRuleException(error_message, response)

        match_result = get_matchable(instance)
        if match_result is None:
            continue

        field_map, matchable = match_result
        if len(matchable.keys()) == 0 or set(all_fields) != set(field_map.keys()):
            continue

        conflicts_query = model.objects.only('id')

        connection = connections['default']

        filter_kwargs = dict(matchable)

        apply_case_sensitive = connection.vendor == 'mysql' and not rule.isDatabaseConstraint

        if apply_case_sensitive:
            conflicts_query, transformed_filters = apply_case_sensitive_filters(
                conflicts_query,
                model,
                matchable,
                filter_kwargs,
            )
            if transformed_filters:
                filter_kwargs.update(transformed_filters)

        conflicts = conflicts_query.filter(**filter_kwargs)
        if instance.id is not None:
            conflicts = conflicts.exclude(id=instance.id)
        if conflicts:
            raise get_exception(conflicts, matchable, field_map)


class ViolatedUniquenessCheck(TypedDict):
    duplicates: int
    # Mapping of field names to detected duplicate values
    fields: dict[str, Any]


class UniquenessCheck(TypedDict):
    totalDuplicates: int
    fields: list[ViolatedUniquenessCheck]


def check_uniqueness(model_name: str, raw_fields: list[str], raw_scopes: list[str], registry=None) \
    -> UniquenessCheck | None:
    """
    Given a model, a list of fields, and a list of scopes, check whether there
    are models of model_name which have duplicate values of fields in scopes. 
    Returns None if model_name is invalid.
    """
    table = datamodel.get_table(model_name)
    django_model = get_model(model_name, registry or apps)
    if table is None or django_model is None:
        return None
    fields = [field.lower() for field in raw_fields]
    scopes = [scope.lower() for scope in raw_scopes]

    required_fields = {field: table.get_field(
        field).required for field in fields}

    strict_filters = Q()
    for field, is_required in required_fields.items():
        if not is_required:
            strict_filters &= (~Q(**{f"{field}": None}))

    for scope in scopes:
        strict_filters &= (~Q(**{f"{scope}": None}))

    all_fields = [*fields, *scopes]

    duplicates_field = '__duplicates'

    db_alias = router.db_for_read(django_model)
    connection = connections[db_alias]

    queryset = django_model.objects
    value_fields: list[str] = [*all_fields]

    if connection.vendor == 'mysql':
        case_sensitive_field_types = (
            dj_models.CharField,
            dj_models.TextField,
            dj_models.SlugField,
            dj_models.EmailField,
            dj_models.UUIDField,
        )

        binary_annotations: dict[str, Func] = {}
        for index, field in enumerate(all_fields):
            resolved_field = resolve_model_field(django_model, field)
            if isinstance(resolved_field, case_sensitive_field_types):
                alias = f"__binary__{index}"
                binary_annotations[alias] = Func(
                    F(field),
                    function='BINARY',
                    output_field=dj_models.TextField(),
                )
                value_fields.append(alias)

        if binary_annotations:
            queryset = queryset.annotate(**binary_annotations)

    duplicates = (
        queryset
        .values(*value_fields)
        .annotate(**{duplicates_field: Count('id')})
        .filter(strict_filters)
        .filter(**{f"{duplicates_field}__gt": 1})
        .order_by(f'-{duplicates_field}')
    )

    total_duplicates = sum(duplicate[duplicates_field]
                           for duplicate in duplicates)

    final = {
        "totalDuplicates": total_duplicates,
        "fields": [
            {
                "duplicates": duplicate[duplicates_field],
                "fields": {
                    field: duplicate[field]
                    for field in all_fields
                },
            }
            for duplicate in duplicates
        ],
    }
    return final


def field_path_with_value(instance, model_name: str, field_path: str, default):
    object_or_field = reduce(lambda obj, field: getattr(
        obj, field, default), field_path.split('__'), instance)

    if object_or_field is default:
        return None

    if object_or_field is None:
        if '__' in field_path or hasattr(object_or_field, 'id'):
            return None

        table = datamodel.get_table(model_name)
        if table is None:
            return None

        field = table.get_field(field_path)
        field_required = field.required if field is not None else False
        if not field_required:
            return None

    return field_path, object_or_field


def serialize_multiple_django(matchable, field_map, fields):
    return {field: serialize_django_obj(matchable[field_map[field]])
            for field in fields}


def join_with_and(fields):
    return ' and '.join(fields)

def apply_default_uniqueness_rules(discipline, registry=None):
    for table, rules in DEFAULT_UNIQUENESS_RULES.items():
        model_name = getattr(datamodel.get_table(table), "django_name", None)
        if model_name is None:
            continue
        for rule in rules:
            fields, scopes = rule["rule"]
            isDatabaseConstraint = rule["isDatabaseConstraint"]

            create_uniqueness_rule(model_name, discipline, isDatabaseConstraint, fields, scopes, registry)


def create_uniqueness_rule(model_name, raw_discipline, is_database_constraint, fields, scopes, registry=None):
    UniquenessRule = registry.get_model(
        'businessrules', 'UniquenessRule') if registry else models.UniquenessRule
    UniquenessRuleField = registry.get_model(
        'businessrules', 'UniquenessRuleField') if registry else models.UniquenessRuleField
    
    discipline = None if rule_is_global(scopes) else raw_discipline

    candidate_rules = UniquenessRule.objects.filter(modelName=model_name,
                                                    isDatabaseConstraint=is_database_constraint,
                                                    discipline=discipline)

    for rule in candidate_rules:
        all_fields = rule.uniquenessrulefield_set.all()
        matching_fields = all_fields.filter(fieldPath__in=fields, isScope=False)
        matching_scopes = all_fields.filter(fieldPath__in=scopes, isScope=True)
        # If the rule already exists, skip creating the rule
        if len(matching_fields) == len(fields) and len(matching_scopes) == len(scopes): 
            return

    logger.info(f"Creating uniqueness rule on {model_name} with fields {fields} and scopes {scopes} for the discipline {discipline.name if discipline else 'Global'}")
    rule = UniquenessRule.objects.create(
        discipline=discipline,
        modelName=model_name,
        isDatabaseConstraint=is_database_constraint
    )

    for field in fields:
        UniquenessRuleField.objects.create(uniquenessrule=rule, fieldPath=field, isScope=False)
    for scope in scopes:
        UniquenessRuleField.objects.create(uniquenessrule=rule, fieldPath=scope, isScope=True)

def remove_uniqueness_rule(model_name, raw_discipline, is_database_constraint, fields, scopes, registry=None):
    UniquenessRule = registry.get_model(
        'businessrules', 'UniquenessRule') if registry else models.UniquenessRule
    UniquenessRuleField = registry.get_model(
        'businessrules', 'UniquenessRuleField') if registry else models.UniquenessRuleField

    discipline = None if rule_is_global(scopes) else raw_discipline

    candidate_rules = UniquenessRule.objects.filter(
        modelName=model_name, isDatabaseConstraint=is_database_constraint, discipline=discipline)

    rule_ids = []
    for rule in candidate_rules: 
        all_fields = rule.uniquenessrulefield_set.all()
        matching_fields = all_fields.filter(fieldPath__in=fields, isScope=False)
        matching_scopes = all_fields.filter(fieldPath__in=scopes, isScope=True)
        # If the rule exists, add it to the list of rules to be deleted
        if len(matching_fields) == len(fields) and len(matching_scopes) == len(scopes): 
            rule_ids.append(rule.id)

    UniquenessRuleField.objects.filter(
        uniquenessrule__id__in=rule_ids).delete()
    UniquenessRule.objects.filter(id__in=rule_ids).delete()


"""If a uniqueness rule has a scope which traverses through a hiearchy 
relationship scoped above the discipline level, that rule should not be 
scoped to discipline and instead be global
"""
GLOBAL_RULE_FIELDS = ["division", 'institution']

def rule_is_global(scopes: Iterable[str]) -> bool:
    return len(scopes) == 0 \
        or any(any(scope_field.lower() in GLOBAL_RULE_FIELDS for scope_field in scope.split('__')) for scope in scopes)

def fix_global_default_rules(registry=None):
    UniquenessRule = registry.get_model('businessrules', 'UniquenessRule') \
        if registry \
        else models.UniquenessRule
    UniquenessRuleField = registry.get_model('businessrules', 'UniquenessRuleField') \
        if registry \
        else models.UniquenessRuleField

    global_rule_fields = UniquenessRuleField.objects.filter(
        uniquenessrule__discipline__isnull=True
    ).values(
        "uniquenessrule__modelName",
        "uniquenessrule__isDatabaseConstraint",
        "fieldPath",
        "isScope",
    )

    global_rule_exists = UniquenessRule.objects.filter(
        discipline__isnull=True,
        modelName=OuterRef("modelName"),
        isDatabaseConstraint=OuterRef("isDatabaseConstraint"),
    )

    discipline_ids = (
        UniquenessRule.objects.exclude(discipline__isnull=True)
        .values_list("discipline_id", flat=True)
        .distinct()
    )

    for discipline_id in discipline_ids:
        with transaction.atomic():
            # Delete matching fields for this discipline
            matching_fields_qs = UniquenessRuleField.objects.filter(
                uniquenessrule__discipline_id=discipline_id
            ).filter(
                Exists(
                    global_rule_fields.filter(
                        **{
                            "uniquenessrule__modelName": OuterRef("uniquenessrule__modelName"),
                            "uniquenessrule__isDatabaseConstraint": OuterRef("uniquenessrule__isDatabaseConstraint"),
                            "fieldPath": OuterRef("fieldPath"),
                            "isScope": OuterRef("isScope"),
                        }
                    )
                )
            )
            matching_fields_qs.delete()

            # Delete UniquenessRule rows for this discipline that are now empty
            empty_rules_qs = (
                UniquenessRule.objects.filter(discipline_id=discipline_id)
                .annotate(field_count=Count("uniquenessrulefield"))
                .filter(field_count=0)  # now empty after field deletions
                .filter(Exists(global_rule_exists))
            )
            empty_rules_qs.delete()

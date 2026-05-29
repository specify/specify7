
from functools import reduce
import logging
import json
from contextlib import contextmanager
from contextvars import ContextVar
from dataclasses import dataclass
from typing import Any, TypedDict, Iterable

from django.apps import apps
from django.db import connections, router, transaction
from django.db.models import Q, Count, Exists, OuterRef, F, Func
from django.db import models as dj_models
from django.db.migrations.recorder import MigrationRecorder
from django.core.exceptions import ObjectDoesNotExist, FieldDoesNotExist
from specifyweb.specify.api.crud import get_model
from specifyweb.specify.datamodel import datamodel
from specifyweb.middleware.general import serialize_django_obj
from specifyweb.backend.cache.thread import ThreadCache
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


@dataclass(frozen=True)
class CachedUniquenessRule:
    rule: Any
    field_names: tuple[str, ...]
    scope_fields: tuple[str, ...]
    all_fields: tuple[str, ...]
    scope: str | None
    is_database_constraint: bool
    is_global: bool
    discipline_id: int | None


_uniqueness_rule_cache = ThreadCache[tuple[int, str], list[CachedUniquenessRule]](
    ContextVar(
        "uniqueness_rule_cache",
        default=None
    )
)

_uniqueness_migration_cache = ThreadCache[str, bool](
    ContextVar(
        "uniqueness_migration_cache",
        default=None,
    )
)

@contextmanager
def cache_uniqueness_rules():
    with (
        _uniqueness_rule_cache.activate(),
        _uniqueness_migration_cache.activate()
    ):
        yield


def resolve_model_field(model, field_path: str):
    current_model = model
    resolved_field = None
    for part in field_path.split('__'):
        try:
            resolved_field = current_model._meta.get_field(part)
        except FieldDoesNotExist:
            return None
        remote_field = getattr(resolved_field, 'remote_field', None)
        remote_model = getattr(remote_field, 'model',
                               None) if remote_field else None
        if remote_model is not None:
            current_model = remote_model
    return resolved_field


def _initial_businessrules_migration_applied():
    return any(
        app == "businessrules" and migration_name == "0001_initial"
        for app, migration_name in MigrationRecorder(
            connections["default"]
        ).applied_migrations()
    )


def _cached_businessrules_migration_applied() -> bool:
    cache_key = "default"
    cache_is_active, is_set = _uniqueness_migration_cache.get(cache_key, default=False)
    if cache_is_active and is_set:
        return True
    # If the cache is not active or the business rule migration is not applied,
    # then check whether it is applied in the DB
    is_applied = _initial_businessrules_migration_applied()
    # If the migration has been applied and the cache is active, store the
    # result so future lookups can bypass hitting the database (a migration
    # generally wouldn't be reversed while Specify is running)
    if cache_is_active and is_applied:
        _uniqueness_migration_cache.set(cache_key, is_applied)

    return is_applied


def _fetch_uniquenessrules_for_cache(registry, model_name) -> list[CachedUniquenessRule]:
    cached_rules: list[CachedUniquenessRule] = []
    UniquenessRule = registry.get_model("businessrules", "UniquenessRule")
    rules = (
        UniquenessRule.objects
        .filter(modelName=model_name)
        .select_related("discipline")
        .prefetch_related("uniquenessrulefield_set")
    )

    for rule in rules:
        rule_fields = tuple(rule.uniquenessrulefield_set.all())
        scope_fields = tuple(
            field.fieldPath for field in rule_fields if field.isScope
        )
        field_names = tuple(
            field.fieldPath.lower() for field in rule_fields if not field.isScope
        )
        scope = scope_fields[0] if scope_fields else None
        all_fields = (
            *field_names,
            *(scope_field.lower() for scope_field in scope_fields),
        )
        cached_rules.append(
            CachedUniquenessRule(
                rule=rule,
                field_names=field_names,
                scope_fields=scope_fields,
                all_fields=all_fields,
                scope=scope,
                is_database_constraint=rule.isDatabaseConstraint,
                is_global=rule_is_global(scope_fields),
                discipline_id=rule.discipline_id,
            )
        )
    return cached_rules


def _get_uniqueness_rule_configs(registry, model_name: str) -> list[CachedUniquenessRule]:
    def fetch_rules(): return _fetch_uniquenessrules_for_cache(registry, model_name)
    cache_key = (id(registry), model_name)
    return _uniqueness_rule_cache.get_or_set(cache_key, fetch_rules)


def _rule_applies_to_instance(rule: CachedUniquenessRule, instance) -> bool:
    if rule.is_global:
        return True
    # REFACTOR: Find some way to generally cache lookups for hierarchy tables,
    # especially for Collection and Discipline.
    return in_same_scope(rule.rule, instance)


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

    if not _cached_businessrules_migration_applied():
        return

    # We can't directly use the main app registry in the context of migrations, which uses fake models
    registry = model._meta.apps

    # REFACTOR(perf): We should look into batching UniquenessRule queries.
    # That is, instead of making a query to the DB for each rule, aggregate
    # the rules and make a "single" query.
    # We should be able to use QuerySet annotations for this, which would also
    # enable us to differentiate which rules are violated. e.g.:
    #  conflicts = model.objects.annotate(
    #               rule1=Exists(model.objects.filter(catalognumber="something")),
    #               rule2=Exists(...),
    #               ...
    #             ).filter(
    #               Q(rule1=True)
    #               | Q(rule2=True),
    #               ...)
    for rule in _get_uniqueness_rule_configs(registry, model_name):
        if not _rule_applies_to_instance(rule, instance):
            continue

        def get_matchable(instance):
            def best_match_or_none(field_name: str):
                try:
                    return field_path_with_value(instance, model_name, field_name, NO_FIELD_VALUE)
                except ObjectDoesNotExist:
                    return None

            matchable = {}
            field_mapping = {}
            for field in rule.all_fields:
                matched_or_none = best_match_or_none(field)
                if matched_or_none is not None:
                    field_mapping[field] = matched_or_none[0]
                    matchable[matched_or_none[0]] = matched_or_none[1]

            return field_mapping, matchable

        def get_exception(conflicts, matchable, field_map):
            error_message = '{} must have unique {}'.format(
                model_name, join_with_and(rule.field_names))

            response = {"table": model_name,
                        "localizationKey": "fieldNotUnique"
                        if rule.scope is None
                        else "childFieldNotUnique",
                        "fieldName": ','.join(rule.field_names),
                        "fieldData": serialize_multiple_django(matchable, field_map, rule.field_names),
                        }

            if rule.scope is not None:
                error_message += f' in {rule.scope.lower()}'
                response.update({
                    "parentField": rule.scope,
                    "parentData": serialize_multiple_django(matchable, field_map, [rule.scope.lower()])
                })
            response['conflicting'] = list(
                conflicts.values_list('id', flat=True)[:100])
            return BusinessRuleException(error_message, response)

        match_result = get_matchable(instance)
        if match_result is None:
            continue

        field_map, matchable = match_result
        if len(matchable.keys()) == 0 or set(rule.all_fields) != set(field_map.keys()):
            continue

        conflicts_query = model.objects.only('id')

        conflicts = conflicts_query.filter(**matchable)
        if instance.id is not None:
            conflicts = conflicts.exclude(id=instance.id)
        if conflicts.exists():
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

    queryset = django_model.objects
    value_fields: list[str] = [*all_fields]

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

            create_uniqueness_rule(
                model_name=model_name,
                discipline=discipline,
                is_database_constraint=isDatabaseConstraint,
                fields=fields,
                scopes=scopes,
                registry=registry
            )


def create_uniqueness_rule(model_name: str, discipline, is_database_constraint: bool, fields: Iterable[str], scopes: Iterable[str], registry=None):
    UniquenessRule = registry.get_model(
        'businessrules', 'UniquenessRule') if registry else models.UniquenessRule
    UniquenessRuleField = registry.get_model(
        'businessrules', 'UniquenessRuleField') if registry else models.UniquenessRuleField

    final_discipline = None if rule_is_global(scopes) else discipline

    candidate_rules = UniquenessRule.objects.filter(modelName=model_name,
                                                    isDatabaseConstraint=is_database_constraint,
                                                    discipline=final_discipline)

    fields = list(fields)
    scopes = list(scopes)

    for rule in candidate_rules:
        # If the rule already exists, skip creating the rule
        if _rule_fields_match(
            rule,
            fields,
            scopes,
        ):
            return

    logger.info(
        f"Creating uniqueness rule on {model_name} with fields {fields} and scopes {scopes} for the discipline {final_discipline.name if final_discipline else 'Global'}")
    rule = UniquenessRule.objects.create(
        discipline=final_discipline,
        modelName=model_name,
        isDatabaseConstraint=is_database_constraint
    )

    for field in fields:
        UniquenessRuleField.objects.create(
            uniquenessrule=rule, fieldPath=field, isScope=False)
    for scope in scopes:
        UniquenessRuleField.objects.create(
            uniquenessrule=rule, fieldPath=scope, isScope=True)


def remove_uniqueness_rule(model_name: str, discipline, is_database_constraint: bool, fields: Iterable[str], scopes: Iterable[str], registry=None):
    UniquenessRule = registry.get_model(
        'businessrules', 'UniquenessRule') if registry else models.UniquenessRule
    UniquenessRuleField = registry.get_model(
        'businessrules', 'UniquenessRuleField') if registry else models.UniquenessRuleField

    final_discipline = None if rule_is_global(scopes) else discipline

    candidate_rules = UniquenessRule.objects.filter(
        modelName=model_name, isDatabaseConstraint=is_database_constraint, discipline=final_discipline)

    fields = list(fields)
    scopes = list(scopes)

    rule_ids = []
    for rule in candidate_rules:
        # If the rule exists, add it to the list of rules to be deleted
        if _rule_fields_match(
            rule,
            fields,
            scopes,
        ):
            rule_ids.append(rule.id)

    UniquenessRuleField.objects.filter(
        uniquenessrule__id__in=rule_ids).delete()
    UniquenessRule.objects.filter(id__in=rule_ids).delete()


def _rule_fields_match(rule, fields: Iterable[str], scopes: Iterable[str]) -> bool:
    fields = list(fields)
    scopes = list(scopes)
    fields_count = len(fields)
    scopes_count = len(scopes)
    all_rule_fields = rule.uniquenessrulefield_set.all()

    matching_fields = all_rule_fields.filter(
        fieldPath__in=fields, isScope=False)
    matching_scopes = all_rule_fields.filter(
        fieldPath__in=scopes, isScope=True)
    return (
        (all_rule_fields.count() == (fields_count + scopes_count)) and
        (matching_fields.count() == fields_count) and
        (matching_scopes.count() == scopes_count)
    )


"""If a uniqueness rule has a scope which traverses through a hiearchy 
relationship scoped above the discipline level, that rule should not be 
scoped to discipline and instead be global
"""
GLOBAL_RULE_FIELDS = ["division", 'institution']


def rule_is_global(scopes: Iterable[str]) -> bool:
    evaluated_scopes = tuple(scopes)
    return len(evaluated_scopes) == 0 \
        or any(any(scope_field.lower() in GLOBAL_RULE_FIELDS for scope_field in scope.split('__')) for scope in evaluated_scopes)


def fix_global_default_rules(registry=None):
    UniquenessRule = registry.get_model('businessrules', 'UniquenessRule') \
        if registry \
        else models.UniquenessRule

    global_rule_signatures = {
            (
                rule.modelName,
                rule.isDatabaseConstraint,
                frozenset(
                    rule.uniquenessrulefield_set.values_list("fieldPath", "isScope")
                ),
            )
            for rule in UniquenessRule.objects.filter(
                discipline__isnull=True
            ).prefetch_related("uniquenessrulefield_set")
        }

    discipline_ids = (
        UniquenessRule.objects.exclude(discipline__isnull=True)
        .values_list("discipline_id", flat=True)
        .distinct()
    )

    for discipline_id in discipline_ids:
        with transaction.atomic():
            for rule in UniquenessRule.objects.filter(
                discipline_id=discipline_id
            ).prefetch_related("uniquenessrulefield_set"):
                signature = (
                    rule.modelName,
                    rule.isDatabaseConstraint,
                    frozenset(
                        rule.uniquenessrulefield_set.values_list("fieldPath", "isScope")
                    ),
                )
            if signature in global_rule_signatures:
                    rule.uniquenessrulefield_set.all().delete()
                    rule.delete()

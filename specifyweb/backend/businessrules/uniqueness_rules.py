from functools import reduce
import logging
import json
from typing import Union, Dict, List, Any, TypedDict, Optional
from collections.abc import Iterable

from django.apps import apps
from django.db import connections
from django.db.models import Q, Count
from django.db.migrations.recorder import MigrationRecorder
from django.core.exceptions import ObjectDoesNotExist
from specifyweb.specify.api import get_model
from specifyweb.specify.datamodel import datamodel
from specifyweb.middleware.general import serialize_django_obj
from specifyweb.specify.scoping import in_same_scope
from .orm_signal_handler import orm_signal_handler
from .exceptions import BusinessRuleException
from . import models

DEFAULT_UNIQUENESS_RULES:  dict[str, list[dict[str, Union[list[list[str]], bool]]]] = json.load(
    open('specifyweb/backend/businessrules/uniqueness_rules.json'))

UNIQUENESS_DISPATCH_UID = 'uniqueness-rules'


NO_FIELD_VALUE = {}


logger = logging.getLogger(__name__)


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
        if not rule_is_global(tuple(field.fieldPath for field in rule_fields.filter(isScope=True))) and not in_same_scope(rule, instance):
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

        conflicts = model.objects.only('id').filter(**matchable)
        if instance.id is not None:
            conflicts = conflicts.exclude(id=instance.id)
        if conflicts:
            raise get_exception(conflicts, matchable, field_map)


class ViolatedUniquenessCheck(TypedDict):
    duplicates: int
    # Mapping of field names to detected duplicate values
    fields: Dict[str, Any]


class UniquenessCheck(TypedDict):
    totalDuplicates: int
    fields: List[ViolatedUniquenessCheck]


def check_uniqueness(model_name: str, raw_fields: list[str], raw_scopes: list[str], registry=None) -> Optional[UniquenessCheck]:
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

    duplicates = django_model.objects.values(
        *all_fields).annotate(**{duplicates_field: Count('id')}).filter(strict_filters).filter(**{f"{duplicates_field}__gt": 1}).order_by(f'-{duplicates_field}')

    total_duplicates = sum(duplicate[duplicates_field]
                           for duplicate in duplicates)

    final = {
        "totalDuplicates": total_duplicates,
        "fields": [{"duplicates": duplicate[duplicates_field], "fields": {field: value for field, value in duplicate.items() if field != duplicates_field}}
                   for duplicate in duplicates]}
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
                model_name, discipline, isDatabaseConstraint, fields, scopes, registry)


def create_uniqueness_rule(model_name, raw_discipline, is_database_constraint, fields, scopes, registry=None):
    UniquenessRule = registry.get_model(
        'businessrules', 'UniquenessRule') if registry else models.UniquenessRule
    UniquenessRuleField = registry.get_model(
        'businessrules', 'UniquenessRuleField') if registry else models.UniquenessRuleField
    
    discipline = None if rule_is_global(scopes) else raw_discipline

    candidate_rules = UniquenessRule.objects.filter(modelName=model_name, isDatabaseConstraint=is_database_constraint, discipline=discipline)

    for rule in candidate_rules: 
        all_fields = rule.uniquenessrulefield_set.all()
        matching_fields = all_fields.filter(fieldPath__in=fields, isScope=False)
        matching_scopes = all_fields.filter(fieldPath__in=scopes, isScope=True)
        # If the rule already exists, skip creating the rule
        if len(matching_fields) == len(fields) and len(matching_scopes) == len(scopes): 
            return

    rule = UniquenessRule.objects.create(
        discipline=discipline, modelName=model_name, isDatabaseConstraint=is_database_constraint)

    for field in fields:
        UniquenessRuleField.objects.create(
            uniquenessrule=rule, fieldPath=field, isScope=False)
    for scope in scopes:
        UniquenessRuleField.objects.create(
            uniquenessrule=rule, fieldPath=scope, isScope=True)


def remove_uniqueness_rule(model_name, raw_discipline, is_database_constraint, fields, scopes, registry=None):
    UniquenessRule = registry.get_model(
        'businessrules', 'UniquenessRule') if registry else models.UniquenessRule
    UniquenessRuleField = registry.get_model(
        'businessrules', 'UniquenessRuleField') if registry else models.UniquenessRuleField

    discipline = None if rule_is_global(scopes) else raw_discipline

    candidate_rules = UniquenessRule.objects.filter(modelName=model_name, isDatabaseConstraint=is_database_constraint, discipline=discipline)

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
    return len(scopes) == 0 or any(any(scope_field.lower() in GLOBAL_RULE_FIELDS for scope_field in scope.split('__')) for scope in scopes)

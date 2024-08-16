from functools import reduce
import logging
import json
from typing import Dict, List, Union, Iterable

from django.db import connections
from django.db.migrations.recorder import MigrationRecorder
from django.core.exceptions import ObjectDoesNotExist
from specifyweb.specify import models
from specifyweb.specify.datamodel import datamodel
from specifyweb.middleware.general import serialize_django_obj
from specifyweb.specify.scoping import in_same_scope
from .orm_signal_handler import orm_signal_handler
from .exceptions import BusinessRuleException
from .models import UniquenessRule

DEFAULT_UNIQUENESS_RULES:  Dict[str, List[Dict[str, Union[List[List[str]], bool]]]] = json.load(
    open('specifyweb/businessrules/uniqueness_rules.json'))

UNIQUENESS_DISPATCH_UID = 'uniqueness-rules'


NO_FIELD_VALUE = {}


logger = logging.getLogger(__name__)

@orm_signal_handler('pre_save', None, dispatch_uid=UNIQUENESS_DISPATCH_UID)
def check_unique(model, instance):
    model_name = instance.__class__.__name__
    rules = UniquenessRule.objects.filter(modelName=model_name)
    applied_migrations = MigrationRecorder(
        connections['default']).applied_migrations()

    for migration in applied_migrations:
        app, migration_name = migration
        if app == 'businessrules' and migration_name == '0001_initial':
            break
    else:
        return

    for rule in rules:
        if not rule_is_global(tuple(field.fieldPath for field in rule.fields.filter(isScope=True))) and not in_same_scope(rule, instance):
            continue

        field_names = [
            field.fieldPath.lower() for field in rule.fields.filter(isScope=False)]

        _scope = rule.fields.filter(isScope=True)
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
                error_message += ' in {}'.format(scope.fieldPath.lower())
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


def field_path_with_value(instance, model_name: str, field_path: str, default):
    object_or_field = reduce(lambda obj, field: getattr(
        obj, field, default), field_path.split('__'), instance)

    if object_or_field is default:
        return None

    if object_or_field is None:
        if '__' in field_path or hasattr(object_or_field, 'id'):
            return None

        table = datamodel.get_table_strict(model_name)
        field = table.get_field_strict(field_path)
        field_required = field.required if field is not None else False
        if not field_required:
            return None

    return field_path, object_or_field


def serialize_multiple_django(matchable, field_map, fields):
    return {field: serialize_django_obj(matchable[field_map[field]])
            for field in fields}


def join_with_and(fields):
    return ' and '.join(fields)


def apply_default_uniqueness_rules(discipline: models.Discipline):
    has_set_global_rules = len(
        UniquenessRule.objects.filter(discipline=None)) > 0

    for table, rules in DEFAULT_UNIQUENESS_RULES.items():
        _discipline = discipline
        model_name = datamodel.get_table_strict(table).django_name
        for rule in rules:
            fields, scopes = rule["rule"]
            isDatabaseConstraint = rule["isDatabaseConstraint"]

            if rule_is_global(scopes):
                if has_set_global_rules:
                    continue
                else:
                    _discipline = None

            create_uniqueness_rule(
                model_name, _discipline, isDatabaseConstraint, fields, scopes)


def create_uniqueness_rule(model_name, discipline, is_database_constraint, fields, scopes) -> UniquenessRule:
    created_rule = UniquenessRule.objects.create(discipline=discipline,
                                                 modelName=model_name, isDatabaseConstraint=is_database_constraint)
    created_rule.fields.set(fields)
    created_rule.fields.add(
        *scopes, through_defaults={"isScope": True})


"""If a uniqueness rule has a scope which traverses through a hiearchy 
relationship scoped above the discipline level, that rule should not be 
scoped to discipline and instead be global
"""
GLOBAL_RULE_FIELDS = ["division", 'institution']


def rule_is_global(scopes: Iterable[str]) -> bool:
    return len(scopes) == 0 or any(any(scope_field.lower() in GLOBAL_RULE_FIELDS for scope_field in scope.split('__')) for scope in scopes)

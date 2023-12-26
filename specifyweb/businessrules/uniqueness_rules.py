import json
from typing import Optional, Dict, List, Union

from django.core.exceptions import ObjectDoesNotExist, MultipleObjectsReturned
from specifyweb.specify import models
from specifyweb.specify.datamodel import datamodel
from specifyweb.middleware.general import serialize_django_obj
from specifyweb.specify.scoping import in_same_scope
from .orm_signal_handler import orm_signal_handler, disconnect_signal
from .exceptions import BusinessRuleException
from .models import UniquenessRule

DEFAULT_UNIQUENESS_RULES:  Dict[str, List[Dict[str, Union[List[List[str]], bool]]]] = json.load(
    open('specifyweb/businessrules/uniqueness_rules.json'))


def make_uniqueness_rule(rule: UniquenessRule):
    raw_model_name = rule.splocalecontaineritems.all()[0].container.name
    model_name = datamodel.get_table(raw_model_name).django_name
    model = getattr(models, model_name, None)
    field_names = [item.name.lower()
                   for item in rule.splocalecontaineritems.filter(uniquenessrule_splocalecontaineritem__isScope=False)]

    _scope = rule.splocalecontaineritems.filter(
        uniquenessrule_splocalecontaineritem__isScope=True)
    scope = None if len(_scope) == 0 else _scope[0]

    all_fields = [*field_names]

    if scope is not None:
        all_fields.append(scope.name.lower())

    def get_matchable(instance):
        def best_match_or_none(field_name):
            try:
                object_or_field = getattr(instance, field_name, None)
                if object_or_field is None:
                    return None
                if not hasattr(object_or_field, 'id'):
                    return field_name, object_or_field
                if hasattr(instance, field_name+'_id'):
                    return field_name+'_id', object_or_field.id

            except ObjectDoesNotExist:
                pass
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
            error_message += ' in {}'.format(scope.name.lower())
            response.update({
                "parentField": scope.name,
                "parentData": serialize_multiple_django(matchable, field_map, [scope.name.lower()])
            })
        response['conflicting'] = list(
            conflicts.values_list('id', flat=True)[:100])
        return BusinessRuleException(error_message, response)

    disconnect_uniqueness_rule(rule)

    @orm_signal_handler('pre_save', model=model_name, dispatch_uid=create_dispatch_uid(rule))
    def check_unique(instance, **kwargs):
        if not in_same_scope(rule, instance):
            return

        match_result = get_matchable(instance)
        if match_result is None:
            return

        field_map, matchable = match_result
        if len(matchable.keys()) == 0:
            return

        conflicts = model.objects.only('id').filter(**matchable)
        if instance.id is not None:
            conflicts = conflicts.exclude(id=instance.id)
        if conflicts:
            raise get_exception(conflicts, matchable, field_map)

    return check_unique


def create_dispatch_uid(rule: UniquenessRule):
    return f"uniqueness-rule-{rule.id}"


def disconnect_uniqueness_rule(rule: UniquenessRule) -> bool:
    table = rule.splocalecontaineritems.all()[0].container.name
    model_name = datamodel.get_table(table).django_name

    return disconnect_signal(
        'pre_save', model_name=model_name, dispatch_uid=create_dispatch_uid(rule))


def serialize_multiple_django(matchable, field_map, fields):
    return {field: serialize_django_obj(matchable[field_map[field]])
            for field in fields}


def join_with_and(fields):
    return ' and '.join(fields)


def initialize_unique_rules(discipline: Optional[models.Discipline] = None):
    if discipline is None:
        rules = UniquenessRule.objects.all()
    else:
        rules = UniquenessRule.objects.filter(discipline=discipline)

    initialized_rules = []

    for rule in rules:
        initialized_rules.append(make_uniqueness_rule(rule))

    return initialized_rules


def apply_default_uniqueness_rules(discipline: models.Discipline):
    containers = discipline.splocalecontainers.get_queryset()
    for container in containers:
        if not container.name.lower().capitalize() in DEFAULT_UNIQUENESS_RULES.keys() \
                or container.schematype != 0:
            continue

        rules = DEFAULT_UNIQUENESS_RULES[container.name.lower().capitalize()]
        for rule in rules:
            unique_fields, scope = rule["rule"]
            is_db_constraint = rule["isDatabaseConstraint"]

            items = container.items.get_queryset().filter(name__in=unique_fields)
            if len(items) == 0:
                continue

            try:
                scope_container_item = container.items.get_queryset().get(
                    name=scope[0]) if len(scope) > 0 else None
            except MultipleObjectsReturned:
                continue

            new_rule = UniquenessRule(
                isDatabaseConstraint=is_db_constraint, discipline=discipline)
            new_rule.save()

            new_rule.splocalecontaineritems.add(*items)
            new_rule.splocalecontaineritems.add(
                scope_container_item, through_defaults={"isScope": True})
    return initialize_unique_rules(discipline)

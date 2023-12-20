from django.core.exceptions import ObjectDoesNotExist
from django.db.models.signals import pre_save
from specifyweb.specify import models
from specifyweb.specify.datamodel import datamodel
from specifyweb.middleware.general import serialize_django_obj
from specifyweb.specify.scoping import in_same_scope
from .orm_signal_handler import orm_signal_handler, disconnect_signal
from .exceptions import BusinessRuleException
from .models import UniquenessRule


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

    @orm_signal_handler('pre_save', model=model_name, dispatch_uid=rule.id)
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


def disconnect_uniqueness_rule(rule: UniquenessRule) -> bool:
    return disconnect_signal('pre_save', dispatch_uid=rule.id)


def serialize_multiple_django(matchable, field_map, fields):
    return {field: serialize_django_obj(matchable[field_map[field]])
            for field in fields}


def join_with_and(fields):
    return ' and '.join(fields)


def initialize_unique_rules(sender, **kwargs):
    for rule in UniquenessRule.objects.all():
        make_uniqueness_rule(rule)

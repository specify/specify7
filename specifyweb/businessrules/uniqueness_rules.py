import json
from django.core.exceptions import ObjectDoesNotExist
from typing import Dict, List, Union, Tuple
from specifyweb.specify import models
from .orm_signal_handler import orm_signal_handler
from .exceptions import BusinessRuleException
from specifyweb.middleware.general import serialize_django_obj


def make_uniqueness_rule(model_name,
                         rule_fields: Tuple[Tuple[str], Tuple[str]]):
    model = getattr(models, model_name)
    table_name = models.datamodel.get_table(model_name).name
    base_fields = rule_fields[0]
    parent_fields = rule_fields[1]
    all_fields = [field for partition in rule_fields for field in partition]

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

        if len(matchable) != len(all_fields):
            # if any field is missing, pass
            return None

        return field_mapping, matchable

    def get_exception(conflicts, matchable, field_map):
        error_message = '{} must have unique {}'.format(table_name,
                                                        join_with_and(base_fields))

        response = {"table": table_name,
                           "localizationKey": "fieldNotUnique"
                           if len(parent_fields) == 0
                           else "childFieldNotUnique",
                           "fieldName": ','.join(base_fields),
                           "fieldData": serialize_multiple_django(matchable, field_map, base_fields),
                           }

        if len(parent_fields) > 0:
            error_message += ' in {}'.format(join_with_and(parent_fields))
            response.update({
                "parentField": ','.join(parent_fields),
                "parentData": serialize_multiple_django(matchable, field_map, parent_fields)
            })
        response['conflicting'] = list(
                         conflicts.values_list('id', flat=True)[:100])
        return BusinessRuleException(error_message, response)

    @orm_signal_handler('pre_save', model_name)
    def check_unique(instance):
        match_result = get_matchable(instance)
        if match_result is None:
            return
        field_map, matchable = match_result
        conflicts = model.objects.only('id').filter(**matchable)
        if instance.id is not None:
            conflicts = conflicts.exclude(id=instance.id)
        if conflicts:
            raise get_exception(conflicts, matchable, field_map)
    return check_unique


def join_with_and(fields):
    return ' and '.join(fields)


RAW_UNIQUENESS_RULES: Dict[
    str, Dict[str, List[Union[Dict[str, Union[str, list]], str, None]]]] = \
    json.load(open(
        'specifyweb/frontend/js_src/lib/components/DataModel/uniquness_rules.json'))

'''
The current definition of uniqueness rules are rather inconvenient. 
For example, a definition like 
    "AccessionAgent":{
       "role":[
          {
             "field":"accession",
             "otherFields":[
                "agent"
             ]
          },
          {
             "field":"repositoryagreement",
             "otherFields":[
                "agent"
             ]
          }
       ],
       "agent":[
          {
             "field":"accession",
             "otherFields":[
                "role"
             ]
          },
          {
             "field":"repositoryagreement",
             "otherFields":[
                "role"
             ]
          }
       ]
    }
can simply be 
    "AccessionAgent": [
        (("role", "agent"), ("accession")),
        (("role", "agent"), ("repositoryagreement"))
        ]
The second format also makes it much easier to construct django queries.
So, parse_uniqueness_rules() automatically converts the current representation
TODO: Refactor front-end to use this instead
'''


def parse_uniqueness_rules():
    PARSED_UNIQUENESS_RULES = {}
    for table, rules in RAW_UNIQUENESS_RULES.items():
        table = table.lower().capitalize()
        if hasattr(models, table):
            PARSED_UNIQUENESS_RULES[table] = []
            for field_name, rule in rules.items():
                # The Specify Model field names are always in lowercase
                field_name = field_name.lower()
                for rule_fields in rule:
                    child, parent = resolve_child_parent(field_name,
                                                         rule_fields)
                    matching_rule = [matched_rule
                                     for matched_rule in
                                     PARSED_UNIQUENESS_RULES[table]
                                     if matched_rule == (child, parent)]
                    if len(matching_rule) == 0:
                        PARSED_UNIQUENESS_RULES[table].append((child, parent))
    return PARSED_UNIQUENESS_RULES


def resolve_child_parent(field, rule_instance):
    child = [field]
    parent = []
    if isinstance(rule_instance, dict):
        parent.append(rule_instance['field'])
        child.extend(rule_instance['otherFields'])
    else:
        if rule_instance is not None:
            parent.append(rule_instance)
    child.sort()
    return tuple(child), tuple(parent)


def serialize_multiple_django(matchable, field_map, fields):
    return {field: serialize_django_obj(matchable[field_map[field]])
            for field in fields}

UNIQUENESS_RULES = parse_uniqueness_rules()

uniqueness_rules = [make_uniqueness_rule(model, rule_field)
                    for model, rules in list(UNIQUENESS_RULES.items())
                    for rule_field in rules
                    ]

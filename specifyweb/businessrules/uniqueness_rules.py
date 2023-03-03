from django.core.exceptions import ObjectDoesNotExist
from specifyweb.specify import models
from .orm_signal_handler import orm_signal_handler
from .exceptions import BusinessRuleException
from specifyweb.middleware.general import serialize_django_obj

def make_uniqueness_rule(model_name, parent_field, unique_field):
    model = getattr(models, model_name)
    table_name = models.datamodel.get_table(model_name).name
    if parent_field is None:
        # uniqueness is global
        @orm_signal_handler('pre_save', model_name)
        def check_unique(instance):
            value = getattr(instance, unique_field)
            if value is None: return
            conflicts = model.objects.only('id').filter(**{
                unique_field: value})
            if instance.id is not None:
                conflicts = conflicts.exclude(id=instance.id)
            if conflicts:
                raise BusinessRuleException(
                "{} must have unique {}".format(table_name, unique_field), 
                {"table" : table_name,
                 "localizationKey" : "fieldNotUnique",
                 "fieldName" : unique_field,
                 "fieldData" : (unique_field, serialize_django_obj(value)), 
                 "conflicting" : list(conflicts.values_list('id', flat=True)[:100])})
    else:
        @orm_signal_handler('pre_save', model_name)
        def check_unique(instance):
            try:
                parent = getattr(instance, parent_field + '_id', None)
            except ObjectDoesNotExist:
                parent = None

            if parent is None: return
            value = getattr(instance, unique_field)
            if value is None: return
            conflicts = model.objects.only('id').filter(**{
                    parent_field + '_id': parent,
                    unique_field: value})
            if instance.id is not None:
                conflicts = conflicts.exclude(id=instance.id)
            if conflicts:
                raise BusinessRuleException(
                    "{} must have unique {} in {}".format(table_name, unique_field, parent_field),
                    {"table" : table_name,
                    "localizationKey" : "childFieldNotUnique",
                     "fieldName" : unique_field,
                     "fieldData" : (unique_field, serialize_django_obj(value)),
                     "parentField" : parent_field,
                     "parentData" : f"{parent_field}: id={parent}",
                     "conflicting" : list(conflicts.values_list('id', flat=True)[:100])})
    return check_unique

UNIQUENESS_RULES = {
    'Accession': {
        'accessionnumber': ['division'],
        },
    'Appraisal': {
        'appraisalnumber': ['accession'],
        },
    'Author': {
        'agent': ['referencework'],
        'ordernumber': ['referencework'],
        },
    'Collection': {
        'collectionname': ['discipline'],
        'code': ['discipline'],
        },
    'Collectionobject': {
        'catalognumber': ['collection'],
        },
    'Collector': {
        'agent': ['collectingevent'],
        },
    'Discipline': {
        'name': ['division'],
        },
    'Division': {
        'name': ['institution'],
        },
    'Gift': {
        'giftnumber': ['discipline'],
        },
    'Groupperson': {
        'member': ['group'],
        },
    'Institution': {
        'name': [None],
        },
    'Loan': {
        'loannumber': ['discipline'],
        },
    'Permit': {
        'permitnumber': [None],
        },
    'Picklist': {
        'name': ['collection'],
        },
    'Preptype': {
        'name': ['collection'],
        },
    'Repositoryagreement': {
        'repositoryagreementnumber': ['division'],
        },
    'Spappresourcedata': {
        'spappresource': [None],
        },
    }


# This check is provided to support the Specify 6.8.01
# datamodel (schema version 2.9). When support for that
# version is dropped it can be removed and this definition
# can be included in the block above.
if hasattr(models, 'Determiner'):
    UNIQUENESS_RULES['Determiner'] = {
        'agent': ['determination'],
    }


uniqueness_rules = [make_uniqueness_rule(model, parent_field, unique_field)
                    for model, rules in list(UNIQUENESS_RULES.items())
                    for unique_field, parent_fields in list(rules.items())
                    for parent_field in parent_fields]

from django.core.exceptions import ObjectDoesNotExist
from specifyweb.specify import models
from .orm_signal_handler import orm_signal_handler
from .exceptions import BusinessRuleException

def make_uniqueness_rule(model_name, parent_field, unique_field):
    model = getattr(models, model_name)
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
                "{} must have unique {}".format(model.__name__, unique_field), 
                {"table" : model.__name__,
                 "type" : "UNIQUENESS", 
                 "fieldName" : unique_field,
                 "fieldData" : (unique_field, value), 
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
                    "{} must have unique {} in {}".format(model.__name__, unique_field, parent_field),
                    {"table" : model.__name__,
                     "type" : "UNIQUENESS",
                     "fieldName" : unique_field,
                     "fieldData" : (unique_field, value),
                     "within" : (parent_field, parent),
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

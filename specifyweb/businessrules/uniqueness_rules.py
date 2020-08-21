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
            conflicts = model.objects.filter(**{
                unique_field: value})
            if instance.id is not None:
                conflicts = conflicts.exclude(id=instance.id)
            if conflicts.count() > 0:
                raise BusinessRuleException("%s must have unique %s" % (model.__name__, unique_field))
    else:
        @orm_signal_handler('pre_save', model_name)
        def check_unique(instance):
            try:
                parent = getattr(instance, parent_field, None)
            except ObjectDoesNotExist:
                parent = None

            if  parent is None: return
            value = getattr(instance, unique_field)
            if value is None: return
            conflicts = model.objects.filter(**{
                    parent_field: parent,
                    unique_field: value})
            if instance.id is not None:
                conflicts = conflicts.exclude(id=instance.id)
            if conflicts.count() > 0:
                raise BusinessRuleException("%s must have unique %s in %s" % (model.__name__, unique_field, parent_field))
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

uniqueness_rules = [make_uniqueness_rule(model, parent_field, unique_field)
                    for model, rules in list(UNIQUENESS_RULES.items())
                    for unique_field, parent_fields in list(rules.items())
                    for parent_field in parent_fields]

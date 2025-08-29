


import logging
from typing import Any
from collections.abc import Callable
from django.db import transaction
from django.core.exceptions import FieldError, FieldDoesNotExist
from django.db.models import Model, F
from django.http import (Http404)
from django.apps import apps

from specifyweb.backend.permissions.permissions import check_field_permissions, check_table_permissions
from specifyweb.backend.workbench.upload.auditlog import auditlog
from specifyweb.specify import models
from specifyweb.specify.api.api_utils import objs_to_data_, CollectionPayload
from specifyweb.specify.utils.autonumbering import autonumber_and_save
from specifyweb.specify.api.exceptions import FilterError, MissingVersionException, OrderByError, RecordSetException, StaleObjectException
from specifyweb.specify.utils.field_change_info import FieldChangeInfo
from specifyweb.specify.api.filter_by_col import filter_by_collection
from specifyweb.specify.models_utils.models_by_table_id import get_model_by_table_id
from specifyweb.specify.models_utils.relationships import get_recordset_info, get_related_or_none, handle_fk_fields, handle_to_many, is_dependent_field
from specifyweb.specify.utils.uiformatters import AutonumberOverflowException
from specifyweb.specify.api.validators import GetCollectionForm, cleanData, fld_change_info

logger = logging.getLogger(__name__)

ReadPermChecker = Callable[[Any], None]

def get_resource(name, id, checker: ReadPermChecker, recordsetid=None) -> dict:
    from specifyweb.specify.api.serializers import _obj_to_data

    """Return a dict of the fields from row 'id' in model 'name'.

    If given a recordset id, the data will be suplemented with
    data about the resource's relationship to the given record set.
    """
    obj = get_object_or_404(name, id=int(id))
    data = _obj_to_data(obj, checker)
    if recordsetid is not None:
        data['recordset_info'] = get_recordset_info(obj, recordsetid)
    return data


def create_obj(collection, agent, model, data: dict[str, Any], parent_obj=None, parent_relationship=None):
    """Create a new instance of 'model' and populate it with 'data'."""
    logger.debug("creating %s with data: %s", model, data)
    if isinstance(model, str):
        model = get_model_or_404(model)

    data = cleanData(model, data, parent_relationship)
    obj = model()
    _, _, handle_remote_to_ones = handle_fk_fields(collection, agent, obj, data)
    set_fields_from_data(obj, data)
    set_field_if_exists(obj, 'createdbyagent', agent)
    set_field_if_exists(obj, 'collectionmemberid', collection.id)
    try:
        autonumber_and_save(collection, agent.specifyuser, obj)
    except AutonumberOverflowException as e:
        logger.warn("autonumbering overflow: %s", e)

    if obj.id is not None: # was the object actually saved?
        check_table_permissions(collection, agent, obj, "create")
        auditlog.insert(obj, agent, parent_obj)

    handle_remote_to_ones(obj)
    handle_to_many(collection, agent, obj, data)
    _handle_special_update_posts(obj)
    return obj


@transaction.atomic
def post_resource(collection, agent, name: str, data, recordsetid: int | None=None):
    """Create a new resource in the database.

    collection - the collection the client is logged into.
    agent - the agent associated with the specify user logged in.
    name - the model name of the resource to be created.
    data - a dict of the data for the resource to be created.
    recordsetid - created resource will be added to the given recordset (optional)
    """
    obj = create_obj(collection, agent, name, data)

    if recordsetid is not None:
        # add the resource to the record set
        Recordset = models.Recordset
        try:
            recordset = Recordset.objects.get(id=recordsetid)
        except Recordset.DoesNotExist as e:
            raise RecordSetException(e)

        if recordset.dbtableid != obj.specify_model.tableId:
            # the resource is not of the right kind to go in the recordset
            raise RecordSetException(
                "expected %s, got %s when adding object to recordset",
                (get_model_by_table_id(recordset.dbtableid), obj.__class__))

        recordset.recordsetitems.create(recordid=obj.id)
    return obj

def update_obj(collection, agent, name: str, id, version, data: dict[str, Any], parent_obj=None, parent_relationship=None):
    """Update the resource with 'id' in model named 'name' with given
    'data'.
    """
    obj = get_object_or_404(name, id=int(id))
    check_table_permissions(collection, agent, obj, "update")

    data = cleanData(obj.__class__, data, parent_relationship)
    dependents_to_delete, fk_dirty, handle_remote_to_ones = handle_fk_fields(collection, agent, obj, data)
    dirty = fk_dirty + set_fields_from_data(obj, data)

    check_field_permissions(collection, agent, obj, [d['field_name'] for d in dirty], "update")

    if hasattr(obj, 'modifiedbyagent'):
        setattr(obj, 'modifiedbyagent', agent)

    data = _handle_special_update_priors(obj, data)
    bump_version(obj, version)
    obj.save(force_update=True)
    auditlog.update(obj, agent, parent_obj, dirty)
    deleter = make_default_deleter(collection=collection, agent=agent)
    for dep in dependents_to_delete:
        delete_obj(dep, deleter, parent_obj=obj)
    handle_remote_to_ones(obj)
    handle_to_many(collection, agent, obj, data)
    _handle_special_update_posts(obj)
    return obj


def delete_obj(obj, deleter: Callable[[Any, Any], None] | None=None, version=None, parent_obj=None, clean_predelete=None) -> None:
    # need to delete dependent -to-one records
    # e.g. delete CollectionObjectAttribute when CollectionObject is deleted
    # but have to delete the referring record first
    dependents_to_delete = [_f for _f in (
        get_related_or_none(obj, field.name)
        for field in obj._meta.get_fields()
        if (field.many_to_one or field.one_to_one) and is_dependent_field(obj, field.name)
    ) if _f]

    if version is not None:
        bump_version(obj, version)

    if clean_predelete:
        clean_predelete(obj)
    
    if hasattr(obj, 'pre_constraints_delete'):
        obj.pre_constraints_delete()

    if deleter:
        deleter(obj, parent_obj)

    obj.delete()

    for dep in dependents_to_delete:
      delete_obj(dep, deleter, version, parent_obj=obj, clean_predelete=clean_predelete)

def update_or_create_resource(collection, agent, model, data, parent_obj, parent_relationship=None): 
    if 'id' in data: 
        return update_obj(collection, agent, 
                          model, data['id'], 
                          data['version'], data, 
                          parent_obj=parent_obj, parent_relationship=parent_relationship)
    else: 
        return create_obj(collection, agent, model, data, parent_obj=parent_obj, parent_relationship=parent_relationship)
    
def make_default_deleter(collection=None, agent=None):
    def _deleter(obj, parent_obj):
        if collection and agent:
            check_table_permissions(collection, agent, obj, "delete")
            auditlog.remove(obj, agent, parent_obj)
    return _deleter


@transaction.atomic
def put_resource(collection, agent, name: str, id, version, data: dict[str, Any]):
    return update_obj(collection, agent, name, id, version, data)


def bump_version(obj, version) -> None:
    """Implements the optimistic locking mechanism.

    If the Django model resource 'obj' has a version field and it
    does not match 'version' which comes from the client, an
    OptimisticLockingException is raised. Otherwise the version
    is incremented.
    """
    # If the object has no version field, there's nothing to do.
    try:
        obj._meta.get_field('version')
    except FieldDoesNotExist:
        return

    try:
        version = int(version)
    except (ValueError, TypeError):
        raise MissingVersionException("%s object cannot be updated without version info" % obj.__class__.__name__)

    # Try to update a row with the PK and the version number we have.
    # If our version is stale, the rows updated will be 0.
    logger.info("Incrementing version of %s object %d from %d.", obj.__class__.__name__, obj.id, version)
    manager = obj.__class__._base_manager
    updated = manager.filter(pk=obj.pk, version=version).update(version=version+1)
    if not updated:
        if obj._meta.model_name in {'collectionobjectgroupjoin'}:
            return # TODO: temporary solution to allow for multiple updates to the same cojo object
        raise StaleObjectException("%s object %d is out of date" % (obj.__class__.__name__, obj.id))
    obj.version = version + 1

def set_fields_from_data(obj: Model, data: dict[str, Any]) -> list[FieldChangeInfo]:
     from specifyweb.specify.api.serializers import prepare_value

     """Where 'obj' is a Django model instance and 'data' is a dict,
     set all fields provided by data that are not related object fields.
     """
     dirty_flds = []
     for field_name, val in list(data.items()):
         field = obj._meta.get_field(field_name)
         if not field.is_relation:
             fld_change = fld_change_info(obj, field, val)
             if fld_change is not None:
                 dirty_flds.append(fld_change)
             setattr(obj, field_name, prepare_value(field, val))
     return dirty_flds

def set_field_if_exists(obj, field: str, value) -> None:
    """Where 'obj' is a Django model instance, a resource object, check
    if a field named 'field' exists and set it to 'value' if so. Do nothing otherwise.
    """
    try:
        f = obj._meta.get_field(field)
    except FieldDoesNotExist:
        return

    if f.concrete:
        setattr(obj, field, value)

def get_object_or_404(model, *args, **kwargs):
    """A version of get_object_or_404 that can accept a model name
    in place of the model class."""
    from django.shortcuts import get_object_or_404 as get_object

    if isinstance(model, str):
        model = get_model_or_404(model)
    return get_object(model, *args, **kwargs)

def get_model_or_404(name: str):
    """Lookup a specify model by name. Raise Http404 if not found."""
    try:
        return strict_get_model(name)
    except AttributeError as e:
        raise Http404(e)
    
def strict_get_model(name: str, apps = apps):
    """Fetch an ORM model from the module dynamically so that
    the typechecker doesn't complain.
    """
    model_name = name.capitalize()
    name = name.lower()
    try:
        return getattr(models, model_name)
    except AttributeError as e:
        for app in apps.get_app_configs():
            for model in app.get_models():
                if model._meta.model_name == name:
                    return model
        raise e

def get_model(name: str, apps=apps): 
    try: 
        return strict_get_model(name, apps)
    except AttributeError: 
        return None
    
def _handle_special_update_posts(obj):
    from specifyweb.backend.interactions.cog_preps import enforce_interaction_sibling_prep_max_count
    enforce_interaction_sibling_prep_max_count(obj)

def _handle_special_update_priors(obj, data):
    from specifyweb.backend.interactions.cog_preps import (
        modify_update_of_interaction_sibling_preps,
        modify_update_of_loan_return_sibling_preps,
    )
    data = modify_update_of_interaction_sibling_preps(obj, data)
    data = modify_update_of_loan_return_sibling_preps(obj, data)
    return data

@transaction.atomic
def delete_resource(collection, agent, name, id, version) -> None:
    """Delete the resource with 'id' and model named 'name' with optimistic
    locking 'version'.
    """
    obj = get_object_or_404(name, id=int(id))
    return delete_obj(obj, (make_default_deleter(collection, agent)), version)


def get_collection(logged_in_collection, model, checker: ReadPermChecker, control_params=GetCollectionForm.defaults, params={}) -> CollectionPayload:
    from specifyweb.specify.api.serializers import _obj_to_data
    
    """Return a list of structured data for the objects from 'model'
    subject to the request 'params'."""

    objs = apply_filters(logged_in_collection, params, model, control_params)

    try:
        return objs_to_data_(objs, objs.count(), lambda o: _obj_to_data(o, checker), control_params['offset'], control_params['limit'])
    except FieldError as e:
        raise OrderByError(e)
    
def apply_filters(logged_in_collection, params, model, control_params=GetCollectionForm.defaults):
    filters = {}

    if isinstance(model, str):
        model = get_model_or_404(model)

    for param, val in list(params.items()):
        if param in control_params:
            # filter out control parameters
            continue

        if param.endswith('__isnull'):
            val = {
                'true': True,
                'false': False
            }.get(val.lower(), val)
        elif param.endswith('__in') or param.endswith('__range'):
            # this is a bit kludgy
            val = val.split(',')

        filters.update({param: val})

    if control_params['filterchronostrat'] == True:
        # Filter out invalid chronostrats
        filters.update({
            'startperiod__isnull': False,
            'endperiod__isnull': False,
            'startperiod__gte': F('endperiod')
        })

    try:
        objs = model.objects.filter(**filters)
    except (ValueError, FieldError) as e:
        raise FilterError(e)

    if control_params['domainfilter'] == 'true':
        objs = filter_by_collection(objs, logged_in_collection)
    if control_params['orderby']:
        try:
            fields = control_params['orderby'].split(',')
            objs = objs.order_by(*fields)
        except FieldError as e:
            raise OrderByError(e)

    return objs
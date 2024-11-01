"""
Implements the RESTful business data API
"""

import json
import logging
import re
from typing import Any, Dict, List, Optional, Tuple, Iterable, Union, \
    Callable, TypedDict
from urllib.parse import urlencode

from typing_extensions import TypedDict

logger = logging.getLogger(__name__)

from django import forms
from django.db import transaction
from django.apps import apps
from django.http import (HttpResponse, HttpResponseBadRequest,
                         Http404, HttpResponseNotAllowed, QueryDict)
from django.core.exceptions import ObjectDoesNotExist, FieldError, FieldDoesNotExist
from django.db.models.fields import DateTimeField, FloatField, DecimalField

from specifyweb.permissions.permissions import enforce, check_table_permissions, check_field_permissions, table_permissions_checker
from specifyweb.specify.models_by_table_id import get_model_by_table_id

from . import models
from .autonumbering import autonumber_and_save
from .uiformatters import AutonumberOverflowException
from .filter_by_col import filter_by_collection
from .auditlog import auditlog
from .datamodel import datamodel
from .calculated_fields import calculate_extra_fields

ReadPermChecker = Callable[[Any], None]

# Regex matching api uris for extracting the model name and id number.
URI_RE = re.compile(r'^/api/specify/(\w+)/($|(\d+))')

def strict_get_model(name: str):
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
    
def get_model(name: str): 
    try: 
        return strict_get_model(name)
    except AttributeError: 
        return None

def correct_field_name(model, field_name: str, ignore_properties: bool = True) -> str:
    """Return the correct field name for a model given a case insensitive
    field name. If the field is not found, raise FieldDoesNotExist.
    """
    if not ignore_properties:
        try:
            getattr(model, field_name) # Able to retrieve model @property
            return field_name
        except AttributeError as e:
            pass
    
    try:
        model._meta.get_field(field_name) # Retrieve field from model by proper name
        return field_name
    except FieldDoesNotExist:
        pass

    # Retrieve field from model by case insensitive name
    field_name = field_name.lower()
    for field in model._meta.get_fields():
        if field.name.lower() == field_name:
            return field.name
    
    raise FieldDoesNotExist(f"field '{field_name}' not found in {model}")

class JsonEncoder(json.JSONEncoder):
    """Augmented JSON encoder that handles datetime and decimal objects."""
    def default(self, obj):
        from decimal import Decimal
        # if isinstance(obj, CallableBool):
        #     return obj()
        # JSON numbers are double precision floating point values, while Python
        # decimals are fixed precision. Thus, need to convert them to strings
        if isinstance(obj, Decimal):
            return str(obj)
        if hasattr(obj, 'isoformat'):
            return obj.isoformat()
        if isinstance(obj, bytes):
            # assume byte data is utf encoded text.
            # this works for things like app resources.
            return obj.decode()
        return json.JSONEncoder.default(self, obj)

def toJson(obj: Any) -> str:
    return json.dumps(obj, cls=JsonEncoder)

class RecordSetException(Exception):
    """Raised for problems related to record sets."""
    pass

class OptimisticLockException(Exception):
    """Raised when there is a problem related to optimistic locking."""
    pass

class MissingVersionException(OptimisticLockException):
    """Raised when an object is expected to have an optimistic locking
    version number, but none can be determined from the request.
    """
    pass

class StaleObjectException(OptimisticLockException):
    """Raised when attempting to mutate a resource with a newer
    version than the client has supplied.
    """
    pass

class FilterError(Exception):
    """Raised when filter a resource collection using a bad value."""
    pass

class OrderByError(Exception):
    """Raised for bad fields in order by clause."""
    pass

class HttpResponseCreated(HttpResponse):
    """Returned to the client when a POST request succeeds and a new
    resource is created.
    """
    status_code = 201

def resource_dispatch(request, model, id) -> HttpResponse:
    """Handles requests related to individual resources.

    Determines the client's version of the resource.
    Determines the logged-in user and collection from the request.
    Dispatches on the request type.
    De/Encodes structured data as JSON.
    """
    request_params = QueryDict(request.META['QUERY_STRING'])

    # Get the version the client has, if it is given
    # in URL query string or in the HTTP if-match header.
    try:
        version = request_params['version']
    except KeyError:
        try:
            version = request.META['HTTP_IF_MATCH']
        except KeyError:
            version = None

    checker = table_permissions_checker(request.specify_collection, request.specify_user_agent, "read")

    # Dispatch on the request type.
    if request.method == 'GET':
        data = get_resource(model, id, checker, request.GET.get('recordsetid', None))
        resp = HttpResponse(toJson(data), content_type='application/json')

    elif request.method == 'PUT':
        data = json.load(request)
        # Look for a version field in the resource data itself.
        try:
            version = data['version']
        except KeyError:
            pass

        obj = put_resource(request.specify_collection,
                           request.specify_user_agent,
                           model, id, version, data)

        resp = HttpResponse(toJson(_obj_to_data(obj, checker)),
                            content_type='application/json')

    elif request.method == 'DELETE':
        delete_resource(request.specify_collection,
                        request.specify_user_agent,
                        model, id, version)

        resp = HttpResponse('', status=204)

    else:
        # Unhandled request type.
        resp = HttpResponseNotAllowed(['GET', 'PUT', 'DELETE'])

    return resp

class GetCollectionForm(forms.Form):
    # Use the logged_in_collection to limit request
    # to relevant items.
    domainfilter = forms.ChoiceField(choices=(('true', 'true'), ('false', 'false')),
                                     required=False)

    # Return at most 'limit' items.
    # Zero for all.
    limit = forms.IntegerField(required=False)

    # Return items starting from 'offset'.
    offset = forms.IntegerField(required=False)

    orderby = forms.CharField(required=False)

    defaults = dict(
        domainfilter=None,
        limit=0,
        offset=0,
        orderby=None,
    )

    def clean_limit(self):
        limit = self.cleaned_data['limit']
        return 20 if limit is None else limit

    def clean_offset(self):
        offset = self.cleaned_data['offset']
        return 0 if offset is None else offset

def collection_dispatch(request, model) -> HttpResponse:
    """Handles requests related to collections of resources.

    Dispatches on the request type.
    Determines the logged-in user and collection from the request.
    De/Encodes structured data as JSON.
    """

    checker = table_permissions_checker(request.specify_collection, request.specify_user_agent, "read")

    if request.method == 'GET':
        control_params = GetCollectionForm(request.GET)
        if not control_params.is_valid():
            return HttpResponseBadRequest(toJson(control_params.errors),
                                          content_type='application/json')
        try:
            data = get_collection(request.specify_collection, model, checker,
                                  control_params.cleaned_data, request.GET)
        except (FilterError, OrderByError) as e:
            return HttpResponseBadRequest(e)
        resp = HttpResponse(toJson(data), content_type='application/json')

    elif request.method == 'POST':
        obj = post_resource(request.specify_collection,
                            request.specify_user_agent,
                            model, json.loads(request.body),
                            request.GET.get('recordsetid', None))

        resp = HttpResponseCreated(toJson(_obj_to_data(obj, checker)),
                                   content_type='application/json')
    else:
        # Unhandled request type.
        resp = HttpResponseNotAllowed(['GET', 'POST'])

    return resp

def collection_dispatch_bulk(request, model) -> HttpResponse:
    """
    Do the same as collection_dispatch, but for bulk POST operations.
    Call this endpoint with a list of objects of the same type to create.
    This reduces the amount of API calls needed to create multiple objects, like when creating multiple carry forwards.
    """
    checker = table_permissions_checker(request.specify_collection, request.specify_user_agent, "read")

    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])
        
    data = json.loads(request.body)
    resp_objs = []
    for obj_data in data:
        obj = post_resource(
            request.specify_collection,
            request.specify_user_agent,
            model,
            obj_data,
            request.GET.get("recordsetid", None),
        )
        resp_objs.append(_obj_to_data(obj, checker))

    return HttpResponseCreated(toJson(resp_objs), content_type='application/json')

def collection_dispatch_bulk_copy(request, model, copies) -> HttpResponse:
    checker = table_permissions_checker(request.specify_collection, request.specify_user_agent, "read")

    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])

    data = json.loads(request.body)
    data = dict(filter(lambda item: item[0] != 'id', data.items())) # Remove ID field before making copies
    resp_objs = []
    for _ in range(int(copies)):
        obj = post_resource(
            request.specify_collection,
            request.specify_user_agent,
            model,
            data,
            request.GET.get("recordsetid", None),
        )
        resp_objs.append(_obj_to_data(obj, checker))

    return HttpResponseCreated(toJson(resp_objs), content_type='application/json')

def get_model_or_404(name: str):
    """Lookup a specify model by name. Raise Http404 if not found."""
    try:
        return strict_get_model(name)
    except AttributeError as e:
        raise Http404(e)

def get_object_or_404(model, *args, **kwargs):
    """A version of get_object_or_404 that can accept a model name
    in place of the model class."""
    from django.shortcuts import get_object_or_404 as get_object

    if isinstance(model, str):
        model = get_model_or_404(model)
    return get_object(model, *args, **kwargs)

def get_resource(name, id, checker: ReadPermChecker, recordsetid=None) -> Dict:
    """Return a dict of the fields from row 'id' in model 'name'.

    If given a recordset id, the data will be suplemented with
    data about the resource's relationship to the given record set.
    """
    obj = get_object_or_404(name, id=int(id))
    data = _obj_to_data(obj, checker)
    if recordsetid is not None:
        data['recordset_info'] = get_recordset_info(obj, recordsetid)
    return data

RecordSetInfo = TypedDict('RecordSetInfo', {
    'recordsetid': int,
    'total_count': int,
    'index': int,
    'previous': Optional[str],
    'next': Optional[str],
})

def get_recordset_info(obj, recordsetid: int) -> Optional[RecordSetInfo]:
    """Return a dict of info about how the resource 'obj' is related to
    the recordset with id 'recordsetid'.
    """
    # Queryset of record set items in the given record set with
    # the additional condition that they match the resource's table.
    Recordsetitem = models.Recordsetitem
    rsis = Recordsetitem.objects.filter(
        recordset__id=recordsetid, recordset__dbtableid=obj.specify_model.tableId)

    # Get the one which points to the resource 'obj'.
    try:
        rsi = rsis.get(recordid=obj.id)
    except Recordsetitem.DoesNotExist:
        return None

    # Querysets for the recordset items before and after the one in question.
    prev_rsis = rsis.filter(recordid__lt=obj.id).order_by('-recordid')
    next_rsis = rsis.filter(recordid__gt=obj.id).order_by('recordid')

    # Build URIs for the previous and the next recordsetitem, if present.
    try:
        prev: Optional[str] = uri_for_model(obj.__class__, prev_rsis[0].recordid)
    except IndexError:
        prev = None

    try:
        next: Optional[str] = uri_for_model(obj.__class__, next_rsis[0].recordid)
    except IndexError:
        next = None

    return {
        'recordsetid': rsi.recordset_id,
        'total_count': rsis.count(),
        'index': prev_rsis.count(),
        'previous': prev,
        'next': next
        }

@transaction.atomic
def post_resource(collection, agent, name: str, data, recordsetid: Optional[int]=None):
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

def _maybe_delete(data: Dict[str, Any], to_delete: str):
    if to_delete in data:
        del data[to_delete]

def cleanData(model, data: Dict[str, Any], agent) -> Dict[str, Any]:
    """Returns a copy of data with only fields that are part of model, removing
    metadata fields and warning on unexpected extra fields."""
    cleaned = {}
    for field_name in list(data.keys()):
        if field_name in ('resource_uri', 'recordset_info', '_tableName'):
            # These fields are meta data, not part of the resource.
            continue
        try:
            db_field_name = correct_field_name(model, field_name)
        except FieldDoesNotExist:
            logger.warn('field "%s" does not exist in %s', field_name, model)
        else:
            cleaned[db_field_name] = data[field_name]

        # Unset date precision if date is not set, but precision is
        # Set date precision if date is set, but precision is not
        if field_name.endswith('precision'):
            precision_field_name = field_name
            date_field_name = field_name[:-len('precision')]
            if date_field_name in data:
                date = data[date_field_name]
                has_date = date is not None and date != ''
                has_precision = data[precision_field_name] is not None
                if has_date and not has_precision:
                    # Assume full precision
                    cleaned[precision_field_name] = 1
                elif not has_date and has_precision:
                    cleaned[precision_field_name] = None
        
    if model is models.Agent:
        # setting user agents is part of the user management system.
        _maybe_delete(cleaned, 'specifyuser')

    # guid should only be updatable for taxon and geography
    if model not in (models.Taxon, models.Geography):
        _maybe_delete(cleaned, 'guid')

    # timestampcreated should never be updated.
    #  _maybe_delete(cleaned, 'timestampcreated')

    # Password should be set though the /api/set_password/<id>/ endpoint
    if model is models.Specifyuser: 
        _maybe_delete(cleaned, 'password')

    return cleaned

def create_obj(collection, agent, model, data: Dict[str, Any], parent_obj=None):
    """Create a new instance of 'model' and populate it with 'data'."""
    logger.debug("creating %s with data: %s", model, data)
    if isinstance(model, str):
        model = get_model_or_404(model)
    data = cleanData(model, data, agent)
    obj = model()
    handle_fk_fields(collection, agent, obj, data)
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
    handle_to_many(collection, agent, obj, data)
    return obj

FieldChangeInfo = TypedDict('FieldChangeInfo', {'field_name': str, 'old_value': Any, 'new_value': Any})

def fld_change_info(obj, field, val) -> Optional[FieldChangeInfo]:
    if field.name != 'timestampmodified':
        value = prepare_value(field, val)
        if isinstance(field, FloatField) or isinstance(field, DecimalField):
            value = None if value is None else float(value)
        old_value = getattr(obj, field.name)
        if str(old_value) != str(value): # ugh
            return {'field_name': field.name, 'old_value': old_value, 'new_value': value}
    return None

def set_fields_from_data(obj, data: Dict[str, Any]) -> List[FieldChangeInfo]:
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

def is_dependent_field(obj, field_name: str) -> bool:
    if obj.specify_model.get_field(field_name) is None:
        return False

    return (
        obj.specify_model.get_field(field_name).dependent

        or (obj.__class__ is models.Collectionobject and
            field_name == 'collectingevent' and
            obj.collection.isembeddedcollectingevent)

        or (field_name == 'paleocontext' and (

            (obj.__class__ is models.Collectionobject and
             obj.collection.discipline.paleocontextchildtable == "collectionobject" and
             obj.collection.discipline.ispaleocontextembedded)

            or (obj.__class__ is models.Collectingevent and
                obj.discipline.paleocontextchildtable == "collectingevent" and
                obj.discipline.ispaleocontextembedded)

            or (obj.__class__ is models.Locality and
                obj.discipline.paleocontextchildtable == "locality" and
                obj.discipline.ispaleocontextembedded))))

def get_related_or_none(obj, field_name: str) -> Any:
    try:
        return getattr(obj, field_name)
    except ObjectDoesNotExist:
        return None

def reorder_fields_for_embedding(cls, data: Dict[str, Any]) -> Iterable[Tuple[str, Any]]:
    """For objects which can have embedded collectingevent or
    paleocontext, we have to make sure the domain field gets set
    first so that is_dependent_field will work.
    """
    put_first = {
        models.Collectionobject: 'collection',
        models.Collectingevent: 'discipline',
        models.Locality: 'discipline',
    }.get(cls, None)

    if put_first in data:
        yield (put_first, data[put_first])
    for key in data.keys() - {put_first}:
        yield (key, data[key])


def handle_fk_fields(collection, agent, obj, data: Dict[str, Any]) -> Tuple[List, List[FieldChangeInfo]]:
    """Where 'obj' is a Django model instance and 'data' is a dict,
    set foreign key fields in the object from the provided data.
    """

    # This function looks at arbitrary related objects so it needs to be able to check read permissions
    read_checker = table_permissions_checker(collection, agent, "read")

    items = reorder_fields_for_embedding(obj.__class__, data)
    dependents_to_delete = []
    dirty: List[FieldChangeInfo] = []
    for field_name, val in items:
        field = obj._meta.get_field(field_name)
        if not field.many_to_one: continue

        old_related = get_related_or_none(obj, field_name)
        dependent = is_dependent_field(obj, field_name)
        old_related_id = None if old_related is None else old_related.id
        new_related_id = None

        if val is None:
            setattr(obj, field_name, None)
            if dependent and old_related:
                dependents_to_delete.append(old_related)

        elif isinstance(val, field.related_model):
            # The related value was patched into the data by a parent object.
            setattr(obj, field_name, val)
            new_related_id = val.id

        elif isinstance(val, str):
            # The related object is given by a URI reference.
            assert not dependent, "didn't get inline data for dependent field %s in %s: %r" % (field_name, obj, val)
            fk_model, fk_id = strict_uri_to_model(val, field.related_model.__name__)
            setattr(obj, field_name, get_object_or_404(fk_model, id=fk_id))
            new_related_id = fk_id

        elif hasattr(val, 'items'):  # i.e. it's a dict of some sort
            # The related object is represented by a nested dict of data.
            rel_model = field.related_model

            rel_obj = update_or_create_resource(collection, agent, rel_model, val, obj if dependent else None)

            setattr(obj, field_name, rel_obj)
            if dependent and old_related and old_related.id != rel_obj.id:
                dependents_to_delete.append(old_related)
            new_related_id = rel_obj.id
            data[field_name] = _obj_to_data(rel_obj, read_checker)
        else:
            raise Exception('bad foreign key field in data')
        if str(old_related_id) != str(new_related_id):
            dirty.append({'field_name': field_name, 'old_value': old_related_id, 'new_value': new_related_id})

    return dependents_to_delete, dirty

def handle_to_many(collection, agent, obj, data: Dict[str, Any]) -> None:
    """For every key in the dict 'data' which is a *-to-many field in the
    Django model instance 'obj', if nested data is provided, use it to
    update the set of related objects.

    The assumption is that provided data represents ALL related objects for
    'obj'. Any existing related objects not in the nested data will be deleted.
    Nested data items with ids will be updated. Those without ids will be
    created as new resources.
    """
    for field_name, val in list(data.items()):
        field = obj._meta.get_field(field_name)
        if not field.is_relation or (field.many_to_one or field.one_to_one): continue # Skip *-to-one fields.
        dependent = is_dependent_field(obj, field_name)

        if isinstance(val, list): 
            assert dependent or (isinstance(obj, models.Recordset) and field_name == 'recordsetitems'), \
                "got inline data for non dependent field %s in %s: %r" % (field_name, obj, val)
        elif hasattr(val, "items"): 
            assert not dependent, "got inline dictionary data for dependent field %s in %s: %r" % (field_name, obj, val)
        else: 
            # The field contains something other than nested data. 
            # Probably the URI of the collection
            continue

        if dependent or (isinstance(obj, models.Recordset) and field_name == 'recordsetitems'): 
            _handle_dependent_to_many(collection, agent, obj, field, val)
        else: 
            _handle_independent_to_many(collection, agent, obj, field, val)

def _handle_dependent_to_many(collection, agent, obj, field, value):
    if not isinstance(value, list): 
        assert isinstance(value, list), "didn't get inline data for dependent field %s in %s: %r" % (field.name, obj, value)
        
    rel_model = field.related_model
    ids = [] # Ids not in this list will be deleted (if dependent) or removed from obj (if independent) at the end.

    for rel_data in value:
        rel_data[field.field.name] = obj

        rel_obj = update_or_create_resource(collection, agent, rel_model, rel_data, parent_obj=obj)

        ids.append(rel_obj.id) # Record the id as one to keep.

    # Delete related objects not in the ids list.
    # TODO: Check versions for optimistic locking.
    to_remove = getattr(obj, field.name).exclude(id__in=ids).select_for_update()
    for rel_obj in to_remove:
        check_table_permissions(collection, agent, rel_obj, "delete")
        auditlog.remove(rel_obj, agent, obj)
    
    to_remove.delete()

class IndependentInline(TypedDict): 
    update: List[Union[str, Dict[str, Any]]]
    remove: List[str]

def _handle_independent_to_many(collection, agent, obj, field, value: IndependentInline): 
    logger.warning("Updating independent collections via the API is experimental and the structure may be changed in the future")
    
    rel_model = field.related_model

    to_update = value.get('update', [])
    to_remove = value.get('remove', [])

    ids_to_fetch = []
    cached_objs = dict()
    fk_model = None

    to_fetch = [*to_update, *to_remove]

    # Fetch the related records which are provided as strings
    for rel_data in to_fetch: 
        if not isinstance(rel_data, str): continue
        fk_model, fk_id = strict_uri_to_model(rel_data, rel_model.__name__)
        ids_to_fetch.append(fk_id)

    if fk_model is not None: 
        cached_objs: Dict[int, Dict[str, Any]] = {item.id: obj_to_data(item) for item in get_model(fk_model).objects.filter(id__in=ids_to_fetch).select_for_update()}

    for rel_data in to_update: 
        if isinstance(rel_data, str): 
            fk_model, fk_id = strict_uri_to_model(rel_data, rel_model.__name__)
            rel_data: Optional[Dict[str, Any]] = cached_objs.get(fk_id)
            if rel_data is None: 
                raise Http404(f"{rel_model.specify_model.name} with id {fk_id} does not exist")
            if rel_data[field.field.name] == uri_for_model(obj.__class__, obj.id): 
                continue

        rel_data[field.field.name] = obj
        update_or_create_resource(collection, agent, rel_model, rel_data, None)
    
    if len(to_remove) > 0:
        assert obj.pk is not None, f"Unable to remove {obj.__class__.__name__}.{field.field.name} resources from new {obj.__class__.__name__}"
        related_field = datamodel.reverse_relationship(obj.specify_model.get_field_strict(field.name))
        assert related_field is not None, f"no reverse relationship for {obj.__class__.__name__}.{field.field.name}" 
        for rel_obj in to_remove: 
            fk_model, fk_id = strict_uri_to_model(rel_obj, rel_model.__name__)
            rel_data: Optional[Dict[str, Any]] = cached_objs.get(fk_id)
            if rel_data is None: 
                raise Http404(f"{rel_model.specify_model.name} with id {fk_id} does not exist")
            assert rel_data[field.field.name] == uri_for_model(obj.__class__, obj.pk), f"Related {related_field.relatedModelName} does not belong to {obj.__class__.__name__}.{field.field.name}: {rel_obj}"
            rel_data[field.field.name] = None
            update_obj(collection, agent, rel_model, rel_data["id"], rel_data["version"], rel_data)

def update_or_create_resource(collection, agent, model, data, parent_obj): 
    if 'id' in data: 
        return update_obj(collection, agent, 
                          model, data['id'], 
                          data['version'], data, 
                          parent_obj=parent_obj)
    else: 
        return create_obj(collection, agent, model, data, parent_obj=parent_obj)

@transaction.atomic
def delete_resource(collection, agent, name, id, version) -> None:
    """Delete the resource with 'id' and model named 'name' with optimistic
    locking 'version'.
    """
    obj = get_object_or_404(name, id=int(id))
    return delete_obj(obj, version, collection=collection, agent=agent)

def delete_obj(obj, version=None, parent_obj=None, collection=None, agent=None, clean_predelete=None) -> None:
    # need to delete dependent -to-one records
    # e.g. delete CollectionObjectAttribute when CollectionObject is deleted
    # but have to delete the referring record first
    dependents_to_delete = [_f for _f in (
        get_related_or_none(obj, field.name)
        for field in obj._meta.get_fields()
        if (field.many_to_one or field.one_to_one) and is_dependent_field(obj, field.name)
    ) if _f]

    if collection and agent:
        check_table_permissions(collection, agent, obj, "delete")
        auditlog.remove(obj, agent, parent_obj)
    if version is not None:
        bump_version(obj, version)
    if clean_predelete:
        clean_predelete(obj)
    if hasattr(obj, 'pre_constraints_delete'):
        obj.pre_constraints_delete()
    obj.delete()

    for dep in dependents_to_delete:
      delete_obj(dep, version, parent_obj=obj, collection=collection, agent=agent, clean_predelete=clean_predelete)


@transaction.atomic
def put_resource(collection, agent, name: str, id, version, data: Dict[str, Any]):
    return update_obj(collection, agent, name, id, version, data)

def update_obj(collection, agent, name: str, id, version, data: Dict[str, Any], parent_obj=None):
    """Update the resource with 'id' in model named 'name' with given
    'data'.
    """
    obj = get_object_or_404(name, id=int(id))
    check_table_permissions(collection, agent, obj, "update")

    data = cleanData(obj.__class__, data, agent)
    dependents_to_delete, fk_dirty = handle_fk_fields(collection, agent, obj, data)
    dirty = fk_dirty + set_fields_from_data(obj, data)

    check_field_permissions(collection, agent, obj, [d['field_name'] for d in dirty], "update")

    try:
        obj._meta.get_field('modifiedbyagent')
    except FieldDoesNotExist:
        pass
    else:
        obj.modifiedbyagent = agent

    bump_version(obj, version)
    obj.save(force_update=True)
    auditlog.update(obj, agent, parent_obj, dirty)
    for dep in dependents_to_delete:
        delete_obj(dep, parent_obj=obj, collection=collection, agent=agent)
    handle_to_many(collection, agent, obj, data)
    return obj

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
        raise StaleObjectException("%s object %d is out of date" % (obj.__class__.__name__, obj.id))
    obj.version = version + 1

def prepare_value(field, val: Any) -> Any:
    if isinstance(field, DateTimeField) and isinstance(val, str):
        return val.replace('T', ' ')
    return val

def parse_uri(uri: str) -> Tuple[str, str]:
    """Return the model name and id from a resource or collection URI."""
    match = URI_RE.match(uri)
    assert match is not None, f"Bad URI: {uri}"
    groups = match.groups()
    return groups[0], groups[2]

def strict_uri_to_model(uri: str, model: str) -> Tuple[str, int]:
    uri_model, uri_id = parse_uri(uri)
    assert model.lower() == uri_model.lower(), f"{model} does not match model in uri: {uri_model}"
    assert uri_id is not None
    return uri_model, int(uri_id)

def obj_to_data(obj) -> Dict[str, Any]:
    "Wrapper for backwards compat w/ other modules that use this function."
    # TODO: Such functions should be audited for whether they should apply
    # read permisions enforcement.
    return _obj_to_data(obj, lambda o: None)

def _obj_to_data(obj, perm_checker: ReadPermChecker) -> Dict[str, Any]:
    """Return a (potentially nested) dictionary of the fields of the
    Django model instance 'obj'.
    """
    perm_checker(obj)

    # Get regular and *-to-one fields.
    fields = obj._meta.get_fields()
    if isinstance(obj, models.Specifyuser):
        # block out password field from users table
        fields = [f for f in fields if f.name != 'password']

    data = dict((field.name, field_to_val(obj, field, perm_checker))
                for field in fields
                if not (field.auto_created or field.one_to_many or field.many_to_many))
    # Get *-to-many fields.
    data.update(dict((ro.get_accessor_name(), to_many_to_data(obj, ro, perm_checker))
                     for ro in obj._meta.get_fields()
                     if ro.one_to_many
                     and obj.specify_model.get_field(ro.get_accessor_name()) is not None))
    # Add a meta data field with the resource's URI.
    data['resource_uri'] = uri_for_model(obj.__class__.__name__.lower(), obj.id)

    data.update(calculate_extra_fields(obj, data))
    return data

def to_many_to_data(obj, rel, checker: ReadPermChecker) -> Union[str, List[Dict[str, Any]]]:
    """Return the URI or nested data of the 'rel' collection
    depending on if the field is included in the 'inlined_fields' global.
    """
    parent_model = rel.model.specify_model
    field_name = rel.get_accessor_name()
    field = parent_model.get_field(field_name)
    if field is not None and field.dependent:
        objs = getattr(obj, field_name)
        return [_obj_to_data(o, checker) for o in objs.all()]

    collection_uri = uri_for_model(rel.related_model)
    return collection_uri + '?' + urlencode([(rel.field.name.lower(), str(obj.id))])

def field_to_val(obj, field, checker: ReadPermChecker) -> Any:
    """Return the value or nested data or URI for the given field which should
    be either a regular field or a *-to-one field.
    """
    if field.many_to_one or (field.one_to_one and not field.auto_created):
        if is_dependent_field(obj, field.name):
            related_obj = getattr(obj, field.name)
            if related_obj is None: return None
            return _obj_to_data(related_obj, checker)
        related_id = getattr(obj, field.name + '_id')
        if related_id is None: return None
        return uri_for_model(field.related_model, related_id)
    else:
        return getattr(obj, field.name)

CollectionPayloadMeta = TypedDict('CollectionPayloadMeta', {
    'limit': int,
    'offset': int,
    'total_count': int
})

CollectionPayload = TypedDict('CollectionPayload', {
    'objects': List[Dict[str, Any]],
    'meta': CollectionPayloadMeta
})

def get_collection(logged_in_collection, model, checker: ReadPermChecker, control_params=GetCollectionForm.defaults, params={}) -> CollectionPayload:
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

        if param.endswith('__in') or param.endswith('__range'):
            # this is a bit kludgy
            val = val.split(',')

        filters.update({param: val})
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

def objs_to_data(objs, offset=0, limit=20) -> CollectionPayload:
    """Wrapper for backwards compatibility."""
    return objs_to_data_(objs, objs.count(), lambda o: _obj_to_data(o, lambda x: None), offset, limit)

def objs_to_data_(
    objs,
    total_count,
    mapper: Callable[[Any], Dict[str, Any]],
    offset=0,
    limit=20
) -> CollectionPayload:
    """Return a collection structure with a list of the data of given objects
    and collection meta data.
    """
    offset, limit = int(offset), int(limit)

    if limit == 0:
        objs = objs[offset:]
    else:
        objs = objs[offset:offset + limit]

    return {'objects': [mapper(o) for o in objs],
            'meta': {'limit': limit,
                     'offset': offset,
                     'total_count': total_count}}

def uri_for_model(model, id=None) -> str:
    """Given a Django model and optionally an id, return a URI
    for the collection or resource (if an id is given).
    """
    if not isinstance(model, str):
        model = model.__name__
    uri = '/api/specify/%s/' % model.lower()
    if id is not None:
        uri += '%d/' % int(id)
    return uri

class RowsForm(GetCollectionForm):
    fields = forms.CharField(required=True) # type: ignore
    distinct = forms.CharField(required=False)
    defaults = dict(
        domainfilter=None,
        limit=0,
        offset=0,
        orderby=None,
        distinct=False,
        fields=None,
    )

def rows(request, model_name: str) -> HttpResponse:
    enforce(request.specify_collection, request.specify_user_agent, [f'/table/{model_name.lower()}'], "read")

    form = RowsForm(request.GET)

    if not form.is_valid():
        return HttpResponseBadRequest(toJson(form.errors), content_type='application/json')

    query = apply_filters(request.specify_collection, request.GET, model_name, form.cleaned_data)
    fields = form.cleaned_data['fields'].split(',')
    try:
        query = query.values_list(*fields).order_by(*fields)
    except FieldError as e:
        return HttpResponseBadRequest(e)
    if form.cleaned_data['domainfilter'] == 'true':
        query = filter_by_collection(query, request.specify_collection)
    if form.cleaned_data['orderby']:
        try:
            query = query.order_by(form.cleaned_data['orderby'])
        except FieldError as e:
            raise OrderByError(e)
    if form.cleaned_data['distinct']:
        query = query.distinct()

    limit = form.cleaned_data['limit']
    offset = form.cleaned_data['offset']
    if limit == 0:
        query = query[offset:]
    else:
        query = query[offset:offset + limit]

    data = list(query)
    return HttpResponse(toJson(data), content_type='application/json')

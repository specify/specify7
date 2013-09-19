from urllib import urlencode
import json
import re

from django.db import transaction
from django.http import HttpResponse, Http404, HttpResponseNotAllowed, QueryDict
from django.core.exceptions import ObjectDoesNotExist
from django.db.models.fields.related import ForeignKey
from django.db.models.fields import DateTimeField, FieldDoesNotExist

from . import models
from .autonumbering import autonumber
from .filter_by_col import filter_by_collection
from .dependent_fields import is_dependent
from .auditlog import auditlog

# Regex matching api uris for extracting the model name and id number.
URI_RE = re.compile(r'^/api/specify/(\w+)/($|(\d+))')

# A set of fields that represent relations to other resources which
# should be included as nested objects when resources are fetched.
from .dependent_fields import dependent_fields as inlined_fields

class JsonEncoder(json.JSONEncoder):
    """Augmented JSON encoder that handles datetime and decimal objects."""
    def default(self, obj):
        from decimal import Decimal
        if isinstance(obj, Decimal):
            return str(obj)
        if hasattr(obj, 'isoformat'):
            return obj.isoformat()
        return json.JSONEncoder.default(self, obj)

def toJson(obj):
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

class HttpResponseCreated(HttpResponse):
    """Returned to the client when a POST request succeeds and a new
    resource is created.
    """
    status_code = 201

def resource_dispatch(request, model, id):
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

    # Dispatch on the request type.
    if request.method == 'GET':
        data = get_resource(model, id, request.GET.get('recordsetid', None))
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

        resp = HttpResponse(toJson(obj_to_data(obj)),
                            content_type='application/json')

    elif request.method == 'DELETE':
        delete_resource(model, id, version)
        resp = HttpResponse('', status=204)

    else:
        # Unhandled request type.
        resp = HttpResponseNotAllowed(['GET', 'PUT', 'DELETE'])

    return resp

def collection_dispatch(request, model):
    """Handles requests related to collections of resources.

    Dispatches on the request type.
    Determines the logged-in user and collection from the request.
    De/Encodes structured data as JSON.
    """
    if request.method == 'GET':
        data = get_collection(request.specify_collection,
                              model, request.GET)
        resp = HttpResponse(toJson(data), content_type='application/json')

    elif request.method == 'POST':
        obj = post_resource(request.specify_collection,
                            request.specify_user_agent,
                            model, json.load(request),
                            request.GET.get('recordsetid', None))

        resp = HttpResponseCreated(toJson(obj_to_data(obj)),
                                   content_type='application/json')
    else:
        # Unhandled request type.
        resp = HttpResponseNotAllowed(['GET', 'POST'])

    return resp

def get_model_or_404(name):
    """Lookup a specify model by name. Raise Http404 if not found."""
    try:
        return getattr(models, name.capitalize())
    except AttributeError as e:
        raise Http404(e)

def get_object_or_404(model, *args, **kwargs):
    """A version of get_object_or_404 that can accept a model name
    in place of the model class."""
    from django.shortcuts import get_object_or_404 as get_object

    if isinstance(model, basestring):
        model = get_model_or_404(model)
    return get_object(model, *args, **kwargs)

def get_resource(name, id, recordsetid=None):
    """Return a dict of the fields from row 'id' in model 'name'.

    If given a recordset id, the data will be suplemented with
    data about the resource's relationship to the given record set.
    """
    obj = get_object_or_404(name, id=int(id))
    data = obj_to_data(obj)
    if recordsetid is not None:
        data['recordset_info'] = get_recordset_info(obj, recordsetid)
    return data

def get_recordset_info(obj, recordsetid):
    """Return a dict of info about how the resource 'obj' is related to
    the recordset with id 'recordsetid'.
    """
    # Queryset of record set items in the given record set with
    # the additional condition that they match the resource's table.
    rsis = models.Recordsetitem.objects.filter(
        recordset__id=recordsetid, recordset__dbtableid=obj.table_id)

    # Get the one which points to the resource 'obj'.
    try:
        rsi = rsis.get(recordid=obj.id)
    except models.Recordsetitem.DoesNotExist:
        return None

    # Querysets for the recordset items before and after the one in question.
    prev_rsis = rsis.filter(recordid__lt=obj.id).order_by('-recordid')
    next_rsis = rsis.filter(recordid__gt=obj.id).order_by('recordid')

    # Build URIs for the previous and the next recordsetitem, if present.
    try:
        prev = uri_for_model(obj.__class__, prev_rsis[0].recordid)
    except IndexError:
        prev = None

    try:
        next = uri_for_model(obj.__class__, next_rsis[0].recordid)
    except IndexError:
        next = None

    return {
        'recordsetid': rsi.recordset_id,
        'total_count': rsis.count(),
        'index': prev_rsis.count(),
        'previous': prev,
        'next': next
        }

@transaction.commit_on_success
def post_resource(collection, agent, name, data, recordsetid=None):
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
        try:
            recordset = models.Recordset.objects.get(id=recordsetid)
        except models.Recordset.DoesNotExist, e:
            raise RecordSetException(e)

        if recordset.dbtableid != obj.table_id:
            # the resource is not of the right kind to go in the recordset
            raise RecordSetException(
                "expected %s, got %s when adding object to recordset",
                (models.models_by_tableid[recordset.dbtableid], obj.__class__))

        recordset.recordsetitems.create(recordid=obj.id)
    return obj

def set_field_if_exists(obj, field, value):
    """Where 'obj' is a Django model instance, a resource object, check
    if a field named 'field' exists and set it to 'value' if so. Do nothing otherwise.
    """
    try:
        obj._meta.get_field(field)
    except FieldDoesNotExist:
        pass
    else:
        setattr(obj, field, value)

def create_obj(collection, agent, model, data, parent_obj=None):
    """Create a new instance of 'model' and populate it with 'data'."""
    if isinstance(model, basestring):
        model = get_model_or_404(model)
    obj = model()
    handle_fk_fields(collection, agent, obj, data)
    set_fields_from_data(obj, data)
    set_field_if_exists(obj, 'createdbyagent', agent)
    set_field_if_exists(obj, 'collectionmemberid', collection.id)
    # Have to save the object before autonumbering b/c
    # autonumber acquires a write lock on the model,
    # but save touches other tables.
    obj.save()
    autonumber(collection, agent.specifyuser, obj)
    obj.save()
    auditlog.insert(obj, agent, parent_obj)
    handle_to_many(collection, agent, obj, data)
    return obj

def set_fields_from_data(obj, data):
    """Where 'obj' is a Django model instance and 'data' is a dict,
    set all fields provided by data that are not related object fields.
    """
    for field_name, val in data.items():
        if field_name in ('resource_uri', 'recordset_info'):
            # These fields are meta data, not part of the resource.
            continue
        field, model, direct, m2m = obj._meta.get_field_by_name(field_name)
        if direct and not isinstance(field, ForeignKey):
            setattr(obj, field_name, prepare_value(field, val))

def handle_fk_fields(collection, agent, obj, data):
    """Where 'obj' is a Django model instance and 'data' is a dict,
    set foreign key fields in the object from the provided data.
    """
    for field_name, val in data.items():
        if field_name in ('resource_uri', 'recordset_info'):
            # These fields are meta data, not part of the resource.
            continue
        field, model, direct, m2m = obj._meta.get_field_by_name(field_name)
        if not isinstance(field, ForeignKey): continue

        try:
            old_related = getattr(obj, field_name)
        except ObjectDoesNotExist:
            old_related = None

        dependent = is_dependent(obj.__class__.__name__, field_name)

        if val is None:
            setattr(obj, field_name, None)
            if dependent and old_related:
                auditlog.remove(old_related, agent, obj)
                old_related.delete()

        elif isinstance(val, field.related.parent_model):
            # The related value was patched into the data by a parent object.
            setattr(obj, field_name, val)

        elif isinstance(val, basestring):
            # The related object is given by a URI reference.
            assert not dependent, "didn't get inline data for dependent field %s in %s: %r" % (field_name, obj, val)
            fk_model, fk_id = parse_uri(val)
            assert fk_model == field.related.parent_model.__name__.lower()
            setattr(obj, field_name + '_id', fk_id)

        elif hasattr(val, 'items'):  # i.e. it's a dict of some sort
            # The related object is represented by a nested dict of data.
            assert dependent, "got inline data for non dependent field %s in %s: %r" % (field_name, obj, val)
            rel_model = field.related.parent_model
            if 'id' in val:
                # The related object is an existing resource with an id.
                # This should never happen.
                rel_obj = update_obj(collection, agent,
                                     rel_model, val['id'],
                                     val['version'], val,
                                     parent_obj=obj)
            else:
                # The related object is to be created.
                rel_obj = create_obj(collection, agent,
                                     rel_model, val,
                                     parent_obj=obj)

            setattr(obj, field_name, rel_obj)
            if dependent and old_related and old_related.id != rel_obj.id:
                auditlog.remove(old_related, agent, obj)
                old_related.delete()
            data[field_name] = obj_to_data(rel_obj)
        else:
            raise Exception('bad foreign key field in data')

def handle_to_many(collection, agent, obj, data):
    """For every key in the dict 'data' which is a *-to-many field in the
    Django model instance 'obj', if nested data is provided, use it to
    update the set of related objects.

    The assumption is that provided data represents ALL related objects for
    'obj'. Any existing related objects not in the nested data will be deleted.
    Nested data items with ids will be updated. Those without ids will be
    created as new resources.
    """
    for field_name, val in data.items():
        if field_name in ('resource_uri', 'recordset_info'):
            # These fields are meta data, not part of the resource.
            continue

        field, model, direct, m2m = obj._meta.get_field_by_name(field_name)
        if direct: continue # Skip *-to-one fields.

        if isinstance(val, list):
            assert is_dependent(obj.__class__.__name__, field_name), \
                   "got inline data for non dependent field %s in %s: %r" % (field_name, obj, val)
        else:
            # The field contains something other than nested data.
            # Probably the URI of the collection of objects.
            assert not is_dependent(obj.__class__.__name__, field_name), \
                   "didn't get inline data for dependent field %s in %s: %r" % (field_name, obj, val)
            continue

        rel_model = field.model
        ids = [] # Ids not in this list will be deleted at the end.
        for rel_data in val:
            rel_data[field.field.name] = obj
            if 'id' in rel_data:
                # Update an existing related object.
                rel_obj = update_obj(collection, agent,
                                     rel_model, rel_data['id'],
                                     rel_data['version'], rel_data,
                                     parent_obj=obj)
            else:
                # Create a new related object.
                rel_obj = create_obj(collection, agent, rel_model, rel_data, parent_obj=obj)
            ids.append(rel_obj.id) # Record the id as one to keep.

        # Delete related objects not in the ids list.
        # TODO: Check versions for optimistic locking.
        to_delete = getattr(obj, field_name).exclude(id__in=ids)
        for rel_obj in to_delete:
            auditlog.remove(rel_obj, agent, obj)
        to_delete.delete()

@transaction.commit_on_success
def delete_resource(name, id, version):
    return delete_obj(name, id, version)

def delete_obj(name, id, version, parent_obj=None):
    """Delete the resource with 'id' and model named 'name' with optimistic
    locking 'version'.
    """
    obj = get_object_or_404(name, id=int(id))
    bump_version(obj, version)
    obj.delete()
    auditlog.delete(obj, agent, parent_obj)

@transaction.commit_on_success
def put_resource(collection, agent, name, id, version, data):
    return update_obj(collection, agent, name, id, version, data)

def update_obj(collection, agent, name, id, version, data, parent_obj=None):
    """Update the resource with 'id' in model named 'name' with given
    'data'.
    """
    obj = get_object_or_404(name, id=int(id))
    handle_fk_fields(collection, agent, obj, data)
    set_fields_from_data(obj, data)

    try:
        obj._meta.get_field('modifiedbyagent')
    except FieldDoesNotExist:
        pass
    else:
        obj.modifiedbyagent = agent

    bump_version(obj, version)
    obj.save(force_update=True)
    auditlog.update(obj, agent, parent_obj)
    handle_to_many(collection, agent, obj, data)
    return obj

def bump_version(obj, version):
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
    manager = obj.__class__._base_manager
    updated = manager.filter(pk=obj.pk, version=version).update(version=version+1)
    if not updated:
        raise StaleObjectException("%s object %d is out of date" % (obj.__class__.__name__, obj.id))
    obj.version = version + 1

def prepare_value(field, val):
    if isinstance(field, DateTimeField) and isinstance(val, basestring):
        return val.replace('T', ' ')
    return val

def parse_uri(uri):
    """Return the model name and id from a resource or collection URI."""
    match = URI_RE.match(uri)
    if match is not None:
        groups = match.groups()
        return (groups[0], groups[2])

def obj_to_data(obj):
    """Return a (potentially nested) dictionary of the fields of the
    Django model instance 'obj'.
    TODO: Add hidden field function (mainly for specifyuser password field).
    """
    # Get regular and *-to-one fields.
    data = dict((field.name, field_to_val(obj, field))
                for field in obj._meta.fields)
    # Get *-to-many fields.
    data.update(dict((ro.get_accessor_name(), to_many_to_data(obj, ro))
                     for ro in obj._meta.get_all_related_objects()))
    # Add a meta data field with the resource's URI.
    data['resource_uri'] = uri_for_model(obj.__class__.__name__.lower(), obj.id)
    return data

def to_many_to_data(obj, related_object):
    """Return the URI or nested data of the 'related_object' collection
    depending on if the field is included in the 'inlined_fields' global.
    """
    parent_model = related_object.parent_model.__name__
    if '.'.join((parent_model, related_object.get_accessor_name())) in inlined_fields:
        objs = getattr(obj, related_object.get_accessor_name())
        return [obj_to_data(o) for o in objs.all()]

    collection_uri = uri_for_model(related_object.model)
    return collection_uri + '?' + urlencode([(related_object.field.name.lower(), str(obj.id))])

def field_to_val(obj, field):
    """Return the value or nested data or URI for the given field which should
    be either a regular field or a *-to-one field.
    """
    if isinstance(field, ForeignKey):
        if '.'.join((obj.__class__.__name__, field.name)) in inlined_fields:
            related_obj = getattr(obj, field.name)
            if related_obj is None: return None
            return obj_to_data(related_obj)
        related_id = getattr(obj, field.name + '_id')
        if related_id is None: return None
        related_model = field.related.parent_model
        return uri_for_model(related_model, related_id)
    else:
        return getattr(obj, field.name)

def get_collection(logged_in_collection, model, params={}):
    """Return a list of structured data for the objects from 'model'
    subject to the request 'params'."""
    if isinstance(model, basestring):
        model = get_model_or_404(model)

    # Default values for request parameters.
    offset = 0
    limit = 20
    order_by = None
    filters = {}
    do_domain_filter = False

    for param, val in params.items():
        if param == 'domainfilter':
            # Use the logged_in_collection to limit request
            # to relevant items.
            do_domain_filter = val == 'true'
            continue

        if param == 'limit':
            # Return at most 'limit' items.
            # Zero for all.
            limit = int(val)
            continue

        if param == 'offset':
            # Return items starting from 'offset'.
            offset = int(val)
            continue

        if param == 'orderby':
            order_by = val
            continue

        # param is a field for filtering
        filters.update({param: val})
    objs = model.objects.filter(**filters)
    if do_domain_filter:
        objs = filter_by_collection(objs, logged_in_collection)
    if order_by is not None:
        objs = objs.order_by(order_by)
    return objs_to_data(objs, offset, limit)

def objs_to_data(objs, offset=0, limit=20):
    """Return a collection structure with a list of the data of given objects
    and collection meta data.
    """
    total_count = objs.count()

    if limit == 0:
        objs = objs[offset:]
    else:
        objs = objs[offset:offset + limit]

    return {'objects': [obj_to_data(o) for o in objs],
            'meta': {'limit': limit,
                     'offset': offset,
                     'total_count': total_count}}

def uri_for_model(model, id=None):
    """Given a Django model and optionally an id, return a URI
    for the collection or resource (if an id is given).
    """
    if not isinstance(model, basestring):
        model = model.__name__
    uri = '/api/specify/%s/' % model.lower()
    if id is not None:
        uri += '%d/' % int(id)
    return uri

def rows(request, model):
    query = getattr(models, model.capitalize()).objects.all()
    fields = request.GET['fields'].split(',')
    query = query.values_list(*fields).order_by(*fields)
    query = filter_by_collection(query, request.specify_collection)
    if request.GET.get('distinct', False):
        query = query.distinct()
    limit = request.GET.get('limit', 0)
    if limit > 0:
        query = query[:limit]
    data = list(query)
    return HttpResponse(toJson(data), content_type='application/json')

from urllib import urlencode
import json
from collections import defaultdict
import re

from django.db import transaction
from django.core.exceptions import ObjectDoesNotExist
from django.http import HttpResponse, HttpResponseBadRequest,\
    Http404, HttpResponseNotAllowed, QueryDict

from django.contrib.auth.decorators import login_required
from django.db.models.fields.related import ForeignKey
from django.db.models.fields import DateTimeField, FieldDoesNotExist
from django.utils import simplejson
from django.views.decorators.csrf import csrf_exempt

from specify import models
from specify.autonumbering import autonumber

URI_RE = re.compile(r'^/api/specify/(\w+)/($|(\d+))')

inlined_fields = [
    'Collector.agent',
    'Collectingevent.collectors',
    'Collectionobject.collectionobjectattribute',
#    'Collectionobject.determinations',
    'Picklist.picklistitems',
]

inlined_dict = defaultdict(list)
for field in inlined_fields:
    m, f = field.split('.')
    inlined_dict[m].append(f)

class JsonDateEncoder(json.JSONEncoder):
    def default(self, obj):
        from decimal import Decimal
        if isinstance(obj, Decimal):
            return str(obj)
        if hasattr(obj, 'isoformat'):
            return obj.isoformat()
        return json.JSONEncoder.default(self, obj)

def toJson(obj):
    return json.dumps(obj, cls=JsonDateEncoder)

class OptimisticLockException(Exception): pass

class MissingVersionException(OptimisticLockException): pass

class StaleObjectException(OptimisticLockException): pass

class HttpResponseConflict(HttpResponse):
    status_code = 409

class HttpResponseCreated(HttpResponse):
    status_code = 201

@login_required
@csrf_exempt
def resource(*args, **kwargs):
    try:
        return resource_dispatch(*args, **kwargs)
    except StaleObjectException:
        return HttpResponseConflict()
    except MissingVersionException:
        return HttpResponseBadRequest('Missing version information.')

def resource_dispatch(request, model, id):
    request_params = QueryDict(request.META['QUERY_STRING'])

    # Get the version the client has.
    try:
        version = request_params['version']
    except KeyError:
        try:
            version = request.META['HTTP_IF_MATCH']
        except KeyError:
            version = None

    if request.method == 'GET':
        resp = HttpResponse(toJson(get_resource(model, id)),
                            content_type='application/json')

    elif request.method == 'PUT':
        data = json.load(request)
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
        resp = HttpResponseNotAllowed(['GET', 'PUT', 'DELETE'])
    return resp

@login_required
@csrf_exempt
def collection(request, model):
    if request.method == 'GET':
        resp = HttpResponse(toJson(get_collection(model, request.GET)),
                            content_type='application/json')

    elif request.method == 'POST':
        obj = post_resource(request.specify_collection,
                            request.specify_user_agent,
                            model, json.load(request))

        resp = HttpResponseCreated(toJson(obj_to_data(obj)),
                                   content_type='application/json')
    else:
        resp = HttpResponseNotAllowed(['GET', 'POST'])
    return resp


def get_model_or_404(name):
    try:
        return getattr(models, name.capitalize())
    except AttributeError as e:
        raise Http404(e)

def get_object_or_404(model, *args, **kwargs):
    from django.shortcuts import get_object_or_404 as get_object

    if isinstance(model, basestring):
        model = get_model_or_404(model)
    return get_object(model, *args, **kwargs)

def get_resource(name, id):
    id = int(id)
    obj = get_object_or_404(name, id=id)
    data = obj_to_data(obj)
    return data

@transaction.commit_on_success
def post_resource(collection, agent, name, data):
    obj = get_model_or_404(name)()
    set_fields_from_data(obj, data)
    # Have to save the object before autonumbering b/c
    # autonumber acquires a write lock on the model,
    # but save touches other tables.
    obj.save()
    autonumber(collection, agent.specifyuser, obj)
    try:
        obj._meta.get_field('createdbyagent')
    except FieldDoesNotExist:
        pass
    else:
        obj.createdbyagent = agent
    obj.save()
    return obj

def set_fields_from_data(obj, data):
    for field_name, val in data.items():
        if field_name == 'resource_uri': continue
        field, model, direct, m2m = obj._meta.get_field_by_name(field_name)
        if not direct: continue
        if isinstance(field, ForeignKey):
            if val is None:
                setattr(obj, field_name, None)
                continue

            fk_model, fk_id = parse_uri(val)
            assert fk_model == field.related.parent_model.__name__.lower()
            setattr(obj, field_name + '_id', fk_id)
        else:
            setattr(obj, field_name, prepare_value(field, val))

@transaction.commit_on_success
def delete_resource(name, id, version):
    id = int(id)
    obj = get_object_or_404(name, id=id)
    bump_version(obj, version)
    obj.delete()

@transaction.commit_on_success
def put_resource(collection, agent, name, id, version, data):
    id = int(id)
    obj = get_object_or_404(name, id=id)
    set_fields_from_data(obj, data)

    try:
        obj._meta.get_field('modifiedbyagent')
    except FieldDoesNotExist:
        pass
    else:
        obj.modifiedbyagent = agent

    bump_version(obj, version)
    obj.save(force_update=True)
    return obj

def bump_version(obj, version):
    # If the object has no version field, just save it.
    try:
        obj._meta.get_field('version')
    except FieldDoesNotExist:
        return

    try:
        version = int(version)
    except ValueError:
        raise MissingVersionException()

    # Update a row with the PK and the version no. we have.
    # If our version is stale, the rows updated will be 0.
    manager = obj.__class__._base_manager
    updated = manager.filter(pk=obj.pk, version=version).update(version=version+1)
    if not updated:
        raise StaleObjectException()
    obj.version = version + 1

def prepare_value(field, val):
    if isinstance(field, DateTimeField):
        return val.replace('T', ' ')
    return val

def parse_uri(uri):
    print uri
    match = URI_RE.match(uri)
    if match is not None:
        groups = match.groups()
        return (groups[0], groups[2])

def obj_to_data(obj):
    data = dict((field.name, field_to_val(obj, field))
                for field in obj._meta.fields)
    data.update(dict((ro.get_accessor_name(), to_many_to_data(obj, ro))
                     for ro in obj._meta.get_all_related_objects()))
    data['resource_uri'] = uri_for_model(obj.__class__.__name__.lower(), obj.id)
    return data

def to_many_to_data(obj, related_object):
    parent_model = related_object.parent_model.__name__
    if related_object.get_accessor_name() in inlined_dict[parent_model]:
        objs = getattr(obj, related_object.get_accessor_name())
        return [obj_to_data(o) for o in objs.all()]

    collection_uri = uri_for_model(related_object.model)
    return collection_uri + '?' + urlencode([(parent_model.lower(), str(obj.id))])

def field_to_val(obj, field):
    if isinstance(field, ForeignKey):
        if field.name in inlined_dict[obj.__class__.__name__]:
            related_obj = getattr(obj, field.name)
            if related_obj is None: return None
            return obj_to_data(related_obj)
        related_id = getattr(obj, field.name + '_id')
        if related_id is None: return None
        related_model = field.related.parent_model
        return uri_for_model(related_model, related_id)
    else:
        return getattr(obj, field.name)

def get_collection(model, params={}):
    if isinstance(model, basestring):
        model = get_model_or_404(model)
    offset = 0
    limit = 20
    filters = {}
    for param, val in params.items():
        if param == 'domainfilter':
            continue

        if param == 'limit':
            limit = int(val)
            continue

        if param == 'offset':
            offset = int(val)
            continue

        # param is a related field
        filters.update({param: val})
    objs = model.objects.filter(**filters)
    return objs_to_data(objs, offset, limit)

def objs_to_data(objs, offset=0, limit=20):
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
    if not isinstance(model, basestring):
        model = model.__name__
    uri = '/api/specify/%s/' % model.lower()
    if id is not None:
        uri += '%d/' % int(id)
    return uri





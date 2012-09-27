from urllib import urlencode
import json
from collections import defaultdict
import re

from django.db import transaction
from django.core.exceptions import ObjectDoesNotExist
from django.http import HttpResponse, HttpResponseBadRequest, Http404
from django.contrib.auth.decorators import login_required
from django.db.models.fields.related import ForeignKey
from django.db.models.fields import DateTimeField, FieldDoesNotExist
from django.utils import simplejson

from specify import models

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

@login_required
def resource(request, model, id):
    if request.method == 'GET':
        return HttpResponse(toJson(get_resource(model, id)),
                            content_type='application/json')

    if request.method == 'PUT':
        try:
            put_resource(request.specify_collection, request.specify_user_agent,
                         model, id, json.load(request))
        except StaleObjectException:
            return HttpResponseConflict()
        except MissingVersionException:
            return HttpResponseBadRequest('Missing version information.')

        return HttpResponse(toJson(get_resource(model, id)),
                            content_type='application/json')

@login_required
def collection(request, model):
    if request.method == 'GET':
        return HttpResponse(toJson(get_collection(model, request.GET)),
                            content_type='application/json')

def get_resource(name, id):
    id = int(id)
    obj = getattr(models, name.capitalize()).objects.get(id=id)
    data = obj_to_data(obj)
    data['resource_uri'] = uri_for_model(name, id)
    return data

@transaction.commit_on_success
def put_resource(collection, agent, name, id, data):
    id = int(id)
    obj = getattr(models, name.capitalize()).objects.get(id=id)

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

    try:
        obj._meta.get_field('modifiedbyagent')
    except FieldDoesNotExist:
        pass
    else:
        obj.modifiedbyagent = agent

    # If the object has no version field, just save it.
    try:
        obj._meta.get_field('version')
    except FieldDoesNotExist:
        obj.save(force_update=True)
        return

    try:
        version = data['version'] # The version the client has.
    except KeyError:
        raise MissingVersionException()

    # Update a row with the PK and the version no. we have.
    # If our version is stale, the rows updated will be 0.
    manager = obj.__class__._base_manager
    updated = manager.filter(pk=obj.pk, version=version).update(version=version+1)
    if not updated:
        raise StaleObjectException()

    # Do the actual update.
    obj.version = version + 1
    obj.save(force_update=True)

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
        model = getattr(models, model.capitalize())
    objs = model.objects.all()
    offset = 0
    limit = 20
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
        objs = objs.filter(**{param: val})
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
        uri += '%d/' % id
    return uri





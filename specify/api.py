import tastypie.resources
import tastypie.fields
from tastypie.authorization import Authorization
from django.db.models import get_models
from django.db import transaction
from django.db.models.fields import FieldDoesNotExist
from django.db.models.fields.related import ForeignRelatedObjectsDescriptor
from django.core.exceptions import ObjectDoesNotExist
from django.http import HttpResponse, HttpResponseBadRequest
from xml.etree import ElementTree
import os
from datetime import datetime

from specify import models

inlined_fields = [
    'Collector.agent',
    'Collectingevent.collectors',
    'Collectionobject.collectionobjectattribute',
    'Collectionobject.determinations',
    'Picklist.picklistitems',
]

filter_fields = {
    'Picklist': {'name': ['exact',]},
}

typesearches = ElementTree.parse(os.path.join(os.path.dirname(__file__),
                                              "static", "resources",
                                              "typesearch_def.xml"))

def add_to_filter_fields(model, field, filter_type):
    if model not in filter_fields: filter_fields[model] = {}
    filters = filter_fields[model]
    if field not in filters: filters[field] = []
    querytypes = filters[field]
    if filter_type not in querytypes: querytypes.append(filter_type)

for typesearch in typesearches.findall('typesearch'):
    model = typesearch.attrib['name'].capitalize()
    field = typesearch.attrib['searchfield'].lower()
    add_to_filter_fields(model, field, 'icontains')


def add_filter_for_fk(fkfield):
    field = fkfield.name
    model = fkfield.model.__name__
    add_to_filter_fields(model, field, 'exact')

for model in get_models(models):
    for field in model._meta.fields:
        if field.rel: add_filter_for_fk(field)


class OptimisticLockException(Exception): pass

class MissingVersionException(OptimisticLockException): pass

class StaleObjectException(OptimisticLockException): pass

class HttpResponseConflict(HttpResponse):
    status_code = 409

class ForeignKey(tastypie.fields.ForeignKey):
    def resource_from_uri(self, fk_resource, uri, request=None, related_obj=None, related_name=None):
        if not uri:
            return None
        return super(ForeignKey, self).resource_from_uri(fk_resource, uri, request, related_obj, related_name)

class ToManyField(tastypie.fields.ToManyField):
    def dehydrate(self, bundle):
        if self.full:
            return super(ToManyField, self).dehydrate(bundle)

        related_uri = self.to_class().get_resource_list_uri()
        return '%s?%s=%d' % (related_uri, self.related_name, bundle.obj.pk)

class ModelResource(tastypie.resources.ModelResource):
    def _build_reverse_url(self, name, args=None, kwargs=None):
        """Hard code the URL lookups to make things fast."""
        if name == 'api_dispatch_detail':
            return '/api/%(api_name)s/%(resource_name)s/%(pk)d/' % kwargs
        if name == 'api_dispatch_list':
            return '/api/%(api_name)s/%(resource_name)s/' % kwargs

        return super(ModelResource, self)._build_reverse_url(name, args=args, kwargs=kwargs)

    def dispatch(self, request_type, request, **kwargs):
        try:
            return super(ModelResource, self).dispatch(request_type, request, **kwargs)
        except StaleObjectException:
            return HttpResponseConflict()
        except MissingVersionException:
            return HttpResponseBadRequest('Missing version information.')

    @transaction.commit_on_success
    def obj_update(self, bundle, request=None, **kwargs):
        if not bundle.obj or not bundle.obj.pk:
            try:
                bundle.obj = self.obj_get(request, **kwargs)
            except ObjectDoesNotExist:
                raise NotFound("A model instance matching the provided arguments could not be found.")

        bundle = self.full_hydrate(bundle)

        # If the object has no version field, just save it.
        try:
            bundle.obj._meta.get_field('version')
        except FieldDoesNotExist:
            bundle.obj.save(force_update=True)
            return bundle

        manager = bundle.obj.__class__._base_manager
        try:
            version = bundle.data['version'] # The version the client has.
        except KeyError:
            raise MissingVersionException()

        # Update a row with the PK and the version no. we have.
        # If our version is stale, the rows updated will be 0.
        updated = manager.filter(pk=bundle.obj.pk, version=version).update(version=version+1)
        if not updated:
            raise StaleObjectException()

        # Do the actual update.
        bundle.obj.version = version + 1
        bundle.obj.save(force_update=True)
        return bundle

def make_to_many_field(model, field, fieldname):
    modelname = field.related.model.__name__ # The model w/ the FK column (the many side)
    fkfieldname = field.related.field.name   # Name of the FK column
    related_resource = "%s.%s%s" % (__name__, modelname, "Resource")
    full = '.'.join((model.__name__, fieldname)) in inlined_fields
    return ToManyField(related_resource, fieldname,
                       related_name=fkfieldname, null=True, full=full)

def make_fk_field(field):
    relname = "%s.%sResource" % (__name__, field.related.parent_model.__name__)
    full = '.'.join((field.model.__name__, field.name)) in inlined_fields
    return ForeignKey(relname, field.name, null=field.null, full=full)

def build_resource(model):
    fk_fields = dict(
        (field.name, make_fk_field(field))
        for field in model._meta.fields if field.rel)

    to_many_fields = dict(
        (fieldname, make_to_many_field(model, field, fieldname))
        for fieldname, field in model.__dict__.items()
        if isinstance(field, ForeignRelatedObjectsDescriptor))

    class Meta:
        filtering = filter_fields.get(model.__name__, {})
        queryset = model.objects.all()
        authorization = Authorization()

    attrs = {'Meta': Meta}
    attrs.update(fk_fields)
    attrs.update(to_many_fields)
    clsname = model.__name__ + 'Resource'
    return type(clsname, (ModelResource,), attrs)

resources = [build_resource(model) for model in get_models(models)]
globals().update(dict((resource.__name__, resource) for resource in resources))

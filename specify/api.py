import tastypie.resources
import tastypie.fields
from tastypie.authorization import Authorization
import tastypie.authentication
from tastypie.exceptions import NotFound
from tastypie.constants import ALL_WITH_RELATIONS
from django.db.models import get_models
from django.db import transaction
from django.db.models.fields import FieldDoesNotExist
from django.db.models.fields.related import ForeignRelatedObjectsDescriptor
from django.core.exceptions import ObjectDoesNotExist
from django.http import HttpResponse, HttpResponseBadRequest, QueryDict
from xml.etree import ElementTree
import os

from specify import models
from specify.filter_by_col import filter_by_collection

class Authentication(tastypie.authentication.Authentication):
    def is_authenticated(self, request, **kwargs):
        return request.user.is_authenticated()

    def get_identifier(self, request):
        return request.user.username

inlined_fields = [
    'Collector.agent',
    'Collectingevent.collectors',
    'Collectionobject.collectionobjectattribute',
#    'Collectionobject.determinations',
    'Picklist.picklistitems',
]

class OptimisticLockException(Exception): pass

class MissingVersionException(OptimisticLockException): pass

class StaleObjectException(OptimisticLockException): pass

class HttpResponseConflict(HttpResponse):
    status_code = 409

class ForeignKey(tastypie.fields.ForeignKey):
    def dehydrate(self, bundle):
        if self.full:
            return super(ForeignKey, self).dehydrate(bundle)

        descr = getattr(bundle.obj.__class__, self.attribute)
        fk = getattr(bundle.obj, descr.field.attname)
        if fk is None:
            return None
        dummy = type('Dummy', (object,), dict(id=fk))()
        return self.to_class().get_resource_uri(dummy)

    def resource_from_uri(self, fk_resource, uri, request=None, related_obj=None, related_name=None):
        if not uri:
            return None
        return super(ForeignKey, self).resource_from_uri(fk_resource, uri, request, related_obj, related_name)

class ToManyField(tastypie.fields.ToManyField):
    def dehydrate(self, bundle):
        if self.full:
            return super(ToManyField, self).dehydrate(bundle)

        related_uri = self.to_class().get_resource_list_uri()
        return '%s?%s=%s' % (related_uri, self.related_name, bundle.obj.pk)

class ModelResource(tastypie.resources.ModelResource):
    def _build_reverse_url(self, name, args=None, kwargs=None):
        """Hard code the URL lookups to make things fast."""
        if name == 'api_dispatch_detail':
            return '/api/%(api_name)s/%(resource_name)s/%(pk)s/' % kwargs
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
    def obj_delete(self, request=None, **kwargs):
        obj = kwargs.pop('_obj', None)

        if not hasattr(obj, 'delete'):
            try:
                obj = self.obj_get(request, **kwargs)
            except ObjectDoesNotExist:
                raise NotFound("A model instance matching the provided arguments could not be found.")

        try:
            obj._meta.get_field('version')
        except FieldDoesNotExist:
            obj.delete()
            return

        if request is None:
            raise MissingVersionException()

        # Get the version the client wants to delete.
        request_params = QueryDict(request.META['QUERY_STRING'])
        try:
            version = request_params['version']
        except KeyError:
            try:
                version = request.META['HTTP_IF_MATCH']
            except KeyError:
                raise MissingVersionException()
        version = int(version)

        # Update a row with the PK and the version no. we have.
        # If our version is stale, the rows updated will be 0.
        manager = obj.__class__._base_manager
        updated = manager.filter(pk=obj.pk, version=version).update(version=version+1)
        if not updated:
            raise StaleObjectException()
        obj.delete()

    @transaction.commit_on_success
    def obj_update(self, bundle, request=None, **kwargs):
        if not bundle.obj or not bundle.obj.pk:
            try:
                bundle.obj = self.obj_get(request, **kwargs)
            except ObjectDoesNotExist:
                raise NotFound("A model instance matching the provided arguments could not be found.")

        bundle = self.full_hydrate(bundle)

        try:
            bundle.obj._meta.get_field('modifiedbyagent')
        except FieldDoesNotExist:
            pass
        else:
            # if the specify user corresponds to more than one agent this will break
            bundle.obj.modifiedbyagent = models.Agent.objects.get(specifyuser=bundle.request.specify_user)

        # If the object has no version field, just save it.
        try:
            bundle.obj._meta.get_field('version')
        except FieldDoesNotExist:
            bundle.obj.save(force_update=True)
            return bundle

        try:
            version = bundle.data['version'] # The version the client has.
        except KeyError:
            raise MissingVersionException()

        # Update a row with the PK and the version no. we have.
        # If our version is stale, the rows updated will be 0.
        manager = bundle.obj.__class__._base_manager
        updated = manager.filter(pk=bundle.obj.pk, version=version).update(version=version+1)
        if not updated:
            raise StaleObjectException()

        # Do the actual update.
        bundle.obj.version = version + 1
        bundle.obj.save(force_update=True)
        return bundle

    def obj_create(self, bundle, request=None, **kwargs):
        agent = models.Agent.objects.get(specifyuser=bundle.request.specify_user)
        for field in ('createdbyagent', 'modifiedbyagent'):
            if hasattr(self._meta.object_class, field):
                kwargs[field] = agent
        return super(ModelResource, self).obj_create(bundle, request, **kwargs)

    def apply_filters(self, request, filters):
        for filtr in filters:
            if filtr.split('__')[-1] == 'in':
                filters[filtr] = [v for val in filters[filtr] for v in val.split(',')]
        qs = super(ModelResource, self).apply_filters(request, filters)
        if 'domainfilter' in request.GET:
            qs = filter_by_collection(qs, request.specify_collection)
        if 'values' in request.GET:
            fields = request.GET['values'].split(',')
            lookups = [f.replace('.', '__') for f in fields]
            qs = qs.values(*lookups)
        if 'distinct' in request.GET: qs = qs.distinct()
        return qs

    def full_dehydrate(self, bundle, *args, **kwargs):
        if isinstance(bundle.obj, dict):
            return dict((col.replace('__', '.') , val) for col, val in bundle.obj.items())
        return super(ModelResource, self).full_dehydrate(bundle, *args, **kwargs)

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
        always_return_data = True
        filtering = dict((field.name, ALL_WITH_RELATIONS) for field in model._meta.fields)
        filtering.update(dict((fieldname, ALL_WITH_RELATIONS)
                              for fieldname, field in model.__dict__.items()
                              if isinstance(field, ForeignRelatedObjectsDescriptor)))
        queryset = model.objects.all()
        authentication = Authentication()
        authorization = Authorization()

    attrs = {'Meta': Meta}
    attrs.update(fk_fields)
    attrs.update(to_many_fields)
    clsname = model.__name__ + 'Resource'
    return type(clsname, (ModelResource,), attrs)

resources = [build_resource(model) for model in get_models(models)]
globals().update(dict((resource.__name__, resource) for resource in resources))

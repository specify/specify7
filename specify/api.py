import tastypie.resources
from tastypie.fields import ForeignKey, ToManyField
from tastypie.authorization import Authorization
from django.db.models import get_models
from django.core.exceptions import ObjectDoesNotExist
from pyquery import PyQuery
import os

from specify import models

to_many_relationships = {
    'Collectionobject': {
        'Determination': 'determinations',
        'Preparation': 'preparations',
        },
    'Collectingevent': {
        'Collector': 'collectors',
        },
    'Picklist': {
        'Picklistitem': 'items',
        }
    }

inlined_fields = [
    'Collector.agent',
    'Collectingevent.collectors',
    'Collectionobject.collectionobjectattribute',
    'Picklist.items',
]

filter_fields = {
    'Picklist': {'name': ['exact',]},
}

typesearches = PyQuery(filename=os.path.join(os.path.dirname(__file__),
                                             "static", "resources",
                                             "typesearch_def.xml"))
for node in typesearches('typesearch'):
    typesearch = PyQuery(node)
    model = typesearch.attr('name').capitalize()
    field = typesearch.attr('searchfield').lower()
    if model not in filter_fields: filter_fields[model] = {}
    filters = filter_fields[model]
    if field not in filters: filters[field] = []
    querytypes = filters[field]
    if 'icontains' not in querytypes: querytypes.append('icontains')

class ModelResource(tastypie.resources.ModelResource):
    def _build_reverse_url(self, name, args=None, kwargs=None):
        """Hard code the URL lookups to make things fast."""
        if name == 'api_dispatch_detail':
            return '/api/%(api_name)s/%(resource_name)s/%(pk)d/' % kwargs

        return super(ModelResource, self)._build_reverse_url(name, args=args, kwargs=kwargs)

    def obj_update(self, bundle, request=None, **kwargs):
        if not bundle.obj or not bundle.obj.pk:
            try:
                bundle.obj = self.obj_get(request, **kwargs)
            except ObjectDoesNotExist:
                raise NotFound("A model instance matching the provided arguments could not be found.")

        bundle = self.full_hydrate(bundle)

        # Save the main object.
        bundle.obj.save()
        return bundle

def make_to_many_field(model, related, fieldname):
    related_model = getattr(models, related)
    def get_related_objs(bundle):
        filter_args = {model.__name__.lower(): bundle.obj}
        return related_model.objects.filter(**filter_args)
    related_resource = "%s.%s%s" % (__name__, related, "Resource")
    full = '.'.join((model.__name__, fieldname)) in inlined_fields
    return ToManyField(related_resource, get_related_objs, null=True, full=full)

def make_fk_field(field):
    relname = "%s.%sResource" % (__name__, field.related.parent_model.__name__)
    full = '.'.join((field.model.__name__, field.name)) in inlined_fields
    return ForeignKey(relname, field.name, null=field.null, full=full)

def build_resource(model):
    fk_fields = dict(
        (field.name, make_fk_field(field))
        for field in model._meta.fields if field.rel)

    rels = to_many_relationships.get(model.__name__, {}).items()
    to_many_fields = dict(
        (fieldname, make_to_many_field(model, related, fieldname))
        for related, fieldname in rels)

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

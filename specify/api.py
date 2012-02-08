from tastypie.resources import ModelResource
from tastypie.fields import ForeignKey, ToManyField
from django.db.models import get_app, get_model, get_models

app = get_app('specify')

to_many_relationships = {
    'Collectionobject': ['Determination', 'Preparation'],
}

def make_to_many_field(model, related):
    related_model = getattr(app, related)
    def get_related_objs(bundle):
        filter_args = {model.__name__.lower(): bundle.obj}
        return related_model.objects.filter(**filter_args)
    related_resource = "%s.%s%s" % (__name__, related, "Resource")
    return ToManyField(related_resource, get_related_objs)

def make_resource_with_foreignkeys(model, attrs={}):
    clsname = model.__name__ + 'Resource'
    attrs.update(get_fk_fields(model))
    attrs['Meta'] = make_standard_meta(model)
    return type(clsname, (ModelResource,), attrs)

def get_fk_fields(model):
    attrs = {}
    for f in model._meta.fields:
        if not f.rel: continue
        relname = __name__ + '.' + \
            f.related.parent_model.__name__ + 'Resource'
        attrs[f.name] = ForeignKey(relname, f.name, null=f.null)
    return attrs

def make_standard_meta(model):
    class Meta:
        queryset = model.objects.all()

    return Meta

def build_resource(model):
    extra_fields = dict((related.lower() + "s", make_to_many_field(model, related))
                        for related in to_many_relationships.get(model.__name__, []))
    return make_resource_with_foreignkeys(model, extra_fields)
    
resources = [build_resource(model) for model in get_models(app)]
globals().update(dict((resource.__name__, resource) for resource in resources))

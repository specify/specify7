from tastypie.resources import ModelResource
from tastypie.fields import ForeignKey, ToManyField
from django.db.models import get_app, get_models
from specify.models import Collectionobject, Determination

resources = []

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

def make_collectionobjectresource():
    model = Collectionobject
    attrs = get_fk_fields(model)
    attrs['Meta'] = make_standard_meta(model)
    def get_determinations(bundle):
        return Determination.objects.filter(collectionobject=bundle.obj)
    attrs['determinations'] = ToManyField('specify.api.DeterminationResource',
                                          get_determinations)
    return type('CollectionobjectResource', (ModelResource,), attrs)

CollectionobjectResource = make_collectionobjectresource()
resources.append(CollectionobjectResource)

for model in get_models(get_app('specify')):
    clsname = model.__name__ + 'Resource'
    if clsname in globals(): continue

    attrs = get_fk_fields(model)
    attrs['Meta'] = make_standard_meta(model)

    cls = type(clsname, (ModelResource,), attrs)
    globals()[clsname] = cls
    resources.append(cls)

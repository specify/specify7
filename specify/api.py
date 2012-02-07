from tastypie.resources import ModelResource
from tastypie.fields import ForeignKey
from django.db.models import get_app, get_models

resources = []

for model in get_models(get_app('specify')):
    class Meta:
        queryset = model.objects.all()

    clsname = model.__name__ + 'Resource'

    attrs = {'Meta': Meta}
    for f in model._meta.fields:
        if not f.rel: continue
        relname = __name__ + '.' + \
            f.related.parent_model.__name__ + 'Resource'
        attrs[f.name] = ForeignKey(relname, f.name, null=f.null)

    cls = type(clsname, (ModelResource,), attrs)
    globals()[clsname] = cls
    resources.append(cls)

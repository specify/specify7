from tastypie.resources import ModelResource
from django.db.models import get_app, get_models

resources = []

for model in get_models(get_app('specify')):
    class Meta:
        queryset = model.objects.all()

    clsname = model.__name__ + 'Resource'
    cls = type(clsname, (ModelResource,), {'Meta': Meta,})
    globals()[clsname] = cls
    resources.append(cls)

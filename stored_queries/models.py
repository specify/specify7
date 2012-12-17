from django.db import models

from specify.models import models_by_tableid as sp_models

TREES = {
    'Taxon',
    'Geography',
    }

def make_path_cache_for(tree):
    modelname = tree.__name__ + 'PC'
    class Meta:
        db_table = tree.__name__.lower() + '_pc'

    attrs = dict(
        __module__=__name__,
        Meta=Meta,
        node=models.ForeignKey(tree,
                               related_name='pathcache',
                               null=False,
                               db_index=True),
        path=models.CharField(max_length=256, db_index=True),
        timestampcreated=models.DateTimeField(auto_now_add=True, db_index=True),
        dirty=models.BooleanField(default=False),
        )
    return type(modelname, (models.Model,), attrs)

globals().update((pathcache.__name__, pathcache) for pathcache in (
    make_path_cache_for(model) for model in sp_models.values()
    if model.__name__ in TREES))


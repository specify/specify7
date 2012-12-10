from django.db import models
from django.db.models import F

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
        )
    return type(modelname, (models.Model,), attrs)

globals().update((pathcache.__name__, pathcache) for pathcache in (
    make_path_cache_for(model) for model in sp_models.values()
    if model.__name__ in TREES))



def update_cache_for(node, path):
    node.pathcache.all().only('id').delete()
    path_str = ''.join([str(e) + ',' for e in path])
    node.pathcache.create(path=path_str)


def get_path_from_root_to(node):
    n = node
    path = []
    while n.parent is not None:
        n = n.parent
        path.append(n.id)

    path.reverse()
    return path

def update_cache_for_subtree(node, path=None):
    if path is None:
        path = get_path_from_root_to(node)

    path = path + [node.id]
    update_cache_for(node, path)
    for subtree in node.children.all().only('id'):
        update_cache_for_subtree(subtree, path)

def update_cache_for_everything(tree):
    roots = tree.objects.filter(parent__isnull=True)
    for root in roots:
        update_cache_for_subtree(root)


def find_stale_rows(cache):
    return cache.objects.filter(node__timestampmodified__gt=F('timestampcreated'),
                                dirty=False)

def mark_stale_rows(cache):
    stale_rows = find_stale_rows(cache)
    for row in stale_rows:
        dirty_rows = cache.objects.filter(path__startswith=row.path)
        dirty_rows.update(dirty=True)


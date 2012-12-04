import re

from django.db.models import Q

import models

STRINGID_RE = re.compile(r'^([^\.]*)\.([^\.]*)\.(.*)$')

def field_key(field):
    return stringid_to_field_lookup(field.stringid)

def stringid_to_field_lookup(stringid):
    path, table_name, field_name = STRINGID_RE.match(stringid).groups()
    path_elems = path.split(',')

    path_fields = []
    node = models.models_by_tableid[int(path_elems[0])]
    for elem in path_elems[1:]:
        try:
            tableid, fieldname = elem.split('-')
        except ValueError:
            tableid, fieldname = elem, None

        path_fields.append(
            get_field_by_tableid(node, int(tableid)) if fieldname is None else fieldname)

        node = models.models_by_tableid[int(tableid)]

    return '__'.join(path_fields + field_name.split('.')).lower()

def get_field_by_tableid(model, tableid):
    for f in model._meta.fields:
        ro = getattr(f, 'related', None)
        if ro is not None and ro.parent_model.tableid == tableid:
            return ro.field.name

    for ro in model._meta.get_all_related_objects():
        if ro.model.tableid == tableid:
            return ro.var_name

    raise Exception("couldn't find related field for tableid %d in %s" % (tableid, model))

def op_like(key, field):
    # TODO: fix this
    return key, field.startvalue

def op_equals(key, field):
    return key, field.startvalue

def op_greaterthan(key, field):
    return key + '__gt', field.startvalue

def op_lessthan(key, field):
    return key + '__lt', field.startvalue

def op_greaterthanequals(key, field):
    return key + '__gte', field.startvalue

def op_lessthanequals(key, field):
    return key + '__lte', field.startvalue

def op_true(key, field):
    return key, True

def op_false(key, field):
    return key, False

def op_dontcare(key, field):
    return

def op_between(key, field):
    return key + '__range', field.startvalue.split(',')[:2]

def op_in(key, field):
    return key + '__in', field.startvalue.split(',')

def op_contains(key, field):
    return key + '__contains', field.startvalue

def op_empty(key, field):
    return key + '__exact', ''

def op_trueornull(key, field):
    return Q(*{key: True}) | Q(*{key + '__isnull', True})

def op_falseornull(key, field):
    return Q(*{key: False}) | Q(*{key + '__isnull', True})

OPERATIONS = [
    op_like,
    op_equals,
    op_greaterthan,
    op_lessthan,
    op_greaterthanequals,
    op_lessthanequals,
    op_true,
    op_false,
    op_dontcare,
    op_between,
    op_in,
    op_contains,
    op_empty,
    op_trueornull,
    op_falseornull,
    ]

QUERY_OPS = [
    op_contains,
    op_like,
    op_equals,
    op_in,
    op_between,
    op_empty,
    ]

def execute(query):
    field_specs = [(field_key(f), f) for f in query.fields.all()]

    all_filters = [(field.isnot, QUERY_OPS[field.operstart](key, field))
                   for key, field in field_specs]

    filters = [f for isnot, f in all_filters if not isnot]
    excludes = [f for isnot, f in all_filters if isnot]

    def args(filters):
        return [f for f in filters if isinstance(f, Q)]

    def kwargs(filters):
        return dict(f for f in filters if isinstance(f, tuple))

    model = models.models_by_tableid[query.contexttableid]

    qs = model.objects \
         .filter(*args(filters), **kwargs(filters)) \
         .exclude(*args(excludes), **kwargs(excludes))

    results = [tuple(field.columnalias for key, field in field_specs)]
    results.extend(
        qs.values_list(*[key for key, field in field_specs]))

    return results

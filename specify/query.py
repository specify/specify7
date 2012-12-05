import re

import models

from query_ops import make_filter

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

def execute(query):
    field_specs = [(field_key(f), f) for f in query.fields.all()]
    filters = [make_filter(k, f) for k, f in field_specs]
    display_fields = [(k, f) for k, f in field_specs if f.isdisplay]

    qs = models.models_by_tableid[query.contexttableid].objects.filter(*filters)

    results = [tuple(f.columnalias for k, f in display_fields)]
    results.extend(qs.values_list(*[k for k, f in display_fields]))

    return results

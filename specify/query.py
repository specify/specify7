import re

import models

from query_ops import make_filter, key_to_key_and_date_part
from filter_by_col import filter_by_collection

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


def field_specs_for(query):
    return [(field_key(f), f) for f in query.fields.all()]


def execute(query, collection_filter=None):
    model = models.models_by_tableid[query.contexttableid]
    field_specs = field_specs_for(query)

    filters = [make_filter(model, k, f.operstart, f.startvalue, f.isnot)
               for k, f in field_specs]

    qs = model.objects.filter(*filters)
    if collection_filter is not None:
        qs = filter_by_collection(qs, collection_filter)
    if query.selectdistinct:
        qs = qs.distinct()

    if query.countonly:
        return qs.count()
    else:
        return make_results(field_specs, qs)

def make_results(field_specs, qs):
    display_fields = [key_to_key_and_date_part(k) + (f,)
                      for k, f in field_specs if f.isdisplay]

    results = [tuple(f.columnalias for _, _, f in display_fields)]
    rows = qs.values_list(*[k for k, _, _ in display_fields])

    date_parts = [dp for _, dp, _ in display_fields]

    def process(row):
        return [v if date_part is None else getattr(v, date_part)
                for v, date_part in zip(row, date_parts)]

    results.extend(process(row) for row in rows)

    return results

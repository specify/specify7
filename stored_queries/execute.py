import re
from django.db.models.fields import FieldDoesNotExist

from specify import models

from make_filter import make_filter, extract_date_part
from specify.filter_by_col import filter_by_collection

STRINGID_RE = re.compile(r'^([^\.]*)\.([^\.]*)\.(.*)$')

def field_spec(field):
    path, table_name, field_name = STRINGID_RE.match(field.stringid).groups()
    path_elems = path.split(',')

    path_fields = []
    node = models.models_by_tableid[int(path_elems[0])]
    for elem in path_elems[1:]:
        try:
            tableid, fieldname = elem.split('-')
        except ValueError:
            tableid, fieldname = elem, None

        table = models.models_by_tableid[int(tableid)]
        if fieldname is None:
            try:
                fieldname = table.__name__.lower()
                node._meta.get_field(fieldname)
            except FieldDoesNotExist:
                raise Exception("couldn't find related field for table %s in %s" % (table.__name__, node))

        path_fields.append(fieldname)
        node = table

    return {
        'query_field': field,
        'table': node,
        'key': '__'.join(path_fields + field_name.split('.')).lower()}

def execute(query, collection_filter=None):
    model = models.models_by_tableid[query.contexttableid]
    field_specs = [field_spec(field) for field in query.fields.all()]
    filters = [make_filter(model, **fs) for fs in field_specs]

    qs = model.objects.filter(*filters)
    if collection_filter is not None:
        qs = filter_by_collection(qs, collection_filter)
    if query.selectdistinct:
        qs = qs.distinct()

    return qs, field_specs

def make_results(field_specs, qs):
    display_fields = [extract_date_part(k) + (f,)
                      for k, f in field_specs if f.isdisplay]

    results = [tuple(f.columnalias for _, _, f in display_fields)]
    rows = qs.values_list(*[k for k, _, _ in display_fields])

    date_parts = [dp for _, dp, _ in display_fields]

    def process(row):
        return [v if date_part is None else getattr(v, date_part, None)
                for v, date_part in zip(row, date_parts)]

    results.extend(process(row) for row in rows)

    return results


import re
from django.db.models.fields import FieldDoesNotExist

from specify import models

from make_filter import make_filter
from specify.filter_by_col import filter_by_collection

# The stringid is a structured consisting of three fields seperated by '.':
# (1) the join path to the specify field.
# (2) the name of the table containing the field.
# (3) name of the specify field.
STRINGID_RE = re.compile(r'^([^\.]*)\.([^\.]*)\.(.*)$')

def field_spec(field):
    """Given a Spqueryfield object returns a dictionary describing the field.

    query_field: the passed in Spqueryfield object
    table: the django model class of the table containing the field
    key: the django style lookup path from the root table to the field
    """
    path, table_name, field_name = STRINGID_RE.match(field.stringid).groups()
    path_elems = path.split(',')

    path_fields = []
    node = models.models_by_tableid[int(path_elems[0])]
    for elem in path_elems[1:]:
        # the elements of the stringid path consist of the join tableid with
        # optionally the join field name.
        try:
            tableid, fieldname = elem.split('-')
        except ValueError:
            tableid, fieldname = elem, None

        table = models.models_by_tableid[int(tableid)]
        if fieldname is None:
            # if the join field name is not given, the field should have
            # the same name as the table
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
    """Returns a pair containing the Django queryset generated from
    the passed in Spquery object and the lis of 'field_specs' as
    defined above.
    """
    model = models.models_by_tableid[query.contexttableid]
    field_specs = [field_spec(field) for field in query.fields.all()]
    filters = [make_filter(**fs) for fs in field_specs]

    qs = model.objects.filter(*filters)
    if collection_filter is not None:
        qs = filter_by_collection(qs, collection_filter)
    if query.selectdistinct:
        qs = qs.distinct()

    return qs, field_specs

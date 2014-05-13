import re, logging
from collections import namedtuple, deque

from specifyweb.specify.models import datamodel

from . import models

logger = logging.getLogger(__name__)

# The stringid is a structure consisting of three fields seperated by '.':
# (1) the join path to the specify field.
# (2) the name of the table containing the field.
# (3) name of the specify field.
STRINGID_RE = re.compile(r'^([^\.]*)\.([^\.]*)\.(.*)$')

# A date field name can be suffixed with 'numericday', 'numericmonth' or 'numericyear'
# to request a filter on that subportion of the date.
DATE_PART_RE = re.compile(r'(.*)((NumericDay)|(NumericMonth)|(NumericYear))$')

def extract_date_part(fieldname):
    match = DATE_PART_RE.match(fieldname)
    if match:
        fieldname, date_part = match.groups()[:2]
        date_part = date_part.replace('Numeric', '')
    else:
        date_part = None
    return fieldname, date_part

def make_table_list(fs):
    path = fs.join_path if fs.tree_rank or fs.is_relationship() else fs.join_path[:-1]
    first = [fs.root_table.tableId]

    def field_to_elem(field):
        related_model = datamodel.get_table(field.relatedModelName)
        if field.relatedModelName.lower() == field.name.lower():
            return related_model.tableId
        else:
            return "%d-%s" % (related_model.tableId, field.name.lower())


    rest = [field_to_elem(f) for f in path]
    return ','.join(first + rest)

def make_stringid(fs, table_list):
    field_name = fs.tree_rank or fs.join_path[-1].name
    if fs.date_part is not None and fs.date_part != "Full Date":
        field_name += 'Numeric' + fs.date_part
    return table_list, fs.table.name.lower(), field_name


class QueryFieldSpec(namedtuple("QueryFieldSpec", "root_table join_path table date_part tree_rank")):
    @classmethod
    def from_stringid(cls, stringid):
        path_str, table_name, field_name = STRINGID_RE.match(stringid).groups()
        path = deque(path_str.split(','))
        root_table = datamodel.get_table_by_id(int(path.popleft()))

        join_path = []
        node = root_table
        for elem in path:
            try:
                tableid, fieldname = elem.split('-')
            except ValueError:
                tableid, fieldname = elem, None
            table = datamodel.get_table_by_id(int(tableid))
            field = node.get_field(fieldname) if fieldname else node.get_field(table.name)
            join_path.append(field)
            node = table

        result = cls(root_table=root_table,
                     join_path=join_path,
                     table=node,
                     date_part=None,
                     tree_rank=None)

        extracted_fieldname, date_part = extract_date_part(field_name)
        field = node.get_field(extracted_fieldname, strict=False)
        if field is not None:
            result.join_path.append(field)
        else:
            result = result._replace(tree_rank=extracted_fieldname)

        if field and field.is_temporal():
            result = result._replace(date_part=date_part if date_part else "Full Date")

        logger.info('parsed stringid %s to %s', stringid, result)
        return result

    def to_spquery_attrs(self, is_formatted_record):
        table_list = make_table_list(self)
        stringid = make_stringid(self, table_list)

        return {
            'tablelist': table_list,
            'stringid': '.'.join(stringid),
            'fieldname': stringid[-1],
            'isrelfld': self.is_relationship()
        }

    def get_field(self):
        return self.join_path[-1]

    def is_relationship(self):
        return self.get_field().is_relationship

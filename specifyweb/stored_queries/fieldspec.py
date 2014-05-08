import re, logging
from collections import namedtuple, deque

from django.core.exceptions import ObjectDoesNotExist

from sqlalchemy import orm, inspect, sql, not_
from sqlalchemy.sql.expression import extract
from sqlalchemy.util.langhelpers import symbol

from specifyweb.specify.models import datamodel

from . import models
from .query_ops import QueryOps

logger = logging.getLogger(__name__)

class FieldSpec(namedtuple('FieldSpec', [
    'field_name',
    'date_part',
    'root_table',
    'join_path',
    'is_relation',
    'op_num',
    'value',
    'negate',
    'display',
    'sort_type'])):

    # The stringid is a structure consisting of three fields seperated by '.':
    # (1) the join path to the specify field.
    # (2) the name of the table containing the field.
    # (3) name of the specify field.
    STRINGID_RE = re.compile(r'^([^\.]*)\.([^\.]*)\.(.*)$')

    @classmethod
    def from_spqueryfield(cls, field, value=None):
        logger.info('generating field spec from %r', field)
        logger.debug('parsing %s', field.stringId)
        path, table_name, field_name = cls.STRINGID_RE.match(field.stringId).groups()
        path_elems = path.split(',')
        root_table = models.models_by_tableid[int(path_elems[0])]

        join_path = []
        node = root_table
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
                tablename = inspect(table).class_.__name__.lower()
                fields = inspect(node).class_.__dict__
                for fieldname in fields:
                    if fieldname.lower() == tablename: break
                else:
                    raise Exception("couldn't find related field for table %s in %s" % (tablename, node))

            join_path.append((fieldname, table))
            node = table

        field_name, date_part = extract_date_part(field_name)

        return cls(field_name   = field_name,
                   date_part    = date_part,
                   root_table   = root_table,
                   join_path    = join_path,
                   is_relation  = field.isRelFld,
                   op_num       = field.operStart,
                   value        = field.startValue if value is None else value,
                   negate       = field.isNot,
                   display      = field.isDisplay,
                   sort_type    = field.sortType)

    def to_stringid(self):
        table_list = self.make_table_list()
        fieldname = self.field_name
        if self.date_part:
            fieldname += "Numeric" + self.date_part
        _, table = self.join_path[-1] if self.join_path else ('', self.root_table)
        return '.'.join((table_list, table.__name__.lower(), fieldname))

    def make_table_list(self):
        table_list = [self.get_table_id(self.root_table)] + [
            self.get_table_id(table) if fieldname.lower() == table.__name__.lower() else (
                self.get_table_id(table) + '-' + fieldname.lower())
            for fieldname, table in self.join_path]

        return ','.join(table_list)

    def get_table_id(self, table):
        return str(datamodel.get_table(table.__name__).tableId)

    def build_join(self, query, join_cache):
        table = self.root_table
        path = deque(self.join_path)

        while len(path) > 0:
            fieldname, next_table = path.popleft()
            logger.debug("joining: %r to %r via %r", table, next_table, fieldname)
            if self.is_relation and len(path) == 0:
                lowercase_fn = fieldname.lower()
                rels = inspect(table).mapper.relationships.items()
                rel = next(rel for name, rel in rels if name.lower() == lowercase_fn)

                if rel.direction is symbol('ONETOMANY'):
                    # when returning a one-to-many field stop short so
                    # the client can do the final 'join' to handle aggregation
                    break
            if join_cache is not None and (table, fieldname) in join_cache:
                aliased = join_cache[(table, fieldname)]
                logger.debug("using join cache for %r.%s", table, fieldname)
            else:
                aliased = orm.aliased(next_table)
                if join_cache is not None:
                    join_cache[(table, fieldname)] = aliased
                    logger.debug("adding to join cache %r, %r", (table, fieldname), aliased)

            query = query.outerjoin(aliased, get_field(table, fieldname))
            table = aliased
        return query, table

    def add_to_query(self, query, no_filter=False, sorting=False, collection=None, join_cache=None):
        logger.info("adding field %s to query", self)
        value_required_for_filter = QueryOps.OPERATIONS[self.op_num] not in (
            'op_true',              # 6
            'op_false',             # 7
            'op_empty',             # 12
            'op_trueornull',        # 13
            'op_falseornull',       # 14
        )

        no_filter = no_filter or (self.value == ''
                                  and value_required_for_filter
                                  and not self.negate)

        query, table = self.build_join(query, join_cache)

        subquery = None
        insp = inspect(table)
        if self.is_relation:
            # will be formatting or aggregating related objects
            field = getattr(table, table._id)

        elif is_tree(insp) and not is_regular_field(insp, self.field_name):
            query, field, subquery = handle_tree_field(
                query, self.field_name, table, insp, no_filter, sorting, collection)

        elif self.date_part is not None:
            field = extract(self.date_part, getattr(table, self.field_name))

        else:
            field = getattr(table, self.field_name)

        if not no_filter:
            logger.debug("filtering field using value: %r", self.value)
            if isinstance(self.value, FieldSpec):
                _, other_field, _ = self.value.add_to_query(query.reset_joinpoint(), no_filter=True, join_cache=join_cache)
                uiformatter = None
                value = other_field
            else:
                uiformatter = get_uiformatter(collection, table, self.field_name)
                value = self.value

            op = QueryOps(uiformatter).by_op_num(self.op_num)
            f = op(field, value)
            query = query.filter(not_(f) if self.negate else f)

        query = query.reset_joinpoint()

        return query, field, subquery


def get_uiformatter(collection, table, field_name):
    from specifyweb.specify.models import Splocalecontaineritem
    from specifyweb.specify.uiformatters import get_uiformatter
    try:
        field_format = Splocalecontaineritem.objects.get(
            container__discipline=collection.discipline,
            container__name=inspect(table).class_.__name__.lower(),
            name=field_name,
            format__isnull=False).format
    except ObjectDoesNotExist:
        return None
    else:
        return get_uiformatter(collection, None, field_format)


def get_tree_def(query, collection, tree_name):
    if tree_name == 'Storage':
        return collection.discipline.division.institution.storagetreedef_id
    else:
        treedef_field = "%streedef_id" % tree_name.lower()
        return  getattr(collection.discipline, treedef_field)


def handle_tree_field(query, field_name, node, insp, no_filter, sorting, collection):
    treedef_column = insp.class_.__name__ + 'TreeDefID'
    treedefitem = orm.aliased( models.classes[insp.class_.__name__ + 'TreeDefItem'] )

    rank_p = (treedefitem.name == field_name)

    ancestor = orm.aliased(node)

    if collection is not None:
        treedef = get_tree_def(query, collection, insp.class_.__name__)
        same_tree_p = getattr(ancestor, treedef_column) == treedef
        rankId = query.session.query(treedefitem.rankId) \
                 .filter(rank_p, getattr(treedefitem, treedef_column) == treedef) \
                 .one()[0]
        rank_p = ancestor.rankId == rankId
        join_treedefitem = False
    else:
        same_tree_p = getattr(node, treedef_column) == getattr(ancestor, treedef_column)
        join_treedefitem = True

    ancestor_p = sql.and_(
        same_tree_p,
        node.nodeNumber.between(ancestor.nodeNumber, ancestor.highestChildNodeNumber))

    if no_filter and not sorting:
        field = getattr(node, node._id)

        def deferred(value):
            subquery = orm.Query(ancestor.name).with_session(query.session)
            subquery = subquery.filter(field == value)
            if join_treedefitem:
                subquery = subquery.join(treedefitem)
            result = subquery.filter(ancestor_p, rank_p).first()
            return result and result[0]
    else:
        query = query.join(ancestor, ancestor_p)
        if join_treedefitem:
            query = query.join(treedefitem)
        query = query.filter(rank_p)
        field = ancestor.name
        deferred = None

    return query, field, deferred

def is_regular_field(insp, field_name):
    return field_name in insp.class_.__dict__

def is_tree(insp):
    fields = insp.class_.__dict__
    return all(field in fields for field in ('definition', 'definitionItem', 'nodeNumber', 'highestChildNodeNumber'))

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

def get_field(table, fieldname):
    fieldname = fieldname.lower()
    for attrname in dir(inspect(table).class_):
        if attrname.lower() == fieldname:
            return getattr(table, attrname)

import re, logging
from collections import namedtuple, deque

from sqlalchemy import orm, sql, not_
from sqlalchemy.sql.expression import extract

from django.core.exceptions import ObjectDoesNotExist

from specifyweb.specify.models import datamodel

from . import models
from .query_ops import QueryOps


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
    path = fs.join_path if fs.tree_rank or not fs.join_path or fs.is_relationship() else fs.join_path[:-1]
    first = [str(fs.root_table.tableId)]

    def field_to_elem(field):
        related_model = datamodel.get_table(field.relatedModelName)
        if field.relatedModelName.lower() == field.name.lower():
            return str(related_model.tableId)
        else:
            return "%d-%s" % (related_model.tableId, field.name.lower())


    rest = [field_to_elem(f) for f in path]
    return ','.join(first + rest)

def make_stringid(fs, table_list):
    field_name = fs.tree_rank or fs.join_path[-1].name if fs.join_path else ''
    if fs.date_part is not None and fs.date_part != "Full Date":
        field_name += 'Numeric' + fs.date_part
    return table_list, fs.table.name.lower(), field_name


class QueryFieldSpec(namedtuple("QueryFieldSpec", "root_table join_path table date_part tree_rank")):
    @classmethod
    def from_path(cls, path_in, add_id=False):
        path = deque(path_in)
        root_table = datamodel.get_table(path.popleft(), strict=True)

        join_path = []
        node = root_table
        while len(path) > 0:
            fieldname = path.popleft()
            field = node.get_field(fieldname, strict=True)
            join_path.append(field)
            if field.is_relationship:
                node = datamodel.get_table(field.relatedModelName)
            else:
                assert len(path) == 0
                assert not add_id

        if add_id:
            join_path.append(node.idField)

        return cls(root_table=root_table,
                   join_path=join_path,
                   table=node,
                   date_part='Full Date' if (join_path and join_path[-1].is_temporal()) else None,
                   tree_rank=None)


    @classmethod
    def from_stringid(cls, stringid, is_relation):
        path_str, table_name, field_name = STRINGID_RE.match(stringid).groups()
        path = deque(path_str.split(','))
        root_table = datamodel.get_table_by_id(int(path.popleft()))

        if is_relation:
            path.pop()

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

        extracted_fieldname, date_part = extract_date_part(field_name)
        field = node.get_field(extracted_fieldname, strict=False)
        tree_rank = None
        if field is None:
            tree_rank = extracted_fieldname if extracted_fieldname else None
        else:
            join_path.append(field)
            if field.is_temporal() and date_part is None:
                date_part = "Full Date"

        result = cls(root_table=root_table,
                     join_path=join_path,
                     table=node,
                     date_part=date_part,
                     tree_rank=tree_rank)

        logger.debug('parsed %s related %s to %s', stringid, is_relation, result)
        return result

    def __init__(self, *args, **kwargs):
        assert self.is_temporal() or self.date_part is None
        assert self.date_part in ('Full Date', 'Day', 'Month', 'Year', None)

    def to_spquery_attrs(self):
        table_list = make_table_list(self)
        stringid = make_stringid(self, table_list)

        return {
            'tablelist': table_list,
            'stringid': '.'.join(stringid),
            'fieldname': stringid[-1],
            'isrelfld': self.is_relationship()
        }

    def to_stringid(self):
        table_list = make_table_list(self)
        return '.'.join(make_stringid(self, table_list))

    def get_field(self):
        try:
            return self.join_path[-1]
        except IndexError:
            return None

    def is_relationship(self):
        return self.tree_rank is None and self.get_field() is not None and self.get_field().is_relationship

    def is_temporal(self):
        field = self.get_field()
        return field is not None and field.is_temporal()

    def build_join(self, query, join_path, join_cache):
        model = getattr(models, self.root_table.name)
        return build_join(query, self.root_table, model, join_path, join_cache)

    def add_to_query(self, query, objformatter, value=None, op_num=None, negate=False,
                     sorting=False, collection=None, join_cache=None):
        no_filter = op_num is None

        subquery = None

        if self.tree_rank is None and self.get_field() is None:
            query, orm_field = objformatter.objformat(query, getattr(models, self.root_table.name), None, join_cache)
            no_filter = True
        elif self.is_relationship():
            # will be formatting or aggregating related objects
            if self.get_field().type == 'many-to-one':
                query, orm_model, table, field = self.build_join(query, self.join_path, join_cache)
                query, orm_field = objformatter.objformat(query, orm_model, None, join_cache)
            else:
                query, orm_model, table, field = self.build_join(query, self.join_path[:-1], join_cache)
                orm_field = objformatter.aggregate(query, self.get_field(), orm_model, None)
        else:
            query, orm_model, table, field = self.build_join(query, self.join_path, join_cache)

            if self.tree_rank is not None:
                query, orm_field, subquery = \
                       handle_tree_field(query, orm_model, table, self.tree_rank,
                                         no_filter, sorting, collection)
            else:
                orm_field = getattr(orm_model, self.get_field().name)

                if field.type == "java.sql.Timestamp":
                    # Only consider the date portion of timestamp fields.
                    # This is to replicate the behavior of Sp6. It might
                    # make since to condition this on whether there is a
                    # time component in the input value.
                    orm_field = sql.func.DATE(orm_field)

                if field.is_temporal() and self.date_part != "Full Date":
                    orm_field = extract(self.date_part, orm_field)

        if not no_filter:
            if isinstance(value, QueryFieldSpec):
                _, other_field, _ = value.add_to_query(query.reset_joinpoint(),
                                                       objformatter,
                                                       join_cache=join_cache)
                uiformatter = None
                value = other_field
            else:
                uiformatter = field and get_uiformatter(collection, table.name, field.name)
                value = value

            op = QueryOps(uiformatter).by_op_num(op_num)
            f = op(orm_field, value)
            query = query.filter(not_(f) if negate else f)

        query = query.reset_joinpoint()

        return query, orm_field, subquery

def get_uiformatter(collection, tablename, fieldname):
    from specifyweb.specify.models import Splocalecontaineritem
    from specifyweb.specify.uiformatters import get_uiformatter
    try:
        field_format = Splocalecontaineritem.objects.get(
            container__discipline=collection.discipline,
            container__name=tablename.lower(),
            name=fieldname.lower(),
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

def handle_tree_field(query, node, table, tree_rank, no_filter, sorting, collection):
    logger.info('handling treefield %s rank: %s', table, tree_rank)
    treedef_column = table.name + 'TreeDefID'
    treedefitem = orm.aliased( getattr(models, table.name + 'TreeDefItem') )

    rank_p = (treedefitem.name == tree_rank)

    ancestor = orm.aliased(node)

    if collection is not None:
        treedef = get_tree_def(query, collection, table.name)
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
        orm_field = getattr(node, node._id)

        def deferred(value):
            subquery = orm.Query(ancestor.name).with_session(query.session)
            subquery = subquery.filter(orm_field == value)
            if join_treedefitem:
                subquery = subquery.join(treedefitem)
            result = subquery.filter(ancestor_p, rank_p).first()
            return result and result[0]
    else:
        query = query.join(ancestor, ancestor_p)
        if join_treedefitem:
            query = query.join(treedefitem)
        query = query.filter(rank_p)
        orm_field = ancestor.name
        deferred = None

    return query, orm_field, deferred

def build_join(query, table, model, join_path, join_cache):
    path = deque(join_path)
    field = None
    while len(path) > 0:
        field = path.popleft()
        if isinstance(field, str):
            field = table.get_field(field, strict=True)
        if not field.is_relationship:
            break

        next_table = datamodel.get_table(field.relatedModelName, strict=True)
        logger.debug("joining: %r to %r via %r", table, next_table, field)
        if join_cache is not None and (model, field.name) in join_cache:
            aliased = join_cache[(model, field.name)]
            logger.debug("using join cache for %r.%s", model, field.name)
        else:
            aliased = orm.aliased(getattr(models, next_table.name))
            if join_cache is not None:
                join_cache[(model, field.name)] = aliased
                logger.debug("adding to join cache %r, %r", (model, field.name), aliased)

            query = query.outerjoin(aliased, getattr(model, field.name))
        table, model = next_table, aliased
    return query, model, table, field


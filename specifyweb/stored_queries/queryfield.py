import logging
from collections import namedtuple, deque

from django.core.exceptions import ObjectDoesNotExist

from sqlalchemy import orm, inspect, sql, not_
from sqlalchemy.sql.expression import extract
from sqlalchemy.util.langhelpers import symbol

from specifyweb.specify.models import datamodel

from . import models
from .query_ops import QueryOps
from .queryfieldspec import QueryFieldSpec

logger = logging.getLogger(__name__)

class QueryField(namedtuple('QueryField', [
    'fieldspec',
    'op_num',
    'value',
    'negate',
    'display',
    'sort_type'])):

    @classmethod
    def from_spqueryfield(cls, field, value=None):        
        logger.info('processing field from %r', field)
        fieldspec = QueryFieldSpec.from_stringid(field.stringId, field.isRelFld)
        
        return cls(fieldspec = fieldspec,
                   op_num    = field.operStart,
                   value     = field.startValue if value is None else value,
                   negate    = field.isNot,
                   display   = field.isDisplay,
                   sort_type = field.sortType)

    def build_join(self, query, join_cache):
        table = self.fieldspec.root_table
        model = getattr(models, table.name)
        path = deque(self.fieldspec.join_path)

        while len(path) > 0:
            field = path.popleft()
            if not field.is_relationship:
                break

            if len(path) == 0 and field.type == 'one-to-many':
                    # when returning a one-to-many field stop short so
                    # the client can do the final 'join' to handle aggregation
                    break
            next_table = datamodel.get_table(field.relatedModelName)
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
        return query, model, table

    def add_to_query(self, query, no_filter=False, sorting=False, collection=None, join_cache=None):
        logger.info("adding field %s", self)
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

        query, orm_model, table = self.build_join(query, join_cache)

        subquery = None
        field = self.fieldspec.get_field()

        if self.fieldspec.is_relationship():
            # will be formatting or aggregating related objects
            orm_field = getattr(orm_model, orm_model._id)

        elif self.fieldspec.tree_rank is not None:
            query, orm_field, subquery = \
                   handle_tree_field(query, orm_model, table, fieldspec.tree_rank,
                                     no_filter, sorting, collection)

        else:
             orm_field = getattr(orm_model, self.fieldspec.get_field().name)
             if field.is_temporal() and self.fieldspec.date_part != "Full Date":
                 orm_field = extract(self.date_part, orm_field)

        if not no_filter:
            if isinstance(self.value, QueryFieldSpec):
                _, other_field, _ = self.value.add_to_query(query.reset_joinpoint(),
                                                            no_filter=True,
                                                            join_cache=join_cache)
                uiformatter = None
                value = other_field
            else:
                uiformatter = get_uiformatter(collection, table.name, field.name)
                value = self.value

            op = QueryOps(uiformatter).by_op_num(self.op_num)
            f = op(orm_field, value)
            query = query.filter(not_(f) if self.negate else f)

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

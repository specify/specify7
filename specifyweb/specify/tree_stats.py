from collections import namedtuple

from sqlalchemy.dialects.mysql import INTEGER
from sqlalchemy.exc import ProgrammingError
from sqlalchemy.orm import aliased
from .models import datamodel
from specifyweb.stored_queries import models
from sqlalchemy import sql, distinct

import logging
logger = logging.getLogger(__name__)

def get_tree_stats(treedef, tree, parentid, specify_collection, session_context, using_cte):
    tree_table = datamodel.get_table(tree)
    tree_def_item = getattr(models, tree_table.name + 'TreeDefItem')
    parentid = None if parentid == 'null' else int(parentid)
    treedef_col = tree_table.name + "TreeDefID"

    tree_node = getattr(models, tree_table.name)
    child = aliased(tree_node)
    _child_id = getattr(child, child._id)
    def make_joins(query):
        descendent = aliased(tree_node)
        _descendent_id = getattr(descendent, descendent._id)
        query = query.outerjoin(descendent,
                                descendent.nodeNumber.between(
                                    child.nodeNumber,
                                    child.highestChildNodeNumber
                                )
                                )
        make_target_joins = getattr(
            StatsQuerySpecialization(specify_collection), tree)

        query, target = make_target_joins(query, _descendent_id)
        target_id = getattr(target, target._id)
        query = query.add_columns(
            sql.cast(sql.func.sum(sql.case([(sql.and_(
                _child_id == _descendent_id,
                target_id.isnot(None)
            ), 1)], else_=0)), INTEGER),
            sql.func.count(target_id)
        )

        return query


    def wrap_cte_query(cte_query, query):
        cte_joined, target = getattr(
            StatsQuerySpecialization(specify_collection), tree)(
            cte_query, cte_query.c.top_or_descendent_id)
        target_id = getattr(target, target._id)
        count_expr = sql.func.count(target_id)
        sum_case_expr = sql.cast(sql.func.sum(sql.case([(sql.and_(
            cte_query.c.top_or_descendent_id == cte_query.c.top_id,
            target_id.isnot(None)
        ), 1)], else_=0)), INTEGER)

        query = query.select_from(cte_joined)
        query = query.add_columns(cte_query.c.top_id,
                                  sum_case_expr,
                                  count_expr).group_by(cte_query.c.top_id)
        return query


    results = None
    with session_context() as session:
        # The join depth only needs to be enough to reach the bottom of the tree.
        # "correct" depth is depth based on actual tree
        # "incorrect" depth > "correct" is naively based on item-table
        # If we use "correct" depth, we will make less joins in CTE (so CTE will be faster)
        # but, "correct" depth takes too long to compute (needs to look at main tree table)
        # As a compromise, we look at defitem table for "incorrect" depth, will be higher than "correct"
        # depth. So yes, technicallly CTE will take "more" time, but experimentation reveals that
        # CTE's "more" time, is still very much low than time taken to compute "correct" depth.
        # I don't even want to use depth, but some pathological tree might have cycles, and CTE depth
        # might be in millions as a custom setting..

        depth_query = session.query(sql.func.count(getattr(tree_def_item, tree_def_item._id))).filter(
            getattr(tree_def_item, treedef_col) == int(treedef))
        depth, = list(depth_query)[0]
        query = None
        try:
            if using_cte:
                cte_definition = session.query(
                    _child_id.label('top_id'),
                    _child_id.label('top_or_descendent_id'),
                    sql.expression.literal_column("1").label("depth")
                ) \
                    .filter(child.ParentID == parentid) \
                    .filter(getattr(child, treedef_col) == int(treedef)) \
                    .cte(recursive=True)
                descendent = aliased(tree_node)
                cte_query = cte_definition.union_all(
                    session.query(
                        cte_definition.c.top_id.label('top_id'),
                        getattr(descendent, descendent._id).label(
                            'top_or_descendent_id'),
                        (cte_definition.c.depth + 1).label('depth')
                    ).join(descendent,
                           sql.and_(descendent.ParentID == cte_definition.c.top_or_descendent_id,
                                    # Restricting join depth to (depth - 1) because a join was made in
                                    # seed query of the cte
                                    cte_definition.c.depth <= depth - 1)
                           )
                )
                query = wrap_cte_query(cte_query, session.query())
                results = list(query)
        except ProgrammingError:
            pass
        finally:
            if results is None:
                query = session.query(getattr(child, child._id)) \
                    .filter(child.ParentID == parentid) \
                    .filter(getattr(child, treedef_col) == int(treedef)) \
                    .group_by(getattr(child, child._id))
                query = make_joins(query)
                results = list(query)

    logger.debug(str(query))
    return results

class StatsQuerySpecialization(
    namedtuple('StatsQuerySpecialization', 'collection')):

    def taxon(self, query, descendant_id):
        det = aliased(models.Determination)

        query = query.outerjoin(det, sql.and_(
            det.isCurrent,
            det.collectionMemberId == self.collection.id,
            det.PreferredTaxonID == descendant_id))

        return query, det

    def geography(self, query, descendant_id):
        co = aliased(models.CollectionObject)
        loc = aliased(models.Locality)
        ce = aliased(models.CollectingEvent)

        query = query.outerjoin(loc, loc.GeographyID == descendant_id) \
            .outerjoin(ce, ce.LocalityID == getattr(loc, loc._id)) \
            .outerjoin(co, sql.and_(
            co.CollectingEventID == getattr(ce, ce._id),
            co.collectionMemberId == self.collection.id))

        return query, co

    def storage(self, query, descendant_id):
        prep = aliased(models.Preparation)

        query = query.outerjoin(prep, sql.and_(
            prep.StorageID == descendant_id,
            prep.collectionMemberId == self.collection.id))

        return query, prep

    def geologictimeperiod(self, query, descendant_id):
        return self.paleo_geo_tree('chronos', query, descendant_id)

    def lithostrat(self, query, descendant_id):
        return self.paleo_geo_tree('litho', query, descendant_id)
    
    def tectonicunit(self, query, descendant_id):
        return self.paleo_geo_tree('tectonic', query, descendant_id)

    def paleo_geo_tree(self, paleo_geo_tree, query, descendant_id):
        assert paleo_geo_tree in ('chronos', 'litho', 'tectonic')

        co = aliased(models.CollectionObject)
        ce = aliased(models.CollectingEvent)
        loc = aliased(models.Locality)
        pc = aliased(models.PaleoContext)

        pc_target = self.collection.discipline.paleocontextchildtable
        join_col = pc.ChronosStratID if paleo_geo_tree == 'chronos' else pc.LithoStratID if paleo_geo_tree == 'litho' else pc.TectonicUnitID

        query = query.outerjoin(pc, join_col == descendant_id)

        if pc_target == "collectionobject":
            query = query.outerjoin(co, sql.and_(
                co.PaleoContextID == getattr(pc, pc._id),
                co.collectionMemberId == self.collection.id))

        elif pc_target == "collectingevent":
            query = query.outerjoin(ce,
                                    ce.PaleoContextID == getattr(pc, pc._id)) \
                .outerjoin(co, sql.and_(
                co.CollectingEventID == getattr(ce, ce._id),
                co.collectionMemberId == self.collection.id))

        elif pc_target == "locality":
            query = query.outerjoin(loc,
                                    loc.PaleoContextID == getattr(pc, pc._id)) \
                .outerjoin(ce, ce.LocalityID == getattr(loc, loc._id)) \
                .outerjoin(co, sql.and_(
                co.CollectingEventID == getattr(ce, ce._id),
                co.collectionMemberId == self.collection.id))

        else:
            raise Exception('unknown paleocontext join table: %s' % pc_target)

        return query, co
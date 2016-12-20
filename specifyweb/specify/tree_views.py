from functools import wraps

from django.views.decorators.http import require_GET, require_POST
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse, Http404
from django.db import connection, transaction

from .views import login_maybe_required, apply_access_control
from .api import get_object_or_404, obj_to_data, toJson
from .models import datamodel
from . import tree_extras

from sqlalchemy.orm import aliased
from sqlalchemy import sql, types

from specifyweb.stored_queries import models
from specifyweb.businessrules.exceptions import BusinessRuleException

def tree_mutation(mutation):
    @login_maybe_required
    @require_POST
    @apply_access_control
    @csrf_exempt
    @transaction.atomic
    @wraps(mutation)
    def wrapper(*args, **kwargs):
        try:
            mutation(*args, **kwargs)
            result = {'success': True}
        except BusinessRuleException as e:
            result = {'success': False, 'error': str(e)}
        return HttpResponse(toJson(result), content_type="application/json")
    return wrapper

@login_maybe_required
@require_GET
def tree_view(request, treedef, tree, parentid):
    tree_table = datamodel.get_table(tree)
    parentid = None if parentid == 'null' else int(parentid)

    node = getattr(models, tree_table.name)
    child = aliased(node)
    accepted = aliased(node)
    id_col = getattr(node, node._id)
    child_id = getattr(child, node._id)
    treedef_col = getattr(node, tree_table.name + "TreeDefID")

    with models.session_context() as session:
        query = session.query(id_col,
                              node.name,
                              node.fullName,
                              node.nodeNumber,
                              node.highestChildNodeNumber,
                              node.rankId,
                              node.AcceptedID,
                              accepted.fullName,
                              sql.functions.count(child_id)) \
                        .outerjoin(child, child.ParentID == id_col) \
                        .outerjoin(accepted, node.AcceptedID == getattr(accepted, node._id)) \
                        .group_by(id_col) \
                        .filter(treedef_col == int(treedef)) \
                        .filter(node.ParentID == parentid) \
                        .order_by(node.name)
        results = list(query)

    return HttpResponse(toJson(results), content_type='application/json')

@login_maybe_required
@require_GET
def tree_stats(request, treedef, tree, parentid):
    tree_table = datamodel.get_table(tree)
    parentid = None if parentid == 'null' else int(parentid)

    node = getattr(models, tree_table.name)
    descendant = aliased(node)
    node_id = getattr(node, node._id)
    descendant_id = getattr(descendant, node._id)
    treedef_col = tree_table.name + "TreeDefID"

    same_tree_p = getattr(descendant, treedef_col) == int(treedef)
    is_descendant_p = sql.and_(
        sql.between(descendant.nodeNumber, node.nodeNumber, node.highestChildNodeNumber),
        same_tree_p)

    target, make_joins = getattr(StatsQuerySpecialization, tree)()
    target_id = getattr(target, target._id)

    direct_count = sql.cast(
        sql.func.sum(sql.case([(sql.and_(target_id != None, descendant_id == node_id), 1)], else_=0)),
        types.Integer)

    all_count = sql.func.count(target_id)

    with models.session_context() as session:
        query = session.query(node_id, direct_count, all_count) \
                            .join(descendant, is_descendant_p) \
                            .filter(node.ParentID == parentid) \
                            .group_by(node_id)

        query = make_joins(request.specify_collection, query, descendant_id)
        results = list(query)

    return HttpResponse(toJson(results), content_type='application/json')

class StatsQuerySpecialization:
    @classmethod
    def taxon(cls):
        det = models.Determination

        def make_joins(collection, query, descendant_id):
            return query.outerjoin(det, sql.and_(
                det.isCurrent,
                det.collectionMemberId == collection.id,
                det.PreferredTaxonID == descendant_id))

        return det, make_joins

    @classmethod
    def geography(cls):
        co = models.CollectionObject
        loc = models.Locality
        ce = models.CollectingEvent

        def make_joins(collection, query, descendant_id):
            return query.outerjoin(loc, loc.GeographyID == descendant_id) \
                   .outerjoin(ce, ce.LocalityID == getattr(loc, loc._id)) \
                   .outerjoin(co, sql.and_(
                co.CollectingEventID == getattr(ce, ce._id),
                co.collectionMemberId == collection.id))

        return co, make_joins

    @classmethod
    def storage(cls):
        prep = models.Preparation

        def make_joins(collection, query, descendant_id):
            return query.outerjoin(prep, sql.and_(
                prep.StorageID == descendant_id,
                prep.collectionMemberId == collection.id))

        return prep, make_joins

    @classmethod
    def geologictimeperiod(cls):
        return cls.chronos_or_litho('chronos')

    @classmethod
    def lithostrat(cls):
        return cls.chronos_or_litho('litho')

    @classmethod
    def chronos_or_litho(cls, chronos_or_litho):
        assert chronos_or_litho in ('chronos', 'litho')

        co = models.CollectionObject
        ce = models.CollectingEvent
        loc = models.Locality
        pc = models.PaleoContext

        def make_joins(collection, query, descendant_id):
            pc_target = collection.discipline.paleocontextchildtable
            join_col = pc.ChronosStratID if chronos_or_litho == 'chronos' else pc.LithoStratID

            query = query.outerjoin(pc, join_col == descendant_id)

            if pc_target == "collectionobject":
                return query.outerjoin(co, sql.and_(
                    co.PaleoContextID == getattr(pc, pc._id),
                    co.collectionMemberId == collection.id))

            if pc_target == "collectingevent":
                return query.outerjoin(ce, ce.PaleoContextID == getattr(pc, pc._id)) \
                        .outerjoin(co, sql.and_(
                    co.CollectingEventID == getattr(ce, ce._id),
                    co.collectionMemberId == collection.id))

            if pc_target == "locality":
                return query.outerjoin(loc, loc.PaleoContextID == getattr(pc, pc._id)) \
                       .outerjoin(ce, ce.LocalityID == getattr(loc, loc._id)) \
                       .outerjoin(co, sql.and_(
                    co.CollectingEventID == getattr(ce, ce._id),
                    co.collectionMemberId == collection.id))

            raise Exception('unknown paleocontext join table: %s' % pc_target)

        return co, make_joins


@login_maybe_required
@require_GET
def path(request, tree, id):
    id = int(id)
    tree_node = get_object_or_404(tree, id=id)

    data = {node.definitionitem.name: obj_to_data(node)
            for node in get_tree_path(tree_node)}

    data['resource_uri'] = '/api/specify_tree/%s/%d/path/' % (tree, id)

    return HttpResponse(toJson(data), content_type='application/json')

def get_tree_path(tree_node):
    while tree_node is not None:
        yield tree_node
        tree_node = tree_node.parent

@login_maybe_required
@require_GET
def predict_fullname(request, tree, parentid):
    parent = get_object_or_404(tree, id=parentid)
    depth = parent.definition.treedefitems.count()
    reverse = parent.definition.fullnamedirection == -1
    defitemid = int(request.GET['treedefitemid'])
    name = request.GET['name']
    fullname = tree_extras.predict_fullname(
        parent._meta.db_table, depth, parent.id, defitemid, name, reverse
    )
    return HttpResponse(fullname, content_type='text/plain')

@tree_mutation
def merge(request, tree, id):
    node = get_object_or_404(tree, id=id)
    target = get_object_or_404(tree, id=request.POST['target'])
    tree_extras.merge(node, target)

@tree_mutation
def move(request, tree, id):
    node = get_object_or_404(tree, id=id)
    target = get_object_or_404(tree, id=request.POST['target'])
    node.parent = target
    node.save()

@tree_mutation
def synonymize(request, tree, id):
    node = get_object_or_404(tree, id=id)
    target = get_object_or_404(tree, id=request.POST['target'])
    tree_extras.synonymize(node, target)

@tree_mutation
def unsynonymize(request, tree, id):
    node = get_object_or_404(tree, id=id)
    tree_extras.unsynonymize(node)

@tree_mutation
def repair_tree(request, tree):
    tree_model = datamodel.get_table(tree)
    table = tree_model.name.lower()
    tree_extras.renumber_tree(table)
    tree_extras.validate_tree_numbering(table)

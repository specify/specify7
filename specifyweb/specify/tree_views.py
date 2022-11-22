from functools import wraps, reduce
from collections import namedtuple

from django.views.decorators.http import require_GET, require_POST
from django.http import HttpResponse, Http404
from django.db import connection, transaction

from .views import login_maybe_required
from .api import get_object_or_404, obj_to_data, toJson
from .models import datamodel
from .auditcodes import TREE_MOVE
from . import tree_extras

from sqlalchemy.orm import aliased
from sqlalchemy import sql, types, distinct

from specifyweb.stored_queries import models
from specifyweb.businessrules.exceptions import BusinessRuleException
from specifyweb.permissions.permissions import PermissionTarget, PermissionTargetAction, check_permission_targets, check_table_permissions


def tree_mutation(mutation):
    @login_maybe_required
    @require_POST
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
def tree_view(request, treedef, tree, parentid, sortfield):
    """Returns a list of <tree> nodes with parent <parentid> restricted to
    the tree defined by treedefid = <treedef>. The nodes are sorted
    according to <sortfield>.
    """
    tree_table = datamodel.get_table(tree)
    parentid = None if parentid == 'null' else int(parentid)

    node = getattr(models, tree_table.name)
    child = aliased(node)
    accepted = aliased(node)
    id_col = getattr(node, node._id)
    child_id = getattr(child, node._id)
    treedef_col = getattr(node, tree_table.name.lower() + "treedefid")
    orderby = tree_table.name.lower() + '.' + sortfield

    cols =(id_col,
           node.name,
           node.fullname,
           node.nodenumber,
           node.highestchildnodenumber,
           node.rankid,
           node.acceptedid,
           accepted.fullname,
        )

    with models.session_context() as session:
        query = session.query(*cols, sql.functions.count(child_id)) \
                        .outerjoin(child, child.parentid == id_col) \
                        .outerjoin(accepted, node.acceptedid == getattr(accepted, node._id)) \
                        .group_by(*cols) \
                        .filter(treedef_col == int(treedef)) \
                        .filter(node.parentid == parentid) \
                        .order_by(orderby)
        results = list(query)

    return HttpResponse(toJson(results), content_type='application/json')

@login_maybe_required
@require_GET
def tree_stats(request, treedef, tree, parentid):
    "Returns tree stats (collection object count) for tree nodes parented by <parentid>."
    tree_table = datamodel.get_table(tree)
    parentid = None if parentid == 'null' else int(parentid)
    treedef_col = tree_table.name.lower() + "treedefid"

    tree_node = getattr(models, tree_table.name)
    child = aliased(tree_node)

    def count_distinct(table):
        "Concision helper. Returns count distinct clause on ID field of table."
        return sql.func.count(distinct(getattr(table, table._id)))

    def make_joins(depth, query):
        "Depth is the number of tree level joins to be made."
        descendants = [child]
        for i in range(depth):
            descendant = aliased(tree_node)
            query = query.outerjoin(descendant, descendant.parentid == getattr(descendants[-1], tree_node._id))
            descendants.append(descendant)

        # The target table is the one we will be counting distinct IDs on. E.g. Collection object.
        make_target_joins = getattr(StatsQuerySpecialization(request.specify_collection), tree)
        targets = []
        for d in descendants:
            query, target = make_target_joins(query, getattr(d, d._id))
            targets.append(target)

        query = query.add_columns(
            count_distinct(targets[0]),  # Count distinct target ids at the immediate level
            reduce(lambda l, r: l + r, [count_distinct(t) for t in targets]) # Sum all levels
        )

        return query

    with models.session_context() as session:
        # The join depth only needs to be enough to reach the bottom of the tree.
        # That will be the number of distinct rankID values not less than
        # the rankIDs of the children of parentid.
        highest_rank = session.query(sql.func.min(tree_node.rankid)).filter(tree_node.parentid==parentid).as_scalar()
        depth, = session.query(sql.func.count(distinct(tree_node.rankid))).filter(tree_node.rankid >= highest_rank)[0]

        query = session.query(getattr(child, child._id)) \
                            .filter(child.parentid == parentid) \
                            .filter(getattr(child, treedef_col) == int(treedef)) \
                            .group_by(getattr(child, child._id))

        query = make_joins(depth, query)
        results = list(query)

    return HttpResponse(toJson(results), content_type='application/json')

class StatsQuerySpecialization(namedtuple('StatsQuerySpecialization', 'collection')):

    def taxon(self, query, descendant_id):
        det = aliased(models.Determination)

        query = query.outerjoin(det, sql.and_(
            det.iscurrent,
            det.collectionmemberid == self.collection.id,
            det.preferredtaxonid == descendant_id))

        return query, det


    def geography(self, query, descendant_id):
        co = aliased(models.CollectionObject)
        loc = aliased(models.Locality)
        ce = aliased(models.CollectingEvent)

        query = query.outerjoin(loc, loc.geographyid == descendant_id) \
                   .outerjoin(ce, ce.localityid == getattr(loc, loc._id)) \
                   .outerjoin(co, sql.and_(
                co.collectingeventid == getattr(ce, ce._id),
                co.collectionmemberid == self.collection.id))

        return query, co


    def storage(self, query, descendant_id):
        prep = aliased(models.Preparation)

        query = query.outerjoin(prep, sql.and_(
                prep.storageid == descendant_id,
                prep.collectionmemberid == self.collection.id))

        return query, prep


    def geologictimeperiod(self, query, descendant_id):
        return self.chronos_or_litho('chronos', query, descendant_id)


    def lithostrat(self, query, descendant_id):
        return self.chronos_or_litho('litho', query, descendant_id)


    def chronos_or_litho(self, chronos_or_litho, query, descendant_id):
        assert chronos_or_litho in ('chronos', 'litho')

        co  = aliased(models.CollectionObject)
        ce  = aliased(models.CollectingEvent)
        loc = aliased(models.Locality)
        pc  = aliased(models.PaleoContext)

        pc_target = self.collection.discipline.paleocontextchildtable
        join_col = pc.chronosstratid if chronos_or_litho == 'chronos' else pc.lithostratid

        query = query.outerjoin(pc, join_col == descendant_id)

        if pc_target == "collectionobject":
            query = query.outerjoin(co, sql.and_(
                co.paleocontextid == getattr(pc, pc._id),
                co.collectionmemberid == self.collection.id))

        elif pc_target == "collectingevent":
            query = query.outerjoin(ce, ce.paleocontextid == getattr(pc, pc._id)) \
                    .outerjoin(co, sql.and_(
                co.collectingeventid == getattr(ce, ce._id),
                co.collectionmemberid == self.collection.id))

        elif pc_target == "locality":
            query = query.outerjoin(loc, loc.paleocontextid == getattr(pc, pc._id)) \
                   .outerjoin(ce, ce.localityid == getattr(loc, loc._id)) \
                   .outerjoin(co, sql.and_(
                co.collectingeventid == getattr(ce, ce._id),
                co.collectionmemberid == self.collection.id))

        else:
            raise Exception('unknown paleocontext join table: %s' % pc_target)

        return query, co


@login_maybe_required
@require_GET
def path(request, tree, id):
    "Returns all nodes up to the root of <tree> starting from node <id>."
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
    """Returns the predicted fullname for a <tree> node based on the name
    field of the node and its <parentid>. Requires GET parameters
    'treedefitemid' and 'name', to indicate the rank (treedefitem) and
    name of the node, respectively.
    """
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
    """Merges <tree> node <id> into the node with id indicated by the
    'target' POST parameter."""
    check_permission_targets(request.specify_collection.id, request.specify_user.id, [perm_target(tree).merge])
    node = get_object_or_404(tree, id=id)
    target = get_object_or_404(tree, id=request.POST['target'])
    tree_extras.merge(node, target, request.specify_user_agent)

@tree_mutation
def move(request, tree, id):
    """Reparents the <tree> node <id> to be a child of the node
    indicated by the 'target' POST parameter.
    """
    check_permission_targets(request.specify_collection.id, request.specify_user.id, [perm_target(tree).move])
    node = get_object_or_404(tree, id=id)
    target = get_object_or_404(tree, id=request.POST['target'])
    old_parent = node.parent
    old_parentid = old_parent.id
    old_fullname = node.fullname
    node.parent = target
    old_stamp = node.timestampmodified
    node.save()
    node = get_object_or_404(tree, id=id)
    if old_stamp is None or (node.timestampmodified > old_stamp):
        tree_extras.mutation_log(TREE_MOVE, node, request.specify_user_agent, node.parent,
                                 [{'field_name': 'parentid','old_value': old_parentid, 'new_value': target.id},
                                  {'field_name': 'fullname','old_value': old_fullname, 'new_value': node.fullname}])

@tree_mutation
def synonymize(request, tree, id):
    """Synonymizes the <tree> node <id> to be a synonym of the node
    indicated by the 'target' POST parameter.
    """
    check_permission_targets(request.specify_collection.id, request.specify_user.id, [perm_target(tree).synonymize])
    node = get_object_or_404(tree, id=id)
    target = get_object_or_404(tree, id=request.POST['target'])
    tree_extras.synonymize(node, target, request.specify_user_agent)

@tree_mutation
def desynonymize(request, tree, id):
    "Causes the <tree> node <id> to no longer be a synonym of another node."
    check_permission_targets(request.specify_collection.id, request.specify_user.id, [perm_target(tree).desynonymize])
    node = get_object_or_404(tree, id=id)
    tree_extras.desynonymize(node, request.specify_user_agent)

@tree_mutation
def repair_tree(request, tree):
    "Repairs the indicated <tree>."
    check_permission_targets(request.specify_collection.id, request.specify_user.id, [perm_target(tree).repair])
    tree_model = datamodel.get_table(tree)
    table = tree_model.name.lower()
    tree_extras.renumber_tree(table)
    tree_extras.validate_tree_numbering(table)


class TaxonMutationPT(PermissionTarget):
    resource = "/tree/edit/taxon"
    merge = PermissionTargetAction()
    move = PermissionTargetAction()
    synonymize = PermissionTargetAction()
    desynonymize = PermissionTargetAction()
    repair = PermissionTargetAction()

class GeographyMutationPT(PermissionTarget):
    resource = "/tree/edit/geography"
    merge = PermissionTargetAction()
    move = PermissionTargetAction()
    synonymize = PermissionTargetAction()
    desynonymize = PermissionTargetAction()
    repair = PermissionTargetAction()

class StorageMutationPT(PermissionTarget):
    resource = "/tree/edit/storage"
    merge = PermissionTargetAction()
    move = PermissionTargetAction()
    synonymize = PermissionTargetAction()
    desynonymize = PermissionTargetAction()
    repair = PermissionTargetAction()

class GeologictimeperiodMutationPT(PermissionTarget):
    resource = "/tree/edit/geologictimeperiod"
    merge = PermissionTargetAction()
    move = PermissionTargetAction()
    synonymize = PermissionTargetAction()
    desynonymize = PermissionTargetAction()
    repair = PermissionTargetAction()

class LithostratMutationPT(PermissionTarget):
    resource = "/tree/edit/lithostrat"
    merge = PermissionTargetAction()
    move = PermissionTargetAction()
    synonymize = PermissionTargetAction()
    desynonymize = PermissionTargetAction()
    repair = PermissionTargetAction()

def perm_target(tree):
    return {
        'taxon': TaxonMutationPT,
        'geography': GeographyMutationPT,
        'storage': StorageMutationPT,
        'geologictimeperiod': GeologictimeperiodMutationPT,
        'lithostrat': LithostratMutationPT,
    }[tree]

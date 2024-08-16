from functools import wraps
from typing import Literal
from django.db import transaction
from django.http import HttpResponse
from django.views.decorators.http import require_POST
from sqlalchemy import sql, distinct
from sqlalchemy.orm import aliased

from specifyweb.middleware.general import require_GET
from specifyweb.businessrules.exceptions import BusinessRuleException
from specifyweb.permissions.permissions import PermissionTarget, \
    PermissionTargetAction, check_permission_targets
from specifyweb.specify.tree_ranks import tree_rank_count
from specifyweb.specify.field_change_info import FieldChangeInfo
from specifyweb.stored_queries import models
from specifyweb.stored_queries.execution import set_group_concat_max_len
from specifyweb.stored_queries.group_concat import group_concat
from . import tree_extras
from .api import get_object_or_404, obj_to_data, toJson
from .auditcodes import TREE_MOVE
from .models import datamodel
from .tree_stats import get_tree_stats
from .views import login_maybe_required, openapi

import logging
logger = logging.getLogger(__name__)

TREE_TABLE = Literal['Taxon', 'Storage', 'Geography', 'Geologictimeperiod', 'Lithostrat']

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


@openapi(schema={
    "get": {
        "parameters": [
            {
                "name": "includeauthor",
                "in": "query",
                "required": False,
                "schema": {
                    "type": "number"
                },
                "description": "If parameter is present, include the author of the requested node in the response \
                    if the tree is taxon and node's rankid >= paramter value."
            }
        ],
        "responses": {
            "200": {
                "description": "Returns a list of nodes with parent <parentid> restricted to the tree defined by <treedef>. \
                Nodes are sorted by <sortfield>",
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "array",
                            "items": {
                                "type": "array",
                                "prefixItems": [
                                    {

                                        "type" : "integer",
                                        "description" : "The id of the child node"

                                    },
                                    {
                                        "type": "string",
                                        "description": "The name of the child node"
                                    },
                                    {
                                        "type": "string",
                                        "description": "The fullName of the child node"
                                    },
                                    {

                                        "type" : "integer",
                                        "description" : "The nodenumber of the child node"
                                    },
                                    {
                                        "type" : "integer",
                                        "description" : "The highestChildNodeNumber of the child node"
                                    },
                                    {
                                        "type" : "integer",
                                        "description" : "The rankId of the child node"

                                    },
                                    {
                                        "type": "number",
                                        "description": "The acceptedId of the child node. Returns null if the node has no acceptedId"
                                    },
                                    {
                                        "type": "string",
                                        "description": "The fullName of the child node's accepted node. Returns null if the node has no acceptedId"
                                    },
                                    {
                                        "type": "string",
                                        "description": "The author of the child node. \
                                        Returns null if <tree> is not taxon or the rankId of the node is less than <includeAuthor> paramter"
                                    },
                                    {

                                        "type" : "integer",
                                        "description" : "The number of children the child node has"
                                    },
                                    {
                                        "type": "string",
                                        "description": "Concat of fullname of syonyms"
                                    }
                                ],
                            }
                        }
                    }
                }
            }
        }
    }
})
@login_maybe_required
@require_GET
def tree_view(request, treedef, tree, parentid, sortfield):
    """Returns a list of <tree> nodes with parent <parentid> restricted to
    the tree defined by treedefid = <treedef>. The nodes are sorted
    according to <sortfield>.
    """
    """
    Also include the author of the node in the response if requested and the tree is the taxon tree.
    There is a preference which can be enabled from within Specify which adds the author next to the 
    fullname on the front end. 
    See https://github.com/specify/specify7/pull/2818 for more context and a breakdown regarding 
    implementation/design decisions
    """
    include_author = request.GET.get('includeauthor', False) and tree == 'taxon'
    with models.session_context() as session:
        set_group_concat_max_len(session.connection())
        results = get_tree_rows(treedef, tree, parentid, sortfield, include_author, session)
    return HttpResponse(toJson(results), content_type='application/json')


def get_tree_rows(treedef, tree, parentid, sortfield, include_author, session):
    tree_table = datamodel.get_table(tree)
    parentid = None if parentid == 'null' else int(parentid)

    node = getattr(models, tree_table.name)
    child = aliased(node)
    accepted = aliased(node)
    synonym = aliased(node)
    id_col = getattr(node, node._id)
    child_id = getattr(child, node._id)
    treedef_col = getattr(node, tree_table.name + "TreeDefID")
    orderby = tree_table.name.lower() + '.' + sortfield
        
    col_args = [
        node.name,
        node.fullName,
        node.nodeNumber,
        node.highestChildNodeNumber,
        node.rankId,
        node.AcceptedID,
        accepted.fullName,
        node.author if include_author else "NULL",
    ]

    apply_min = [
        # for some reason, SQL is rejecting the group_by in some dbs
        # due to "only_full_group_by". It is somehow not smart enough to see 
        # that there is no dependency in the columns going from main table to the to-manys (child, and syns)
        # I want to use ANY_VALUE() but that's not supported by MySQL 5.6- and MariaDB.
        # I don't want to disable "only_full_group_by" in case someone misuses it...
        # applying min to fool into thinking it is aggregated.
        # these values are guarenteed to be the same
        sql.func.min(arg) for arg in col_args
        ]
    
    grouped = [
        *apply_min, 
        # syns are to-many, so child can be duplicated
        sql.func.count(distinct(child_id)),
        # child are to-many, so syn's full name can be duplicated
        # FEATURE: Allow users to select a separator?? Maybe that's too nice
        group_concat(distinct(synonym.fullName), separator=', ')
    ]

    query = session.query(id_col, *grouped) \
        .outerjoin(child, child.ParentID == id_col) \
        .outerjoin(accepted, node.AcceptedID == getattr(accepted, node._id)) \
        .outerjoin(synonym, synonym.AcceptedID == id_col) \
        .group_by(id_col) \
        .filter(treedef_col == int(treedef)) \
        .filter(node.ParentID == parentid) \
        .order_by(orderby)
    results = list(query)
    return results

@login_maybe_required
@require_GET
def tree_stats(request, treedef, tree, parentid):
    "Returns tree stats (collection object count) for tree nodes parented by <parentid>."

    using_cte = (tree in ['geography', 'taxon', 'storage'])
    results = get_tree_stats(treedef, tree, parentid, request.specify_collection, models.session_context, using_cte)

    return HttpResponse(toJson(results), content_type='application/json')


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
    check_permission_targets(request.specify_collection.id,
                             request.specify_user.id, [perm_target(tree).merge])
    node = get_object_or_404(tree, id=id)
    target = get_object_or_404(tree, id=request.POST['target'])
    tree_extras.merge(node, target, request.specify_user_agent)


@tree_mutation
def move(request, tree, id):
    """Reparents the <tree> node <id> to be a child of the node
    indicated by the 'target' POST parameter.
    """
    check_permission_targets(request.specify_collection.id,
                             request.specify_user.id, [perm_target(tree).move])
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
        field_change_infos = [
            FieldChangeInfo(field_name='parentid', old_value=old_parentid, new_value=target.id),
            FieldChangeInfo(field_name='fullname', old_value=old_fullname, new_value=node.fullname)
            ]
        tree_extras.mutation_log(TREE_MOVE, node, request.specify_user_agent,
                                 node.parent, field_change_infos)

@openapi(schema={
    "post": {
        "parameters": [{
            "name": "tree",
            "in": "path",
            "required": True,
            "schema": {
                "enum": ['Storage']
            }
        },
        {
            "name": "id",
            "in": "path",
            "description": "The id of the node from which to bulk move from.",
            "required": True,
            "schema": {
                "type": "integer",
                "minimum": 0
            }
        }],
        "requestBody": {
            "required": True,
            "content": {
                "application/x-www-form-urlencoded": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "target": { 
                                "type": "integer", 
                                "description": "The ID of the storage tree node to which the preparations should be moved." 
                            },
                        },
                        'required': ['target'],
                        'additionalProperties': False
                    }
                }
            }
        },
        "responses": {
            "200": {
                "description": "Success message indicating the bulk move operation was successful."
            }
        }
    }
})
@tree_mutation
def bulk_move(request, tree: TREE_TABLE, id: int):
    """Bulk move the preparations under the <tree> node <id> to have
    as new location storage the node indicated by the 'target'
    POST parameter.
    """
    check_permission_targets(request.specify_collection.id,
                             request.specify_user.id, [perm_target(tree).bulk_move])
    node = get_object_or_404(tree, id=id)
    target = get_object_or_404(tree, id=request.POST['target'])
    tree_extras.bulk_move(node, target, request.specify_user_agent)

@tree_mutation
def synonymize(request, tree, id):
    """Synonymizes the <tree> node <id> to be a synonym of the node
    indicated by the 'target' POST parameter.
    """
    check_permission_targets(request.specify_collection.id,
                             request.specify_user.id,
                             [perm_target(tree).synonymize])
    node = get_object_or_404(tree, id=id)
    target = get_object_or_404(tree, id=request.POST['target'])
    tree_extras.synonymize(node, target, request.specify_user_agent)


@tree_mutation
def desynonymize(request, tree, id):
    "Causes the <tree> node <id> to no longer be a synonym of another node."
    check_permission_targets(request.specify_collection.id,
                             request.specify_user.id,
                             [perm_target(tree).desynonymize])
    node = get_object_or_404(tree, id=id)
    tree_extras.desynonymize(node, request.specify_user_agent)


@tree_mutation
def repair_tree(request, tree):
    "Repairs the indicated <tree>."
    check_permission_targets(request.specify_collection.id,
                             request.specify_user.id,
                             [perm_target(tree).repair])
    tree_model = datamodel.get_table(tree)
    table = tree_model.name.lower()
    tree_extras.renumber_tree(table)
    tree_extras.validate_tree_numbering(table)

@login_maybe_required
@require_GET
def tree_rank_item_count(request, tree, rankid):
    """Returns the number of items in the tree rank with id <rank_id>."""
    tree_rank_model_name = tree if tree.endswith('treedefitem') else tree + 'treedefitem'
    rank = get_object_or_404(tree_rank_model_name, id=rankid)
    count = tree_rank_count(tree, rank.id)
    return HttpResponse(toJson(count), content_type='application/json')

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
    bulk_move = PermissionTargetAction()
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

from functools import wraps
import json
from django.db import transaction
from django.http import HttpResponse, HttpResponseServerError
from django.views.decorators.http import require_GET, require_POST
from sqlalchemy import sql
from sqlalchemy.orm import aliased

from specifyweb.businessrules.exceptions import BusinessRuleException
from specifyweb.permissions.permissions import PermissionTarget, \
    PermissionTargetAction, check_permission_targets
from specifyweb.stored_queries import models
from . import tree_extras
from .api import get_object_or_404, obj_to_data, toJson
from .auditcodes import TREE_MOVE
from .models import datamodel
from .tree_stats import get_tree_stats
from .views import login_maybe_required, openapi
from . import models as spmodels
from sys import maxsize

import logging
logger = logging.getLogger(__name__)

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
    tree_table = datamodel.get_table(tree)
    parentid = None if parentid == 'null' else int(parentid)

    node = getattr(models, tree_table.name)
    child = aliased(node)
    accepted = aliased(node)
    id_col = getattr(node, node._id)
    child_id = getattr(child, node._id)
    treedef_col = getattr(node, tree_table.name + "TreeDefID")
    orderby = tree_table.name.lower() + '.' + sortfield

    """
        Also include the author of the node in the response if requested and the tree is the taxon tree.
        There is a preference which can be enabled from within Specify which adds the author next to the 
        fullname on the front end. 
        See https://github.com/specify/specify7/pull/2818 for more context and a breakdown regarding 
        implementation/design decisions
    """
    includeAuthor = request.GET.get(
        'includeauthor') if 'includeauthor' in request.GET else False

    with models.session_context() as session:
        query = session.query(id_col,
                              node.name,
                              node.fullName,
                              node.nodeNumber,
                              node.highestChildNodeNumber,
                              node.rankId,
                              node.AcceptedID,
                              accepted.fullName,
                              node.author if (
                                          includeAuthor and tree == 'taxon') else "NULL",
                              sql.functions.count(child_id)) \
            .outerjoin(child, child.ParentID == id_col) \
            .outerjoin(accepted, node.AcceptedID == getattr(accepted, node._id)) \
            .group_by(id_col) \
            .filter(treedef_col == int(treedef)) \
            .filter(node.ParentID == parentid) \
            .order_by(orderby)
        results = list(query)
    return HttpResponse(toJson(results), content_type='application/json')


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
        tree_extras.mutation_log(TREE_MOVE, node, request.specify_user_agent,
                                 node.parent,
                                 [{'field_name': 'parentid',
                                   'old_value': old_parentid,
                                   'new_value': target.id},
                                  {'field_name': 'fullname',
                                   'old_value': old_fullname,
                                   'new_value': node.fullname}])


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


class TaxonMutationPT(PermissionTarget):
    resource = "/tree/edit/taxon"
    merge = PermissionTargetAction()
    move = PermissionTargetAction()
    synonymize = PermissionTargetAction()
    desynonymize = PermissionTargetAction()
    repair = PermissionTargetAction()
    edit_ranks = PermissionTargetAction()


class GeographyMutationPT(PermissionTarget):
    resource = "/tree/edit/geography"
    merge = PermissionTargetAction()
    move = PermissionTargetAction()
    synonymize = PermissionTargetAction()
    desynonymize = PermissionTargetAction()
    repair = PermissionTargetAction()
    edit_ranks = PermissionTargetAction()


class StorageMutationPT(PermissionTarget):
    resource = "/tree/edit/storage"
    merge = PermissionTargetAction()
    move = PermissionTargetAction()
    synonymize = PermissionTargetAction()
    desynonymize = PermissionTargetAction()
    repair = PermissionTargetAction()
    edit_ranks = PermissionTargetAction()


class GeologictimeperiodMutationPT(PermissionTarget):
    resource = "/tree/edit/geologictimeperiod"
    merge = PermissionTargetAction()
    move = PermissionTargetAction()
    synonymize = PermissionTargetAction()
    desynonymize = PermissionTargetAction()
    repair = PermissionTargetAction()
    edit_ranks = PermissionTargetAction()


class LithostratMutationPT(PermissionTarget):
    resource = "/tree/edit/lithostrat"
    merge = PermissionTargetAction()
    move = PermissionTargetAction()
    synonymize = PermissionTargetAction()
    desynonymize = PermissionTargetAction()
    repair = PermissionTargetAction()
    edit_ranks = PermissionTargetAction()


def perm_target(tree):
    return {
        'taxon': TaxonMutationPT,
        'geography': GeographyMutationPT,
        'storage': StorageMutationPT,
        'geologictimeperiod': GeologictimeperiodMutationPT,
        'lithostrat': LithostratMutationPT,
    }[tree]

TAXON_RANKS = {
    'TAXONOMY_ROOT': 0,
    'TAXONOMY ROOT': 0,
    'LIFE': 0,
    'KINGDOM': 10,
    'SUBKINGDOM': 20,
    'DIVISION': 30,
    'PHYLUM': 30,
    'SUBDIVISION': 40,
    'SUBPHYLUM': 40,
    'SUPERCLASS': 50,
    'CLASS': 60,
    'SUBCLASS': 70,
    'INFRACLASS': 80,
    'SUPERORDER': 90,
    'ORDER': 100,
    'SUBORDER': 110,
    'INFRAORDER': 120,
    'PARVORDER': 125,
    'SUPERFAMILY': 130,
    'FAMILY': 140,
    'SUBFAMILY': 150,
    'TRIBE': 160,
    'SUBTRIBE': 170,
    'GENUS': 180,
    'SUBGENUS': 190,
    'SECTION': 200,
    'SUBSECTION': 210,
    'SPECIES': 220,
    'SUBSPECIES': 230,
    'VARIETY': 240,
    'SUBVARIETY': 250,
    'FORMA': 260,
    'SUBFORMA': 270
}
GEOGRAPHY_RANKS = {
    'CONTINENT': 100,
    'COUNTRY': 200,
    'STATE': 300,
    'COUNTY': 400
}
STORAGE_RANKS = {
    'BUILDING': 100,
    'COLLECTION': 150,
    'ROOM': 200,
    'AISLE': 250,
    'CABINET': 300,
    'SHELF': 350,
    'BOX': 400,
    'RACK': 450,
    'VIAL': 500
}
GEOLOGIC_TIME_PERIOD_RANKS = {
    'ERA': 100,
    'PERIOD': 200,
    'EPOCH': 300,
    'AGE': 400
}
LITHO_STRAT_RANKS = {
    'SUPERGROUP': 100,
    'GROUP': 200,
    'FORMATION': 300,
    'MEMBER': 400,
    'BED': 500
}

DEFAULT_RANK_INCREMENT = 100
TAXON_RANK_INCREMENT = 10
GEOGRAPHY_RANK_INCREMENT = DEFAULT_RANK_INCREMENT
STORAGE_RANK_INCREMENT = 50
GEOLOGIC_TIME_PERIOD_INCREMENT = DEFAULT_RANK_INCREMENT
LITHO_STRAT_INCREMENT = DEFAULT_RANK_INCREMENT

# Map tree type to default tree ranks and default rank id increment
TREE_RANKS_MAPPING = {
    'taxon': (TAXON_RANKS, TAXON_RANK_INCREMENT),
    'geography': (GEOGRAPHY_RANKS, GEOGRAPHY_RANK_INCREMENT),
    'storage': (STORAGE_RANKS, STORAGE_RANK_INCREMENT),
    'geologictimeperiod': (GEOLOGIC_TIME_PERIOD_RANKS, GEOLOGIC_TIME_PERIOD_INCREMENT),
    'lithostrat': (LITHO_STRAT_RANKS, LITHO_STRAT_INCREMENT),
}

@openapi(schema={
    'post': {
        "requestBody": {
            "required": True,
            "description": "Add rank to a tree.",
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "description": "The request body.",
                        "properties": {
                            "newRankName": {
                                "type": "string",
                                "description": "The name of the new rank to add."
                            },
                            "parentRankName": {
                                "type": "string",
                                "description": "The name of the parent rank to add the new rank to (use 'root' to add to the front)."
                            },
                            "treeID": {
                                "type": "integer",
                                "description": "The ID of the tree (defaults to the first tree)."
                            },
                            "newRankTitle": {
                                "type": "string",
                                "description": "The title of the rank to add (defaults to the name)."
                            },
                            "useDefaultRankIDs": {
                                "type": "boolean",
                                "description": "Determine if the default rank IDs should be used (defaults to True)."
                            }
                        },
                        'required': ['newRankName', 'parentRankName'],
                        'additionalProperties': False
                    }
                }
            }
        },
        "responses": {
            "200": {"description": "Success",},
            "500": {"description": "Server Error"},
        } 
    },
})
@tree_mutation
def add_tree_rank(request, tree) -> HttpResponse:
    """
    Adds a new rank to the specified tree. Expects 'rank_name' and 'tree'
    in the POST data. Adds the rank to 
    """
    check_permission_targets(request.specify_collection.id,
                             request.specify_user.id,
                             [perm_target(tree).edit_ranks])
    
    # Get parameter values from request
    data = json.loads(request.body)
    new_rank_name = data.get('newRankName')
    parent_rank_name = data.get('parentRankName')
    tree_id = data.get('treeID', 1)
    new_rank_title = data.get('newRankTitle', new_rank_name)
    use_default_rank_ids = data.get('useDefaultRankIDs', True)

    # Throw exceptions if the required parameters are not given correctly
    if new_rank_name is None:
        raise Exception("Rank name is not given")
    if parent_rank_name is None:
        raise Exception("Parent rank name is not given")
    if tree is None or tree.lower() not in TREE_RANKS_MAPPING.keys():
        raise Exception("Invalid tree type")

    # Get tree def item model
    tree_def_model_name = (tree + 'treedef').lower().title()
    tree_def_item_model_name = (tree + 'treedefitem').lower().title()
    tree_def_model = getattr(spmodels, tree_def_model_name.lower().title())
    tree_def_item_model = getattr(spmodels, tree_def_item_model_name.lower().title())

    # Determine the new rank id parameters
    new_rank_id = None
    tree_def = tree_def_model.objects.get(id=tree_id)
    parent_rank = tree_def_item_model.objects.filter(treedef=tree_def, name=parent_rank_name).first()
    if parent_rank is None and parent_rank_name != 'root':
        raise Exception('Target rank name does not exist')
    parent_rank_id = parent_rank.rankid if parent_rank_name != 'root' else -1
    rank_ids = sorted(list(tree_def_item_model.objects.filter(treedef=tree_def).values_list('rankid', flat=True)))
    parent_rank_idx = rank_ids.index(parent_rank_id) if rank_ids is not None and parent_rank_name != 'root' else -1
    next_rank_id = rank_ids[parent_rank_idx + 1] if rank_ids is not None and  parent_rank_idx + 1 < len(rank_ids) else None
    if next_rank_id is None and parent_rank_name != 'root':
        next_rank_id = maxsize

    # Don't allow rank IDs less than 2
    if next_rank_id == 0:
        raise Exception("Can't create rank ID less than 0")
    
    # Set conditions for rank ID creation
    is_tree_def_items_empty = rank_ids is None or len(rank_ids) < 1
    is_new_rank_first = parent_rank_id == -1
    is_new_rank_last = parent_rank_idx == len(rank_ids) - 1 if rank_ids is not None else True
    
    # Set the default ranks and increments depending on the tree type
    default_tree_ranks, rank_increment = TREE_RANKS_MAPPING.get(tree.lower(), (None, 100))
    
    # Build new fields for the new TreeDefItem record
    new_fields_dict = {
        'name': new_rank_name.lower().title(),
        'title': new_rank_title,
        'parent': parent_rank,
        'treedef': tree_def
    }

    # Determine if the default rank ID can be used
    can_use_default_rank_id = (
        use_default_rank_ids 
        and default_tree_ranks is not None 
        and new_rank_name.upper() in default_tree_ranks
    )
    
    # Only use the the default rank id if the fhe following criteria is met: 
    # - new_rank_name is in the the default ranks set
    # - the default rank id is not already used
    # - the default rank is greater than the target rank
    # - the default rank is less than the current next rank from the target rank
    if can_use_default_rank_id:
        default_rank_id = default_tree_ranks[new_rank_name.upper()]

        # Check if the default rank ID is not already used
        is_default_rank_id_unused = default_rank_id not in rank_ids

        # Check if the default rank ID can be logically placed in the hierarchy
        is_placement_valid = (
            is_tree_def_items_empty 
            or (is_new_rank_first and default_rank_id < next_rank_id) 
            or (is_new_rank_last and default_rank_id > parent_rank_id)
            or (default_rank_id > parent_rank_id and default_rank_id < next_rank_id)
        )

        if is_default_rank_id_unused and is_placement_valid:
            new_rank_id = default_rank_id

    # Set the new rank id if a default rank id is not available
    if new_rank_id is None:
        # If this is the first rank, set the rank id to the default increment
        if is_tree_def_items_empty:
            new_rank_id = rank_increment

        # If there are no ranks higher than the target rank, then add the new rank to the end of the hierarchy
        elif is_new_rank_first:
            min_rank_id = rank_ids[0]
            new_rank_id = int(min_rank_id / 2)
            if new_rank_id >= min_rank_id:
                raise Exception(f"Can't add rank id bellow {min_rank_id}")

        # If there are no ranks lower than the target rank, then add the new rank to the top of the hierarchy
        elif is_new_rank_last:
            max_rank_id = rank_ids[-1]
            new_rank_id = max_rank_id + rank_increment # TODO: checkout

        # If the new rank is being placed somewhere in the middle of the heirarchy
        else:
            new_rank_id = int((next_rank_id - parent_rank_id) / 2) + parent_rank_id
            if next_rank_id - parent_rank_id < 1:
                raise Exception(f"Can't add rank id between {new_rank_id} and {parent_rank_id}")

    # Create and save the new TreeDefItem record
    new_fields_dict['rankid'] = new_rank_id
    new_rank = tree_def_item_model.objects.create(**new_fields_dict)
    new_rank.save()

    # Set the parent rank, that previously pointed to the target, to the new rank
    child_ranks = tree_def_item_model.objects.filter(treedef=tree_def, parent=parent_rank).exclude(rankid=new_rank_id)
    if child_ranks.exists():
        # Iterate through the child ranks, but there should only ever be 0 or 1 child ranks to update
        for child_rank in child_ranks:
            child_rank.parent = new_rank 
            child_rank.save()

    # Regenerate full names
    tree_extras.set_fullnames(tree_def, null_only=False, node_number_range=None)

    logger.info(f"Added new tree rank: {new_rank_name} with ID: {new_rank_id}")
    return HttpResponse("Success")

@openapi(schema={
    'post': {
        "requestBody": {
            "required": True,
            "description": "Replace a list of old records with a new record.",
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "description": "The request body.",
                        "properties": {
                            "rankName": {
                                "type": "string",
                                "description": "The name of the rank to delete."
                            },
                            "treeID": {
                                "type": "integer",
                                "description": "The ID of the tree."
                            }
                        },
                        'required': ['rankName', 'treeID'],
                        'additionalProperties': False
                    }
                }
            }
        },
        "responses": {
            "200": {"description": "Success",},
            "500": {"description": "Server Error"},
        }
    },
})
@tree_mutation
def delete_tree_rank(request, tree) -> HttpResponse:
    """
    Deletes a rank from the specified tree. Expects 'rank_id' in the POST data.
    """
    check_permission_targets(request.specify_collection.id,
                             request.specify_user.id,
                             [perm_target(tree).edit_ranks])

    # Get parameter values from request
    data = json.loads(request.body)
    rank_name = data.get('rankName')
    tree_id = data.get('treeID', 1)
    
    # Throw exceptions if the required parameters are not given correctly
    if rank_name is None:
        raise Exception("Rank name is not given")
    if tree is None or tree.lower() not in TREE_RANKS_MAPPING.keys():
        raise Exception("Invalid tree type")

    # Get tree def item model
    tree_def_model_name = (tree + 'treedef').lower().title()
    tree_def_item_model_name = (tree + 'treedefitem').lower().title()
    tree_def_model = getattr(spmodels, tree_def_model_name)
    tree_def_item_model = getattr(spmodels, tree_def_item_model_name)
    tree_def = tree_def_model.objects.get(id=tree_id)

    # Make sure no nodes are present in the rank before deleting rank
    rank = tree_def_item_model.objects.get(name=rank_name)
    if tree_def_item_model.objects.filter(parent=rank).count() > 1:
        raise Exception("The Rank is not empty, cannot delete!")

    # Set the parent rank, that previously pointed to the old rank, to the target rank
    child_ranks = tree_def_item_model.objects.filter(treedef=tree_def, parent=rank)
    if child_ranks.exists():
        # Iterate through the child ranks, but there should only ever be 0 or 1 child ranks to update
        for child_rank in child_ranks:
            child_rank.parent = rank.parent
            child_rank.save()

    # Delete rank from TreeDefItem table
    rank.delete()

    # Regenerate full names
    tree_extras.set_fullnames(tree_def, null_only=False, node_number_range=None)

    logger.info(f"Deleted tree rank with name: {rank_name}")
    return HttpResponse("Success")

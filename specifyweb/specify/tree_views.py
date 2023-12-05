from functools import wraps
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

TAXON_RANKS = {
    'TAXONOMY_ROOT': 0,
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

TREE_RANKS_MAPPING = {
    'taxon': (TAXON_RANKS, TAXON_RANK_INCREMENT),
    'geography': (GEOGRAPHY_RANKS, GEOGRAPHY_RANK_INCREMENT),
    'storage': (STORAGE_RANKS, STORAGE_RANK_INCREMENT),
    'geologictimeperiod': (GEOLOGIC_TIME_PERIOD_RANKS, GEOLOGIC_TIME_PERIOD_INCREMENT),
    'lithostrat': (LITHO_STRAT_RANKS, LITHO_STRAT_INCREMENT),
}

@openapi.schema({
    "post": {
        "parameters": [
            {
                "name": "newRankName",
                "in": "formData",
                "required": True,
                "schema": {
                    "type": "string"
                },
                "description": "The name of the new rank to add"
            },
            {
                "name": "targetRankName",
                "in": "formData",
                "required": True,
                "schema": {
                    "type": "string"
                },
                "description": "The name of the parent rank to add the new rank to (use 'root' to add to the front)"
            },
            {
                "name": "treeType",
                "in": "formData",
                "required": True,
                "schema": {
                    "type": "string",
                    "enum": ["taxon", "geography", "storage", "geologicTimePeriod", "lithoStrat"]
                },
                "description": "The type of the tree (taxon, geography, or storage)"
            },
            {
                "name": "newRankTitle",
                "in": "formData",
                "required": False,
                "schema": {
                    "type": "string"
                },
                "description": "The title of the rank to add (defaults to the name)"
            },
            {
                "name": "useDefaultRankIDs",
                "in": "formData",
                "required": False,
                "schema": {
                    "type": "bool"
                },
                "description": "Determine if the default rank IDs should be used (defaults to True)"
            }
        ],
        "responses": {
            "200": {
                "description": "Rank successfully added",
                "content": {
                    "application/json": {}
                }
            },
            "400": {
                "description": "Invalid input"
            },
            "500": {
                "description": "Internal server error"
            }
        }
    }
})
@tree_mutation
@require_POST
def add_tree_rank(request, tree) -> HttpResponse:
    """
    Adds a new rank to the specified tree. Expects 'rank_name' and 'tree_type'
    in the POST data. Adds the rank to 
    """
    try:
        # Get parameter values from request
        new_rank_title = request.POST.get('newRankTitle', new_rank_name)
        use_default_rank_ids = request.POST.get('useDefaultRankIDs', True)
        tree_type, new_rank_name, target_rank_name = (
            request.POST.get(key) for key in ('treeType', 'newRankName', 'targetRankName')
        )

        # Throw exceptions if the required parameters are not given correctly
        if new_rank_name is None:
            raise Exception("Rank name is not given")
        if target_rank_name is None:
            raise Exception("Target rank name is not given")
        if tree_type is None or tree_type.lower() not in TREE_RANKS_MAPPING.keys():
            raise Exception("Invalid tree type")

        # Get tree def item model
        tree_def_model_name = str.join(tree_type, 'treedef').lower().title()
        tree_def_item_model_name = str.join(tree_type, 'treedefitem').lower().title()
        tree_def_model = getattr(spmodels, tree_def_model_name)
        tree_def_item_model = getattr(spmodels, tree_def_item_model_name)

        # Determine the new rank id parameters
        new_rank_id = None
        target_rank = tree_def_item_model.objects.get(name=target_rank_name)
        if target_rank is None:
            raise Exception('Target rank name does not exist')
        target_rank_id = target_rank.rank_id
        rank_ids = list(tree_def_item_model.objects.all().values_list('rank_id', flat=True)).sort()
        target_rank_idx = rank_ids.index(target_rank_id)
        next_rank_id = rank_ids[target_rank_idx + 1] if target_rank_idx + 1 < len(rank_ids) else None

        # Don't allow rank IDs less than 0
        if next_rank_id == 0:
            raise Exception("Can't create rank ID less than 0")
        
        # Set conditions for rank ID creation
        is_tree_def_items_empty = rank_ids is None or len(rank_ids) < 1
        is_new_rank_first = target_rank_id == -1
        is_new_rank_last = target_rank_idx == len(rank_ids) - 1
        
        # Set the default ranks and increments depending on the tree type
        default_tree_ranks, rank_increment = TREE_RANKS_MAPPING.get(tree_type, (None, 100))
        
        # Build new fields for the new TreeDefItem record
        new_fields_dict = {
            'name': new_rank_name,
            'title': new_rank_title
        }
        new_fields_dict[tree_type.lower() + 'treedefid'] = tree_def_model

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
                or (is_new_rank_last and default_rank_id > target_rank_id)
                or (default_rank_id > target_rank_id and default_rank_id < next_rank_id)
            )

            if is_default_rank_id_unused and is_placement_valid:
                new_rank_id = default_rank_id

        # Set the new rank id if a default rank id is not available
        if new_rank_id is None:
            # If this is the first rank, create ...
            if is_tree_def_items_empty:
                new_fields_dict['rankid'] = rank_increment

            # If there are no ranks higher than the target rank, then add the new rank to the end of the hierarchy
            elif is_new_rank_first:
                new_rank_id = int((next_rank_id - target_rank_id) / 2) + target_rank_idx
                max_rank_id = rank_ids[-1]
                new_fields_dict['rankid'] = max_rank_id + rank_increment

            # If there are no ranks lower than the target rank, then add the new rank to the top of the hierarchy
            elif is_new_rank_last:
                min_rank_id = rank_ids[0]
                new_fields_dict['rankid'] = min_rank_id + rank_increment # TODO: checkout

            # If the new rank is being placed somewhere in the middle of the heirarchy
            else:
                new_rank_id = int((next_rank_id - target_rank_id) / 2) + target_rank_id
                if next_rank_id - target_rank_id < 1:
                    raise Exception(f"Can't add rank id between {new_rank_id} and {target_rank_id}")
                
        # Create and save the new TreeDefItem record
        new_fields_dict['rankid'] = new_rank_id
        tree_def_item = tree_def_item_model.objects.create(**new_fields_dict)
        tree_def_item.save()

        # Create a new tree def item
        tree_def_item_model.objects.create(id=new_rank_id, name=new_rank_name, title=new_rank_title)

        # Regenerate full names
        tree_extras.set_fullnames(tree_def_model, null_only=False, node_number_range=None)

        logger.info(f"Added new tree rank: {new_rank_name} with ID: {new_rank_id}")
        return HttpResponse("Success")
    
    except Exception as e:
        logger.error(f"Error in adding tree rank: {str(e)}")
        return HttpResponseServerError(f"Failed: {str(e)}")

@openapi.schema({
    "post": {
        "parameters": [
            {
                "name": "rankName",
                "in": "formData",
                "required": True,
                "schema": {
                    "type": "string"
                },
                "description": "The name of the rank to delete"
            },
            {
                "name": "treeType",
                "in": "formData",
                "required": True,
                "schema": {
                    "type": "string",
                    "enum": ["taxon", "geography", "storage", "geologicTimePeriod", "lithoStrat"]
                },
                "description": "The type of the tree (taxon, geography, or storage)"
            }
        ],
        "responses": {
            "200": {
                "description": "Rank successfully deleted",
                "content": {
                    "application/json": {}
                }
            },
            "404": {
                "description": "Rank not found"
            },
            "500": {
                "description": "Internal server error"
            }
        }
    }
})
@tree_mutation
@require_POST
def delete_tree_rank(request, tree) -> HttpResponse:
    """
    Deletes a rank from the specified tree. Expects 'rank_id' in the POST data.
    """
    try:
        # Get parameter values from request
        tree_type = request.POST.get('treeType')
        rank_name = request.POST.get('rankName')
        
        # Throw exceptions if the required parameters are not given correctly
        if rank_name is None:
            raise Exception("Rank name is not given")
        if tree_type is None or tree_type.lower() not in TREE_RANKS_MAPPING.keys():
            raise Exception("Invalid tree type")

        # Get tree model
        tree_model = getattr(spmodels, tree_type.lower().title())

        # Get tree def item model
        tree_def_model_name = str.join(tree_type, 'treedef').lower().title()
        tree_def_item_model_name = str.join(tree_type, 'treedefitem').lower().title()
        tree_def_model = getattr(spmodels, tree_def_model_name)
        tree_def_item_model = getattr(spmodels, tree_def_item_model_name)

        # Make sure no nodes are present in the rank before deleting rank
        rank = tree_def_item_model.objects.get(name=rank_name)
        nodes_in_rank = tree_model.objects.filter(rank_id=rank.rank_id)
        if nodes_in_rank is None or nodes_in_rank.count() > 0:
            raise Exception("The Rank is not empty, cannot delete!")

        # Delete rank from TreeDefItem table
        rank.delete()

        # Regenerate full names
        tree_extras.set_fullnames(tree_def_model, null_only=False, node_number_range=None)

        logger.info(f"Deleted tree rank with name: {rank_name}")
        return HttpResponse("Success")
    
    except Exception as e:
        logger.error(f"Error in deleting tree rank: {str(e)}")
        return HttpResponseServerError(f"Failed: {str(e)}")
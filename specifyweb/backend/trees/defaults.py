from typing import Dict, Optional, TypedDict, NotRequired, Union
import json

from django.db import transaction

from specifyweb.backend.notifications.models import Message
from specifyweb.celery_tasks import LogErrorsTask, app
import specifyweb.specify.models as spmodels
from specifyweb.backend.trees.default_tree_files import stream_default_tree_csv
from specifyweb.backend.trees.utils import get_models, TREE_ROOT_NODES
from specifyweb.backend.trees.extras import renumber_tree, set_fullnames
from specifyweb.backend.redis_cache.store import add_to_set, remove_from_set, set_members
from specifyweb.backend.trees.redis import ACTIVE_DEFAULT_TREE_TASK_REDIS_KEY

import logging
logger = logging.getLogger(__name__)

class RankConfiguration(TypedDict):
    name: str
    title: NotRequired[str]
    enforced: bool
    infullname: bool
    fullnameseparator: NotRequired[str]
    rank: int # rank id

def initialize_default_tree(tree_type: str, discipline_or_institution, tree_name: str, rank_cfg: list[RankConfiguration], full_name_direction: int=1, root_cfg: Optional[dict]= None):
    """Creates an initial empty tree."""
    with transaction.atomic():
        tree_def_model, tree_rank_model, tree_node_model = get_models(tree_type)

        # Create tree definition
        scope = {}
        if discipline_or_institution:
            if tree_type == 'storage':
                scope = {
                    'institution': discipline_or_institution
                }
            else:
                scope = {
                    'discipline': discipline_or_institution
                }
        
        # Uniquify name
        tree_def = None
        unique_tree_name = tree_name
        if tree_def_model.objects.filter(name=tree_name, **scope).exists():
            i = 1
            while tree_def_model.objects.filter(name=f"{tree_name}_{i}", **scope).exists():
                i += 1
            unique_tree_name = f"{tree_name}_{i}"

        tree_def, _ = tree_def_model.objects.get_or_create(
            name=unique_tree_name,
            fullnamedirection=full_name_direction,
            **scope
        )
        
        # Create tree ranks
        treedefitems_bulk = []
        rank_id = 0
        for rank in rank_cfg:
            treedefitems_bulk.append(
                tree_rank_model(
                    treedef=tree_def,
                    name=rank.get('name'),
                    title=(rank.get('title') or rank.get('name').title()),
                    rankid=int(rank.get('rank', rank_id)),
                    isenforced=rank.get('enforced', True),
                    isinfullname=rank.get('infullname', False),
                    fullnameseparator=rank.get('fullnameseparator', ' ')
                )
            )
            rank_id += 10
        if treedefitems_bulk:
            tree_rank_model.objects.bulk_create(treedefitems_bulk, ignore_conflicts=False)

            # Create a root node
            created_items = list(
                tree_rank_model.objects.filter(treedef=tree_def).order_by('rankid')
            )

            parent_item = None
            for item in created_items:
                item.parent = parent_item
                parent_item = item

            tree_rank_model.objects.bulk_update(created_items, ['parent'])

            # Create a root node for non-taxon trees
            # New taxon trees are expected to be empty
            if tree_type != 'taxon':
                create_default_root(tree_def, tree_type, root_cfg)

        return tree_def

def create_default_root(tree_def, tree_type: str, root_cfg: Optional[dict]= None):
    """Create root node"""
    # TODO: Avoid having duplicated code from add_root endpoint
    tree_def_model, tree_rank_model, tree_node_model = get_models(tree_type)
    root_rank = tree_rank_model.objects.get(treedef=tree_def, rankid=0)

    # Don't create a root if one already exists
    existing_root = tree_node_model.objects.filter(
        definition=tree_def,
        definitionitem=root_rank
    ).first()
    
    if existing_root:
        return existing_root
    
    kwargs = {
        'name': TREE_ROOT_NODES.get(tree_type, "Root"),
        'fullname': TREE_ROOT_NODES.get(tree_type, "Root"),
        'nodenumber': 1,
        'definition': tree_def,
        'definitionitem': root_rank,
        'parent': None,
    }
    if root_cfg:
        kwargs.update(root_cfg)

    tree_node, _ = tree_node_model.objects.get_or_create(
        **kwargs
    )
    return tree_node

class RankMappingConfiguration(TypedDict):
    name: str
    column: str
    enforced: NotRequired[bool]
    rank: NotRequired[int]
    infullname: NotRequired[bool]
    fullnameseparator: NotRequired[str]
    fields: Dict[str, str]

class TreeConfiguration(TypedDict):
    all_columns: list[str]
    ranks: list[RankMappingConfiguration]
    root: NotRequired[dict]

class DefaultTreeContext():
    """Context for a default tree creation task"""
    def __init__(self, tree_type: str, tree_def, tree_cfg: TreeConfiguration, create_missing_ranks: bool):
        self.tree_type = tree_type
        self.tree_def = tree_def

        self.tree_def_model, self.tree_rank_model, self.tree_node_model = get_models(tree_type)

        self.tree_cfg = tree_cfg
        if create_missing_ranks:
            self.create_missing_ranks()

        self.local_count = 0
        self.local_id_field = 'text1'
        
        self.create_rank_map()
        self.root_parent = self.tree_node_model.objects.filter(
            definitionitem__rankid=0, 
            definition=self.tree_def
        ).first()

        self.counter = 0
        self.batch_size = 1000
    
    def create_missing_ranks(self):
        """Create missings ranks when importing nodes into an existing tree. Matches ranks by rank id."""
        for rank in self.tree_cfg['ranks']:
            if rank.get('rank'):
                self.tree_rank_model.objects.get_or_create(
                    treedef=self.tree_def,
                    rankid=rank.get('rank'),
                    defaults={
                        'name': rank['name'],
                        'title': (rank.get('title') or rank.get('name').title()),
                        'isenforced': rank.get('enforced', True),
                        'isinfullname': rank.get('infullname', False),
                        'fullnameseparator': rank.get('fullnameseparator', ' '),
                    }
                )

    def create_rank_map(self):
        """Rank lookup map to reduce queries"""
        ranks = list(self.tree_rank_model.objects.filter(treedef=self.tree_def))
        self.tree_def_item_map = {rank.name: rank for rank in ranks}
        # Buffers for batches
        self.rankid_map = {rank.rankid: rank for rank in ranks}
        # All node objects to be created in this batch, separated by rank
        self.buffers = {rank.rankid: {} for rank in ranks}
        # Contains all nodes that can be parents at the current row. Name -> Object or database ID.
        self.parent_lookup = {rank.rankid: {} for rank in ranks}
        # IDs of nodes commited to the database. Local ID -> Database ID
        self.created = {rank.rankid: {} for rank in ranks}
        self.highest_rank = 0

    def add_node_to_buffer(self, node, rank_id, row_id):
        """Add node to the current batch of nodes to be created"""
        if rank_id not in self.buffers:
            self.buffers[rank_id] = {}
            self.parent_lookup[rank_id] = {}
            self.created[rank_id] = {}
        self.buffers[rank_id][row_id] = node
        self.parent_lookup[rank_id][node.name] = node
        return node

    def get_existing_parent(self, rank_id: int, name: str) -> Union[object, int, None]:
        """Gets a node if its already in the current batch's buffer. Prevents duplication within a batch."""
        # Check for node in buffer, return node
        lookup = self.parent_lookup.get(rank_id, {})
        return lookup.get(name, None)
    
    def clear_parent_lookup(self, highest_rank: int):
        """Clears all higher-rank buffers, since they are no longer relevant"""
        # This will prevent a node from being parented to an incorrect parent with the same name
        if highest_rank < self.highest_rank:
            for id in list(self.parent_lookup.keys()):
                if id > highest_rank:
                    self.parent_lookup[id] = {}
            self.highest_rank = highest_rank
        self.highest_rank = max(highest_rank, self.highest_rank)
    
    def finalize(self):
        """Clears temporary local id values from tree."""
        self.tree_node_model.objects.filter(
            definition=self.tree_def
        ).update(
            **{f"{self.local_id_field}": None}
        )

    def flush(self, force=False):
        """Flushes this batch's buffer if the batch is complete. Bulk creates the nodes in a complete batch."""
        self.counter += 1
        if not (force or self.counter >= self.batch_size):
            return
        logger.debug(f"Batch creating {self.counter} rows.")
        
        # Go through ranks in ascending order and bulk create nodes
        ordered_rank_ids = sorted(self.buffers.keys())
        for rank_id in ordered_rank_ids:
            logger.debug(f"On rank {rank_id}")
            buffer = self.buffers.get(rank_id, {})

            rank = self.rankid_map.get(rank_id)
            if rank is None:
                # Can't create nodes because this rank doesn't exist
                continue

            nodes_to_create = []
            # Update the nodes' parents to a saved version of their parents
            for row_id, node in list(buffer.items()):
                parent = getattr(node, 'parent', None)
                parent_id = getattr(node, 'parent_id', None)
                if parent is not None and getattr(parent, 'pk', None) is None:
                    saved_parent_id = self.created[parent.rankid].get(int(getattr(parent, self.local_id_field)))
                    # Handle root
                    if not saved_parent_id and parent.name == getattr(self.root_parent, 'name', None):
                        saved_parent_id = self.root_parent.id
                    if saved_parent_id:
                        node.parent = None
                        node.parent_id = saved_parent_id

                # Create node if its parent has been created
                if getattr(node.parent, 'pk', None) is not None or getattr(node, 'parent_id', None) is not None:
                    nodes_to_create.append(node)
                else:
                    logger.warning(f"Could not create {node.name} because a valid parent could not be resolved. {parent_id}, {str(parent)}")

            if nodes_to_create:
                self.tree_node_model.objects.bulk_create(nodes_to_create, ignore_conflicts=True)

                # Store the ids of the nodes were created in this batch
                created_local_ids = [str(getattr(n, self.local_id_field)) for n in nodes_to_create]
                created_nodes = self.tree_node_model.objects.filter(
                    definition=self.tree_def,
                    definitionitem=rank,
                    **{f"{self.local_id_field}__in": created_local_ids}
                )
                self.created[rank_id].update({int(getattr(n, self.local_id_field)): n.id for n in created_nodes})
                
                # parent_lookup still contains unsaved objects. Replace them with IDs.
                sorted_created_nodes = sorted(
                    created_nodes,
                    key=lambda n: int(getattr(n, self.local_id_field)),
                    reverse=True
                )
                for node in sorted_created_nodes:
                    local_id = int(getattr(node, self.local_id_field))
                    name = node.name
                    self.parent_lookup[rank_id][name] = self.created[rank_id].get(local_id)


            self.buffers[rank_id] = {}

        self.counter = 0

def add_default_tree_record(context: DefaultTreeContext, row: dict, tree_cfg: TreeConfiguration, row_id: int):
    """
    Given one CSV row and a column mapping / rank configuration dictionary,
    walk through the 'ranks' in order, creating or updating each tree record and linking
    it to its parent.
    """
    tree_node_model = context.tree_node_model
    tree_def = context.tree_def
    parent = context.root_parent
    parent_id = None

    highest_rank = 0
    rank_count = len(tree_cfg['ranks'])
    for index in range(rank_count):
        rank_mapping = tree_cfg['ranks'][index]
        rank_name = rank_mapping['name']
        fields_mapping = rank_mapping['fields']

        record_name = row.get(rank_mapping.get('column', rank_name)) # Record's name is in the <rank_name> column.

        if not record_name:
            continue # This row doesn't contain a record for this rank.

        defaults = {}
        for model_field, csv_col in fields_mapping.items():
            if model_field == 'name':
                continue
            v = row.get(csv_col)
            if v:
                defaults[model_field] = v

        rank_title = rank_mapping.get('title', rank_name.capitalize())

        # Get the rank by the rank id, or column name as a fallback.
        # Skip creating on this rank if it doesn't exist
        if rank_mapping['rank']:
            tree_def_item = context.rankid_map.get(rank_mapping['rank'])
        else:
            tree_def_item = context.tree_def_item_map.get(rank_name)

        if tree_def_item is None:
            continue
        
        # Check if this is the last node in this row.
        # If so, do not attempt to de-duplicate it. Non-parent nodes are allowed to share names.
        is_last = (index == rank_count-1)
        if not is_last and index < rank_count-1:
            next_rank_mapping = tree_cfg['ranks'][index+1]
            next_rank_name = next_rank_mapping['name']
            next_record_name = row.get(next_rank_mapping.get('column', next_rank_name))
            if not next_record_name:
                is_last = True
        
        if is_last:
            highest_rank = tree_def_item.rankid

        # Create the node at this rank if it isn't already there.
        existing = context.get_existing_parent(tree_def_item.rankid, record_name)
        if not is_last and existing is not None:
            if type(existing) is int:
                # Use parent's true id
                parent_id = existing
                parent = None
            else:
                # Unsaved parent, use the object directly (It will be replaced with the true id when buffer is flushed)
                parent_id = None
                parent = existing
        else:
            # Add new node to buffer
            data = {
                'name': record_name,
                'fullname': record_name,
                'definition': tree_def,
                'definitionitem': tree_def_item,
                'rankid': tree_def_item.rankid,
            }
            if hasattr(tree_node_model, 'isaccepted'):
                data['isaccepted'] = True
            data.update(defaults)

            # Add a unique identifier in this import context (to be deleted when tree is finalized)
            # This will be used to query this exact node again once its saved
            context.local_count += 1
            data[context.local_id_field] = context.local_count
            
            if parent is not None:
                data['parent'] = parent
            elif parent_id is not None:
                data['parent_id'] = parent_id

            obj = tree_node_model(**data)
            obj = context.add_node_to_buffer(obj, tree_def_item.rankid, row_id)

            parent = obj
            parent_id = None

    # Clear irrelevant parents
    context.clear_parent_lookup(highest_rank)

def queue_create_default_tree_task(task_id):
    """Store queued (and active) default tree creation tasks so they can be reliably tracked later."""
    add_to_set(ACTIVE_DEFAULT_TREE_TASK_REDIS_KEY, task_id)
    logger.debug(f"Queued task {task_id}. Current tasks: {set_members(ACTIVE_DEFAULT_TREE_TASK_REDIS_KEY)}")

def get_active_create_default_tree_tasks() -> list[str]:
    tasks = set_members(ACTIVE_DEFAULT_TREE_TASK_REDIS_KEY)
    logger.debug(f"Active tree creation tasks: {tasks}")
    return list(tasks)

def finish_create_default_tree_task(task_id):
    """Clear a finished tree creation task from redis cache."""
    remove_from_set(ACTIVE_DEFAULT_TREE_TASK_REDIS_KEY, task_id)
    logger.debug(f"Finished task {task_id}. Current tasks: {set_members(ACTIVE_DEFAULT_TREE_TASK_REDIS_KEY)}")

@app.task(base=LogErrorsTask, bind=True)
def create_default_tree_task(self, url: str, discipline_id: int, tree_type: str, specify_collection_id: Optional[int],
                             specify_user_id: Optional[int], tree_cfg: dict, row_count: Optional[int], initial_tree_name: str,
                             existing_tree_def_id = None, create_missing_ranks: bool = False, notify: bool = True):
    logger.info(f'starting task {str(self.request.id)}')

    discipline = None
    if discipline_id:
        discipline = spmodels.Discipline.objects.get(id=discipline_id)

    tree_name = initial_tree_name # Name will be uniquified on tree creation

    if notify and specify_user_id and specify_collection_id:
        specify_user = spmodels.Specifyuser.objects.get(id=specify_user_id)
        Message.objects.create(
            user=specify_user,
            content=json.dumps({
                'type': 'create-default-tree-starting',
                'name': initial_tree_name,
                'taskid': str(self.request.id),
                'collection_id': specify_collection_id,
            })
        )

    current = 0
    total = 1
    def progress(cur: int, additional_total: int=0) -> None:
        nonlocal current, total
        current += cur
        total += additional_total
        if current > total:
            current = total
        self.update_state(state='RUNNING', meta={'current': current, 'total': total})

    try:
        with transaction.atomic():
            tree_def = None
            if existing_tree_def_id:
                # Import into exisiting tree
                tree_def_model, tree_rank_model, tree_node_model = get_models(tree_type)
                tree_def = tree_def_model.objects.filter(pk=existing_tree_def_id).first()

            if tree_def is None:
                # Create a new empty tree. Get rank configuration from the mapping.
                full_name_direction = 1
                if tree_type in ('geologictimeperiod',):
                    full_name_direction = -1

                rank_cfg = [{
                    'name': 'Root',
                    'enforced': True,
                    'rank': 0,
                    **tree_cfg.get('root', {})
                }]
                auto_rank_id = 10
                for rank in tree_cfg['ranks']:
                    rank_cfg.append({
                        'name': rank['name'],
                        'enforced': rank.get('enforced', True),
                        'infullname': rank.get('infullname', False),
                        'fullnameseparator': rank.get('fullnameseparator', ' '),
                        'rank': rank.get('rank', auto_rank_id)
                    })
                    auto_rank_id += 10
                tree_def = initialize_default_tree(tree_type, discipline, initial_tree_name, rank_cfg, full_name_direction, tree_cfg.get('root'))
            
            create_default_root(tree_def, tree_type, tree_cfg.get('root'))
            tree_name = tree_def.name
            
            # Start importing CSV data
            context = DefaultTreeContext(tree_type, tree_def, tree_cfg, create_missing_ranks)

            total_rows = 0
            if row_count:
                total_rows = row_count-2
            progress(0, total_rows)
            
            for row in stream_default_tree_csv(url):
                add_default_tree_record(context, row, tree_cfg, current)
                context.flush()
                progress(1, 0)
            context.flush(force=True)

            # Finalize Tree
            context.finalize()
            renumber_tree(tree_type)
            set_fullnames(tree_def)
    except Exception as e:
        if notify and specify_user_id and specify_collection_id:
            Message.objects.create(
                user=specify_user,
                content=json.dumps({
                    'type': 'create-default-tree-failed',
                    'name': tree_name,
                    'taskid': str(self.request.id),
                    'collection_id': specify_collection_id,
                    # 'error': str(e)
                })
            )
        finish_create_default_tree_task(f'create_default_tree_{tree_type}_{existing_tree_def_id or self.request.id}')
        raise

    if notify and specify_user_id and specify_collection_id:
        Message.objects.create(
            user=specify_user,
            content=json.dumps({
                'type': 'create-default-tree-completed',
                'name': tree_name,
                'taskid': str(self.request.id),
                'collection_id': specify_collection_id,
            })
        )
    
    finish_create_default_tree_task(f'create_default_tree_{tree_type}_{existing_tree_def_id or self.request.id}')

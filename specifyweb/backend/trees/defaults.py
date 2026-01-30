from typing import Any, Callable, List, Dict, Iterator, Optional, TypedDict, NotRequired
import json
import requests
import csv
import time
from requests.exceptions import ChunkedEncodingError, ConnectionError

from django.db import transaction

from specifyweb.backend.notifications.models import Message
from specifyweb.celery_tasks import LogErrorsTask, app
import specifyweb.specify.models as spmodels
from specifyweb.backend.trees.utils import get_models, SPECIFY_TREES, TREE_ROOT_NODES
from specifyweb.backend.trees.extras import renumber_tree, set_fullnames

import logging
logger = logging.getLogger(__name__)

class RankConfiguration(TypedDict):
    name: str
    title: NotRequired[str]
    enforced: bool
    infullname: bool
    fullnameseparator: NotRequired[str]
    rank: int # rank id

def initialize_default_tree(tree_type: str, discipline_or_institution, tree_name: str, rank_cfg: list[RankConfiguration], full_name_direction: int=1):
    """Creates an initial empty tree."""
    with transaction.atomic():
        tree_def_model, tree_rank_model, tree_node_model = get_models(tree_type)
        
        # Uniquify name
        tree_def = None
        unique_tree_name = tree_name
        if tree_def_model.objects.filter(name=tree_name).exists():
            i = 1
            while tree_def_model.objects.filter(name=f"{tree_name}_{i}").exists():
                i += 1
            unique_tree_name = f"{tree_name}_{i}"
        
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
                create_default_root(tree_def, tree_type)

        return tree_def

def create_default_root(tree_def, tree_type: str):
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

    tree_node, _ = tree_node_model.objects.get_or_create(
        name=TREE_ROOT_NODES.get(tree_type, "Root"),
        fullname=TREE_ROOT_NODES.get(tree_type, "Root"),
        nodenumber=1,
        definition=tree_def,
        definitionitem=root_rank,
        parent=None
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

class DefaultTreeContext():
    """Context for a default tree creation task"""
    def __init__(self, tree_type: str, tree_name: str):
        self.tree_type = tree_type
        self.tree_name = tree_name

        self.tree_def_model, self.tree_rank_model, self.tree_node_model = get_models(tree_type)

        self.tree_def = self.tree_def_model.objects.get(name=tree_name)
        
        self.create_rank_map()
        self.root_parent = self.tree_node_model.objects.filter(
            definitionitem__rankid=0, 
            definition=self.tree_def
        ).first()

        self.counter = 0
        self.batch_size = 1000

    def create_rank_map(self):
        """Rank lookup map to reduce queries"""
        ranks = list(self.tree_rank_model.objects.filter(treedef=self.tree_def))
        self.tree_def_item_map = {rank.name: rank for rank in ranks}
        # Buffers for batches
        self.rankid_map = {rank.rankid: rank for rank in ranks}
        self.buffers = {rank.rankid: {} for rank in ranks}
        self.created = {rank.rankid: {} for rank in ranks}

    def add_node_to_buffer(self, node, rank_id, row_id):
        """Add node to the current batch of nodes to be created"""
        if rank_id not in self.buffers:
            self.buffers[rank_id] = {}
            self.created[rank_id] = {}
        self.buffers[rank_id][row_id] = node
        return node

    def get_node_in_buffer(self, rank_id: int, name: str):
        """Gets a node if its already in the current batch's buffer. Prevents duplication within a batch."""
        # Check for node in buffer, return node
        buffer = self.buffers.get(rank_id, {})
        for node in buffer.values():
            if node.name == name:
                return node
        return None
    
    def get_existing_node_id(self, rank_id: int, name: str) -> Optional[int]:
        """Gets a node's id if it has already been created. Prevents duplication across an entire import."""
        # Check for existing id, return id
        created_in_rank = self.created.get(rank_id)
        if created_in_rank:
            return created_in_rank.get(name)
        return None

    def flush(self, force=False):
        """Flushes this batch's buffer if the batch is complete. Bulk creates the nodes in a complete batch."""
        self.counter += 1
        if not (force or self.counter > self.batch_size):
            return
        logger.debug(f"Batch creating {self.batch_size} rows.")
        
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
                    saved_parent_id = self.created[parent.rankid].get(parent.name)
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
                created_names = [n.name for n in nodes_to_create]
                created_nodes = self.tree_node_model.objects.filter(
                    definition=self.tree_def,
                    definitionitem=rank,
                    name__in=created_names
                )
                self.created[rank_id].update({n.name: n.id for n in created_nodes})

            self.buffers[rank_id] = {}

        self.counter = 0

def add_default_tree_record(context: DefaultTreeContext, row: dict, tree_cfg: dict[str, RankMappingConfiguration], row_id: int):
    """
    Given one CSV row and a column mapping / rank configuration dictionary,
    walk through the 'ranks' in order, creating or updating each tree record and linking
    it to its parent.
    """
    tree_node_model = context.tree_node_model
    tree_def = context.tree_def
    parent = context.root_parent
    parent_id = None
    rank_id = 10

    for rank_mapping in tree_cfg['ranks']:
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

        # Get the rank by the column name.
        # Skip creating on this rank if it doesn't exist
        tree_def_item = context.tree_def_item_map.get(rank_name)

        if tree_def_item is None:
            continue

        # Create the node at this rank if it isn't already there.
        buffered = context.get_node_in_buffer(tree_def_item.rankid, record_name)
        existing_id = context.get_existing_node_id(tree_def_item.rankid, record_name)
        if existing_id is not None:
            parent_id = existing_id
            parent = None
        elif buffered is not None:
            parent_id = None
            parent = buffered
        else:
            data = {
                'name': record_name,
                'fullname': record_name,
                'definition': tree_def,
                'definitionitem': tree_def_item,
                'rankid': tree_def_item.rankid,
                **defaults
            }
            if parent is not None:
                data['parent'] = parent
            elif parent_id is not None:
                data['parent_id'] = parent_id
            obj = tree_node_model(**data)
            obj = context.add_node_to_buffer(obj, tree_def_item.rankid, row_id)

            parent = obj
            parent_id = None
        rank_id += 10

@app.task(base=LogErrorsTask, bind=True)
def create_default_tree_task(self, url: str, discipline_id: int, tree_discipline_name: str, specify_collection_id: Optional[int],
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
            tree_type = 'taxon'
            if tree_discipline_name in SPECIFY_TREES:
                # non-taxon tree
                tree_type = tree_discipline_name

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
                tree_def = initialize_default_tree(tree_type, discipline, initial_tree_name, rank_cfg, full_name_direction)
            
            create_default_root(tree_def, tree_type)
            tree_name = tree_def.name
            
            # Start importing CSV data
            context = DefaultTreeContext(tree_type, tree_name)

            total_rows = 0
            if row_count:
                total_rows = row_count-2
            progress(0, total_rows)
            
            for row in stream_csv_from_url(url):
                add_default_tree_record(context, row, tree_cfg, current)
                context.flush()
                progress(1, 0)
            context.flush(force=True)

            # Finalize Tree
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

def stream_csv_from_url(url: str) -> Iterator[Dict[str, str]]:
    """
    Streams a taxon CSV from a URL. Yields each row.
    """
    chunk_size = 8192
    max_retries = 10

    def lines_iter() -> Iterator[str]:
        # Streams data from the server in -chunks-, yields -lines-.
        buffer = b""
        bytes_downloaded = 0
        retries = 0

        headers = {}
        while True:
            # Request data starting from the last downloaded bytes
            if bytes_downloaded > 0:
                headers['Range'] = f'bytes={bytes_downloaded}-'

            try:
                with requests.get(url, stream=True, timeout=(5, 30), headers=headers) as resp:
                    resp.raise_for_status()
                    for chunk in resp.iter_content(chunk_size=chunk_size):
                        chunk_length = len(chunk)
                        if chunk_length == 0:
                            continue
                        buffer += chunk
                        bytes_downloaded += chunk_length
                        
                        # Extract all lines from chunk
                        while True:
                            new_line_index = buffer.find(b'\n')
                            if new_line_index == -1: break
                            line = buffer[:new_line_index + 1] # extract line
                            buffer = buffer[new_line_index + 1 :] # clear read buffer
                            yield line.decode('utf-8-sig', errors='replace')

                    if buffer:
                        # yield last line
                        yield buffer.decode('utf-8-sig', errors='replace')
                    return
            except (ChunkedEncodingError, ConnectionError) as e:
                # Trigger retry
                if retries < max_retries:
                    retries += 1
                    time.sleep(2 ** retries)
                    continue
                raise
            except Exception:
                raise

    reader = csv.DictReader(lines_iter())
    
    for row in reader:
        yield row
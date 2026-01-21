from typing import Any, Callable, List, Dict, Iterator, Optional, TypedDict, Tuple, NotRequired
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

        # Ensure a real root exists for new trees, otherwise everything starts with parent=None
        if self.root_parent is None:
            root_rank = self.rankid_map.get(0)
            if root_rank is not None:
                self.root_parent = self.tree_node_model(
                    name=self.tree_def.name,
                    fullname=self.tree_def.name,
                    definition=self.tree_def,
                    definitionitem=root_rank,
                    parent=None,
                )
                self.root_parent.save(skip_tree_extras=True)

        self.counter = 0
        self.batch_size = 1000

    def create_rank_map(self):
        """Rank lookup map to reduce queries"""
        ranks = list(self.tree_rank_model.objects.filter(treedef=self.tree_def))
        self.tree_def_item_map = {rank.name: rank for rank in ranks}
        self.rankid_map = {rank.rankid: rank for rank in ranks}

        # buffers[rank_id] = {(rank_id, parent_key, name): node}
        self.buffers: Dict[int, Dict[Tuple[int, Tuple[str, Optional[int]], str], Any]] = {
            rank.rankid: {} for rank in ranks
        }

    def _parent_key(self, parent) -> Tuple[str, Optional[int]]:
        if parent is None:
            return ("root", None)
        pk = getattr(parent, "pk", None)
        if pk is not None:
            return ("pk", int(pk))
        return ("tmp", id(parent))

    def add_node_to_buffer(self, node, rank_id: int):
        """Add node to current batch buffer, de-duping on (rank_id, parent, name)."""
        parent = getattr(node, "parent", None)
        key = (rank_id, self._parent_key(parent), node.name)
        self.buffers.setdefault(rank_id, {})
        self.buffers[rank_id][key] = node
        return node

    def get_node_in_buffer(self, rank_id: int, name: str, parent):
        """Get a node if its already in the current batch's buffer. Prevents duplication."""
        key = (rank_id, self._parent_key(parent), name)
        return self.buffers.get(rank_id, {}).get(key)

    def flush(self, force: bool = False):
        """Flushes this batch's buffer if the batch is complete. Bulk creates the nodes in a complete batch."""
        self.counter += 1
        if not (force or self.counter >= self.batch_size):
            return

        created_map: Dict[int, Dict[Tuple[str, Tuple[str, Optional[int]]], Any]] = {}

        # create ranks in ascending order so parents exist before children
        for rank_id in sorted(self.buffers.keys()):
            buffer = self.buffers.get(rank_id, {})
            if not buffer:
                continue

            rank = self.rankid_map.get(rank_id)
            if rank is None:
                self.buffers[rank_id] = {}
                continue

            nodes_to_create = []
            for (node_rankid, node_parent_key, node_name), node in list(buffer.items()):
                parent = getattr(node, "parent", None)

                # Resolve unsaved parent from nodes created earlier in this batch
                if parent is not None and getattr(parent, "pk", None) is None:
                    parent_rankid = getattr(getattr(parent, "definitionitem", None), "rankid", None)

                    saved_parent = None
                    if parent_rankid is not None:
                        parent_lookup_key = (
                            parent.name,
                            self._parent_key(getattr(parent, "parent", None))
                        )
                        saved_parent = created_map.get(parent_rankid, {}).get(parent_lookup_key)

                    # Fallback to real root
                    if saved_parent is None and self.root_parent is not None:
                        if parent.name == self.root_parent.name:
                            saved_parent = self.root_parent

                    if saved_parent is not None:
                        node.parent = saved_parent

                # Only root nodes may have parent=None
                if node_rankid == 0:
                    nodes_to_create.append(node)
                else:
                    if getattr(getattr(node, "parent", None), "pk", None) is not None:
                        nodes_to_create.append(node)
                    else:
                        logger.warning(
                            f"Skipping {node.name} (rank {node_rankid}) – parent could not be resolved"
                        )

            if nodes_to_create:
                self.tree_node_model.objects.bulk_create(nodes_to_create, ignore_conflicts=True)

                # Load the saved copies so children can point to them
                created_names = [n.name for n in nodes_to_create]
                created_nodes = self.tree_node_model.objects.filter(
                    definition=self.tree_def,
                    definitionitem=rank,
                    name__in=created_names
                )

                # Map by parent_key and name
                rank_created: Dict[Tuple[str, Tuple[str, Optional[int]]], Any] = {}
                for n in created_nodes:
                    key = (
                        n.name,
                        self._parent_key(getattr(n, "parent", None))
                    )
                    rank_created[key] = n
                created_map[rank_id] = rank_created

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
        buffered = context.get_node_in_buffer(tree_def_item.rankid, record_name, parent)
        if buffered is not None:
            obj = buffered
        else:
            data = {
                'name': record_name,
                'fullname': record_name,
                'definition': tree_def,
                'definitionitem': tree_def_item,
                'parent': parent,
                **defaults
            }
            obj = tree_node_model(**data)
            obj = context.add_node_to_buffer(obj, tree_def_item.rankid)

        parent = obj
        rank_id += 10

@app.task(base=LogErrorsTask, bind=True)
def create_default_tree_task(self, url: str, discipline_id: int, tree_discipline_name: str, specify_collection_id: Optional[int],
                             specify_user_id: Optional[int], tree_cfg: dict, row_count: Optional[int], initial_tree_name: str,
                             existing_tree_def_id = None):
    logger.info(f'starting task {str(self.request.id)}')

    discipline = None
    if discipline_id:
        discipline = spmodels.Discipline.objects.get(id=discipline_id)
    tree_name = initial_tree_name # Name will be uniquified on tree creation

    if specify_user_id and specify_collection_id:
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
    except Exception as e:
        if specify_user_id and specify_collection_id:
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

    if specify_user_id and specify_collection_id:
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
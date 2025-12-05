from typing import Any, Callable, Dict, Iterator, Optional
import json
import requests
import csv
import time
from requests.exceptions import ChunkedEncodingError, ConnectionError

from django.db import transaction
from django.db.models import Q, Count, Model

from specifyweb.backend.notifications.models import Message
from specifyweb.celery_tasks import LogErrorsTask, app
import specifyweb.specify.models as spmodels
from specifyweb.specify.datamodel import datamodel, Table

import logging
logger = logging.getLogger(__name__)

lookup = lambda tree: (tree.lower() + 'treedef')

SPECIFY_TREES = {"taxon", "storage", "geography", "geologictimeperiod", "lithostrat", 'tectonicunit'}

def get_search_filters(collection: spmodels.Collection, tree: str):
    tree_name = tree.lower()
    if tree_name == 'storage':
        return Q(institution=collection.discipline.division.institution)
    discipline_query = Q(discipline=collection.discipline)
    if tree_name == 'taxon':
        discipline_query |= Q(
            # TEST: should this only be added if discipline is null?
            cotypes__collection=collection
            )
    tree_at_discipline = getattr(collection.discipline, lookup(tree))
    if tree_at_discipline:
        discipline_query |= Q(id=tree_at_discipline.id)
    return discipline_query

def get_treedefs(collection: spmodels.Collection, tree_name: str) ->  list[tuple[int, int]]:
    # Get the appropriate TreeDef based on the Collection and tree_name

    # Mimic the old behavior of limiting the query to the first item for trees other than taxon.
    # Even though the queryconstruct can handle trees with multiple types.
    _limit = lambda query: (query if tree_name.lower() == 'taxon' else query[:1])
    search_filters = get_search_filters(collection, tree_name)

    lookup_tree = lookup(tree_name)
    tree_table = datamodel.get_table_strict(lookup_tree)
    tree_model: Model = getattr(spmodels, tree_table.django_name)

    # Get all the treedefids, and the count of item in each, corresponding to our search predicates
    search_query = _limit(
        tree_model.objects.filter(search_filters)
        .annotate(item_counts=Count("treedefitems", distinct=True))
        .distinct()
        .values_list("id", "item_counts")
    )

    result = list(search_query)

    assert len(result) > 0, "No definition to query on"

    return result

def get_default_treedef(table: Table, collection):
    if table.name.lower() not in SPECIFY_TREES:
        raise Exception(f"unexpected tree type: {table.name}")
    
    if table.name == 'Taxon':
        return collection.discipline.taxontreedef

    elif table.name == "Geography":
        return collection.discipline.geographytreedef

    elif table.name == "LithoStrat":
        return collection.discipline.lithostrattreedef

    elif table.name == "GeologicTimePeriod":
        return collection.discipline.geologictimeperiodtreedef

    elif table.name == "Storage":
        return collection.discipline.division.institution.storagetreedef

    elif table.name == 'TectonicUnit':
        return collection.discipline.tectonicunittreedef
    
    return None

def get_treedefitem_model(tree: str):
    return getattr(spmodels, tree.lower().title() + 'treedefitem')

def get_treedef_model(tree: str):
    return getattr(spmodels, tree.lower().title() + 'treedef')

def get_models(name: str):
    tree_def_model = get_treedef_model(name)
    tree_rank_model = get_treedefitem_model(name)
    tree_node_model = getattr(spmodels, name.lower().title())
    
    return tree_def_model, tree_rank_model, tree_node_model

def initialize_default_tree(tree_type: str, discipline, tree_name: str, rank_names_lst: list):
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
        tree_def, _ = tree_def_model.objects.get_or_create(
            name=unique_tree_name,
            discipline=discipline
        )
        
        # Create tree ranks
        treedefitems_bulk = []
        rank_id = 0
        for rank_name in rank_names_lst:
            treedefitems_bulk.append(
                tree_rank_model(
                    treedef=tree_def,
                    name=rank_name, # TODO: allow rank name configuration
                    rankid=int(rank_id),
                )
            )
            rank_id += 10
        if treedefitems_bulk:
            tree_rank_model.objects.bulk_create(treedefitems_bulk, ignore_conflicts=False)

            # Create root node
            # TODO: Avoid having duplicated code from add_root endpoint
            root_rank = tree_rank_model.objects.get(treedef=tree_def, rankid=0)
            tree_node, _ = tree_node_model.objects.get_or_create(
                name="Root",
                fullname="Root",
                nodenumber=1,
                definition=tree_def,
                definitionitem=root_rank,
                parent=None
            )

        tree_name = tree_def.name
        return tree_name

def add_default_tree_record(tree_type: str, discipline, row: dict, tree_name: str, tree_cfg: dict[str, Any]):
    """
    Given one CSV row, the discipline, and a rank configuration dictionary,
    walk through the 'ranks' in order, creating or updating each tree record and linking
    it to its parent.
    """
    tree_def_model, tree_rank_model, tree_node_model = get_models(tree_type)
    tree_def = tree_def_model.objects.get(name=tree_name)
    parent = tree_node_model.objects.get(name='Root', fullname='Root', definition=tree_def)
    rank_id = 10

    for rank_map in tree_cfg['ranks']:
        rank = next(iter(rank_map))
        fields_map = rank_map[rank]

        value = row.get(rank)
        if not value:
            continue

        defaults = {}
        for csv_col, model_field in fields_map.items():
            if csv_col == rank:
                continue
            v = row.get(csv_col)
            if v:
                defaults[model_field] = v

        treedef_item, _ = tree_rank_model.objects.get_or_create(
            name=rank.capitalize(),
            treedef=tree_def,
            rankid=rank_id
        )

        obj = tree_node_model.objects.filter(
            name=value,
            fullname=value,
            definition=tree_def,
            definitionitem=treedef_item,
            parent=parent,
        ).first()
        if obj is None:
            data = {
                'name': value,
                'fullname': value,
                'definition': tree_def,
                'definitionitem': treedef_item,
                'parent': parent,
                'rankid': treedef_item.rankid,
                **defaults
            }
            obj = tree_node_model(**data)
            obj.save(skip_tree_extras=True)

        # if not taxon_obj and defaults:
        #     for f, v in defaults.items():
        #         setattr(taxon_obj, f, v)
        #     taxon_obj.save()

        parent = obj
        rank_id += 10

@app.task(base=LogErrorsTask, bind=True)
def create_default_tree_task(self, url: str, discipline_id: int, tree_discipline_name: str, rank_count: int, specify_collection_id: int,
                             specify_user_id: int, mapping_url: str, row_count: Optional[int]):
    logger.info(f'starting task {str(self.request.id)}')

    specify_user = spmodels.Specifyuser.objects.get(id=specify_user_id)
    discipline = spmodels.Discipline.objects.get(id=discipline_id)
    tree_name = tree_discipline_name.capitalize()

    Message.objects.create(
        user=specify_user,
        content=json.dumps({
            'type': 'create-default-tree-running',
            'name': "Create_Default_Tree_" + tree_discipline_name,
            'collection_id': specify_collection_id,
            'discipline_name': tree_discipline_name,
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

    def set_tree(name: str) -> None:
        nonlocal tree_name
        tree_name = name

    try:
        tree_type = 'taxon'
        if tree_discipline_name in SPECIFY_TREES:
            # non-taxon tree
            tree_type = tree_discipline_name

        try:
            resp = requests.get(mapping_url)
            resp.raise_for_status()
            tree_cfg = resp.json()
        except Exception:
            raise
        
        total_rows = 0
        if row_count:
            total_rows = row_count-2
        progress(0, total_rows)
        with transaction.atomic():
            for row in stream_csv_from_url(url, discipline, rank_count, tree_type, tree_name, set_tree):
                add_default_tree_record(tree_type, discipline, row, tree_name, tree_cfg)
                progress(1, 0)
    except Exception as e:
        Message.objects.create(
            user=specify_user,
            content=json.dumps({
                'type': 'create-default-tree-failed',
                'name': "Create_Default_Tree_" + tree_discipline_name,
                'collection_id': specify_collection_id,
                'discipline_name': tree_discipline_name
                # 'error': str(e)
            })
        )
        raise

    Message.objects.create(
        user=specify_user,
        content=json.dumps({
            'type': 'create-default-tree-completed',
            'name': "Create_Default_Tree_" + tree_discipline_name,
            'collection_id': specify_collection_id,
            'discipline_name': tree_discipline_name,
        })
    )

def stream_csv_from_url(url: str, discipline, rank_count: int, tree_type: str, initial_tree_name: str, set_tree: Callable[[str], None]) -> Iterator[Dict[str, str]]:
    """
    Streams a taxon CSV from a URL. Yields each row.
    """
    chunk_size = 8192
    max_retries = 5

    def lines_iter() -> Iterator[str]:
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
                            yield line.decode('utf-8', errors='replace')

                    if buffer:
                        yield buffer.decode('utf-8', errors='replace')
                    return
            except (ChunkedEncodingError, ConnectionError) as e:
                # Trigger retry
                if retries < max_retries:
                    retries += 1
                    time.sleep(0.5*retries)
                    continue
                raise
            except Exception:
                raise

    reader = csv.DictReader(lines_iter())

    rank_names_lst = reader.fieldnames[:rank_count]
    rank_names_lst.insert(0, "Root") # Add Root rank
    tree_name = initialize_default_tree(tree_type, discipline, initial_tree_name, rank_names_lst)
    set_tree(tree_name)
    
    for row in reader:
        yield row
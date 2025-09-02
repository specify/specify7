from typing import Dict, Iterator
import json
import requests
import csv

from django.db import transaction

from django.db.models import Q, Count, Model

import logging

from specifyweb.backend.notifications.models import Message
from specifyweb.celery_tasks import LogErrorsTask, app

import specifyweb.specify.models as spmodels
from specifyweb.specify.datamodel import datamodel, Table

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

# fishes      kingdom,phylum,class,order,family,genus,species,subspecies,family common name,species author,species source,species lsid,species common name,subspecies author,subspecies source,subspecies lsid,subspecies common name
# herps       kingdom,phylum,class,order,family,genus,species,subspecies,family common name,species author,species source,species lsid,species common name,subspecies author,subspecies source,subspecies lsid,subspecies common name
# inverts     kingdom,phylum,class,order,family,genus,species,subspecies,species author,species source,species lsid,species common name,subspecies author,subspecies source,subspecies lsid,subspecies common name
# mammalia    kingdom,phylum,class,order,family,genus,species,subspecies,family common name,species author,species source,species lsid,species common name,subspecies author,subspecies source,subspecies lsid,subspecies common name
# orthptera   kingdom,phylum,class,order,superfamily,family,genus,species,subspecies,species author,species source,species lsid,species common name,family common name,subspecies author,subspecies source,subspecies lsid,subspecies common name
# poales      kingdom,division,class,order,family,genus,species,subspecies,variety,species author,species source,species lsid,species common name,subspecies author,subspecies source,subspecies lsid,subspecies common name,variety author,variety source,variety lsid,variety common name
DISCIPLINE_TAXON_CSV_COLUMNS = {
    'ichthyology': {
        'all_columns': ['kingdom','phylum','class','order','family','genus','species','subspecies','family common name','species author','species source','species lsid','species common name','subspecies author','subspecies source','subspecies lsid','subspecies common name'],
        'taxon_ranks': [
            {'kingdom': {'kingdom': 'name'}},
            {'phylum': {'phylum': 'name'}},
            {'class': {'class': 'name'}},
            {'order': {'order': 'name'}},
            {'family': {
                'family': 'name',
                'family common name': 'commonname'}
            },
            {'genus': {'genus': 'name'}},
            {'species': {
                'species': 'name',
                'species author': 'author',
                'species source': 'source',
                'species lsid': 'lsid',
                'species common name': 'commonname'}
            },
            {'subspecies': {
                'subspecies': 'name',
                'subspecies author': 'author',
                'subspecies source': 'source',
                'subspecies lsid': 'lsid',
                'subspecies common name': 'commonname'}
            }
        ],
    },
    'herpetology': {
        'all_columns': ['kingdom','phylum','class','order','family','genus','species','subspecies','family common name','species author','species source','species lsid','species common name','subspecies author','subspecies source','subspecies lsid','subspecies common name'],
        'taxon_ranks': [
            {'kingdom': {'kingdom': 'name'}},
            {'phylum': {'phylum': 'name'}},
            {'class': {'class': 'name'}},
            {'order': {'order': 'name'}},
            {'family': {
                'family': 'name',
                'family common name': 'commonname'}
            },
            {'genus': {'genus': 'name'}},
            {'species': {
                'species': 'name',
                'species author': 'author',
                'species source': 'source',
                'species lsid': 'lsid',
                'species common name': 'commonname'}
            },
            {'subspecies': {
                'subspecies': 'name',
                'subspecies author': 'author',
                'subspecies source': 'source',
                'subspecies lsid': 'lsid',
                'subspecies common name': 'commonname'}
            }
        ],
    },
    'invertebrate': {
        'all_columns': ['kingdom','phylum','class','order','family','genus','species','subspecies','species author','species source','species lsid','species common name','subspecies author','subspecies source','subspecies lsid','subspecies common name'],
        'taxon_ranks': [
            {'kingdom': {'kingdom': 'name'}},
            {'phylum': {'phylum': 'name'}},
            {'class': {'class': 'name'}},
            {'order': {'order': 'name'}},
            {'family': {
                'family': 'name'}
            },
            {'genus': {'genus': 'name'}},
            {'species': {
                'species': 'name',
                'species author': 'author',
                'species source': 'source',
                'species lsid': 'lsid',
                'species common name': 'commonname'}
            },
            {'subspecies': {
                'subspecies': 'name',
                'subspecies author': 'author',
                'subspecies source': 'source',
                'subspecies lsid': 'lsid',
                'subspecies common name': 'commonname'}
            }
        ],
    },
    'mammology': {
        'all_columns': ['kingdom','phylum','class','order','family','genus','species','subspecies','family common name','species author','species source','species lsid','species common name','subspecies author','subspecies source','subspecies lsid','subspecies common name'],
        'taxon_ranks': [
            {'kingdom': {'kingdom': 'name'}},
            {'phylum': {'phylum': 'name'}},
            {'class': {'class': 'name'}},
            {'order': {'order': 'name'}},
            {'family': {
                'family': 'name',
                'family common name': 'commonname'}
            },
            {'genus': {'genus': 'name'}},
            {'species': {
                'species': 'name',
                'species author': 'author',
                'species source': 'source',
                'species lsid': 'lsid',
                'species common name': 'commonname'}
            },
            {'subspecies': {
                'subspecies': 'name',
                'subspecies author': 'author',
                'subspecies source': 'source',
                'subspecies lsid': 'lsid',
                'subspecies common name': 'commonname'}
            }
        ],
    },
    'entomology': {
        'all_columns': ['kingdom','phylum','class','order','superfamily','family','genus','species','subspecies','species author','species source','species lsid','species common name','family common name','subspecies author','subspecies source','subspecies lsid','subspecies common name'],
        'taxon_ranks': [
            {'kingdom': {'kingdom': 'name'}},
            {'phylum': {'phylum': 'name'}},
            {'class': {'class': 'name'}},
            {'order': {'order': 'name'}},
            {'superfamily': {'superfamily': 'name'}},
            {'family': {
                'family': 'name',
                'family common name': 'commonname'}
            },
            {'genus': {'genus': 'name'}},
            {'species': {
                'species': 'name',
                'species author': 'author',
                'species source': 'source',
                'species lsid': 'lsid',
                'species common name': 'commonname'}
            },
            {'subspecies': {
                'subspecies': 'name',
                'subspecies author': 'author',
                'subspecies source': 'source',
                'subspecies lsid': 'lsid',
                'subspecies common name': 'commonname'}
            }
        ],
    },
    'botany': {
        'all_columns': ['kingdom','division','class','order','family','genus','species','subspecies','variety','species author','species source','species lsid','species common name','subspecies author','subspecies source','subspecies lsid','subspecies common name','variety author','variety source','variety lsid','variety common name'],
        'taxon_ranks': [
            {'kingdom': {'kingdom': 'name'}},
            {'division': {'division': 'name'}},
            {'class': {'class': 'name'}},
            {'order': {'order': 'name'}},
            {'family': {
                'family': 'name'}
            },
            {'genus': {'genus': 'name'}},
            {'species': {
                'species': 'name',
                'species author': 'author',
                'species source': 'source',
                'species lsid': 'lsid',
                'species common name': 'commonname'}
            },
            {'subspecies': {
                'subspecies': 'name',
                'subspecies author': 'author',
                'subspecies source': 'source',
                'subspecies lsid': 'lsid',
                'subspecies common name': 'commonname'}
            },
            {'variety': {
                'variety': 'name',
                'variety author': 'author',
                'variety source': 'source',
                'variety lsid': 'lsid',
                'variety common name': 'commonname'}
            }
        ],
    },
}

def initialize_default_taxon_tree(taxon_tree_name, discipline_name, logged_in_discipline_name, rank_names_lst):
    """
    Initialize the default taxon tree for a given collection.
    """
    discipline = spmodels.Discipline.objects.filter(name=discipline_name).first()
    if not discipline:
        discipline = spmodels.Discipline.objects.filter(name=logged_in_discipline_name).first()
        if not discipline:
            discipline = spmodels.Discipline.objects.all().first()
    
    tree_def = None
    if spmodels.Taxontreedef.objects.filter(name=taxon_tree_name).exists():
        i = 1
        while spmodels.Taxontreedef.objects.filter(name=f"{taxon_tree_name}_{i}").exists():
            i += 1
        tree_def, _ = spmodels.Taxontreedef.objects.get_or_create(
            name=f"{taxon_tree_name}_{i}",
            discipline=discipline
        )
    else:
        tree_def = spmodels.Taxontreedef.objects.create(
            name=taxon_tree_name,
            discipline=discipline
        )
    
    tree_rank, _ = spmodels.Taxontreedefitem.objects.get_or_create(
        name="Root",
        treedef=tree_def,
        rankid=0
    )

    rank_id = 10
    for rank_name in rank_names_lst:
        spmodels.Taxontreedefitem.objects.get_or_create(
            name=rank_name,
            treedef=tree_def,
            rankid=rank_id
        )
        rank_id += 10

    tree_node, _ = spmodels.Taxon.objects.get_or_create(
        name="Root",
        fullname="Root",
        nodenumber=1,
        definition=tree_def,
        definitionitem=tree_rank,
        parent=None
    )

    tree_name = tree_def.name
    return tree_name

def add_default_taxon(row, tree_name, discipline_name):
    """
    Given one CSV row and the discipline (must match a key in DISCIPLINE_TAXON_CSV_COLUMNS),
    walk through the taxon_ranks in order, creating or updating each Taxon and linking
    it to its parent.
    """
    cfg = DISCIPLINE_TAXON_CSV_COLUMNS[discipline_name]
    tree_def = spmodels.Taxontreedef.objects.get(name=tree_name)
    parent = spmodels.Taxon.objects.get(name='Root', fullname='Root', definition=tree_def)
    rank_id = 10

    for rank_map in cfg['taxon_ranks']:
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

        treedef_item, _ = spmodels.Taxontreedefitem.objects.get_or_create(
            name=rank.capitalize(),
            treedef=tree_def,
            rankid=rank_id
        )

        taxon_obj = spmodels.Taxon.objects.filter(
            name=value,
            fullname=value,
            definition=tree_def,
            definitionitem=treedef_item,
            parent=parent,
        ).first()
        if taxon_obj is None:
            data = {
                'name': value,
                'fullname': value,
                'definition': tree_def,
                'definitionitem': treedef_item,
                'parent': parent,
                'rankid': treedef_item.rankid,
                **defaults
            }
            taxon_obj = spmodels.Taxon(**data)
            taxon_obj.save(skip_tree_extras=True)

        # if not taxon_obj and defaults:
        #     for f, v in defaults.items():
        #         setattr(taxon_obj, f, v)
        #     taxon_obj.save()

        parent = taxon_obj
        rank_id += 10

@app.task(base=LogErrorsTask, bind=True)
def create_default_trees_task(self, url: str, discipline_name: str, logged_in_discipline_name: str, rank_count: int,
                              specify_collection_id: int, specify_user_id: int):
    logger.info(f'starting task {str(self.request.id)}')

    specify_user = spmodels.Specifyuser.objects.get(id=specify_user_id)
    tree_name = discipline_name.capitalize()

    Message.objects.create(
        user=specify_user,
        content=json.dumps({
            'type': 'create-default-tree-running',
            'name': "Create_Default_Tree_" + discipline_name,
            'collection_id': specify_collection_id,
            'discipline_name': logged_in_discipline_name,
        })
    )

    def count_csv_rows(url: str) -> int:
        with requests.get(url, stream=True) as resp:
            resp.raise_for_status()
            lines = (line.decode('utf-8') for line in resp.iter_lines(decode_unicode=False))
            reader = csv.DictReader(lines)
            return sum(1 for _ in reader)

    current = 0
    total = 1
    def progress(cur: int, additional_total: int=0) -> None:
        nonlocal current, total
        current += cur
        total += additional_total
        if current > total:
            current = total
        self.update_state(state='RUNNING', meta={'current': current, 'total': total})
    
    def stream_csv_from_url(url: str, discipline_name: str, rank_count: int) -> Iterator[Dict[str, str]]:
        nonlocal tree_name
        with requests.get(url, stream=True) as resp:
            resp.raise_for_status()
            lines = (line.decode('utf-8') for line in resp.iter_lines(decode_unicode=False))
            reader = csv.DictReader(lines)

            rank_names_lst = reader.fieldnames[:rank_count]
            tree_name = initialize_default_taxon_tree(tree_name, discipline_name,
                                                      logged_in_discipline_name, rank_names_lst)
            
            for row in reader:
                yield row

    try:
        row_count = count_csv_rows(url) - 2
        progress(0, row_count)
        with transaction.atomic():
            for row in stream_csv_from_url(url, discipline_name, rank_count):
                add_default_taxon(row, tree_name, discipline_name)
                progress(1, 0)
    except requests.HTTPError:
        Message.objects.create(
            user=specify_user,
            content=json.dumps({
                'type': 'create-default-tree-failed',
                'name': "Create_Default_Tree_" + discipline_name,
                'collection_id': specify_collection_id,
                'discipline_name': logged_in_discipline_name
                # 'error': str(e)
            })
        )

    Message.objects.create(
        user=specify_user,
        content=json.dumps({
            'type': 'create-default-tree-completed',
            'name': "Create_Default_Tree_" + discipline_name,
            'collection_id': specify_collection_id,
            'discipline_name': logged_in_discipline_name,
        })
    )
from typing import Tuple, List
from django.db.models import Q, Count, Model

import specifyweb.specify.models as spmodels
from specifyweb.specify.datamodel import datamodel, Table
from specifyweb.specify.tree_extras import adding_node

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

def get_treedefs(collection: spmodels.Collection, tree_name: str) ->  List[Tuple[int, int]]:
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

# def add_default_taxon(
#     collection: spmodels.Collection,
#     tree_name: str,
#     node_name: str,
#     node_number: int,
#     rank_id: int,
#     parent_id: int = None
# )
    
#     # Get the default TreeDef for the collection
#     tree_def = get_default_treedef(tree_def_model, collection)
    
#     # Create the new TreeDefItem
#     tree_rank = tree_rank_model.objects.create(
#         name=node_name,
#         treedef=tree_def,
#         rankid=rank_id
#     )
    
#     # Create the new TreeNode
#     tree_node = tree_node_model.objects.create(
#         name=node_name,
#         nodenumber=node_number,
#         definition=tree_def,
#         definitionitem=tree_rank,
#         parent_id=parent_id
#     )
    
#     node = None
#     # adding_node(node)

# fishes      kingdom,phylum,class,order,family,genus,species,subspecies,family common name,species author,species source,species lsid,species common name,subspecies author,subspecies source,subspecies lsid,subspecies common name
# herps       kingdom,phylum,class,order,family,genus,species,subspecies,family common name,species author,species source,species lsid,species common name,subspecies author,subspecies source,subspecies lsid,subspecies common name
# inverts     kingdom,phylum,class,order,family,genus,species,subspecies,species author,species source,species lsid,species common name,subspecies author,subspecies source,subspecies lsid,subspecies common name
# mammalia    kingdom,phylum,class,order,family,genus,species,subspecies,family common name,species author,species source,species lsid,species common name,subspecies author,subspecies source,subspecies lsid,subspecies common name
# orthptera   kingdom,phylum,class,order,superfamily,family,genus,species,subspecies,species author,species source,species lsid,species common name,family common name,subspecies author,subspecies source,subspecies lsid,subspecies common name
# poales      kingdom,division,class,order,family,genus,species,subspecies,variety,species author,species source,species lsid,species common name,subspecies author,subspecies source,subspecies lsid,subspecies common name,variety author,variety source,variety lsid,variety common name
DISCIPLINE_TAXON_CSV_COLUMNS = {
    'fishes': {
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
    'herps': {
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
    'inverts': {
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
    'mammalia': {
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
    'orthoptera': {
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
    'poales': {
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

def initialize_defualt_taxon_tree(taxon_tree_name, discipline_name, rank_names_lst):
    """
    Initialize the default taxon tree for a given collection.
    """
    discipline = spmodels.Discipline.objects.filter(name=discipline_name).first()
    if not discipline:
        discipline = spmodels.Discipline.objects.all().first()
    tree_def = spmodels.TaxonTreeDef.objects.get_or_create(
        name=taxon_tree_name,
        discipline=discipline
    )
    
    tree_rank = spmodels.Taxontreedefitem.objects.get_or_create(
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

    tree_node = spmodels.Taxon.objects.get_or_create(
        name="Root",
        nodenumber=1,
        definition=tree_def,
        definitionitem=tree_rank,
        parent=None
    )

# def add_default_taxon(taxon_data, discpline_name, tree_name, taxon_tree_def, rank_count=8):
#     collection = taxon_data['collection']
#     tree_name = taxon_data['tree_name']
#     node_name = taxon_data['node_name']
#     node_number = taxon_data['node_number']
#     rank_id = taxon_data['rank_id']
#     parent_id = taxon_data.get('parent_id', None)

#     kingdom = taxon_data.get('kingdom', None)
#     phylum = taxon_data.get('phylum', None)
#     class_ = taxon_data.get('class_', None)
#     order = taxon_data.get('order', None)
#     family = taxon_data.get('family', None)
#     genus = taxon_data.get('genus', None)
#     species = taxon_data.get('species', None)
#     subspecies = taxon_data.get('subspecies', None)
#     family_common_name = taxon_data.get('family common name', None)
#     species_author = taxon_data.get('species author', None)
#     species_source = taxon_data.get('species source', None)
#     species_lsid = taxon_data.get('species lsid', None)
#     species_common_name = taxon_data.get('species common name', None)
#     subspecies_author = taxon_data.get('subspecies author', None)
#     subspecies_source = taxon_data.get('subspecies source', None)
#     subspecies_lsid = taxon_data.get('subspecies lsid', None)
#     subspecies_common_name = taxon_data.get('subspecies common name', None)
#     division = taxon_data.get('division', None)
#     superfamily = taxon_data.get('superfamily', None)
#     variety = taxon_data.get('variety', None)
#     variety_author = taxon_data.get('variety author', None)
#     variety_source = taxon_data.get('variety source', None)
#     variety_lsid = taxon_data.get('variety lsid', None)
#     variety_common_name = taxon_data.get('variety common name', None)

#     taxon_tree_def_items = taxon_tree_def.treedefitems.all()
#     rank_names = [rank.name for rank in taxon_tree_def_items]

#     # for taxon_rank_dict in discipline_columns[discpline_name]['taxon_ranks']:
#     #     for rank_name, rank_dict in taxon_rank_dict.items():
#     #         if rank in taxon_tree_def_items:
#     #             pass
                    
#     #         tree_node = spmodels.Taxon.objects.get_or_create(
#     #             name=rank_name,
#     #             nodenumber=node_number,
#     #             definition=taxon_tree_def,
#     #             definitionitem=tree_rank,
#     #             parent_id=parent_id
#     #         )

#     taxon_dict = {}
#     # for col, value in taxon_data.items():
#     #     taxon_values_dict = DISCIPLINE_TAXON_CSV_COLUMNS[discpline_name]['taxon_ranks'][col]
#     #     for col_name, field_name in taxon_values_dict.items():
#     #         if field_name in rank_names:
#     #             taxon_dict[field_name] = field_value

#     for col_name, field_name in taxon_values_dict.items():
#         if field_name in rank_names:
#             taxon_dict[field_name] = taxon_data[col_name]


#     rank_iter = 1
#     for parent_taxon_dict in DISCIPLINE_TAXON_CSV_COLUMNS[discpline_name]['taxon_ranks']:
#         parent_taxon_info = {}
#         for rank_name, fields_dict in parent_taxon_dict.items():
#             for csv_field_name, taxon_field_name in fields_dict.items():
#                 field_value = taxon_dict[csv_field_name]
#                 if field_value and field_value != '':
#                     parent_taxon_info[taxon_field_name] = field_value

#         spmodels.Taxon.objects.get_or_create(
#             name=parent_taxon_info['name'],
#             nodenumber=node_number,
#             definition=taxon_tree_def,
#             definitionitem=tree_rank,
#             parent_id=parent_id
#         )
    
#     for csv_field_name, csv_value in taxon_data.items():
#         pass

def add_default_taxon(row, discipline_name):
    """
    Given one CSV row and the discipline (must match a key in DISCIPLINE_TAXON_CSV_COLUMNS),
    walk through the taxon_ranks in order, creating or updating each Taxon and linking
    it to its parent.
    """
    cfg = DISCIPLINE_TAXON_CSV_COLUMNS[discipline_name]
    tree_def = spmodels.TaxonTreeDef.objects.get(name='Taxon')
    parent = spmodels.Taxon.objects.get(name='Root', definition=tree_def)

    for rank_map in cfg['taxon_ranks']:
        # rank_map is e.g. {'family': {'family': 'name', 'family common name': 'commonname'}}
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

        treedef_item = spmodels.Taxontreedefitem.objects.get(
            name=rank.capitalize(),
            treedef=tree_def
        )

        taxon_obj, created = spmodels.Taxon.objects.get_or_create(
            name=value,
            definition=tree_def,
            definitionitem=treedef_item,
            parent=parent,
            defaults=defaults
        )

        if not created and defaults:
            for f, v in defaults.items():
                setattr(taxon_obj, f, v)
            taxon_obj.save()

        parent = taxon_obj
            

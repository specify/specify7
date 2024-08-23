from os import name
from typing import Dict, Any, Optional, Union, Tuple
import logging

from specifyweb.specify.datamodel import datamodel, Table, Relationship

from .upload_table import DeferredScopeUploadTable, UploadTable, OneToOneTable, MustMatchTable
from .tomany import ToManyRecord
from .treerecord import TreeRank, TreeRankRecord, TreeRecord, MustMatchTreeRecord, get_tree_model
from .uploadable import Uploadable
from .column_options import ColumnOptions
from .scoping import DEFERRED_SCOPING

logger = logging.getLogger(__name__)

schema: Dict = {
    'title': 'Specify 7 Workbench Upload Plan',
    'description': 'The workbench upload plan defines how to load columnar data into the Specify datamodel.',
    "$schema": "http://json-schema.org/schema#",

    'type': 'object',
    'properties': {
        'baseTableName': { 'type': 'string' },
        'uploadable': {
            'oneOf': [
                { 'type': 'object',
                  'properties': { 'uploadTable': { '$ref': '#/definitions/uploadTable' } },
                  'required': [ 'uploadTable' ],
                  'additionalProperties': False
                },
                { 'type': 'object',
                  'properties': { 'treeRecord': { '$ref': '#/definitions/treeRecord' } },
                  'required': [ 'treeRecord' ],
                  'additionalProperties': False
                },
            ]
        },
        "treeId": {
            "oneOf": [
                { "type": "integer" },
                { "type": "null" }
            ]
        }
    },
    'required': [ 'baseTableName', 'uploadable' ],
    'additionalProperties': False,

    'definitions': {
        'uploadTable': {
            'type': 'object',
            'description': 'The uploadTable structure defines how to upload data for a given table.',
            'properties': {
                'overrideScope' : {
                    'description' : '',
                    'type' : 'object',
                    'properties': {
                        'collection' : { '$ref': '#/definitions/scopingOverride'}
                        },
                    'additionalProperties' : False,
                    },
                'wbcols': { '$ref': '#/definitions/wbcols' },
                'static': { '$ref': '#/definitions/static' },
                'toOne': { '$ref': '#/definitions/toOne' },
                'toMany': {
                    'type': 'object',
                    'desciption': 'Maps the names of -to-many relationships of the table to an array of upload definitions for each.',
                    'additionalProperties': { 'type': 'array', 'items': { '$ref': '#/definitions/toManyRecord' } }
                }
            },
            'required': [ 'wbcols', 'static', 'toOne', 'toMany' ],
            'additionalProperties': False
        },

        'toManyRecord': {
            'type': 'object',
            'description': 'The toManyRecord structure defines how to upload data for one record into a given table that stands '
            'in a many-to-one relationship to another.',
            'properties': {
                'wbcols': { '$ref': '#/definitions/wbcols' },
                'static': { '$ref': '#/definitions/static' },
                'toOne': { '$ref': '#/definitions/toOne' },
            },
            'required': [ 'wbcols', 'static', 'toOne' ],
            'additionalProperties': False
        },

        'treeRecord': {
            'type': 'object',
            'description': 'The treeRecord structure defines how to upload data into Specify tree type table.',
            'properties': {
                'ranks': {
                    'type': 'object',
                    'description': 'Maps the ranks of the tree to the headers of the source columns of input data.',
                    'additionalProperties': {
                        'oneOf': [
                            { 'type': 'string' },
                            {
                                'type': 'object',
                                'properties': {
                                    'treeNodeCols': { '$ref': '#/definitions/treeNodeCols' },
                                    'treeId': { '$ref': '#definitions/treeId'}
                                },
                                'required': [ 'treeNodeCols' ],
                                'additionalProperties': False
                            }
                        ]
                    },
                    'examples': [
                        {'Continent': 'Continent/Ocean', 'Country': 'Country', 'State': 'State/Prov/Pref', 'County': 'Region'},
                        {"Class": "Class", "Superfamily": "Superfamily", "Family": "Family", "Genus": "Genus", "Subgenus": "Subgenus", "Species": "Species", "Subspecies": "Subspecies"}
                    ]
                },
            },
            'required': [ 'ranks' ],
            'additionalProperties': False
        },

        'uploadable': {
            'description': 'The uploadable structure differentiates among types of uploadable data structures which can be either '
            'the base structure for uploading data or stand in a -to-one relationship to another uploadable structure. Currently only '
            'uploadTable or treeRecord.',
            'oneOf': [
                { 'type': 'object',
                  'properties': { 'uploadTable': { '$ref': '#/definitions/uploadTable' } },
                  'required': [ 'uploadTable' ],
                  'additionalProperties': False
                },
                { 'type': 'object',
                  'properties': { 'oneToOneTable': { '$ref': '#/definitions/uploadTable' } },
                  'required': [ 'oneToOneTable' ],
                  'additionalProperties': False
                },
                { 'type': 'object',
                  'properties': { 'mustMatchTable': { '$ref': '#/definitions/uploadTable' } },
                  'required': [ 'mustMatchTable' ],
                  'additionalProperties': False
                },
                { 'type': 'object',
                  'properties': { 'treeRecord': { '$ref': '#/definitions/treeRecord' } },
                  'required': [ 'treeRecord' ],
                  'additionalProperties': False
                },
                { 'type': 'object',
                  'properties': { 'mustMatchTreeRecord': { '$ref': '#/definitions/treeRecord' } },
                  'required': [ 'mustMatchTreeRecord' ],
                  'additionalProperties': False
                },
            ],
        },

        'treeId': {
            "oneOf": [
                { "type": "integer" },
                { "type": "null" }
            ]
        },

        'wbcols': {
            'type': 'object',
            'description': 'Maps the columns of the destination table to the headers of the source columns of input data.',
            'additionalProperties': { 'oneOf': [ { 'type': 'string' }, { '$ref': '#/definitions/columnOptions' } ] },
            'examples': [
                {'catalognumber': 'Specimen #', 'catalogeddate': 'Recored Date', 'objectcondition': 'Condition'},
                {'lastname': 'Collector 1 Last Name', 'firstname': 'Collector 1 First Name'},
            ]
        },

        'treeNodeCols': {
            'type': 'object',
            'description': 'Maps the columns of the destination tree table to the headers of the source columns of input data.',
            'required': ['name'],
            'properties': {
                'nodenumber': False,
                'highestchildnodenumber': False,
                'rankid': False,
            },
            'additionalProperties': { 'oneOf': [ { 'type': 'string' }, { '$ref': '#/definitions/columnOptions' } ] },
            'examples': [
                {'name': 'Species', 'author': 'Species Author'},
            ]
        },

        'columnOptions': {
            'type': 'object',
            'properties': {
                'column': { 'type': 'string', 'description': 'The column header of the source data.' },
                'matchBehavior': {
                    'type': 'string',
                    'enum': ['ignoreWhenBlank', 'ignoreAlways', 'ignoreNever'],
                    'default': 'ignoreNever',
                    'description': '''When set to ignoreWhenBlank blank values in this column will not be considered for matching purposes.
Blank values are ignored when matching even if a default values is provided. When set to ignoreAlways the value in
this column will never be considered for matching purposes, only for uploading.'''
                },
                'nullAllowed': {
                    'type': 'boolean',
                    'default': True,
                    'description': 'If set to false rows that would result in null values being uploaded for this column will be rejected.'
                },
                'default': {
                    'type': ['string', 'null'],
                    'default': None,
                    'description': 'When set use this value for any cells that are empty in this column.'
                }
            },
            'required': ['column'],
            'additionalProperties': False
        },

        'toOne': {
            'type': 'object',
            'description': 'Maps the names of -to-one relationships of the table to upload definitions for each.',
            'additionalProperties': { '$ref': '#/definitions/uploadable' }
        },

        'static': {
            'type': 'object',
            'description': 'A set of static values that will be added to every record loaded.',
            'examples': [
                {'ispublic': True, 'license': 'CC BY-NC-ND 2.0'}
            ]
        },
        'scopingOverride' : {
            'description' : '',
            'default' : None,
            'oneOf' : [ {'type': 'integer'},
                        {'type': 'null'}]
        }
    }
}


def parse_plan_with_basetable(collection, to_parse: Dict) -> Tuple[Table, Uploadable]:
    base_table = datamodel.get_table_strict(to_parse['baseTableName'])
    extra = {}
    if 'treeId' in to_parse.keys():
        extra['treedefid'] = to_parse['treeId']
    return base_table, parse_uploadable(collection, base_table, to_parse['uploadable'], extra)

def parse_plan(collection, to_parse: Dict) -> Uploadable:
    return parse_plan_with_basetable(collection, to_parse)[1]

def parse_uploadable(collection, table: Table, to_parse: Dict, extra: Dict = {}) -> Uploadable:
    if 'uploadTable' in to_parse:
        return parse_upload_table(collection, table, to_parse['uploadTable'], extra)

    if 'oneToOneTable' in to_parse:
        return OneToOneTable(*parse_upload_table(collection, table, to_parse['oneToOneTable']))

    if 'mustMatchTable' in to_parse:
        return MustMatchTable(*parse_upload_table(collection, table, to_parse['mustMatchTable']))

    if 'mustMatchTreeRecord' in to_parse:
        return MustMatchTreeRecord(*parse_tree_record(collection, table, to_parse['mustMatchTreeRecord']))

    if 'treeRecord' in to_parse:
        treedefid = None
        if 'treedefid' in extra.keys():
            treedefid = int(extra['treedefid'])
        return parse_tree_record(collection, table, to_parse['treeRecord'], treedefid)

    raise ValueError('unknown uploadable type')

def parse_upload_table(collection, table: Table, to_parse: Dict, extra: Dict = {}) -> UploadTable:

    def rel_table(key: str) -> Table:
        return datamodel.get_table_strict(table.get_relationship(key).relatedModelName)
    
    def defer_scope_upload_table(default_collection, table: Table, to_parse: Dict, deferred_information: Tuple[str, str]) -> DeferredScopeUploadTable:
        related_key = DEFERRED_SCOPING[deferred_information][0]
        filter_field = DEFERRED_SCOPING[deferred_information][1]
        relationship_name = DEFERRED_SCOPING[deferred_information][2]
        
        return DeferredScopeUploadTable(
            name=table.django_name,
            related_key=related_key,
            relationship_name=relationship_name,
            filter_field=filter_field,
            overrideScope= to_parse['overrideScope'] if 'overrideScope' in to_parse.keys() else None,
            wbcols={k: parse_column_options(v) for k,v in to_parse['wbcols'].items()},
            static=to_parse['static'],
            toOne={
                key: defer_scope_upload_table(collection, rel_table(key), to_one, (table.django_name, key)) 
                    if (table.django_name, key) in DEFERRED_SCOPING.keys()
                    else parse_uploadable(collection, rel_table(key), to_one)
                    for key, to_one in to_parse['toOne'].items()
            },
            toMany={
                key: [parse_to_many_record(default_collection, rel_table(key), records) for record in to_manys]
                for key, to_manys in to_parse['toMany'].items()
            } 
        )

    return UploadTable(
        name=table.django_name,
        overrideScope= to_parse['overrideScope'] if 'overrideScope' in to_parse.keys() else None,
        wbcols={k: parse_column_options(v) for k,v in to_parse['wbcols'].items()},
        static=to_parse['static'],
        toOne={
            key: defer_scope_upload_table(collection, rel_table(key), to_one['uploadTable'], (table.django_name, key)) 
                if (table.django_name, key) in DEFERRED_SCOPING.keys()
                else parse_uploadable(collection, rel_table(key), to_one)
                for key, to_one in to_parse['toOne'].items()
        },
        toMany={
            key: [parse_to_many_record(collection, rel_table(key), record, extra) for record in to_manys]
            for key, to_manys in to_parse['toMany'].items()
        }
    )

def parse_tree_record(collection, table: Table, to_parse: Dict, base_treedefid: Optional[int] = None) -> TreeRecord:
    ranks: Dict[Union[str, TreeRankRecord], Dict[str, ColumnOptions]] = {}
    for rank, name_or_cols in to_parse['ranks'].items():
        treedefid = None
        if isinstance(name_or_cols, str):
            rank_name = name_or_cols
            parsed_cols = {'name': parse_column_options(name_or_cols)}
        else:
            tree_node_cols = {k: parse_column_options(v) for k, v in name_or_cols['treeNodeCols'].items()}
            rank_name = name_or_cols['treeNodeCols']['name']
            parsed_cols = tree_node_cols
            if 'treeId' in name_or_cols:
                treedefid = name_or_cols['treeId']

        # if treedefid is None:
        #     treedefid = get_treedef_id(rank_name, table.name, False, base_treedefid)
        tree_rank_record = TreeRank(rank_name, table.name, treedefid, base_treedefid).tree_rank_record()
        ranks[tree_rank_record] = parsed_cols
        if not isinstance(name_or_cols, str): # TODO: Make better
            to_parse['ranks'][rank]['treeId'] = tree_rank_record.treedef_id

        if base_treedefid is None:
            base_treedefid = tree_rank_record.treedef_id

    for rank, cols in ranks.items():
        assert 'name' in cols, to_parse

    # if base_treedefid is None:
    #     for tree_rank_record, cols in ranks.items(): # type: ignore
    #         # treedefid = get_treedef_id(cols['name'].column, table.name, False, base_treedefid)
    #         treedefid = 
    #         if treedefid is not None:
    #             base_treedefid = treedefid
    #             break

    return TreeRecord(
        name=table.django_name,
        ranks=ranks,
        base_treedef_id=base_treedefid
    )

# def find_treedef(rank_name: str, tree: str, treedef_id: Optional[int] = None, is_adjusting: bool = False):
#     tree_model = get_tree_model(tree)
#     filter_kwargs = {'name': rank_name}
#     if treedef_id is not None:
#         filter_kwargs['treedef_id'] = treedef_id # type: ignore
#     ranks = tree_model.objects.filter(**filter_kwargs)
#     if ranks.count() == 0:
#         return None
#     elif ranks.count() > 1 and is_adjusting and treedef_id is not None:
#         raise ValueError(f"Multiple treedefitems with name {rank_name} and treedef_id {treedef_id}")

#     first_rank = ranks.first()
#     if first_rank is None:
#         return None

#     return first_rank.treedef

# def get_treedef_id_old(
#     rank_name: str, tree: str, is_adjusting: bool, base_treedef_id: Optional[int] = None
# ) -> Optional[int]:
#     for treedef_id in [base_treedef_id, None]:
#         treedef = find_treedef(rank_name, tree, treedef_id, is_adjusting)
#         if treedef:
#             return treedef.id

#     if is_adjusting:
#         raise ValueError(f"Could not find treedefitem with name {rank_name}")
#     return None

# def get_treedef_id(
#     rank_name: str, tree: str, is_adjusting: bool, base_treedef_id: Optional[int] = None
# ) -> Optional[int]:
#     treedef = find_treedef(rank_name, tree, base_treedef_id, False)
    
#     if treedef is None:
#         treedef = find_treedef(rank_name, tree, None, is_adjusting)

#     if is_adjusting:
#         raise ValueError(f"Could not find treedefitem with name {rank_name}")
#     return None

# def adjust_upload_plan(plan: Dict, collection) -> Dict:
#     if (
#         "uploadable" not in plan
#         or "treeRecord" not in plan["uploadable"]
#         or "ranks" not in plan["uploadable"]["treeRecord"]
#     ):
#         return plan

#     base_table = datamodel.get_table_strict(plan['baseTableName'])
#     uploadable = parse_uploadable(collection, base_table, plan['uploadable'])
#     tree_table_name = plan['uploadable']['uploadTable']['toMany']
    
#     # determinations = plan['uploadable']['uploadTable']['toMany']['determinations']
#     # for determination in determinations:
#     tree = plan['uploadable']['uploadTable']['toMany']['determinations'][0]['toOne'].keys()[0]
    
#     base_treedef_id = plan.get('treeId', None)
#     tree = 'Taxon' # tree = plan['uploadable']
#     for rank, name_or_cols in plan['uploadable']['treeRecord']['ranks'].items():
#         if isinstance(name_or_cols, dict):
#             rank_name = name_or_cols['treeNodeCols']['name']
#             if 'treedefid' not in name_or_cols:
#                 # name_or_cols['treeId'] = get_treedef_id(rank_name, tree, True, base_treedef_id)
#                 name_or_cols['treeId'] = TreeRank(rank_name, tree, None, base_treedef_id).treedef_id

#     return plan

def adjust_upload_plan(plan: Dict, collection):
    base_table = datamodel.get_table_strict(plan['baseTableName'])
    extra = {}
    if 'treeId' in plan.keys():
        extra['treedefid'] = plan['treeId']
    
    if 'treeRecord' in plan:
        treedefid = None
        if 'treedefid' in extra.keys():
            treedefid = int(extra['treedefid'])

    for rank, name_or_cols in plan['ranks'].items():
        treedefid = None
        if not isinstance(name_or_cols, str):
            tree_node_cols = {k: parse_column_options(v) for k, v in name_or_cols['treeNodeCols'].items()}
            rank_name = name_or_cols['treeNodeCols']['name']
            parsed_cols = tree_node_cols
            if 'treeId' in name_or_cols:
                treedefid = name_or_cols['treeId']
                # tree_rank_record = TreeRank(rank, table.name, treedefid, base_treedefid).tree_rank_record()
                # plan['ranks'][rank]['treeId'] = tree_rank_record.treedef_id

    return plan
    

def parse_to_many_record(collection, table: Table, to_parse: Dict, extra: Dict = {}) -> ToManyRecord:

    def rel_table(key: str) -> Table:
        return datamodel.get_table_strict(table.get_relationship(key).relatedModelName)

    return ToManyRecord(
        name=table.django_name,
        wbcols={k: parse_column_options(v) for k,v in to_parse['wbcols'].items()},
        static=to_parse['static'],
        toOne={
            key: parse_uploadable(collection, rel_table(key), to_one, extra)
            for key, to_one in to_parse['toOne'].items()
        },
    )

def parse_column_options(to_parse: Union[str, Dict]) -> ColumnOptions:
    if isinstance(to_parse, str):
        return ColumnOptions(
            column=to_parse,
            matchBehavior="ignoreNever",
            nullAllowed=True,
            default=None,
        )
    else:
        return ColumnOptions(
            column=to_parse['column'],
            matchBehavior=to_parse.get('matchBehavior', "ignoreNever"),
            nullAllowed=to_parse.get('nullAllowed', True),
            default=to_parse.get('default', None),
        )

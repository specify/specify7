from typing import Dict, Any, Union

from specifyweb.specify.datamodel import datamodel, Table, Relationship
from specifyweb.specify.load_datamodel import DoesNotExistError
from specifyweb.specify import models

from .upload_table import UploadTable, OneToOneTable, MustMatchTable
from .tomany import ToManyRecord
from .treerecord import TreeRecord
from .data import Uploadable

schema = {
    'title': 'Specify 7 Workbench Upload Plan',
    'description': 'The workbench upload plan defines how to load columnar data into the Specify datamodel.',
    "$schema": "http://json-schema.org/schema#",

    'type': 'object',
    'properties': {
        'baseTableName': { 'type': 'string' },
        'uploadable': { '$ref': '#/definitions/uploadable' },
    },
    'required': [ 'baseTableName', 'uploadable' ],
    'additionalProperties': False,

    'definitions': {
        'uploadTable': {
            'type': 'object',
            'description': 'The uploadTable structure defines how to upload data for a given table.',
            'properties': {
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
                    'additionalProperties': { 'type': 'string' },
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
            'type': 'object',
            'description': 'The uploadable structure differentiates among types of uploadable data structures which can be either '
            'the base structure for uploading data or stand in a -to-one relationship to another uploadable structure. Currently only '
            'uploadTable or treeRecord.',
            'patternProperties': {
                '^uploadTable$': { '$ref': '#/definitions/uploadTable' },
                '^oneToOneTable$': { '$ref': '#/definitions/uploadTable' },
                '^mustMatchTable$': { '$ref': '#/definitions/uploadTable' },
                '^treeRecord$': { '$ref': '#/definitions/treeRecord' },
            },
            'additionalProperties': False
        },

        'wbcols': {
            'type': 'object',
            'description': 'Maps the columns of the destination table to the headers of the source columns of input data.',
            'additionalProperties': { 'type': 'string' },
            'examples': [
                {'catalognumber': 'Specimen #', 'catalogeddate': 'Recored Date', 'objectcondition': 'Condition'},
                {'lastname': 'Collector 1 Last Name', 'firstname': 'Collector 1 First Name'},
            ]
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
    }
}


def parse_plan(collection, to_parse: Dict) -> Uploadable:
    base_table = datamodel.get_table_strict(to_parse['baseTableName'])
    return parse_uploadable(collection, base_table, to_parse['uploadable'])


def parse_uploadable(collection, table: Table, to_parse: Dict) -> Uploadable:
    if 'uploadTable' in to_parse:
        return parse_upload_table(collection, table, to_parse['uploadTable'])

    if 'oneToOneTable' in to_parse:
        return OneToOneTable(*parse_upload_table(collection, table, to_parse['oneToOneTable']))

    if 'mustMatchTable' in to_parse:
        return MustMatchTable(*parse_upload_table(collection, table, to_parse['mustMatchTable']))

    if 'treeRecord' in to_parse:
        return parse_tree_record(collection, table, to_parse['treeRecord'])

    raise ValueError('unknown uploadable type')

def parse_upload_table(collection, table: Table, to_parse: Dict) -> UploadTable:

    def rel_table(key: str) -> Table:
        return datamodel.get_table_strict(table.get_relationship(key).relatedModelName)

    return UploadTable(
        name=table.django_name,
        wbcols=to_parse['wbcols'],
        static=to_parse['static'],
        toOne={
            key: parse_uploadable(collection, rel_table(key), to_one)
            for key, to_one in to_parse['toOne'].items()
        },
        toMany={
            key: [parse_to_many_record(collection, rel_table(key), record) for record in to_manys]
            for key, to_manys in to_parse['toMany'].items()
        }
    )

def parse_tree_record(collection, table: Table, to_parse: Dict) -> TreeRecord:
    return TreeRecord(
        name=table.django_name,
        ranks=to_parse['ranks'],
    )

def parse_to_many_record(collection, table: Table, to_parse: Dict) -> ToManyRecord:

    def rel_table(key: str) -> Table:
        return datamodel.get_table_strict(table.get_relationship(key).relatedModelName)

    return ToManyRecord(
        name=table.django_name,
        wbcols=to_parse['wbcols'],
        static=to_parse['static'],
        toOne={
            key: parse_uploadable(collection, rel_table(key), to_one)
            for key, to_one in to_parse['toOne'].items()
        },
    )

from typing import Dict

from .upload_table import UploadTable
from .tomany import ToManyRecord
from .treerecord import TreeRecord
from .data import Uploadable

schema = {
    'title': 'Specify 7 Workbench Upload Plan',
    'description': 'The workbench upload plan defines how to load columnar data into the Specify datamodel.',
    "$schema": "http://json-schema.org/schema#",

    '$ref': '#/definitions/uploadable',

    'definitions': {
        'uploadTable': {
            'type': 'object',
            'description': 'The uploadTable structure defines how to upload data for a given table.',
            'properties': {
                'name' : {
                    'type': 'string',
                    'description': 'The name of the Specify table the data is to be loaded into.',
                    'examples': ['Collectionobject', 'Collectingevent', 'Agent']
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
            'required': [ 'name', 'wbcols', 'static', 'toOne', 'toMany' ],
            'additionalProperties': False
        },

        'toManyRecord': {
            'type': 'object',
            'description': 'The toManyRecord structure defines how to upload data for one record into a given table that stands '
            'in a many-to-one relationship to another.',
            'properties': {
                'name' : {
                    'type': 'string',
                    'description': 'The name of the Specify table the data is to be loaded into. '
                    'This value must be the same for every element of a toMany array.',
                    'examples': ['Collectionobject', 'Collectingevent', 'Agent']
                },
                'wbcols': { '$ref': '#/definitions/wbcols' },
                'static': { '$ref': '#/definitions/static' },
                'toOne': { '$ref': '#/definitions/toOne' },
            },
            'required': [ 'name', 'wbcols', 'static', 'toOne' ],
            'additionalProperties': False
        },

        'treeRecord': {
            'type': 'object',
            'description': 'The treeRecord structure defines how to upload data into Specify tree type table.',
            'properties': {
                'name' : {
                    'type': 'string',
                    'description': 'The name of the Specify tree table the data is to be loaded into.',
                    'examples': ['Taxon', 'Geography', 'Storage']
                },
                'treedefname': {
                    'type': 'string',
                    'description': 'The name of the Specify tree definition table for this tree.',
                    'examples': ['Taxontreedef', 'Geographytreedef', 'Storagetreedef']
                },
                'treedefid': {
                    'type': 'integer',
                    'description': 'The row id of the row in the Specify tree definition table for the definition of this tree.'
                },
                'ranks': {
                    'type': 'object',
                    'description': 'Maps the ranks of the tree to the headers of the source columns of input data.',
                    'additionalProperties': { 'type': 'string' },
                    'examples': [
                        {"Continent/Ocean": "Continent", "Country": "Country", "State/Prov/Pref": "State", "Region": "County"},
                        {"Class": "Class", "Superfamily": "Superfamily", "Family": "Family", "Genus": "Genus", "Subgenus": "Subgenus", "Species": "Species", "Subspecies": "Subspecies"}
                    ]
                },
            },
            'required': [ 'name', 'treedefname', 'treedefid', 'ranks' ],
            'additionalProperties': False
        },

        'uploadable': {
            'type': 'object',
            'description': 'The uploadable structure differentiates among types of uploadable data structures which can be either '
            'the base structure for uploading data or stand in a -to-one relationship to another uploadable structure. Currently only '
            'uploadTable or treeRecord.',
            'patternProperties': {
                '^uploadTable$': { '$ref': '#/definitions/uploadTable' },
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


def parse_uploadable(to_parse: Dict) -> Uploadable:
    if 'uploadTable' in to_parse:
        return parse_upload_table(to_parse['uploadTable'])

    if 'treeRecord' in to_parse:
        return parse_tree_record(to_parse['treeRecord'])

    raise ValueError('unknown uploadable type')

def parse_upload_table(to_parse: Dict) -> UploadTable:
    d = dict(to_parse)
    d['toOne'] = {
        key: parse_uploadable(to_one)
        for key, to_one in to_parse['toOne'].items()
    }
    d['toMany'] = {
        key: [parse_to_many_record(record) for record in to_manys]
        for key, to_manys in to_parse['toMany'].items()
    }
    return UploadTable(**d)

def parse_tree_record(to_parse: Dict) -> TreeRecord:
    return TreeRecord(**to_parse)

def parse_to_many_record(to_parse: Dict) -> ToManyRecord:
    d = dict(to_parse)
    d['toOne'] = {
        key: parse_uploadable(to_one)
        for key, to_one in to_parse['toOne'].items()
    }
    return ToManyRecord(**d)

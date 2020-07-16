from typing import Dict

from .upload_table import UploadTable
from .tomany import ToManyRecord
from .treerecord import TreeRecord
from .data import Uploadable

schema = {
    "$schema": "http://json-schema.org/schema#",

    '$ref': '#/definitions/uploadable',

    'definitions': {
        'uploadTable': {
            'type': 'object',
            'properties': {
                'name' : { 'type': 'string' },
                'wbcols': { 'type': 'object', 'additionalProperties': { 'type': 'string' } },
                'static': { 'type': 'object' },
                'toOne': { 'type': 'object', 'additionalProperties': { '$ref': '#/definitions/uploadable' } },
                'toMany': {
                    'type': 'object',
                    'additionalProperties': { 'type': 'array', 'items': { '$ref': '#/definitions/toManyRecord' } }
                }
            },
            'required': [ 'name', 'wbcols', 'static', 'toOne', 'toMany' ],
            'additionalProperties': False
        },

        'toManyRecord': {
            'type': 'object',
            'properties': {
                'name' : { 'type': 'string' },
                'wbcols': { 'type': 'object', 'additionalProperties': { 'type': 'string' } },
                'static': { 'type': 'object' },
                'toOne': { 'type': 'object', 'additionalProperties': { '$ref': '#/definitions/uploadable' } },
            },
            'required': [ 'name', 'wbcols', 'static', 'toOne' ],
            'additionalProperties': False
        },

        'treeRecord': {
            'type': 'object',
            'properties': {
                'name' : { 'type': 'string' },
                'treedefname': { 'type': 'string' },
                'treedefid': { 'type': 'integer' },
                'ranks': { 'type': 'object', 'additionalProperties': { 'type': 'string' } },
            },
            'required': [ 'name', 'treedefname', 'treedefid', 'ranks' ],
            'additionalProperties': False
        },

        'uploadable': {
            'type': 'object',
            'patternProperties': {
                '^uploadTable$': { '$ref': '#/definitions/uploadTable' },
                '^treeRecord$': { '$ref': '#/definitions/treeRecord' },
            },
            'additionalProperties': False
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

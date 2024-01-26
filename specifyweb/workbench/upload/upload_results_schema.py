

schema = {
    'title': 'Specify 7 Workbench Upload Results',
    'descriptions': 'Records results of uploading a data set.',
    "$schema": "http://json-schema.org/schema#",

    'type': 'array',
    'items': { '$ref': '#/definitions/UploadResult' },

    'definitions': {

        'UploadResult': {
            'type': 'object',
            'properties': {
                'UploadResult': {
                    'type': 'object',
                    'properties': {
                        'record_result': { '$ref': '#/definitions/RecordResult' },
                        'toOne': {
                            'type': 'object',
                            'description': 'Maps the names of -to-one relationships of the table to upload results for each.',
                            'additionalProperties': { '$ref': '#/definitions/UploadResult' }
                        },
                        'toMany': {
                            'type': 'object',
                            'desciption': 'Maps the names of -to-many relationships of the table to an array of upload results for each.',
                            'additionalProperties': { 'type': 'array', 'items': { '$ref': '#/definitions/UploadResult' } }
                        }
                    },
                    'required': ['record_result', 'toOne', 'toMany'],
                    'additionalProperties': False
                }
            },
            'required': ['UploadResult'],
            'additionalProperties': False
        },

        'RecordResult': {
            'description': "Records the specific result of attempting to upload a particular record.",
            'oneOf': [
                { '$ref': '#/definitions/ParseFailures' },
                { '$ref': '#/definitions/NoMatch' },
                { '$ref': '#/definitions/FailedBusinessRule' },
                { '$ref': '#/definitions/NullRecord' },
                { '$ref': '#/definitions/MatchedMultiple' },
                { '$ref': '#/definitions/Matched' },
                { '$ref': '#/definitions/Uploaded' },
                { '$ref': '#/definitions/PropagatedFailure' },
            ]
        },

        'PropagatedFailure': {
            'type': 'object',
            'desciption': 'Indicates failure due to a failure to upload a related record.',
            'properties': {
                'PropagatedFailure': {
                    'type': 'object',
                    'additionalProperties': False
                }
            },
            'required': ['PropagatedFailure'],
            'additionalProperties': False
        },

        'ParseFailures': {
            'type': 'object',
            'desciption': 'Indicates one or more values were invalid, preventing a record from uploading.',
            'properties': {
                'ParseFailures': {
                    'type': 'object',
                    'properties': {
                        'failures': {
                            'type': 'array',
                            'items': {
                                'type': 'array',
                                'items': [
                                    { 'type': 'string', 'description': 'Description of the issue.' },
                                    {
                                        'type': 'object',
                                        'description': 'Dynamic arguments for the message. Differ depending on the message. Will be injected by front-end into localized string',
                                        'additionalProperties': True
                                    },
                                    { 'type': 'string', 'description': 'The dataset column name.' },
                                ],
                            }
                        }
                    },
                    'required': ['failures'],
                    'additionalProperties': False
                }
            },
            'required': ['ParseFailures'],
            'additionalProperties': False
        },

        'NoMatch': {
            'type': 'object',
            'desciption': 'Indicates failure due to inability to find an expected existing matching record.',
            'properties': {
                'NoMatch': {
                    'type': 'object',
                    'properties': {
                        'info': { '$ref': '#/definitions/ReportInfo' }
                    },
                    'required': ['info'],
                    'additionalProperties': False
                }
            },
            'required': ['NoMatch'],
            'additionalProperties': False
        },

        'FailedBusinessRule': {
            'type': 'object',
            'desciption': 'Indicates a record failed to upload due to a business rule violation.',
            'properties': {
                'FailedBusinessRule': {
                    'type': 'object',
                    'properties': {
                        'message': { 'type': 'string', 'description': 'The code of the error message. Code is resolved to localized string by front-end.' },
                        'payload': {
                            'type': 'object',
                            'description': 'Dynamic arguments for the message. Differ depending on the message. Will be injected by front-end into localized string',
                            'additionalProperties': True
                        },
                        'info': { '$ref': '#/definitions/ReportInfo' }
                    },
                    'required': ['message', 'info'],
                    'additionalProperties': False
                }
            },
            'required': ['FailedBusinessRule'],
            'additionalProperties': False
        },

        'NullRecord': {
            'type': 'object',
            'desciption': 'Indicates that no record was uploaded because all relevant columns in the data set are empty.',
            'properties': {
                'NullRecord': {
                    'type': 'object',
                    'properties': {
                        'info': { '$ref': '#/definitions/ReportInfo' }
                    },
                    'required': ['info'],
                    'additionalProperties': False
                }
            },
            'required': ['NullRecord'],
            'additionalProperties': False
        },

        'MatchedMultiple': {
            'type': 'object',
            'desciption': 'Indicates failure due to finding multiple matches to existing records.',
            'properties': {
                'MatchedMultiple': {
                    'type': 'object',
                    'properties': {
                        'ids': { 'type': 'array', 'description': 'List of ids of the matching database records.', 'items': { 'type': 'integer' } },
                        'key': { 'type': 'string', 'description': 'Allows disambiguation to be applied to multiple records.' },
                        'info': { '$ref': '#/definitions/ReportInfo' }
                    },
                    'required': ['ids', 'key', 'info'],
                    'additionalProperties': False
                }
            },
            'required': ['MatchedMultiple'],
            'additionalProperties': False
        },

        'Matched': {
            'type': 'object',
            'desciption': 'Indicates that an existing record in the database was matched.',
            'properties': {
                'Matched': {
                    'type': 'object',
                    'properties': {
                        'id': { 'type': 'integer', 'description': 'The id of the matched database row.' },
                        'info': { '$ref': '#/definitions/ReportInfo' }
                    },
                    'required': ['id', 'info'],
                    'additionalProperties': False
                }
            },
            'required': ['Matched'],
            'additionalProperties': False
        },

        'Uploaded': {
            'type': 'object',
            'desciption': 'Indicates that a new row was added to the database.',
            'properties': {
                'Uploaded': {
                    'type': 'object',
                    'properties': {
                        'id': { 'type': 'integer', 'description': 'The database id of the added row.' },
                        'picklistAdditions': {
                            'type': 'array',
                            'items': { '$ref': '#definitions/PicklistAddition' }
                        },
                        'info': { '$ref': '#/definitions/ReportInfo' },
                    },
                    'required': ['id', 'info', 'picklistAdditions'],
                    'additionalProperties': False
                }
            },
            'required': ['Uploaded'],
            'additionalProperties': False
        },

        'PicklistAddition': {
            'type': 'object',
            'desciption': 'Indicates that a value had to be added to a picklist in the course of uploading a record.',
            'properties': {
                'id': { 'type': 'integer', 'description': 'The new picklistitem id.' },
                'name': { 'type': 'string', 'description': 'The name of the picklist receiving the new item.' },
                'value': { 'type': 'string', 'description': 'The value of the new item.' },
                'caption': { 'type': 'string', 'description': 'The data set column that produced the new item.' }
            },
            'required': ['id', 'name', 'value', 'caption'],
            'additionalProperties': False
        },

        'ReportInfo': {
            'type': 'object',
            'desciption': 'Records metadata about an UploadResult indicating the tables, data set columns, and any tree information involved.',
            'properties': {
                'tableName': { 'type': 'string', 'description': 'The name of the table a record relates to.' },
                'columns': { 'type': 'array', 'description': 'The columns from the data set a record relates to.', 'items': { 'type': 'string' } },
                'treeInfo': { 'oneOf': [ { '$ref': '#definitions/TreeInfo' }, { 'type': 'null' } ] }
            },
            'required': ['tableName', 'columns', 'treeInfo'],
            'additionalProperties': False
        },

        'TreeInfo': {
            'type': 'object',
            'desciption': 'If an UploadResult involves a tree record, this metadata indicates where in the tree the record resides.',
            'properties': {
                'rank': { 'type': 'string', 'description': 'The tree rank a record relates to.' },
                'name': { 'type': 'string', 'description': 'The name of the tree node a record relates to.' }
            },
            'required': ['rank', 'name'],
            'additionalProperties': False
        }
    }
}

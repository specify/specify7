_TAXON_TREE_GROUP_ITEM_SCHEMA = {
    'type': 'object',
    'properties': {
        'taxonTreeDefId': {
            'oneOf': [
                {'type': 'integer'},
                {'type': 'null'},
            ]
        },
        'taxonTreeName': {
            'oneOf': [
                {'type': 'string'},
                {'type': 'null'},
            ]
        },
        'collectionObjectIds': {
            'type': 'array',
            'items': {'type': 'integer'},
        },
        'catalogNumbers': {
            'type': 'array',
            'items': {'type': 'string'},
        },
        'collectionObjectTypeNames': {
            'type': 'array',
            'items': {'type': 'string'},
        },
    },
    'required': [
        'taxonTreeDefId',
        'taxonTreeName',
        'collectionObjectIds',
        'catalogNumbers',
        'collectionObjectTypeNames',
    ],
    'additionalProperties': False,
}

_ERROR_RESPONSE_SCHEMA = {
    'description': 'Invalid request payload.',
    'content': {
        'application/json': {
            'schema': {
                'type': 'object',
                'properties': {'error': {'type': 'string'}},
                'required': ['error'],
                'additionalProperties': False,
            }
        }
    },
}

BATCH_IDENTIFY_VALIDATE_RECORD_SET_OPENAPI_SCHEMA = {
    'post': {
        'requestBody': {
            'required': True,
            'content': {
                'application/json': {
                    'schema': {
                        'type': 'object',
                        'properties': {
                            'collectionObjectIds': {
                                'type': 'array',
                                'items': {'type': 'integer'},
                            }
                        },
                        'required': ['collectionObjectIds'],
                        'additionalProperties': False,
                    }
                }
            },
        },
        'responses': {
            '200': {
                'description': (
                    'Validated collection objects for Batch Identify and'
                    ' grouped them by effective taxon tree.'
                ),
                'content': {
                    'application/json': {
                        'schema': {
                            'type': 'object',
                            'properties': {
                                'collectionObjectIds': {
                                    'type': 'array',
                                    'items': {'type': 'integer'},
                                },
                                'hasMixedTaxonTrees': {'type': 'boolean'},
                                'taxonTreeGroups': {
                                    'type': 'array',
                                    'items': _TAXON_TREE_GROUP_ITEM_SCHEMA,
                                },
                            },
                            'required': [
                                'collectionObjectIds',
                                'hasMixedTaxonTrees',
                                'taxonTreeGroups',
                            ],
                            'additionalProperties': False,
                        }
                    }
                },
            },
            '400': _ERROR_RESPONSE_SCHEMA,
        },
    }
}

BATCH_IDENTIFY_RESOLVE_OPENAPI_SCHEMA = {
    'post': {
        'requestBody': {
            'required': True,
            'content': {
                'application/json': {
                    'schema': {
                        'type': 'object',
                        'properties': {
                            'catalogNumbers': {
                                'type': 'array',
                                'items': {'type': 'string'},
                            },
                            'validateOnly': {'type': 'boolean'},
                        },
                        'required': ['catalogNumbers'],
                        'additionalProperties': False,
                    }
                }
            },
        },
        'responses': {
            '200': {
                'description': (
                    'Resolved collection objects and validation details for'
                    ' catalog number input.'
                ),
                'content': {
                    'application/json': {
                        'schema': {
                            'type': 'object',
                            'properties': {
                                'collectionObjectIds': {
                                    'type': 'array',
                                    'items': {'type': 'integer'},
                                },
                                'currentDeterminationIds': {
                                    'type': 'array',
                                    'items': {'type': 'integer'},
                                },
                                'unmatchedCatalogNumbers': {
                                    'type': 'array',
                                    'items': {'type': 'string'},
                                },
                                'hasMixedTaxonTrees': {'type': 'boolean'},
                                'taxonTreeGroups': {
                                    'type': 'array',
                                    'items': _TAXON_TREE_GROUP_ITEM_SCHEMA,
                                },
                            },
                            'required': [
                                'collectionObjectIds',
                                'currentDeterminationIds',
                                'unmatchedCatalogNumbers',
                                'hasMixedTaxonTrees',
                                'taxonTreeGroups',
                            ],
                            'additionalProperties': False,
                        }
                    }
                },
            },
            '400': _ERROR_RESPONSE_SCHEMA,
        },
    }
}

BATCH_IDENTIFY_OPENAPI_SCHEMA = {
    'post': {
        'requestBody': {
            'required': True,
            'content': {
                'application/json': {
                    'schema': {
                        'type': 'object',
                        'properties': {
                            'collectionObjectIds': {
                                'type': 'array',
                                'items': {'type': 'integer'},
                            },
                            'determination': {
                                'type': 'object',
                                'additionalProperties': True,
                            },
                        },
                        'required': ['collectionObjectIds', 'determination'],
                        'additionalProperties': False,
                    }
                }
            },
        },
        'responses': {
            '200': {
                'description': (
                    'Created determination records for all selected collection'
                    ' objects.'
                ),
                'content': {
                    'application/json': {
                        'schema': {
                            'type': 'object',
                            'properties': {
                                'createdCount': {'type': 'integer'},
                                'collectionObjectIds': {
                                    'type': 'array',
                                    'items': {'type': 'integer'},
                                },
                                'determinationIds': {
                                    'type': 'array',
                                    'items': {'type': 'integer'},
                                },
                            },
                            'required': [
                                'createdCount',
                                'collectionObjectIds',
                                'determinationIds',
                            ],
                            'additionalProperties': False,
                        }
                    }
                },
            },
            '400': _ERROR_RESPONSE_SCHEMA,
        },
    }
}

from ..upload_table import UploadTable, ScopedUploadTable
from ..tomany import ToManyRecord
from ..treerecord import TreeRecord
from ..upload_plan_schema import parse_column_options

json = dict(
    baseTableName = 'Collectionobject',
    uploadable = { 'uploadTable': dict(
        wbcols = {
            'catalognumber' : "BMSM No.",
        },
        static = {},
        toMany = {
            'determinations': [
                dict(
                    wbcols = {
                        'determineddate': 'ID Date',
                    },
                    static = {
                        'iscurrent': True,
                    },
                    toOne = {
                        'determiner': { 'uploadTable': dict(
                            wbcols = {
                                'title': 'Determiner 1 Title',
                                'firstname': 'Determiner 1 First Name',
                                'middleinitial': 'Determiner 1 Middle Initial',
                                'lastname': 'Determiner 1 Last Name',
                            },
                            static = {
                                'agenttype': 1
                            },
                            toOne = {},
                            toMany = {},
                        )},
                        'taxon': { 'treeRecord': dict(
                            ranks = {
                                'Class': 'Class',
                                'Superfamily': 'Superfamily',
                                'Family': 'Family',
                                'Genus': 'Genus',
                                'Subgenus': 'Subgenus',
                                'Species': dict(
                                    treeNodeCols = {
                                        'name': 'Species',
                                        'author': 'Species Author',
                                    },
                                    treeId = 3
                                ),
                                'Subspecies': dict(
                                    treeNodeCols = {
                                        'name': 'Subspecies',
                                        'author': 'Subspecies Author',
                                    },
                                    treeId = 3
                                ),
                            }
                        )}
                    },
                ),
            ],
        },
        toOne = {
            'collectingevent': { 'uploadTable': dict(
                wbcols = {
                    'enddate' : 'End Date Collected',
                    'startdate' : 'Start Date Collected',
                    'stationfieldnumber' : 'Station No.',
                },
                static = {},
                toOne = {
                    'locality': { 'uploadTable': dict(
                        wbcols = {
                            'localityname': 'Site',
                            'latitude1': 'Latitude1',
                            'longitude1': 'Longitude1',
                        },
                        static = {'srclatlongunit': 0},
                        toOne = {
                            'geography': { 'treeRecord': dict(
                                ranks = {
                                    'Continent': 'Continent/Ocean' ,
                                    'Country': 'Country',
                                    'State': 'State/Prov/Pref',
                                    'County': 'Region',
                                }
                            )},
                        },
                        toMany = {},
                    )}
                },
                toMany = {
                    'collectors': [
                        dict(
                            wbcols = {},
                            static = {'isprimary': True, 'ordernumber': 0},
                            toOne = {
                                'agent': { 'uploadTable': dict(
                                    wbcols = {
                                        'title'          : 'Collector 1 Title',
                                        'firstname'     : 'Collector 1 First Name',
                                        'middleinitial' : 'Collector 1 Middle Initial',
                                        'lastname'      : 'Collector 1 Last Name',
                                    },
                                    static = {
                                        'agenttype': 1
                                    },
                                    toOne = {},
                                    toMany = {},
                                )}
                            }
                        ),
                        dict(
                            wbcols = {},
                            static = {'isprimary': False, 'ordernumber': 1},
                            toOne = {
                                'agent': { 'uploadTable': dict(
                                    wbcols = {
                                        'title'          : 'Collector 2 Title',
                                        'firstname'     : 'Collector 2 First Name',
                                        'middleinitial' : 'Collector 2 Middle Initial',
                                        'lastname'      : 'Collector 2 Last name',
                                    },
                                    static = {
                                        'agenttype': 1
                                    },
                                    toOne = {},
                                    toMany = {},
                                )}
                            }
                        ),
                    ]
                }
            )}
        }
    )}
)

def with_scoping(collection) -> ScopedUploadTable:
    return UploadTable(
        name = 'Collectionobject',
        wbcols = {
            'catalognumber' : parse_column_options("BMSM No."),
        },
        overrideScope=None,
        static = {},
        toMany = {
            'determinations': [
                ToManyRecord(
                    name = 'Determination',
                    wbcols = {
                        'determineddate': parse_column_options('ID Date'),
                    },
                    static = {
                        'iscurrent': True,
                    },
                    toOne = {
                        'determiner': UploadTable(
                            name = 'Agent',
                            wbcols = {
                                'title': parse_column_options('Determiner 1 Title'),
                                'firstname': parse_column_options('Determiner 1 First Name'),
                                'middleinitial': parse_column_options('Determiner 1 Middle Initial'),
                                'lastname': parse_column_options('Determiner 1 Last Name'),
                            },
                            overrideScope=None,
                            static = {'agenttype': 1},
                            toOne = {},
                            toMany = {},
                        ),
                        'taxon': TreeRecord(
                            name = 'Taxon',
                            ranks = {
                                'Class': {'name': parse_column_options('Class')},
                                'Superfamily': {'name': parse_column_options('Superfamily')},
                                'Family': {'name': parse_column_options('Family')},
                                'Genus': {'name': parse_column_options('Genus')},
                                'Subgenus': {'name': parse_column_options('Subgenus')},
                                'Species': {'name': parse_column_options('Species'), 'author': parse_column_options('Species Author')},
                                'Subspecies': {'name': parse_column_options('Subspecies'), 'author': parse_column_options('Subspecies Author')},
                            }
                        )
                    },
                ),
            ],
        },
        toOne = {
            'collectingevent': UploadTable(
                name = 'Collectingevent',
                wbcols = {
                    'enddate' : parse_column_options('End Date Collected'),
                    'startdate' : parse_column_options('Start Date Collected'),
                    'stationfieldnumber' : parse_column_options('Station No.'),
                },
                overrideScope=None,
                static = {},
                toOne = {
                    'locality': UploadTable(
                        name = 'Locality',
                        wbcols = {
                            'localityname': parse_column_options('Site'),
                            'latitude1': parse_column_options('Latitude1'),
                            'longitude1': parse_column_options('Longitude1'),
                        },
                        overrideScope=None,
                        static = {'srclatlongunit': 0},
                        toOne = {
                            'geography': TreeRecord(
                                name = 'Geography',
                                ranks = {
                                    'Continent': {'name': parse_column_options('Continent/Ocean')},
                                    'Country': {'name': parse_column_options('Country')},
                                    'State': {'name': parse_column_options('State/Prov/Pref')},
                                    'County': {'name': parse_column_options('Region')},
                                }
                            ),
                        },
                        toMany = {},
                    )
                },
                toMany = {
                    'collectors': [
                        ToManyRecord(
                            name = 'Collector',
                            wbcols = {},
                            static = {'isprimary': True, 'ordernumber': 0},
                            toOne = {
                                'agent': UploadTable(
                                    name = 'Agent',
                                    wbcols = {
                                        'title'          : parse_column_options('Collector 1 Title'),
                                        'firstname'     : parse_column_options('Collector 1 First Name'),
                                        'middleinitial' : parse_column_options('Collector 1 Middle Initial'),
                                        'lastname'      : parse_column_options('Collector 1 Last Name'),
                                    },
                                    overrideScope=None,
                                    static = {'agenttype': 1},
                                    toOne = {},
                                    toMany = {},
                                )
                            }
                        ),
                        ToManyRecord(
                            name = 'Collector',
                            wbcols = {},
                            static = {'isprimary': False, 'ordernumber': 1},
                            toOne = {
                                'agent': UploadTable(
                                    name = 'Agent',
                                    wbcols = {
                                        'title'          : parse_column_options('Collector 2 Title'),
                                        'firstname'     : parse_column_options('Collector 2 First Name'),
                                        'middleinitial' : parse_column_options('Collector 2 Middle Initial'),
                                        'lastname'      : parse_column_options('Collector 2 Last name'),
                                    },
                                    overrideScope=None,
                                    static = {'agenttype': 1},
                                    toOne = {},
                                    toMany = {},
                                )
                            }
                        ),
                    ]
                }
            ),
        },
    ).apply_scoping(collection)

from ..upload_table import UploadTable
from ..tomany import ToManyRecord
from ..treerecord import TreeRecord

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
                                'Species': 'Species',
                                'Subspecies': 'Subspecies',
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

def with_scoping(collection) -> UploadTable:
    return UploadTable(
        name = 'Collectionobject',
        wbcols = {
            'catalognumber' : "BMSM No.",
        },
        static = {},
        toMany = {
            'determinations': [
                ToManyRecord(
                    name = 'Determination',
                    wbcols = {
                        'determineddate': 'ID Date',
                    },
                    static = {
                        'iscurrent': True,
                    },
                    toOne = {
                        'determiner': UploadTable(
                            name = 'Agent',
                            wbcols = {
                                'title': 'Determiner 1 Title',
                                'firstname': 'Determiner 1 First Name',
                                'middleinitial': 'Determiner 1 Middle Initial',
                                'lastname': 'Determiner 1 Last Name',
                            },
                            static = {'agenttype': 1},
                            toOne = {},
                            toMany = {},
                        ),
                        'taxon': TreeRecord(
                            name = 'Taxon',
                            treedefid = None,
                            ranks = {
                                'Class': 'Class',
                                'Superfamily': 'Superfamily',
                                'Family': 'Family',
                                'Genus': 'Genus',
                                'Subgenus': 'Subgenus',
                                'Species': 'Species',
                                'Subspecies': 'Subspecies',
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
                    'enddate' : 'End Date Collected',
                    'startdate' : 'Start Date Collected',
                    'stationfieldnumber' : 'Station No.',
                },
                static = {},
                toOne = {
                    'locality': UploadTable(
                        name = 'Locality',
                        wbcols = {
                            'localityname': 'Site',
                            'latitude1': 'Latitude1',
                            'longitude1': 'Longitude1',
                        },
                        static = {'srclatlongunit': 0},
                        toOne = {
                            'geography': TreeRecord(
                                name = 'Geography',
                                treedefid = None,
                                ranks = {
                                    'Continent': 'Continent/Ocean' ,
                                    'Country': 'Country',
                                    'State': 'State/Prov/Pref',
                                    'County': 'Region',
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
                                        'title'          : 'Collector 1 Title',
                                        'firstname'     : 'Collector 1 First Name',
                                        'middleinitial' : 'Collector 1 Middle Initial',
                                        'lastname'      : 'Collector 1 Last Name',
                                    },
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
                                        'title'          : 'Collector 2 Title',
                                        'firstname'     : 'Collector 2 First Name',
                                        'middleinitial' : 'Collector 2 Middle Initial',
                                        'lastname'      : 'Collector 2 Last name',
                                    },
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

from .upload import UploadTable, ToManyRecord

example_plan = UploadTable(
    name = 'Collectionobject',
    wbcols = {
        "BMSM No." : 'catalognumber',
    },
    static = {'collection_id': 4},
    toMany = {},
    toOne = {
        'collectingevent': UploadTable(
            name = 'Collectingevent',
            wbcols = {
                # 'End Date Collected' : 'enddate',
                # 'Start Date Collected' : 'startdate',
                'Station No.' : 'stationfieldnumber',
            },
            static = {'discipline_id': 3},
            toOne = {},
            toMany = {
                'collectors': [
                    ToManyRecord(
                        name = 'Collector',
                        wbcols = {},
                        static = {'isprimary': True, 'ordernumber': 0, 'division_id': 2},
                        toOne = {
                            'agent': UploadTable(
                                name = 'Agent',
                                wbcols = {
                                    'Collector 1 Title'          : 'title',
                                    'Collector 1 First Name'     : 'firstname',
                                    'Collector 1 Middle Initial' : 'middleinitial',
                                    'Collector 1 Last Name'      : 'lastname',
                                },
                                static = {
                                    'agenttype': 1
                                },
                                toOne = {},
                                toMany = {},
                            )
                        }
                    ),
                    ToManyRecord(
                        name = 'Collector',
                        wbcols = {},
                        static = {'isprimary': False, 'ordernumber': 1, 'division_id': 2},
                        toOne = {
                            'agent': UploadTable(
                                name = 'Agent',
                                wbcols = {
                                    'Collector 2 Title'          : 'title',
                                    'Collector 2 First Name'     : 'firstname',
                                    'Collector 2 Middle Initial' : 'middleinitial',
                                    'Collector 2 Last name'      : 'lastname',
                                },
                                static = {
                                    'agenttype': 1
                                },
                                toOne = {},
                                toMany = {},
                            )
                        }
                    ),
                ]
            }
        ),
    },
)

# BMSM No.
# Class
# Superfamily
# Family
# Genus
# Subgenus
# Species
# Subspecies
# Species Author
# Subspecies Author
# Determiner 1 Title
# Determiner 1 First Name
# Determiner 1 Middle Initial
# Determiner 1 Last Name
# ID Date
# Country
# Date Collected
# Start Date Collected
# End Date Collected
# Collection Method
# Prep Type 1
# Accession No.
# Remarks
# Cataloged by
# DateCataloged
# Latitude1
# Latitude2
# Longitude1
# Longitude2
# Lat Long Type
# Station No.
# Collector 1 Title
# Collector 1 First Name
# Collector 1 Middle Initial
# Collector 1 Last Name
# Collector 2 Title
# Collector 2 First Name
# Collector 2 Middle Initial
# Collector 2 Last name

from django.db import models

""" Special Deletion Rules for table relationships 
    
    Of the form: base_table : { relationship: action}

    Possible Django actions (w/ django 2.2) are:
        CASCADE, PROTECT, SET_NULL, SET_DEFAULT, SET(...), DO_NOTHING

    More information can be found at django's docs here: 
    https://docs.djangoproject.com/en/2.2/ref/models/fields/#django.db.models.ForeignKey.on_delete

    See .build_models.py for uses
"""
SPECIAL_DELETION_RULES = {
    'Spappresource' : {'spreports': models.CASCADE},

    'Recordset' : {'recordsetitems' : models.CASCADE},

    'Specifyuser' : {
        'agent' : models.SET_NULL,
        'spAppResourceDirs' : models.CASCADE,
        'spAppResources': models.CASCADE,
        'spPrincipals': models.CASCADE,
        },

    # Handle workbench deletion using raw sql in business rules.
    'Workbench' : {'workbenchrow': models.DO_NOTHING},
    'Workbenchrow' : {
        'workbenchdataitem' : models.DO_NOTHING,
        'workbenchrowimage' : models.DO_NOTHING,
        'workbenchrowexportedrelationship' : models.DO_NOTHING,
    },

    # System Tables

    'Spauditlog' : {'fields' : models.CASCADE},

    'Spappresource' : {'spAppResourceDatas': models.CASCADE},
    'Spappresourcedir' : {
        'spPersistedAppResources': models.CASCADE,
        'spPersistedViewSets' : models.CASCADE,
        },
    'Spviewsetobj' : {'spAppResourceDatas' : models.CASCADE},
    
    'Splocalecontainer' : {
        'items' : models.CASCADE,
        'names' : models.CASCADE
    },
    'Splocalecontaineritem' : {
        'names' : models.CASCADE
    },
    'SpQuery' : {"fields" : models.CASCADE},
}

""" Any additional desired delete blockers 
Of the form 'base_table': ['field_1_name', 'field_2_name', ...]
Use the django attributes from the 'base_table' for field names

See .build_models.py and .views.py for uses
"""
ADDITIONAL_DELETE_BLOCKERS = {
    'Agent' : ['specifyuser'],
}

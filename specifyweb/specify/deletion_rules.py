from django.db import models

""" Special Deletion Rules for table relationships 
    
    Of the form: base_table : { field_name: action}

    Possible Django actions (w/ django 2.2) are:
        CASCADE, PROTECT, SET_NULL, SET_DEFAULT, SET(...), DO_NOTHING

    More information can be found at django's docs here: 
    https://docs.djangoproject.com/en/2.2/ref/models/fields/#django.db.models.ForeignKey.on_delete

    See .build_models.py for uses
"""
SPECIAL_DELETION_RULES = {
    'Spappresource' : {'spreport': models.CASCADE},

    'Recordset' : {'recordsetitem' : models.CASCADE},

    'Specifyuser' : {
        'agent' : models.SET_NULL,
        'spAppResourceDir' : models.CASCADE,
        'spAppResource': models.CASCADE,
        'spPrincipal': models.CASCADE,
        },

    # Handle workbench deletion using raw sql in business rules.
    'Workbench' : {'workbenchrow': models.DO_NOTHING},
    'Workbenchrow' : {
        'workbenchdataitem' : models.DO_NOTHING,
        'workbenchrowimage' : models.DO_NOTHING,
        'workbenchrowexportedrelationship' : models.DO_NOTHING,
    },

    # System Tables

    'Spauditlog' : {'field' : models.CASCADE},

    'Spappresource' : {'spAppResourceData': models.CASCADE},
    'Spappresourcedir' : {
        'spPersistedAppResource': models.CASCADE,
        'spPersistedViewSet' : models.CASCADE,
        },
    'Spviewsetobj' : {'spAppResourceData' : models.CASCADE},
    
    'Splocalecontainer' : {
        'item' : models.CASCADE,
        'name' : models.CASCADE
    },
    'Splocalecontaineritem' : {
        'name' : models.CASCADE
    },
    'SpQuery' : {"field" : models.CASCADE},
}

""" Any additional desired delete blockers 
Of the form 'base_table': ['field_1_name', 'field_2_name', ...]
Use the django attributes from the 'base_table' for field names

See .build_models.py and .views.py for uses
"""
ADDITIONAL_DELETE_BLOCKERS = {
    'Agent' : ['specifyuser'],
}

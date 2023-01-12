from django.db import models

""" Special Deletion Rules for table relationships 
    
    Of the form: base_table : { relationship: action}

    Possible Django actions (w/ django 2.2) are:
        CASCADE, PROTECT, SET_NULL, SET_DEFAULT, SET(...), DO_NOTHING

    More information can be found at django's docs here: 
    https://docs.djangoproject.com/en/2.2/ref/models/fields/#django.db.models.ForeignKey.on_delete
"""
SPECIAL_DELETION_RULES = {
    'Appresource' : {'spreport': models.CASCADE},

    'Picklist' : {'picklistitem': models.CASCADE},

    'Recordset' : {'Recordsetitem' : models.CASCADE},

    'Specifyuser' : {
        'agent' : models.SET_NULL,
        'spappresourcedir' : models.CASCADE,
        'spappresource': models.CASCADE,
        'spprincipal': models.CASCADE,
        },
        
    # Handle workbench deletion using raw sql in business rules.
    'Workbench' : {'workbenchrow': models.DO_NOTHING},
    'Workbenchrow' : {
        'workbenchdataitem' : models.DO_NOTHING,
        'workbenchrowimage' : models.DO_NOTHING,
        'workbenchrowexportedrelationship' : models.DO_NOTHING,
    },

    # System Tables

    'Spauditlog' : {'Spauditlogfield' : models.CASCADE},

    'Spappresource' : {'spappresourcedata': models.CASCADE},
    'Spappresourcedir' : {
        'spappresource': models.CASCADE,
        'spviewsetobj' : models.CASCADE,
        'spappresourcedata': models.CASCADE,
        },
    'Spviewsetobj' : {'spappresourcedata' : models.CASCADE},
    
    'Splocalecontainer' : {
        'splocalecontaineritem' : models.CASCADE,
        'splocaleitemstr' : models.CASCADE
    },
    'Splocalecontaineritem' : {
        'splocaleitemstr' : models.CASCADE
    },
    'SpQuery' : {"spqueryfield" : models.CASCADE},
}
from django.db import models

""" Special Deletion Rules for table relationships 
    
    Of the form: 'relatedTable.relName' : action, 
        where relName is the field name of the relationship in relatedTable

    For example, 'Accessionagent.accession' : models.CASCADE 
        would delete the associated Accession Agent when Accession is deleted
    
    The field and relationship names can be viewed at
        https://files.specifysoftware.org/schema/version/2.10/

    Possible Django actions (w/ django 2.2) are:
        CASCADE, PROTECT, SET_NULL, SET_DEFAULT, SET(...), DO_NOTHING

    More information can be found at django's docs here: 
    https://docs.djangoproject.com/en/2.2/ref/models/fields/#django.db.models.ForeignKey.on_delete

    See .build_models.py for uses
"""
SPECIAL_DELETION_RULES = {
    'Agent.specifyuser' : models.SET_NULL,
    'Borrow.addressOfRecord' : models.SET_NULL,
    'Loanpreparation.preparation' : models.SET_NULL,

     # Handle workbench deletion using raw sql in business rules.
    'Workbenchrow.workbench': models.DO_NOTHING,
    'Workbenchdataitem.workbenchrow': models.DO_NOTHING,
    'Workbenchrowimage.workbenchrow': models.DO_NOTHING,
    'Workbenchrowexportedrelationship.workbenchrow': models.DO_NOTHING,

    # These fields are not marked as dependent because the relationship
    # can be null
    'Spappresourcedir.specifyuser': models.CASCADE,
    'Spappresource.specifyuser': models.CASCADE,
    'Spappresourcedata.spappresource': models.CASCADE,
    'Spappresourcedata.spviewsetobj': models.CASCADE,

    # In addition to these rules, Specify Cascades relationships tagged as dependent
    # For the complete list, see the global variable called 
    # dependent_fields in .load_datamodel.py 

    # If the field/relationship is not dependent and not defined here, then it is 
    # protected
}

""" Any additional desired delete blockers 
Of the form 'base_table': ['field_1_name', 'field_2_name', ...]

See .build_models.py and .views.py for uses
"""
ADDITIONAL_DELETE_BLOCKERS = {
    'Agent' : ['specifyuser'],
}

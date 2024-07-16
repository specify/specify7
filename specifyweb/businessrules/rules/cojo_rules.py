from specifyweb.businessrules.orm_signal_handler import orm_signal_handler
from specifyweb.specify.models import CollectionObjectGroupJoin

@orm_signal_handler('pre_save', 'CollectionObjectGroupJoin')
def cojo_pre_save(cojo):
    # For records with the same parentcog field, there can be only one isPrimare field set to True.
    # So when a record is saved with isPrimary set to True, we need to set all other records with the same parentcog
    # to isPrimary = False.
    if cojo.isprimary == True:
        (CollectionObjectGroupJoin.objects
         .filter(parentcog=cojo.parentcog)
         .update(isprimary=False))

    if cojo.issubstrate == True:
        (CollectionObjectGroupJoin.objects
         .filter(parentcog=cojo.parentcog, issubstrate=True)
         .update(issubstrate=False))
        
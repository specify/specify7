from specifyweb.businessrules.exceptions import BusinessRuleException
from specifyweb.businessrules.orm_signal_handler import orm_signal_handler
from specifyweb.specify.models import CollectionObjectGroupJoin

@orm_signal_handler('pre_save', 'CollectionObjectGroupJoin')
def cojo_pre_save(cojo):
    # Ensure the both the childcog and childco fields are not null.
    if cojo.childcog == None and cojo.childco == None:
        raise BusinessRuleException('Both childcog and childco cannot be null.')
    
    # Ensure the childcog and childco fields are not both set.
    if cojo.childcog != None and cojo.childco != None:
        raise BusinessRuleException('Both childcog and childco cannot be set.')

    # For records with the same parentcog field, there can be only one isPrimare field set to True.
    # So when a record is saved with isPrimary set to True, we need to set all other records with the same parentcog
    # to isPrimary = False.
    if cojo.isprimary == True:
        (CollectionObjectGroupJoin.objects
         .filter(parentcog=cojo.parentcog)
         .update(isprimary=False))

    if cojo.issubstrate == True:
        (CollectionObjectGroupJoin.objects
         .filter(parentcog=cojo.parentcog)
         .update(issubstrate=False))
        
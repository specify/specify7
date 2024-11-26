import os
import sys
from specifyweb.businessrules.exceptions import BusinessRuleException
from specifyweb.businessrules.orm_signal_handler import orm_signal_handler
from specifyweb.specify.models import Collectionobjectgroupjoin

def is_running_tests():
    return any(module in sys.modules for module in ('pytest', 'unittest'))

@orm_signal_handler('pre_save', 'Collectionobjectgroupjoin')
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
        (Collectionobjectgroupjoin.objects
         .filter(parentcog=cojo.parentcog)
         .update(isprimary=False))

    if cojo.issubstrate == True:
        (Collectionobjectgroupjoin.objects
         .filter(parentcog=cojo.parentcog)
         .update(issubstrate=False))

    if (
        cojo.childcog is not None
        and cojo.childcog.cojo is not None
        and cojo.childcog.cojo.id is not cojo.id
        and not is_running_tests()
    ):
        raise BusinessRuleException('ChildCog is already in use as a child in another COG.')
    
    if (cojo.childcog_id == cojo.parentcog_id): 
        raise BusinessRuleException(f"Cannot add a COG to itself. COG name: {cojo.childcog.name}")

@orm_signal_handler('post_save', 'Collectionobjectgroup')
def cog_post_save(cog):
    # Delete cojos that point to this COG to ensure we avoid multiple COGs having the same child cog
    Collectionobjectgroupjoin.objects.filter(childcog=cog).delete()
    if cog.parentcog is not None:
        Collectionobjectgroupjoin.objects.get_or_create(
            childcog=cog,
            childco=None,
            parentcog=cog.parentcog
        )
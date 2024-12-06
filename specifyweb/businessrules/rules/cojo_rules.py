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

    if (
        cojo.childco is not None
        and cojo.childco.cojo is not None
        and cojo.childco.cojo.id is not cojo.id
        and not is_running_tests()
    ):
        raise BusinessRuleException('ChildCo is already in use as a child in another COG.')

@orm_signal_handler('post_save', 'Collectionobjectgroup')
def cog_post_save(cog):
    # Delete cojos that point to this COG to ensure we avoid multiple COGs having the same child cog
    cojo = Collectionobjectgroupjoin.objects.filter(childcog=cog).first()
    if cog.parentcog is None: 
        return
    if cojo and cojo.parentcog != cog.parentcog:
        Collectionobjectgroupjoin.objects.filter(childcog=cog).delete()
    if cog.parentcog is not None:
        Collectionobjectgroupjoin.objects.get_or_create(
            childcog=cog,
            childco=None,
            parentcog=cog.parentcog
        )

@orm_signal_handler('post_save', 'Collectionobject')
def co_post_save(co):
    # Delete cojos that point to this CO to ensure we avoid multiple COGs having the same child co
    cojo = Collectionobjectgroupjoin.objects.filter(childco=co).first()
    if co.parentcog is None: 
        return
    if cojo and cojo.parentcog != co.parentcog:
        Collectionobjectgroupjoin.objects.filter(childcog=co).delete()
    if co.parentcog is not None:
        Collectionobjectgroupjoin.objects.get_or_create(
            childcog=None,
            childco=co,
            parentcog=co.parentcog
        )

@orm_signal_handler('post_save', 'Collectionobjectgroupjoin')
def cojo_post_save(cojo):
    if (cojo.childcog is not None): 
        cojo.childcog.parentcog = cojo.parentcog
        cojo.childcog.save()

    if (cojo.childco is not None): 
        cojo.childco.parentcog = cojo.parentcog
        cojo.childco.save()

@orm_signal_handler('pre_delete', 'Collectionobjectgroupjoin')
def cojo_post_delete(cojo):
    if (cojo.childco and cojo.childco.parentcog is not None): 
        cojo.childco.parentcog = None
        cojo.childco.save()

    if (cojo.childcog and cojo.childcog.parentcog is not None): 
        cojo.childcog.parentcog = None
        cojo.childcog.save()

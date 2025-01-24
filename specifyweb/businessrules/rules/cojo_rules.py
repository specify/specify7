from enum import Enum

from django.db.models import Max

from specifyweb.businessrules.exceptions import BusinessRuleException
from specifyweb.businessrules.orm_signal_handler import orm_signal_handler
from specifyweb.specify.models import Collectionobjectgroupjoin


class COGType(Enum):
    DISCRETE = "Discrete"
    CONSOLIDATED = "Consolidated"
    DRILL_CORE = "Drill Core"


@orm_signal_handler('pre_save', 'Collectionobjectgroupjoin')
def cojo_pre_save(cojo):
    # Ensure the both the childcog and childco fields are not null.
    if cojo.childcog is None and cojo.childco is None:
        raise BusinessRuleException('Both childcog and childco cannot be null.')

    # Ensure the childcog and childco fields are not both set.
    if cojo.childcog is not None and cojo.childco is not None:
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
    ):
        raise BusinessRuleException(
            'ChildCog is already in use as a child in another COG.')

    if (
        cojo.childco is not None
        and cojo.childco.cojo is not None
        and cojo.childco.cojo.id is not cojo.id
    ):
        raise BusinessRuleException(
            'ChildCo is already in use as a child in another COG.')

    if cojo.precedence is None:
        others = Collectionobjectgroupjoin.objects.filter(
            parentcog=cojo.parentcog
        )
        top = others.aggregate(Max('precedence'))['precedence__max']
        cojo.precedence = 0 if top is None else top + 1


@orm_signal_handler('post_save', 'Collectionobjectgroupjoin')
def cojo_post_save(cojo):
    """
        For Consolidated COGs, mark the first CO child as primary if none have been set by the user
    """
    co_children = Collectionobjectgroupjoin.objects.filter(
        parentcog=cojo.parentcog, childco__isnull=False)
    if len(co_children) > 0 and not co_children.filter(isprimary=True).exists() and cojo.parentcog.cogtype.type == COGType.CONSOLIDATED.value:
        first_child = co_children.first()
        first_child.isprimary = True
        first_child.save()

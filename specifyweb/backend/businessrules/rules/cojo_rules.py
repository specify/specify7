from enum import Enum

from django.db.models import Max

from specifyweb.backend.businessrules.exceptions import BusinessRuleException
from specifyweb.backend.businessrules.orm_signal_handler import orm_signal_handler
from specifyweb.backend.inheritance.utils import get_cat_num_inheritance_setting
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

    _inherit_catalog_number_if_configured(cojo)


def _inherit_catalog_number_if_configured(cojo: Collectionobjectgroupjoin) -> None:
    child = cojo.childco
    if child is None:
        return

    collection = child.collection
    if collection is None:
        return

    agent = getattr(cojo, 'createdbyagent', None) or child.createdbyagent
    specify_user = getattr(agent, 'specifyuser', None) if agent else None

    try:
        inherit_enabled = get_cat_num_inheritance_setting(collection, specify_user)
        if not inherit_enabled and specify_user is not None:
            inherit_enabled = get_cat_num_inheritance_setting(collection, None)
    except Exception:
        inherit_enabled = False

    if not inherit_enabled:
        return

    primary_cojo = (
        Collectionobjectgroupjoin.objects.filter(parentcog=cojo.parentcog, isprimary=True)
        .select_related('childco')
        .first()
    )

    if primary_cojo is None or primary_cojo.childco is None:
        return

    if primary_cojo.id == cojo.id:
        return

    primary_catalog_number = primary_cojo.childco.catalognumber
    if not primary_catalog_number:
        return

    if child.catalognumber == primary_catalog_number:
        return

    child.__class__.objects.filter(pk=child.pk).update(
        catalognumber=primary_catalog_number
    )
    child.catalognumber = primary_catalog_number

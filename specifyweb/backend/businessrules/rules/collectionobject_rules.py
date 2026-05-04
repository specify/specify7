from specifyweb.backend.businessrules.orm_signal_handler import orm_signal_handler

from specifyweb.backend.businessrules.exceptions import BusinessRuleException
from specifyweb.backend.businessrules.utils import get_unique_catnum_across_comp_co_coll_pref
from specifyweb.specify.models import Component

def _collection_object_catalog_check_needed(co) -> bool:
    if co.catalognumber is None:
        return False
    if co.pk is None:
        return True

    return not type(co).objects.filter(
        pk=co.pk,
        catalognumber=co.catalognumber,
        collection_id=co.collection_id,
    ).exists()

@orm_signal_handler('pre_save', 'Collectionobject')
def collectionobject_pre_save(co):
    if co.collectionmemberid is None:
        co.collectionmemberid = co.collection_id

    if co.collectionobjecttype is None:
        co.collectionobjecttype = co.collection.collectionobjecttype

    agent = co.createdbyagent
    if (
        agent is not None
        and agent.specifyuser is not None
        and _collection_object_catalog_check_needed(co)
    ):

        unique_catnum_across_comp_co_coll_pref = get_unique_catnum_across_comp_co_coll_pref(co.collection, co.createdbyagent.specifyuser)

        if unique_catnum_across_comp_co_coll_pref:
            contains_component_duplicates = Component.objects.filter(
                catalognumber=co.catalognumber,
                collectionobject__collection_id=co.collection_id,
            ).exists()

            if contains_component_duplicates:
                raise BusinessRuleException(
                    'Catalog Number is already in use for another Component in this collection.')

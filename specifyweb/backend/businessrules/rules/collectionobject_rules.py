from specifyweb.backend.businessrules.orm_signal_handler import orm_signal_handler

from specifyweb.backend.businessrules.exceptions import BusinessRuleException
from specifyweb.backend.businessrules.utils import (
    changed_fields_include,
    component_catalog_number_exists,
    get_default_collectionobjecttype_id,
    get_unique_catnum_across_comp_co_coll_pref_by_ids,
)

def _collection_object_catalog_check_needed(co) -> bool:
    if co.catalognumber is None:
        return False
    if co.pk is None:
        return True
    if not changed_fields_include(co, ("catalognumber", "collection")):
        return False

    return not type(co).objects.filter(
        pk=co.pk,
        catalognumber=co.catalognumber,
        collection_id=co.collection_id,
    ).exists()

@orm_signal_handler('pre_save', 'Collectionobject')
def collectionobject_pre_save(co):
    if co.collectionmemberid is None:
        co.collectionmemberid = co.collection_id

    if co.collectionobjecttype_id is None:
        co.collectionobjecttype_id = get_default_collectionobjecttype_id(
            co.collection_id
        )

    if (
        co.createdbyagent_id is not None
        and _collection_object_catalog_check_needed(co)
    ):

        unique_catnum_across_comp_co_coll_pref = (
            get_unique_catnum_across_comp_co_coll_pref_by_ids(
                co.collection_id,
                co.createdbyagent_id,
            )
        )

        if unique_catnum_across_comp_co_coll_pref:
            contains_component_duplicates = component_catalog_number_exists(
                co.catalognumber,
                excluded_component_id=co.pk,
            )

            if contains_component_duplicates:
                raise BusinessRuleException("Catalog Number is already in use for another Component in this collection.")

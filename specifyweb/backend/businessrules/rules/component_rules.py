from specifyweb.backend.businessrules.orm_signal_handler import orm_signal_handler
from specifyweb.backend.businessrules.exceptions import BusinessRuleException
from specifyweb.backend.businessrules.utils import (
    _component_catnum_cache,
    get_unique_catnum_across_comp_co_coll_pref_by_ids,
    component_catalog_number_exists
)
from specifyweb.specify.models import Collectionobject

@orm_signal_handler('pre_save', 'Component')
def component_pre_save(comp):
    created_by_agent_id = comp.createdbyagent_id
    collection_object = comp.collectionobject
    collection_id = getattr(collection_object, "collection_id", None)

    # We don't have an easy way at the moment to record that the existing
    # Component's catalogNumber was changed without hitting the DB for the old
    # value or have some other cache to map ID -> catalogNumber
    # While both of those approaches are feasible, let's just clear any
    # existing cache for now under the assumption the catalogNumber was changed
    if comp.pk is not None:
        _component_catnum_cache.clear_keys()

    if (created_by_agent_id is not None
        and comp.catalognumber is not None
        and collection_id is not None):

        unique_catnum_across_comp_co_coll_pref = get_unique_catnum_across_comp_co_coll_pref_by_ids(collection_id, created_by_agent_id)

        if unique_catnum_across_comp_co_coll_pref:
            # FEAT: Cache CO catalognumber?
            contains_co_duplicates = Collectionobject.objects.filter(
            catalognumber=comp.catalognumber, collection_id=collection_id).exists()

            if contains_co_duplicates:
                # REFACTOR: localize these table and field names
                raise BusinessRuleException("Catalog Number is already in use by another Collection Object in this Collection")

            contains_component_duplicates = component_catalog_number_exists(
                catalog_number=comp.catalognumber,
                excluded_component_id=comp.pk,
                collection_id=collection_id
            )

            if contains_component_duplicates:
                raise BusinessRuleException(
                    # REFACTOR: localize these table and field names
                    'Catalog Number is already in use by another Component in this Collection')

@orm_signal_handler('pre_delete', 'Component')
def component_pre_delete(comp):
    _component_catnum_cache.clear_keys()

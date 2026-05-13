from specifyweb.backend.businessrules.orm_signal_handler import orm_signal_handler
from specifyweb.backend.businessrules.exceptions import BusinessRuleException
from specifyweb.backend.businessrules.utils import (
    _component_catnum_cache,
    get_cached_unique_catnum_across_comp_co_coll_pref,
)
from specifyweb.specify.models import Collectionobject, Component

@orm_signal_handler('pre_save', 'Component')
def component_pre_save(comp):
    _component_catnum_cache.clear_keys()

    agent = comp.createdbyagent
    if agent is not None and agent.specifyuser is not None:
        unique_catnum_across_comp_co_coll_pref = get_cached_unique_catnum_across_comp_co_coll_pref(comp.collectionobject.collection, comp.createdbyagent.specifyuser)

        if unique_catnum_across_comp_co_coll_pref: 
            if comp.catalognumber is not None:
                contains_co_duplicates = Collectionobject.objects.filter(
                catalognumber=comp.catalognumber).exclude(pk=comp.pk).exists()

                contains_component_duplicates = Component.objects.filter(
                catalognumber=comp.catalognumber).exclude(pk=comp.pk).exists()

                if contains_co_duplicates or contains_component_duplicates: 
                    raise BusinessRuleException(
                        'Catalog Number is already in use for another Collection Object or Component in this collection.')

@orm_signal_handler('pre_delete', 'Component')
def component_pre_delete(comp):
    _component_catnum_cache.clear_keys()

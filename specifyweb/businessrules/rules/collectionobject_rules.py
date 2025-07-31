from specifyweb.businessrules.exceptions import BusinessRuleException
from specifyweb.businessrules.orm_signal_handler import orm_signal_handler
from specifyweb.specify.models import Component
from specifyweb.specify.utils import get_unique_catnum_across_comp_co_coll_pref


@orm_signal_handler('pre_save', 'Collectionobject')
def collectionobject_pre_save(co):
    if co.collectionmemberid is None:
        co.collectionmemberid = co.collection_id

    if co.collectionobjecttype is None: 
        co.collectionobjecttype = co.collection.collectionobjecttype

    agent = co.createdbyagent
    if agent is not None or agent.specifyuser is not None:

        unique_catnum_across_comp_co_coll_pref = get_unique_catnum_across_comp_co_coll_pref(co.collection, co.createdbyagent.specifyuser)

        if unique_catnum_across_comp_co_coll_pref: 
            if co.catalognumber is not None:
                contains_component_duplicates = Component.objects.filter(
                catalognumber=co.catalognumber).exclude(pk=co.pk).exists()

                if contains_component_duplicates: 
                    raise BusinessRuleException(
                        'Catalog Number is already in use for another Component in this collection.')

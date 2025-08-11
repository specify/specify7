from specifyweb.backend.businessrules.orm_signal_handler import orm_signal_handler

from specifyweb.backend.businessrules.exceptions import BusinessRuleException


@orm_signal_handler('pre_save', 'Collectionobject')
def collectionobject_pre_save(co):
    if co.collectionmemberid is None:
        co.collectionmemberid = co.collection_id

    if co.collectionobjecttype is None:
        co.collectionobjecttype = co.collection.collectionobjecttype

    if co.componentParent is not None:
        raise BusinessRuleException("componentParent can not be set",
                                    {"table": "CollectionObejct",
                                     "fieldName": "componentParent",
                                     "componentParentId": co.componentParent.id})

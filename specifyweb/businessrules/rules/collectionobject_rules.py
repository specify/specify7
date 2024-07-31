from specifyweb.businessrules.orm_signal_handler import orm_signal_handler


@orm_signal_handler('pre_save', 'Collectionobject')
def collectionobject_pre_save(co):
    if co.collectionmemberid is None:
        co.collectionmemberid = co.collection_id

    if co.collectionobjecttype is None: 
        co.collectionobjecttype = co.collection.collectionobjecttype

from specifyweb.businessrules.orm_signal_handler import orm_signal_handler


@orm_signal_handler('pre_save', 'Preparation')
def preparation_pre_save(preparation):
    if preparation.collectionmemberid is None:
        preparation.collectionmemberid = preparation.collectionobject.collectionmemberid

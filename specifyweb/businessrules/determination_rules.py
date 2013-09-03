from .orm_signal_handler import orm_signal_handler

@orm_signal_handler('pre_save', 'Determination')
def determination_pre_save(det):
    if det.collectionmemberid is None:
        det.collectionmemberid = det.collectionobject.collectionmemberid

@orm_signal_handler('pre_save', 'Determination')
def only_one_determination_iscurrent(determination):
    if determination.iscurrent:
        determination.collectionobject.determinations.all().update(iscurrent=False)

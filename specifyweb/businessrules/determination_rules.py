from .orm_signal_handler import orm_signal_handler

@orm_signal_handler('pre_save', 'Determination')
def determination_pre_save(det):
    if det.collectionmemberid is None:
        det.collectionmemberid = det.collectionobject.collectionmemberid

    taxon = det.taxon
    if taxon is None:
        det.preferredtaxon = None
    else:
        taxon = type(taxon).objects.select_for_update().get(id=taxon.id)
        limit = 100
        while taxon.acceptedtaxon_id is not None:
            if taxon.acceptedtaxon_id == taxon.id: break
            limit -= 1
            assert limit > 0 # in case of cycles or pathologically long synonym chains
            taxon = type(taxon).objects.select_for_update().get(id=taxon.acceptedtaxon_id)
        det.preferredtaxon = taxon


@orm_signal_handler('pre_save', 'Determination')
def only_one_determination_iscurrent(determination):
    if determination.iscurrent:
        determination.collectionobject.determinations.all().update(iscurrent=False)

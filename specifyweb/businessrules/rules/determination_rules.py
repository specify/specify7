from specifyweb.businessrules.orm_signal_handler import orm_signal_handler

from specifyweb.specify.models import Determination, Taxon


@orm_signal_handler('pre_save', 'Determination')
def determination_pre_save(det):
    if det.collectionmemberid is None:
        det.collectionmemberid = det.collectionobject.collectionmemberid

    taxon_id = det.taxon_id
    if taxon_id is None:
        det.preferredtaxon = None
    else:
        acceptedtaxon_id = Taxon.objects.select_for_update().values_list(
            'acceptedtaxon_id', flat=True).get(id=taxon_id)
        limit = 100
        while acceptedtaxon_id is not None:
            if acceptedtaxon_id == taxon_id:
                break
            limit -= 1
            if not limit > 0:
                raise AssertionError(f"Could not find accepted taxon for synonymized taxon (id ='{taxon_id}')", {
                                     "taxonId": taxon_id, "localizationKey": "limitReachedDeterminingAccepted"})
            taxon_id = acceptedtaxon_id
            acceptedtaxon_id = Taxon.objects.select_for_update().values_list(
                'acceptedtaxon_id', flat=True).get(id=taxon_id)

        det.preferredtaxon_id = taxon_id


@orm_signal_handler('pre_save', 'Determination')
def only_one_determination_iscurrent(determination):
    if determination.iscurrent:
        Determination.objects.filter(
            collectionobject=determination.collectionobject_id).update(iscurrent=False)
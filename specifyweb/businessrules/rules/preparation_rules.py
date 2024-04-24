from specifyweb.businessrules.orm_signal_handler import orm_signal_handler
from django.db.models import Sum
from specifyweb.specify import models

@orm_signal_handler('pre_save', 'Preparation')
def preparation_pre_save(preparation):
    if preparation.collectionmemberid is None:
        preparation.collectionmemberid = preparation.collectionobject.collectionmemberid

def get_prep_undisposed_total_count(id: int):
    if id is not None:
        Preparation = getattr(models, 'Preparation', None)
        prep_ids = Preparation.objects.filter(
            collectionobject__accessionid=id
        ).values_list('preparationid', flat=True)
        
        running_total = 0
        non_null = False
        for prep_id in prep_ids:
            prep_cnt = Preparation.objects.filter(
                preparationid=prep_id
            ).aggregate(Sum('actualCountAmt'))['actualCountAmt__sum']
            if prep_cnt is not None:
                running_total += prep_cnt
                non_null = True
        return running_total if non_null else None
    return None

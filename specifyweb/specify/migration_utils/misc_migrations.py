

def make_selectseries_false(apps):
    spquery = apps.get_model('specify', 'Spquery')
    spquery.objects.filter(selectseries=None).update(selectseries=False)

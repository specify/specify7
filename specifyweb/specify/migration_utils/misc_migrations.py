

def make_selectseries_false(apps):
    spquery = apps.get_model('specify', 'Spquery')
    if 'selectseries' in [field.name for field in spquery._meta.get_fields()]:
        spquery.objects.filter(selectseries=None).update(selectseries=False)
    elif 'smushed' in [field.name for field in spquery._meta.get_fields()]:
        spquery.objects.filter(smushed=None).update(smushed=False)

from django.db import migrations
from django.db.models import F

def reverse_faulty_end_start_period(apps, schema_editor):
    GeologicTimePeriod = apps.get_model('specify', 'Geologictimeperiod')
    using = schema_editor.connection.alias
    periods = GeologicTimePeriod.objects.using(using).filter(
        startperiod__lt=F('endperiod')
    ).values_list('pk', 'startperiod', 'endperiod')
    for primary_key, startperiod, endperiod in periods:
        GeologicTimePeriod.objects.using(using).filter(pk=primary_key).update(
            startperiod=endperiod,
            endperiod=startperiod,
        )
class Migration(migrations.Migration):

    dependencies = [
        ('patches', '0004_add_title_tree_rank_fix'),
    ]

    operations = [
        migrations.RunPython(reverse_faulty_end_start_period,migrations.RunPython.noop, atomic=True),
    ]

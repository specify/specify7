from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('specify', '0045_add_missing_dwc_fields'),
    ]

    operations = [
        migrations.AddIndex(
            model_name='tectonicunit',
            index=models.Index(fields=['name'], name='TectonicUnitNameIDX'),
        ),
        migrations.AddIndex(
            model_name='tectonicunit',
            index=models.Index(fields=['fullname'], name='TectonicUnitFullNameIDX'),
        ),
        migrations.AddIndex(
            model_name='tectonicunit',
            index=models.Index(fields=['guid'], name='TectonicUnitGuidIDX'),
        ),
    ]

from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('specify', '0040_components'),
    ]

    operations = [
        migrations.AddIndex(
            model_name='accession',
            index=models.Index(fields=['division_id', 'accessionnumber'], name='AccScopeAccessionsnumberIDX'),
        ),
        migrations.AddIndex(
            model_name='collectionobject',
            index=models.Index(fields=['collectionmemberid', 'catalognumber'], name='ColObjScopeCatalognumberIDX'),
        ),
    ]

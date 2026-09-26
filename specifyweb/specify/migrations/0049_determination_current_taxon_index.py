from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('specify', '0048_taxontreedefitem_parent_context_delete'),
    ]

    operations = [
        migrations.AddIndex(
            model_name='determination',
            index=models.Index(
                fields=['iscurrent', 'taxon'],
                name='DetCurrentTaxonIDX',
            ),
        ),
        migrations.AddIndex(
            model_name='determination',
            index=models.Index(
                fields=['collectionmemberid', 'iscurrent', 'taxon'],
                name='DetColMemCurrentTaxonIDX',
            ),
        ),
    ]

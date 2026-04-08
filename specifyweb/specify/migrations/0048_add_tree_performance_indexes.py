"""
Add ~20 missing performance indexes for tree operations and large table lookups.

Addresses GitHub issue #7482. Without these indexes, queries like
  SELECT ... FROM taxon WHERE NodeNumber BETWEEN X AND Y
do full table scans (type: ALL) on tables with 200K+ rows.
"""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('specify', '0046_add_tectonicunit_indexes'),
    ]

    operations = [
        # -- Taxon tree indexes --
        migrations.AddIndex(
            model_name='taxon',
            index=models.Index(fields=['nodenumber'], name='TaxonNodeNumIDX'),
        ),
        migrations.AddIndex(
            model_name='taxon',
            index=models.Index(fields=['highestchildnodenumber'], name='TaxonHCNNumIDX'),
        ),
        migrations.AddIndex(
            model_name='taxon',
            index=models.Index(fields=['rankid'], name='TaxonRankIDIDX'),
        ),

        # -- Geography tree indexes --
        migrations.AddIndex(
            model_name='geography',
            index=models.Index(fields=['nodenumber'], name='GeoNodeNumIDX'),
        ),
        migrations.AddIndex(
            model_name='geography',
            index=models.Index(fields=['highestchildnodenumber'], name='GeoHCNNumIDX'),
        ),

        # -- Storage tree indexes --
        migrations.AddIndex(
            model_name='storage',
            index=models.Index(fields=['nodenumber'], name='StorNodeNumIDX'),
        ),
        migrations.AddIndex(
            model_name='storage',
            index=models.Index(fields=['highestchildnodenumber'], name='StorHCNNumIDX'),
        ),

        # -- Geologictimeperiod tree indexes --
        migrations.AddIndex(
            model_name='geologictimeperiod',
            index=models.Index(fields=['nodenumber'], name='GTPNodeNumIDX'),
        ),
        migrations.AddIndex(
            model_name='geologictimeperiod',
            index=models.Index(fields=['highestchildnodenumber'], name='GTPHCNNumIDX'),
        ),

        # -- Lithostrat tree indexes --
        migrations.AddIndex(
            model_name='lithostrat',
            index=models.Index(fields=['nodenumber'], name='LithoNodeNumIDX'),
        ),
        migrations.AddIndex(
            model_name='lithostrat',
            index=models.Index(fields=['highestchildnodenumber'], name='LithoHCNNumIDX'),
        ),

        # -- Tectonicunit tree indexes --
        migrations.AddIndex(
            model_name='tectonicunit',
            index=models.Index(fields=['nodenumber'], name='TectNodeNumIDX'),
        ),
        migrations.AddIndex(
            model_name='tectonicunit',
            index=models.Index(fields=['highestchildnodenumber'], name='TectHCNNumIDX'),
        ),

        # -- GUID indexes for large tables --
        migrations.AddIndex(
            model_name='locality',
            index=models.Index(fields=['guid'], name='LocalityGuidIDX'),
        ),
        migrations.AddIndex(
            model_name='collectionobject',
            index=models.Index(fields=['guid'], name='COGuidIDX'),
        ),

        # -- Compound index: determination lookups by collection + current --
        migrations.AddIndex(
            model_name='determination',
            index=models.Index(
                fields=['collectionmemberid', 'iscurrent'],
                name='DetColMemCurrIDX',
            ),
        ),

        # -- Compound index: CoJo lookups by parent COG + primary flag --
        migrations.AddIndex(
            model_name='collectionobjectgroupjoin',
            index=models.Index(
                fields=['parentcog', 'isprimary'],
                name='CojoParentPrimaryIDX',
            ),
        ),
    ]

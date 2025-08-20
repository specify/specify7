from django.db import migrations, models

class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('specify', '0038_make_countonly_default_false'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.CreateModel(
                    name='Geography',
                    fields=[],
                    options={
                        'db_table': 'geography',
                        'app_label': 'trees',
                    },
                    bases=(models.Model,),
                ),
                migrations.CreateModel(
                    name='Geographytreedef',
                    fields=[],
                    options={
                        'db_table': 'geographytreedef',
                        'app_label': 'trees',
                    },
                    bases=(models.Model,),
                ),
                migrations.CreateModel(
                    name='Geographytreedefitem',
                    fields=[],
                    options={
                        'db_table': 'geographytreedefitem',
                        'app_label': 'trees',
                    },
                    bases=(models.Model,),
                ),
                migrations.CreateModel(
                    name='Geologictimeperiod',
                    fields=[],
                    options={
                        'db_table': 'geologictimeperiod',
                        'app_label': 'trees',
                    },
                    bases=(models.Model,),
                ),
                migrations.CreateModel(
                    name='Geologictimeperiodtreedef',
                    fields=[],
                    options={
                        'db_table': 'geologictimeperiodtreedef',
                        'app_label': 'trees',
                    },
                    bases=(models.Model,),
                ),
                migrations.CreateModel(
                    name='Geologictimeperiodtreedefitem',
                    fields=[],
                    options={
                        'db_table': 'geologictimeperiodtreedefitem',
                        'app_label': 'trees',
                    },
                    bases=(models.Model,),
                ),
                migrations.CreateModel(
                    name='Lithostrat',
                    fields=[],
                    options={
                        'db_table': 'lithostrat',
                        'app_label': 'trees',
                    },
                    bases=(models.Model,),
                ),
                migrations.CreateModel(
                    name='Lithostrattreedef',
                    fields=[],
                    options={
                        'db_table': 'lithostrattreedef',
                        'app_label': 'trees',
                    },
                    bases=(models.Model,),
                ),
                migrations.CreateModel(
                    name='Lithostrattreedefitem',
                    fields=[],
                    options={
                        'db_table': 'lithostrattreedefitem',
                        'app_label': 'trees',
                    },
                    bases=(models.Model,),
                ),
                migrations.CreateModel(
                    name='Storage',
                    fields=[],
                    options={
                        'db_table': 'storage',
                        'app_label': 'trees',
                    },
                    bases=(models.Model,),
                ),
                migrations.CreateModel(
                    name='Storagetreedef',
                    fields=[],
                    options={
                        'db_table': 'storagetreedef',
                        'app_label': 'trees',
                    },
                    bases=(models.Model,),
                ),
                migrations.CreateModel(
                    name='Storagetreedefitem',
                    fields=[],
                    options={
                        'db_table': 'storagetreedefitem',
                        'app_label': 'trees',
                    },
                    bases=(models.Model,),
                ),
                migrations.CreateModel(
                    name='Taxon',
                    fields=[],
                    options={
                        'db_table': 'taxon',
                        'app_label': 'trees',
                    },
                    bases=(models.Model,),
                ),
                migrations.CreateModel(
                    name='Taxontreedef',
                    fields=[],
                    options={
                        'db_table': 'taxontreedef',
                        'app_label': 'trees',
                    },
                    bases=(models.Model,),
                ),
                migrations.CreateModel(
                    name='Taxontreedefitem',
                    fields=[],
                    options={
                        'db_table': 'taxontreedefitem',
                        'app_label': 'trees',
                    },
                    bases=(models.Model,),
                ),
                migrations.CreateModel(
                    name='Tectonicunit',
                    fields=[],
                    options={
                        'db_table': 'tectonicunit',
                        'app_label': 'trees',
                    },
                    bases=(models.Model,),
                ),
                migrations.CreateModel(
                    name='Tectonicunittreedef',
                    fields=[],
                    options={
                        'db_table': 'tectonicunittreedef',
                        'app_label': 'trees',
                    },
                    bases=(models.Model,),
                ),
                migrations.CreateModel(
                    name='Tectonicunittreedefitem',
                    fields=[],
                    options={
                        'db_table': 'tectonicunittreedefitem',
                        'app_label': 'trees',
                    },
                    bases=(models.Model,),
                ),
            ],
        ),
    ]

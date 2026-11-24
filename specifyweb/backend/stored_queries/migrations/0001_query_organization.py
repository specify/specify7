import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('specify', '0048_taxontreedefitem_parent_context_delete'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='QueryFolder',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=256)),
                ('section', models.CharField(choices=[('personal', 'Your queries'), ('sharing', 'Queries I share'), ('shared', 'Shared queries')], default='personal', max_length=8)),
                ('owner', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='query_folders', to=settings.AUTH_USER_MODEL)),
                ('parent', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='children', to='stored_queries.queryfolder')),
            ],
            options={
                'db_table': 'stored_query_folder',
            },
        ),
        migrations.CreateModel(
            name='QueryFolderMembership',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('section', models.CharField(choices=[('personal', 'Your queries'), ('sharing', 'Queries I share'), ('shared', 'Shared queries')], max_length=8)),
                ('folder', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='memberships', to='stored_queries.queryfolder')),
                ('owner', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
                ('query', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='folder_memberships', to='specify.spquery')),
            ],
            options={
                'db_table': 'stored_query_folder_membership',
                'constraints': [models.UniqueConstraint(fields=('owner', 'query', 'section'), name='unique_query_folder_per_user_section')],
            },
        ),
        migrations.CreateModel(
            name='QueryFavorite',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('owner', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
                ('query', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='favorites', to='specify.spquery')),
            ],
            options={
                'db_table': 'stored_query_favorite',
                'constraints': [models.UniqueConstraint(fields=('owner', 'query'), name='unique_query_favorite_per_user')],
            },
        ),
        migrations.CreateModel(
            name='QueryArchive',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('owner', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to=settings.AUTH_USER_MODEL)),
                ('query', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='specify.spquery')),
            ],
            options={
                'db_table': 'stored_query_archive',
                'constraints': [models.UniqueConstraint(fields=('owner', 'query'), name='unique_query_archive_per_user')],
            },
        ),
    ]

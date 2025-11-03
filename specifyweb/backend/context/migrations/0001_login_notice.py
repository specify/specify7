from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('specify', '0040_components'),
    ]

    operations = [
        migrations.CreateModel(
            name='LoginNotice',
            fields=[
                ('sp_global_messages_id', models.AutoField(db_column='SpGlobalMessagesID', primary_key=True, serialize=False)),
                ('scope', models.TextField(default='login')),
                ('content', models.TextField(blank=True, default='')),
                ('is_enabled', models.BooleanField(default=False)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'spglobalmessages',
            },
        ),
        migrations.AddConstraint(
            model_name='loginnotice',
            constraint=models.UniqueConstraint(fields=('scope',), name='spglobalmessages_scope_unique'),
        ),
    ]

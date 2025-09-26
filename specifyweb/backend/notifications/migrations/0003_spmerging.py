from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone
class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('specify', '__first__'),
        ('notifications', '0002_message_read'),
    ]

    operations = [
        migrations.CreateModel(
            name='Spmerging',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=256)),
                ('taskid', models.CharField(max_length=256)),
                ('mergingstatus', models.CharField(max_length=256)),
                ('response', models.TextField()),
                ('table', models.CharField(max_length=256)),
                ('newrecordid', models.IntegerField(null=True)),
                ('newrecordata', models.JSONField(null=True)),
                ('oldrecordids', models.JSONField(null=True)),
                ('collection', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='specify.Collection')),
                ('specifyuser', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
                ('timestampcreated', models.DateTimeField(default=django.utils.timezone.now)),
                ('timestampmodified', models.DateTimeField(auto_now=True)),
                ('createdbyagent', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='+', to='specify.agent')),
                ('modifiedbyagent', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='+', to='specify.agent')),
            ],
            options={
                'db_table': 'spmerging'
            },
        ),
    ] 

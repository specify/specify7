from django.conf import settings
from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = []

    operations = [
        migrations.AlterField(
            model_name='dnasequencingrun',
            name='tracefilename',
            field=models.CharField(blank=True, max_length=64, null=True, unique=False, db_column='TraceFileName', db_index=False),
        ),
    ]

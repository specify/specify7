from django.db import migrations
from specifyweb.permissions.migration_utils.edit_permissions import add_stats_edit_permission


class Migration(migrations.Migration):
    dependencies = [
        ('permissions', '0006_add_dataset_create_recordset_permission')
    ]
    operations = [
        migrations.RunPython(add_stats_edit_permission)
    ]

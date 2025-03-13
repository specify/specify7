from django.db import migrations
from specifyweb.specify.models import Collection  # type: ignore
from specifyweb.permissions.migration_utils.edit_permissions import add_stats_edit_permission
from ..models import Role


class Migration(migrations.Migration):
    dependencies = [
        ('permissions', '0006_add_dataset_create_recordset_permission')
    ]
    operations = [
        migrations.RunPython(add_stats_edit_permission)
    ]

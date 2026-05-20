from django.db import migrations
from specifyweb.backend.workbench.upload.auditlog import auditlog


def add_stats_edit_permission(apps, schema_editor=None):
    Role = apps.get_model('permissions', 'Role')

    all_full_access_roles = Role.objects.filter(name="Full Access - Legacy")

    for full_access_role in all_full_access_roles:
        new_policy, created = full_access_role.policies.get_or_create(
            resource="/preferences/statistics",
            action="edit",
        )
        if created:
            auditlog.insert(new_policy, None)


class Migration(migrations.Migration):
    dependencies = [
        ('permissions', '0006_add_dataset_create_recordset_permission')
    ]
    operations = [
        migrations.RunPython(add_stats_edit_permission)
    ]

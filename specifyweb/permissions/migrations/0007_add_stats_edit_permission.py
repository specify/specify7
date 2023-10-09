from django.db import migrations
from specifyweb.specify.models import Collection  # type: ignore
from ..models import Role


def add_stats_edit_permission(apps, schema_editor):
    for collection in Collection.objects.all():
        try:
            all_full_access_roles = Role.objects.filter(collection=collection, name="Full Access - Legacy")
            for full_access_role in all_full_access_roles:
                full_access_role.policies.create(resource="/preferences"
                                                          "/statistics",
                                                 action="edit")
        except:
            print("Failed to assign stats edit permission in collection: ",
                  collection.id)


class Migration(migrations.Migration):
    dependencies = [
        ('permissions', '0006_add_dataset_create_recordset_permission')
    ]
    operations = [
        migrations.RunPython(add_stats_edit_permission)
    ]

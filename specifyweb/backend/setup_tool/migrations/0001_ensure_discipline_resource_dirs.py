from django.db import migrations

def ensure_discipline_resource_dirs(apps, schema_editor):
    from specifyweb.backend.setup_tool.app_resource_defaults import (
        ensure_all_discipline_resource_dirs,
    )

    ensure_all_discipline_resource_dirs()

class Migration(migrations.Migration):
    dependencies = [
        ('specify', '0044_alter_deletion_cascade'),
    ]

    operations = [
        migrations.RunPython(
            ensure_discipline_resource_dirs,
            migrations.RunPython.noop,
        ),
    ]

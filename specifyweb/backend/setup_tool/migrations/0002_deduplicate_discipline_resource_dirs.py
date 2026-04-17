from django.db import migrations

def deduplicate_discipline_resource_dirs(apps, schema_editor):
    from specifyweb.backend.setup_tool.app_resource_defaults import (
        ensure_all_discipline_resource_dirs,
    )

    ensure_all_discipline_resource_dirs()


class Migration(migrations.Migration):
    dependencies = [
        ("setup_tool", "0001_ensure_discipline_resource_dirs"),
    ]

    operations = [
        migrations.RunPython(
            deduplicate_discipline_resource_dirs,
            migrations.RunPython.noop,
        ),
    ]

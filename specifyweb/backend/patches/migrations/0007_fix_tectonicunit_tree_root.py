from django.db import migrations

def set_tectonicunit_root_fullname(apps, schema_editor):
    TectonicUnit = apps.get_model('specify', 'Tectonicunit')
    if not TectonicUnit:
        return

    TectonicUnit.objects.filter(
        parent__isnull=True,
        name="Root",
        fullname__isnull=True
    ).update(fullname="Root")

class Migration(migrations.Migration):

    dependencies = [
        ('patches', '0006_version_fix'),
        ('specify', '0009_tectonic_ranks'),
    ]

    operations = [
        migrations.RunPython(
            set_tectonicunit_root_fullname,
            migrations.RunPython.noop, atomic=True
        )
    ]

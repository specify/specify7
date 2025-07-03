from django.db import migrations
from specifyweb.specify.migration_utils import update_schema_config as usc
from specifyweb.specify.migration_utils.default_cots import create_cotype_picklist, COTYPE_PICKLIST_NAME

def revert_cotype_picklist(apps):
    Picklist = apps.get_model('specify', 'Picklist')
    Picklist.objects.filter(name=COTYPE_PICKLIST_NAME).delete()

def revert_cotype_splocalecontaineritem(apps):
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')
    Splocaleitemstr = apps.get_model('specify', 'Splocaleitemstr')

    Splocaleitemstr.objects.filter(
        text=usc.COT_TEXT,
        itemdesc__container__name="collectionobject",
        itemdesc__container__schematype=0,
    ).delete()
    Splocaleitemstr.objects.filter(
        text=usc.COT_TEXT,
        itemname__container__name="collectionobject",
        itemname__container__schematype=0,
    ).delete()
    Splocalecontaineritem.objects.filter(
        name=usc.COT_FIELD_NAME, container__name="collectionobject", container__schematype=0
    ).delete()

class Migration(migrations.Migration):
    dependencies = [
        ('specify', '0002_geo'),
    ]

    def apply_migration(apps, schema_editor):
        create_cotype_picklist(apps)
        usc.create_cotype_splocalecontaineritem(apps)

    def revert_migration(apps, schema_editor):
        revert_cotype_picklist(apps)
        revert_cotype_splocalecontaineritem(apps)

    operations = [
        migrations.RunPython(apply_migration, revert_migration, atomic=True)
    ]
"""
This migration updates the data model for COG and Schema Config entries for pre-geo tables and creates picklists for COGTypes.

Data model changes:
Removed COG -> cojo
Added COG -> children

Schema Config changes:
Added StorageTreeDef -> institution
Added COG -> children
Removed CollectionObject -> collectionObjectType (duplicate)
Removed COG -> cojo

Creates a picklist for COGType -> type and updates an existing incorrect picklist for COG -> COGType
"""
from django.db import migrations, models
import django.db.models.deletion

from specifyweb.specify.migration_utils import update_schema_config as usc

class Migration(migrations.Migration):
    dependencies = [
        ('specify', '0006_fix_tectonic_tree_fields'),
    ]

    def apply_migration(apps, schema_editor):
        usc.update_cog_type_fields(apps)
        usc.create_cogtype_picklist(apps)
        usc.update_cogtype_splocalecontaineritem(apps)
        usc.update_systemcogtypes_picklist(apps)
        usc.update_cogtype_type_splocalecontaineritem(apps)

    def revert_migration(apps, schema_editor):
        usc.revert_cog_type_fields(apps)
        usc.revert_cogtype_picklist(apps)
        usc.revert_cogtype_splocalecontaineritem(apps)
        usc.revert_systemcogtypes_picklist(apps)
        usc.revert_cogtype_type_splocalecontaineritem(apps)

    operations = [
        migrations.AlterField(
            model_name="collectionobjectgroupjoin",
            name="parentcog",
            field=models.ForeignKey(
                db_column="ParentCOGID",
                on_delete=django.db.models.deletion.CASCADE,
                related_name="children",
                to="specify.collectionobjectgroup",
            ),
        ),
        migrations.RunPython(apply_migration, revert_migration, atomic=True),
    ]

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

from specifyweb.specify.migration_utils.migration_helpers import create_cogtype_picklist, revert_cog_type_fields, revert_cogtype_picklist, revert_cogtype_splocalecontaineritem, revert_cogtype_type_splocalecontaineritem, revert_systemcogtypes_picklist, update_cog_type_fields, update_cogtype_splocalecontaineritem, update_cogtype_type_splocalecontaineritem, update_systemcogtypes_picklist

class Migration(migrations.Migration):
    dependencies = [
        ('specify', '0006_fix_tectonic_tree_fields'),
    ]

    def apply_migration(apps, schema_editor):
        update_cog_type_fields(apps)
        create_cogtype_picklist(apps)
        update_cogtype_splocalecontaineritem(apps)
        update_systemcogtypes_picklist(apps)
        update_cogtype_type_splocalecontaineritem(apps)

    def revert_migration(apps, schema_editor):
        revert_cog_type_fields(apps)
        revert_cogtype_picklist(apps)
        revert_cogtype_splocalecontaineritem(apps)
        revert_systemcogtypes_picklist(apps)
        revert_cogtype_type_splocalecontaineritem(apps)

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

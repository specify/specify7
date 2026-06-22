from specifyweb.specify.migration_utils.schema_reader import camel_to_spaced_title_case, datamodel_type_to_schematype, uncapitilize
from specifyweb.specify.models import datamodel

import logging

from specifyweb.specify.migration_utils.migration_helpers.helper_0002_schema_config_update import MIGRATION_0002_TABLES
from specifyweb.specify.migration_utils.migration_helpers.helper_0004_stratigraphy_age import MIGRATION_0004_FIELDS, MIGRATION_0004_TABLES
from specifyweb.specify.migration_utils.migration_helpers.helper_0007_schema_config_update import MIGRATION_0007_FIELDS
from specifyweb.specify.migration_utils.migration_helpers.helper_0008_schema_config_update import MIGRATION_0008_FIELDS
from specifyweb.specify.migration_utils.migration_helpers.helper_0012_add_cojo_to_schema_config import MIGRATION_0012_FIELDS
from specifyweb.specify.migration_utils.migration_helpers.helper_0013_collectionobjectgroup_parentcog import MIGRATION_0013_FIELDS
# ##########################################
# Used in 0017_schemaconfig_fixes.py
# ##########################################

CONTAINER_MIGRATIONS = [MIGRATION_0002_TABLES, MIGRATION_0004_TABLES]

CONTAINER_ITEM_MIGRATIONS = [
    MIGRATION_0004_FIELDS,
    MIGRATION_0007_FIELDS,
    MIGRATION_0008_FIELDS,
    MIGRATION_0012_FIELDS,
    MIGRATION_0013_FIELDS,
]

logger = logging.getLogger(__name__)


def fix_table_captions(apps):
    Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')
    Splocaleitemstr = apps.get_model('specify', 'Splocaleitemstr')

    for migration in CONTAINER_MIGRATIONS:
        for table_name, table_desc in migration:
            table = datamodel.get_table(table_name)
            
            # BUG: The splocalecontainer related tables can still exist in the 
            # database, and this will result in skipping any operation if the 
            # table/field is removed, renamed, etc.
            if table is None: 
                logger.warning(f"Table does not exist in latest state of the datamodel, skipping Schema Config update for: {table_name}")
                continue
            containers = Splocalecontainer.objects.filter(
                name=table_name.lower(), schematype=0)

            # If needed, correct the label of the table in the schema config
            if table_desc is not None:
                Splocaleitemstr.objects.filter(
                    containername__in=containers, text=table_desc
                ).update(text=camel_to_spaced_title_case(uncapitilize(table.name)))

            # Update the types for the fields in the table
            items = Splocalecontaineritem.objects.filter(
                container__in=containers)
            for item in items:
                datamodel_field = table.get_field(item.name)
                if not datamodel_field:
                    continue

                item.type = datamodel_type_to_schematype(
                    datamodel_field.type) if datamodel_field.is_relationship else datamodel_field.type
                item.isrequired = datamodel_field.required if item.isrequired is None else item.isrequired

                item.save()


def fix_item_types(apps):
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')

    for migration in CONTAINER_ITEM_MIGRATIONS:
        for table_name, fields in migration.items():
            table = datamodel.get_table(table_name)
            # BUG: The splocalecontainer related tables can still exist in the 
            # database, and this will result in skipping any operation if the 
            # table/field is removed, renamed, etc.
            if table is None:
                logger.warning(f"Table does not exist in latest state of the datamodel, skipping Schema Config entry for: {table_name}")
                continue
            items = Splocalecontaineritem.objects.filter(
                container__name=table_name.lower(), container__schematype=0, name__in=fields)

            for item in items:
                datamodel_field = table.get_field(item.name)
                if not datamodel_field:
                    continue

                item.type = datamodel_type_to_schematype(
                    datamodel_field.type) if datamodel_field.is_relationship else datamodel_field.type
                item.isrequired = datamodel_field.required if item.isrequired is None else item.isrequired

                item.save()


def schemaconfig_fixes(apps, schema_editor=None):
    fix_table_captions(apps)
    fix_item_types(apps)

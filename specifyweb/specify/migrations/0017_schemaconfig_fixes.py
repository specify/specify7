# Generated by Django 3.2.15 on 2024-11-21 20:08

from django.db import migrations
from django.db.models import F

from specifyweb.specify.migration_utils.update_schema_config import datamodel_type_to_schematype, uncapitilize, camel_to_spaced_title_case
from specifyweb.specify.datamodel import datamodel

from specifyweb.specify.migration_utils.sp7_schemaconfig import (
    # SpLocaleContainer migration changes
    MIGRATION_0002_TABLES, MIGRATION_0004_TABLES,

    # SpLocaleContainerItem migration changes
    MIGRATION_0004_FIELDS, MIGRATION_0007_FIELDS, MIGRATION_0008_FIELDS, MIGRATION_0012_FIELDS, MIGRATION_0013_FIELDS
)

CONTAINER_MIGRATIONS = [MIGRATION_0002_TABLES, MIGRATION_0004_TABLES]

CONTAINER_ITEM_MIGRATIONS = [
    MIGRATION_0004_FIELDS, MIGRATION_0007_FIELDS, MIGRATION_0008_FIELDS, MIGRATION_0012_FIELDS, MIGRATION_0013_FIELDS]

"""
This migration fixes two bugs introduced in other migrations by the functions 
from .migration_utils.update_schema_config.

Specifically, this migration does the following: 

- Adds the 'type' and 'isrequired' fields to splocalecontaineritems
- The caption of tables was being set to their descriptions, this sets it to 
  the proper lables
"""


def fix_table_captions(apps):
    Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')
    Splocaleitemstr = apps.get_model('specify', 'Splocaleitemstr')

    for migration in CONTAINER_MIGRATIONS:
        for table_name, table_desc in migration:
            table = datamodel.get_table_strict(table_name)
            containers = Splocalecontainer.objects.filter(
                name=table_name.lower(), schematype=0)

            # If needed, correct the label of the table in the schema config
            if table_desc is not None:
                Splocaleitemstr.objects.filter(
                    containername__in=containers, text=table_desc).update(text=camel_to_spaced_title_case(uncapitilize(table.name)))

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
            table = datamodel.get_table_strict(table_name)
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


def schemaconfig_fixes(apps, schema_editor):
    fix_table_captions(apps)
    fix_item_types(apps)


class Migration(migrations.Migration):
    dependencies = [
        ('specify', '0016_collectionobjecttype_catalognumformatname'),
    ]

    operations = [
        migrations.RunPython(schemaconfig_fixes,
                             migrations.RunPython.noop, atomic=True)
    ]

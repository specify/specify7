from specifyweb.specify.migration_utils.schema_writer import revert_table_field_schema_config, revert_table_schema_config, update_table_field_schema_config_with_defaults, update_table_schema_config_with_defaults
from specifyweb.specify.migration_utils.sp7_schemaconfig import (
    MIGRATION_0029_UPDATE_FIELDS,
    MIGRATION_0040_TABLES,
    MIGRATION_0040_FIELDS,
    MIGRATION_0040_UPDATE_FIELDS,
    MIGRATION_0040_HIDDEN_FIELDS,
)
# ##########################################
# Used in 0040_components.py
# ##########################################

def remove_componentparent_item(apps):
    revert_table_field_schema_config("CollectionObject", "componentParent", apps)

def remove_0029_schema_config_fields(apps, schema_editor=None):
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')
    Splocaleitemstr = apps.get_model('specify', 'Splocaleitemstr')

    FIELDS_TO_REMOVE = MIGRATION_0029_UPDATE_FIELDS
    for table, fields in FIELDS_TO_REMOVE.items():
        items = Splocalecontaineritem.objects.filter(
            container__name=table.lower(),
            container__schematype=0,
            # we only need the field name from the tuple of Schema Config information
            name__in=list(map(lambda f: f[0].lower(), fields))
        )

        # Delete field labels (captions) and descriptions (Splocaleitemstr) associated with the fields
        Splocaleitemstr.objects.filter(
            Q(itemdesc__in=items) | Q(itemname__in=items)
        ).delete()

        items.delete()

def create_table_schema_config_with_defaults(apps, schema_editor=None):
    Discipline = apps.get_model('specify', 'Discipline')
    for discipline in Discipline.objects.all():
        for table, desc in MIGRATION_0040_TABLES:
            update_table_schema_config_with_defaults(table, discipline.id, desc, apps)

        for table, fields in MIGRATION_0040_FIELDS.items():
            for field in fields:
                update_table_field_schema_config_with_defaults(table, discipline.id, field, apps)

def update_schema_config_field_desc_for_components(apps, schema_editor=None):
    Splocaleitemstr = apps.get_model('specify', 'Splocaleitemstr')

    for table, fields in MIGRATION_0040_UPDATE_FIELDS.items():
        for field_name, new_name, new_desc in fields:

            Splocaleitemstr.objects.filter(
                itemdesc__container__name=table.lower(),
                itemdesc__container__schematype=0,
                itemdesc__name=field_name.lower(),
                language="en",
            ).update(text=new_desc)

            Splocaleitemstr.objects.filter(
                itemname__container__name=table.lower(),
                itemname__container__schematype=0,
                itemname__name=field_name.lower(),
                language="en",
            ).update(text=new_name)

def update_hidden_prop_for_compoenents(apps, schema_editor=None):
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')

    for table, fields in MIGRATION_0040_FIELDS.items():
        Splocalecontaineritem.objects.filter(
            container__name=table.lower(),
            container__schematype=0,
            name__in=list(map(lambda f: f.lower(), fields))
        ).update(ishidden=True)

def create_cotype_splocalecontaineritem_for_components(apps):
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')
    PICKLIST_NAME = 'CollectionObjectType'
    FIELD_NAME = 'type'

    # Create a Splocalecontaineritem record for each Component Splocalecontainer
    # NOTE: Each discipline has its own Component Splocalecontainer
    Splocalecontaineritem.objects.filter(
        container__name='component',
        container__schematype=0,
        name=FIELD_NAME
    ).update(
        picklistname=PICKLIST_NAME,
        isrequired=True,
        type='ManyToOne',
    )

def hide_component_fields(apps, schema_editor=None):
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')

    for table, fields in MIGRATION_0040_HIDDEN_FIELDS.items():
        Splocalecontaineritem.objects.filter(
            container__name=table.lower(),
            container__schematype=0,
            name__in=list(map(lambda f: f.lower(), fields))
        ).update(ishidden=True)

def restore_0029_schema_config_fields(apps, schema_editor=None):
    Discipline = apps.get_model('specify', 'Discipline')
    FIELDS_TO_REMOVE = MIGRATION_0029_UPDATE_FIELDS
    for discipline in Discipline.objects.all():
        for table, fields in FIELDS_TO_REMOVE.items():
            for field_name, _, _ in fields:
                update_table_field_schema_config_with_defaults(table, discipline.id, field_name, apps)

def revert_table_schema_config_with_defaults(apps, schema_editor=None):
    for table, _ in MIGRATION_0040_TABLES:
        revert_table_schema_config(table, apps)
    for table, fields in MIGRATION_0040_FIELDS.items():
        for field in fields:
            revert_table_field_schema_config(table, field, apps)

def reverse_hide_component_fields(apps, schema_editor=None):
    Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')
    Discipline = apps.get_model('specify', 'Discipline')

    for discipline in Discipline.objects.all():
        for table, fields in MIGRATION_0040_HIDDEN_FIELDS.items():
            containers = Splocalecontainer.objects.filter(
                name=table.lower(),
                discipline_id=discipline.id,
            )
            for container in containers:
                for field_name in fields:
                    items = Splocalecontaineritem.objects.filter(
                        container=container,
                        name=field_name.lower()
                    )
                    items.update(ishidden=False)
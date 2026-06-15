from specifyweb.specify.migration_utils.schema_writer import revert_table_field_schema_config, update_table_field_schema_config_with_defaults
from specifyweb.specify.migration_utils.sp7_schemaconfig import (
    MIGRATION_0027_FIELDS,
    MIGRATION_0027_UPDATE_FIELDS,
    )
# ##########################################
# Used in 0027_CO_children.py
# ##########################################

def update_co_children_fields(apps):
    def update_discipline_fields(apps):
        Discipline = apps.get_model('specify', 'Discipline')

        for discipline in Discipline.objects.all():
            for table, fields in MIGRATION_0027_FIELDS.items(): 
                for field in fields: 
                    update_table_field_schema_config_with_defaults(table, discipline.id, field, apps)

    def update_schema_config_field_desc(apps):
        Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
        Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')
        Splocaleitemstr = apps.get_model('specify', 'Splocaleitemstr')

        for table, fields in MIGRATION_0027_UPDATE_FIELDS.items():
            #i.e: Collection Object
            containers = Splocalecontainer.objects.filter(
                name=table.lower(),
            )

            for container in containers:
                for field_name, new_name, new_desc in fields:
                    #i.e: COType
                    items = Splocalecontaineritem.objects.filter(
                        container=container,
                        name__iexact=field_name
                    )

                    for item in items:
                        localized_items_desc = Splocaleitemstr.objects.filter(itemdesc_id=item.id).first()
                        localized_items_name = Splocaleitemstr.objects.filter(itemname_id=item.id).first()

                        if localized_items_desc is None or localized_items_name is None:
                            continue

                        localized_items_desc.text = new_desc
                        localized_items_desc.save() 

                        localized_items_name.text = new_name
                        localized_items_name.save() 

    update_discipline_fields(apps)
    update_schema_config_field_desc(apps)

def revert_co_children_fields(apps):
    def revert_update_fields(apps):
        for table, fields in MIGRATION_0027_FIELDS.items(): 
            for field in fields: 
                revert_table_field_schema_config(table, field, apps)

    def revert_update_schema_field(apps):
        Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
        Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')

        for table, fields in MIGRATION_0027_UPDATE_FIELDS.items():
            containers = Splocalecontainer.objects.filter(
                name=table.lower(),
            )
            for container in containers:
                for field_name in fields:
                    items = Splocalecontaineritem.objects.filter(
                        container=container,
                        name=field_name
                    )

                    for item in items:
                        item.ishidden = False
                        item.save()

    revert_update_fields(apps)
    revert_update_schema_field(apps)
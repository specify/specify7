from specifyweb.specify.migration_utils.schema_writer import revert_table_field_schema_config, update_table_field_schema_config_with_defaults
# ##########################################
# Used in 0027_CO_children.py
# ##########################################

MIGRATION_0027_FIELDS = {
    'CollectionObject': ['parentCO', 'children'],
}
MIGRATION_0027_UPDATE_FIELDS = {
    'CollectionObject': [
        ('parentCO', 'Parent Collection Object', 'Parent CollectionObject'), 
        ('children', 'Children', 'Children'),
    ]
}

def update_co_children_fields(apps):
    def update_discipline_fields(apps):
        Discipline = apps.get_model('specify', 'Discipline')

        for discipline in Discipline.objects.all():
            for table, fields in MIGRATION_0027_FIELDS.items(): 
                for field in fields: 
                    update_table_field_schema_config_with_defaults(table, discipline.id, field, apps)

    def update_schema_config_field_desc(apps):
        Splocaleitemstr = apps.get_model('specify', 'Splocaleitemstr')

        for table, fields in MIGRATION_0027_UPDATE_FIELDS.items():
            for field_name, new_label, new_desc in fields:
                Splocaleitemstr.objects.filter(
                    itemname__container__name__iexact=table,
                    itemname__container__schematype=0,
                    itemname__name__iexact=field_name,
                    language="en"
                ).update(
                    text=new_label
                )
                Splocaleitemstr.objects.filter(
                    itemdesc__container__name__iexact=table,
                    itemdesc__container__schematype=0,
                    itemdesc__name__iexact=field_name,
                    language="en"
                ).update(
                    text=new_desc
                )

    update_discipline_fields(apps)
    update_schema_config_field_desc(apps)

def revert_co_children_fields(apps):
    def revert_update_fields(apps):
        for table, fields in MIGRATION_0027_FIELDS.items(): 
            for field in fields: 
                revert_table_field_schema_config(table, field, apps)

    def revert_update_schema_field(apps):
        Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')

        for table, fields in MIGRATION_0027_FIELDS.items():
            Splocalecontaineritem.objects.filter(
                container__name=table.lower(),
                container__schematype=0,
                name__in=fields
            ).update(
                ishidden=False
            )

    revert_update_fields(apps)
    revert_update_schema_field(apps)

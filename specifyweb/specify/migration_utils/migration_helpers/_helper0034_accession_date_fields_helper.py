from specifyweb.specify.migration_utils.schema_writer import revert_table_field_schema_config, update_table_field_schema_config_with_defaults
from specifyweb.specify.migration_utils.sp7_schemaconfig import (
    MIGRATION_0034_FIELDS,
    MIGRATION_0034_UPDATE_FIELDS,
)
# ##########################################
# Used in 0034_accession_date_fields.py
# ##########################################

def update_accession_date_fields(apps):
    def update_0034_fields(apps):
        """
        Update table-field schema entries for plain field names
        (e.g., MIGRATION_0034_FIELDS).
        """
        Discipline = apps.get_model('specify', 'Discipline')
        for discipline in Discipline.objects.all():
            for table, fields in MIGRATION_0034_FIELDS.items():
                for field_name in fields:
                    update_table_field_schema_config_with_defaults(table, discipline.id, field_name, apps)

    def update_0034_schema_config_field_desc(apps):
        """
        Update field descriptions and display names using MIGRATION_0034_UPDATE_FIELDS
        (tuple: (fieldName, newLabel, newDesc)).
        """
        Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
        Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')
        Splocaleitemstr = apps.get_model('specify', 'Splocaleitemstr')

        for table, fields in MIGRATION_0034_UPDATE_FIELDS.items():
            containers = Splocalecontainer.objects.filter(name=table.lower())
            for container in containers:
                for (field_name, new_name, new_desc) in fields:
                    items = Splocalecontaineritem.objects.filter(
                        container=container,
                        name__iexact=field_name
                    )
                    for item in items:
                        item.ishidden = True
                        item.save()
                        desc_str = Splocaleitemstr.objects.filter(itemdesc_id=item.id).first()
                        name_str = Splocaleitemstr.objects.filter(itemname_id=item.id).first()
                        if desc_str is not None:
                            desc_str.text = new_desc
                            desc_str.save()
                        if name_str is not None:
                            name_str.text = new_name
                            name_str.save()

    update_0034_fields(apps)
    update_0034_schema_config_field_desc(apps)

def revert_update_accession_date_fields(apps):
    def revert_0034_fields(apps):
        """
        Revert table-field entries for plain field names.
        """
        for table, fields in MIGRATION_0034_FIELDS.items():
            for field_name in fields:
                revert_table_field_schema_config(table, field_name, apps)

    def revert_0034_schema_config_field_desc(apps):
        """
        Revert the field name/description updates.
        """
        Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
        Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')

        for table, fields in MIGRATION_0034_UPDATE_FIELDS.items():
            containers = Splocalecontainer.objects.filter(name=table.lower())
            for container in containers:
                for (field_name, _, _) in fields:
                    items = Splocalecontaineritem.objects.filter(
                        container=container,
                        name__iexact=field_name
                    )
                    # If needed, reset ishidden or revert text

    revert_0034_fields(apps)
    revert_0034_schema_config_field_desc(apps)
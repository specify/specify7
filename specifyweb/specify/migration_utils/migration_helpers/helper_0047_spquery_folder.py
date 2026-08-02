from specifyweb.specify.migration_utils.schema_writer import revert_table_field_schema_config, revert_table_schema_config, update_table_field_schema_config_with_defaults, update_table_schema_config_with_defaults

# ##########################################
# Used in 0047_spquery_folder.py
# ##########################################

MIGRATION_0047_TABLES = [
    ('SpQueryFolder', None),
]

MIGRATION_0047_FIELDS = {
    'SpQuery': ['spqueryfolder', 'isarchived'],
}

MIGRATION_0047_UPDATE_FIELDS = {
    'SpQueryFolder': [
        ('name', 'Name', 'Folder name'),
        ('ordinal', 'Ordinal', 'Sort order for the folder'),
        ('remarks', 'Remarks', 'Folder description or notes'),
        ('parent', 'Parent', 'Parent folder for hierarchical organization'),
        ('children', 'Subfolders', 'Child folders within this folder'),
        ('spquerys', 'Queries', 'Queries contained in this folder'),
    ],
    'SpQuery': [
        ('spqueryfolder', 'Folder', 'Folder containing this query'),
        ('isarchived', 'Archived', 'Whether this query is archived'),
    ],
}

MIGRATION_0047_HIDDEN_FIELDS = {
    'SpQueryFolder': ['ordinal', 'remarks', 'version'],
}


def create_table_schema_config_with_defaults(apps, schema_editor=None):
    Discipline = apps.get_model('specify', 'Discipline')
    for discipline_id, discipline_type in Discipline.objects.all().order_by('type').values_list('pk', 'type'):
        for table, desc in MIGRATION_0047_TABLES:
            update_table_schema_config_with_defaults(
                table_name=table,
                discipline_id=discipline_id,
                discipline_type=discipline_type,
                apps=apps,
                table_defaults={"desc": desc}
            )

        for table, fields in MIGRATION_0047_FIELDS.items():
            for field in fields:
                update_table_field_schema_config_with_defaults(
                    table_name=table,
                    discipline_id=discipline_id,
                    discipline_type=discipline_type,
                    field_name=field,
                    apps=apps
                )


def update_schema_config_field_desc(apps, schema_editor=None):
    Splocaleitemstr = apps.get_model('specify', 'Splocaleitemstr')

    for table, fields in MIGRATION_0047_UPDATE_FIELDS.items():
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


def unhide_isfavorite_field(apps, schema_editor=None):
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')
    Splocalecontaineritem.objects.filter(
        container__name='spquery',
        container__schematype=0,
        name='isfavorite'
    ).update(ishidden=True)


def hide_new_fields(apps, schema_editor=None):
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')

    for table, fields in MIGRATION_0047_HIDDEN_FIELDS.items():
        Splocalecontaineritem.objects.filter(
            container__name=table.lower(),
            container__schematype=0,
            name__in=list(map(lambda f: f.lower(), fields))
        ).update(ishidden=True)


def revert_table_schema_config_with_defaults(apps, schema_editor=None):
    for table, _ in MIGRATION_0047_TABLES:
        revert_table_schema_config(table, apps)
    for table, fields in MIGRATION_0047_FIELDS.items():
        for field in fields:
            revert_table_field_schema_config(table, field, apps)


def reverse_hide_new_fields(apps, schema_editor=None):
    Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')
    Discipline = apps.get_model('specify', 'Discipline')

    for discipline_id in Discipline.objects.all().values_list('pk', flat=True):
        for table, fields in MIGRATION_0047_HIDDEN_FIELDS.items():
            containers = Splocalecontainer.objects.filter(
                name=table.lower(),
                discipline_id=discipline_id,
            )
            for container in containers:
                for field_name in fields:
                    items = Splocalecontaineritem.objects.filter(
                        container=container,
                        name=field_name.lower()
                    )
                    items.update(ishidden=True)


def reverse_unhide_isfavorite_field(apps, schema_editor=None):
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')
    Splocalecontaineritem.objects.filter(
        container__name='spquery',
        container__schematype=0,
        name='isfavorite'
    ).update(ishidden=False)

import json
import django.db.models.deletion

from django.conf import settings
from django.db import migrations, models

import specifyweb.specify.models
from specifyweb.backend.redis_cache.store import delete_key, redis_type, add_to_set, set_members

"""
WARNING: Data loss may occur if the Redis container is stopped once this
migration has been stared but has not finished.
For example, if an error occurs during this migration and the Redis container
is stopped.
Please ensure data within Redis is persisted via a mount, or there are
additional backups of the following tables before this migration: 
- autonumsch_coll
- autonumsch_dsp 
- autonumsch_div
- specifyuser_spprincipal
- spprincipal_sppermission
- sp_schema_mapping
- project_colobj

This migration creates or normalizes the Many to Many Join Tables for all
instances (those created in Specify 6, and those created in Specify 7).
The migration is necessitated due to the fact that the Django version we're
using when the tables are being created does not support more than one Primary
Key per table.
This is problematic becuase Specify 6 Many to Many Join tables all had more
than one Primary Key.

The forwards migration steps are the following:
- Store existing Many To Many records in an intermediary source (Redis)
- Drop the old Many to Many tables
- Recreate the Many to Many tables via Django
- Migrate the stored records to the new Many to Many tables
"""

"""
A static representation of the Many To Many Join tables from Specify 6.
The keys of this dict should be the name of the table in the database.
"""
LEGACY_MANY_TO_MANY_JOIN_TABLES = {
    "autonumsch_coll": {
        "to": ('specify', 'Autonumschcoll'),
        "fields": (
            {
                "new_field_name": "autonumberingscheme_id",
                "legacy_column_name": "AutoNumberingSchemeID"
            },
            {
                "new_field_name": "collection_id",
                "legacy_column_name": "CollectionID"
            }
        ),
        "sql": """
CREATE TABLE `autonumsch_coll` (
  `CollectionID` int(11) NOT NULL,
  `AutoNumberingSchemeID` int(11) NOT NULL,
  PRIMARY KEY (`CollectionID`,`AutoNumberingSchemeID`),
  KEY `FK46F04F2AFE55DD76` (`AutoNumberingSchemeID`),
  KEY `FK46F04F2A8C2288BA` (`CollectionID`),
  CONSTRAINT `FK46F04F2A8C2288BA` FOREIGN KEY (`CollectionID`) REFERENCES `collection` (`UserGroupScopeId`),
  CONSTRAINT `FK46F04F2AFE55DD76` FOREIGN KEY (`AutoNumberingSchemeID`) REFERENCES `autonumberingscheme` (`AutoNumberingSchemeID`)
);
"""
    },
    "autonumsch_dsp": {
        "to": ('specify', 'Autonumschdsp'),
        "fields": (
            {
                "new_field_name": "autonumberingscheme_id",
                "legacy_column_name": "AutoNumberingSchemeID"
            },
            {
                "new_field_name": "discipline_id",
                "legacy_column_name": "DisciplineID"
            }
        ),
        "sql": """
CREATE TABLE `autonumsch_dsp` (
  `DisciplineID` int(11) NOT NULL,
  `AutoNumberingSchemeID` int(11) NOT NULL,
  PRIMARY KEY (`DisciplineID`,`AutoNumberingSchemeID`),
  KEY `FKA8BE5C3FE55DD76` (`AutoNumberingSchemeID`),
  KEY `FKA8BE5C34CE675DE` (`DisciplineID`),
  CONSTRAINT `FKA8BE5C34CE675DE` FOREIGN KEY (`DisciplineID`) REFERENCES `discipline` (`UserGroupScopeId`),
  CONSTRAINT `FKA8BE5C3FE55DD76` FOREIGN KEY (`AutoNumberingSchemeID`) REFERENCES `autonumberingscheme` (`AutoNumberingSchemeID`)
)
"""
    },
    "autonumsch_div": {
        "to": ('specify', 'Autonumschdiv'),
        "fields": (
            {
                "new_field_name": "autonumberingscheme_id",
                "legacy_column_name": "AutoNumberingSchemeID"
            },
            {
                "new_field_name": "division_id",
                "legacy_column_name": "DivisionID"
            }
        ),
        "sql": """
CREATE TABLE `autonumsch_div` (
  `DivisionID` int(11) NOT NULL,
  `AutoNumberingSchemeID` int(11) NOT NULL,
  PRIMARY KEY (`DivisionID`,`AutoNumberingSchemeID`),
  KEY `FKA8BE493FE55DD76` (`AutoNumberingSchemeID`),
  KEY `FKA8BE49397C961D8` (`DivisionID`),
  CONSTRAINT `FKA8BE49397C961D8` FOREIGN KEY (`DivisionID`) REFERENCES `division` (`UserGroupScopeId`),
  CONSTRAINT `FKA8BE493FE55DD76` FOREIGN KEY (`AutoNumberingSchemeID`) REFERENCES `autonumberingscheme` (`AutoNumberingSchemeID`)
)
"""
    },
    "specifyuser_spprincipal": {
        "to": ('specify', 'Specifyuser_spprincipal'),
        "fields": (
            {
                "new_field_name": "specifyuser_id",
                "legacy_column_name": "SpecifyUserID"
            },
            {
                "new_field_name": "spprincipal_id",
                "legacy_column_name": "SpPrincipalID"
            }
        ),
        "sql": """
CREATE TABLE `specifyuser_spprincipal` (
  `SpecifyUserID` int(11) NOT NULL,
  `SpPrincipalID` int(11) NOT NULL,
  PRIMARY KEY (`SpecifyUserID`,`SpPrincipalID`),
  KEY `FK81E18B5E4BDD9E10` (`SpecifyUserID`),
  KEY `FK81E18B5E99A7381A` (`SpPrincipalID`),
  CONSTRAINT `FK81E18B5E4BDD9E10` FOREIGN KEY (`SpecifyUserID`) REFERENCES `specifyuser` (`SpecifyUserID`),
  CONSTRAINT `FK81E18B5E99A7381A` FOREIGN KEY (`SpPrincipalID`) REFERENCES `spprincipal` (`SpPrincipalID`)
)
"""
    },
    "spprincipal_sppermission": {
        "to": ('specify', 'Spprincipal_sppermission'),
        "fields": (
            {
                "new_field_name": "sppermission_id",
                "legacy_column_name": "SpPermissionID"
            },
            {
                "new_field_name": "spprincipal_id",
                "legacy_column_name": "SpPrincipalID"
            }
        ),
        "sql": """
CREATE TABLE `spprincipal_sppermission` (
  `SpPermissionID` int(11) NOT NULL,
  `SpPrincipalID` int(11) NOT NULL,
  PRIMARY KEY (`SpPermissionID`,`SpPrincipalID`),
  KEY `FK9DD8B2FA99A7381A` (`SpPrincipalID`),
  KEY `FK9DD8B2FA891F8736` (`SpPermissionID`),
  CONSTRAINT `FK9DD8B2FA891F8736` FOREIGN KEY (`SpPermissionID`) REFERENCES `sppermission` (`SpPermissionID`),
  CONSTRAINT `FK9DD8B2FA99A7381A` FOREIGN KEY (`SpPrincipalID`) REFERENCES `spprincipal` (`SpPrincipalID`)
)
"""
    },
    "sp_schema_mapping": {
        "to": ('specify', 'Spexportschema_exportmapping'),
        "fields": (
            {
                "new_field_name": "spexportschema_id",
                "legacy_column_name": "SpExportSchemaID"
            },
            {
                "new_field_name": "spexportschemamapping_id",
                "legacy_column_name": "SpExportSchemaMappingID"
            }
        ),
        "sql": """
CREATE TABLE `sp_schema_mapping` (
  `SpExportSchemaMappingID` int(11) NOT NULL,
  `SpExportSchemaID` int(11) NOT NULL,
  PRIMARY KEY (`SpExportSchemaMappingID`,`SpExportSchemaID`),
  KEY `FKC5EDFE525722A7A2` (`SpExportSchemaID`),
  KEY `FKC5EDFE52F7C8AAB0` (`SpExportSchemaMappingID`),
  CONSTRAINT `FKC5EDFE525722A7A2` FOREIGN KEY (`SpExportSchemaID`) REFERENCES `spexportschema` (`SpExportSchemaID`),
  CONSTRAINT `FKC5EDFE52F7C8AAB0` FOREIGN KEY (`SpExportSchemaMappingID`) REFERENCES `spexportschemamapping` (`SpExportSchemaMappingID`)
)
"""
    },
    "project_colobj": {
        "to": ('specify', 'Project_colobj'),
        "fields": (
            {
                "new_field_name": "project_id",
                "legacy_column_name": "ProjectID"
            },
            {
                "new_field_name": "collectionobject_id",
                "legacy_column_name": "CollectionObjectID"
            }
        ),
        "sql": """
CREATE TABLE `project_colobj` (
  `ProjectID` int(11) NOT NULL,
  `CollectionObjectID` int(11) NOT NULL,
  PRIMARY KEY (`ProjectID`,`CollectionObjectID`),
  KEY `FK1E416F5DAF28760A` (`ProjectID`),
  KEY `FK1E416F5D75E37458` (`CollectionObjectID`),
  CONSTRAINT `FK1E416F5D75E37458` FOREIGN KEY (`CollectionObjectID`) REFERENCES `collectionobject` (`CollectionObjectID`),
  CONSTRAINT `FK1E416F5DAF28760A` FOREIGN KEY (`ProjectID`) REFERENCES `project` (`ProjectID`)
)
"""
    }
}

def redis_table_key(table: str):
    return f"migration:0043:{table}"

results = dict()


def tables_exist(connection, *table_names: str) -> tuple[str, ...]:
    db_name = connection.settings_dict['NAME']
    rows = None
    with connection.cursor() as cursor:
        sql = """
            SELECT TABLE_NAME
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_SCHEMA = %s
                AND TABLE_NAME IN %s;
            """
        cursor.execute(sql, [db_name, table_names])
        rows = cursor.fetchall()
    if not rows:
        return tuple()
    return tuple(tables[0] for tables in rows)


def get_existing_records(connection, table: str, table_schema) -> tuple[str, ...]:
    columns = {
        field_map["legacy_column_name"]: field_map["new_field_name"]
        for field_map in table_schema["fields"]
    }
    column_str = ", ".join(columns.keys())
    rows = None
    final_column_names = tuple(columns.keys())
    with connection.cursor() as cursor:
        # We aren't binding values, we're binding column and table names here.
        # Couldn't find a way to prepare these values, so using string
        # interpolation. Yuck
        sql = """
        SELECT {col_str} FROM `{table_name}`;
        """.format(col_str=column_str, table_name=table)
        cursor.execute(sql)
        rows = cursor.fetchall()
        final_column_names = tuple(
            description[0] for description in cursor.description)
    if not rows:
        return tuple()
    return tuple(json.dumps({columns[col_name]: value
                  for col_name, value in zip(final_column_names, row)})
                for row in rows)


def store_existing_records(connection):
    existing_tables = tables_exist(
        connection, *LEGACY_MANY_TO_MANY_JOIN_TABLES.keys())
    for existing_table in existing_tables:
        schema = LEGACY_MANY_TO_MANY_JOIN_TABLES[existing_table]
        if redis_type(redis_table_key(existing_table)) != "set":
            delete_key(redis_table_key(existing_table))
        existing_records = get_existing_records(
            connection, existing_table, schema)
        add_to_set(redis_table_key(existing_table), *existing_records)


def migrate_old_records(apps):
    for table in LEGACY_MANY_TO_MANY_JOIN_TABLES.keys():
        raw_existing_records = set_members(redis_table_key(table))
        many_to_many_migration_schema = LEGACY_MANY_TO_MANY_JOIN_TABLES[table]
        app_label, model_label = many_to_many_migration_schema["to"]
        Model = apps.get_model(app_label, model_label)
        Model.objects.bulk_create((Model(**json.loads(record)) for record in raw_existing_records))

def split_iterable(iterable, chunk_size=999):
    for i in range(0, len(iterable), chunk_size):
        yield iterable[i:i+chunk_size]

def migrate_to_legacy(connection):
    for table, table_schema in LEGACY_MANY_TO_MANY_JOIN_TABLES.items():
        raw_existing_records = tuple(set_members(redis_table_key(table)))
        if len(raw_existing_records) <= 0:
            continue
        columns = {
            field_map["new_field_name"]: field_map["legacy_column_name"]
            for field_map in table_schema["fields"]
        }
        column_str = ", ".join(columns.values())
        with connection.cursor() as cursor:
            # Executemany has a maximum evaluation size of 999 statements
            # Just in case there's more than that many records, we split up the
            # iterable into 999 sized chunks and evaluate each chunk
            # independently
            for chunked_records in split_iterable(raw_existing_records):
                records = tuple(json.loads(raw_record) for raw_record in chunked_records)
                data = tuple(
                    tuple(record[col] for col in columns.keys())
                    for record in records
                )
                sql = f"INSERT INTO {table} ({column_str}) VALUES (%s, %s)"
                # It might be more performant to use string interpolation
                # here instead of execute many
                # Don't want to have to deal with potential SQL injection
                # coming from the Redis DB though...
                cursor.executemany(sql, data)

def wrapped_migrate_to_legacy(apps, schema_editor):
    connection = schema_editor.connection
    migrate_to_legacy(connection)
    for table_name in LEGACY_MANY_TO_MANY_JOIN_TABLES.keys():
        delete_key(redis_table_key(table_name))

def wrapped_migrate_old_records(apps, schema_editor):
    migrate_old_records(apps)
    for table_name in LEGACY_MANY_TO_MANY_JOIN_TABLES.keys():
        delete_key(redis_table_key(table_name))


def wrapped_store_records(apps, schema_editor):
    connection = schema_editor.connection
    store_existing_records(connection)


class Migration(migrations.Migration):
    dependencies = [
        ('specify', '0042_discipline_type_picklist'),
    ]

    operations = [
        migrations.RunPython(
            wrapped_store_records,
            wrapped_migrate_to_legacy,
            atomic=True,
        ),
        *[migrations.RunSQL(
            sql=f"DROP TABLE IF EXISTS {table}",
            reverse_sql=LEGACY_MANY_TO_MANY_JOIN_TABLES[table]["sql"]
        ) for table in LEGACY_MANY_TO_MANY_JOIN_TABLES.keys()],
        migrations.CreateModel(
            name='Spprincipal_sppermission',
            fields=[
                ('id', models.AutoField(db_column='SpPrincipalSpPermissionID',
                 primary_key=True, serialize=False)),
                ('sppermission', models.ForeignKey(db_column='SpPermissionID',
                 on_delete=django.db.models.deletion.CASCADE, related_name='+', to='specify.sppermission')),
                ('spprincipal', models.ForeignKey(db_column='SpPrincipalID',
                 on_delete=django.db.models.deletion.CASCADE, related_name='+', to='specify.spprincipal')),
            ],
            options={
                'db_table': 'spprincipal_sppermission',
            },
        ),
        migrations.CreateModel(
            name='Spexportschema_exportmapping',
            fields=[
                ('id', models.AutoField(
                    db_column='SpExportSchemaExportMappingID', primary_key=True, serialize=False)),
                ('spexportschema', models.ForeignKey(db_column='SpExportSchemaID',
                 on_delete=specifyweb.specify.models.protect_with_blockers, related_name='+', to='specify.spexportschema')),
                ('spexportschemamapping', models.ForeignKey(db_column='SpExportSchemaMappingID',
                 on_delete=specifyweb.specify.models.protect_with_blockers, related_name='+', to='specify.spexportschemamapping')),
            ],
            options={
                'db_table': 'sp_schema_mapping',
            },
        ),
        migrations.CreateModel(
            name='Specifyuser_spprincipal',
            fields=[
                ('id', models.AutoField(db_column='SpeicfyuserSpPrincipalID',
                 primary_key=True, serialize=False)),
                ('specifyuser', models.ForeignKey(db_column='SpecifyUserID',
                 on_delete=django.db.models.deletion.CASCADE, related_name='+', to=settings.AUTH_USER_MODEL)),
                ('spprincipal', models.ForeignKey(db_column='SpPrincipalID',
                 on_delete=django.db.models.deletion.CASCADE, related_name='+', to='specify.spprincipal')),
            ],
            options={
                'db_table': 'specifyuser_spprincipal',
            },
        ),
        migrations.CreateModel(
            name='Project_colobj',
            fields=[
                ('id', models.AutoField(db_column='ProjectColObjID',
                 primary_key=True, serialize=False)),
                ('collectionobject', models.ForeignKey(db_column='CollectionObjectID',
                 on_delete=specifyweb.specify.models.protect_with_blockers, related_name='+', to='specify.collectionobject')),
                ('project', models.ForeignKey(db_column='ProjectID',
                 on_delete=specifyweb.specify.models.protect_with_blockers, related_name='+', to='specify.project')),
            ],
            options={
                'db_table': 'project_colobj',
            },
        ),
        migrations.CreateModel(
            name='Autonumschdsp',
            fields=[
                ('id', models.AutoField(db_column='AutonumSchDspID',
                 primary_key=True, serialize=False)),
                ('autonumberingscheme', models.ForeignKey(db_column='AutoNumberingSchemeID',
                 on_delete=django.db.models.deletion.CASCADE, related_name='+', to='specify.autonumberingscheme')),
                ('discipline', models.ForeignKey(db_column='DisciplineID',
                 on_delete=django.db.models.deletion.CASCADE, related_name='+', to='specify.discipline')),
            ],
            options={
                'db_table': 'autonumsch_dsp',
            },
        ),
        migrations.CreateModel(
            name='Autonumschdiv',
            fields=[
                ('id', models.AutoField(db_column='AutonumSchDivID',
                 primary_key=True, serialize=False)),
                ('autonumberingscheme', models.ForeignKey(db_column='AutoNumberingSchemeID',
                 on_delete=django.db.models.deletion.CASCADE, related_name='+', to='specify.autonumberingscheme')),
                ('division', models.ForeignKey(db_column='DivisionID',
                 on_delete=django.db.models.deletion.CASCADE, related_name='+', to='specify.division')),
            ],
            options={
                'db_table': 'autonumsch_div',
            },
        ),
        migrations.CreateModel(
            name='Autonumschcoll',
            fields=[
                ('id', models.AutoField(db_column='AutonumSchCollID',
                 primary_key=True, serialize=False)),
                ('autonumberingscheme', models.ForeignKey(db_column='AutoNumberingSchemeID',
                 on_delete=django.db.models.deletion.CASCADE, related_name='+', to='specify.autonumberingscheme')),
                ('collection', models.ForeignKey(db_column='CollectionID',
                 on_delete=django.db.models.deletion.CASCADE, related_name='+', to='specify.collection')),
            ],
            options={
                'db_table': 'autonumsch_coll',
            },
        ),
        migrations.AddField(
            model_name='autonumberingscheme',
            name='collections',
            field=models.ManyToManyField(
                related_name='numberingschemes', through='specify.Autonumschcoll', to='specify.collection'),
        ),
        migrations.AddField(
            model_name='autonumberingscheme',
            name='disciplines',
            field=models.ManyToManyField(
                related_name='numberingschemes', through='specify.Autonumschdsp', to='specify.discipline'),
        ),
        migrations.AddField(
            model_name='autonumberingscheme',
            name='divisions',
            field=models.ManyToManyField(
                related_name='numberingschemes', through='specify.Autonumschdiv', to='specify.division'),
        ),
        migrations.AddField(
            model_name='project',
            name='collectionobjects',
            field=models.ManyToManyField(
                related_name='projects', through='specify.Project_colobj', to='specify.collectionobject'),
        ),
        migrations.AddField(
            model_name='specifyuser',
            name='spprincipals',
            field=models.ManyToManyField(
                related_name='spprincipals', through='specify.Specifyuser_spprincipal', to='specify.spprincipal'),
        ),
        migrations.AddField(
            model_name='spexportschema',
            name='mappings',
            field=models.ManyToManyField(
                related_name='spexportschemas', through='specify.Spexportschema_exportmapping', to='specify.spexportschemamapping'),
        ),
        migrations.AddField(
            model_name='spprincipal',
            name='sppermissions',
            field=models.ManyToManyField(
                related_name='spprincipals', through='specify.Spprincipal_sppermission', to='specify.sppermission'),
        ),
        migrations.AddConstraint(
            model_name='spprincipal_sppermission',
            constraint=models.UniqueConstraint(
                fields=('spprincipal', 'sppermission'), name='spprincipal_sppermission'),
        ),
        migrations.AddConstraint(
            model_name='spexportschema_exportmapping',
            constraint=models.UniqueConstraint(fields=(
                'spexportschema', 'spexportschemamapping'), name='exportschema_exportmapping'),
        ),
        migrations.AddConstraint(
            model_name='specifyuser_spprincipal',
            constraint=models.UniqueConstraint(
                fields=('specifyuser', 'spprincipal'), name='specifyuser_spprincipal'),
        ),
        migrations.AddConstraint(
            model_name='project_colobj',
            constraint=models.UniqueConstraint(
                fields=('project', 'collectionobject'), name='project_collectionobject'),
        ),
        migrations.AddConstraint(
            model_name='autonumschdsp',
            constraint=models.UniqueConstraint(fields=(
                'autonumberingscheme', 'discipline'), name='autonumberingscheme_discipline'),
        ),
        migrations.AddConstraint(
            model_name='autonumschdiv',
            constraint=models.UniqueConstraint(fields=(
                'autonumberingscheme', 'division'), name='autonumberingscheme_division'),
        ),
        migrations.AddConstraint(
            model_name='autonumschcoll',
            constraint=models.UniqueConstraint(fields=(
                'autonumberingscheme', 'collection'), name='autonumberingscheme_collection'),
        ),
        migrations.RunPython(
            wrapped_migrate_old_records,
            wrapped_store_records,
            atomic=True
        )
    ]

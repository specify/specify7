"""
Restore indexes, unique constraints and foreign keys that are declared by the
Specify models but missing from the database.

On MySQL 8, specify.0001_initial used to fail with error 1071 ("Specified key was
too long") when creating localityNameIDX, because LocalityName is varchar(1024)
and InnoDB keys are limited to 3072 bytes. MySQL DDL is not transactional, so the
tables created before the failure were kept, and the docker entrypoint
(base_specify_migration --use-override) then recorded 0001 as applied. Every
operation after the failure point in 0001 (indexes and unique_together) and all
deferred SQL (foreign keys and db_index indexes) was never run, leaving databases
where most lookups are full table scans.

The repair only runs when localityNameIDX is missing, which is the signature of
that failure. Healthy databases, including those upgraded from Specify 6, always
have it, so they are left untouched.
"""
import logging

from django.db import DatabaseError

logger = logging.getLogger(__name__)

SIGNATURE_TABLE = "locality"
SIGNATURE_INDEX = "localityNameIDX"

# Unique constraints still declared on the models but deliberately dropped from the
# database by later migrations. businessrules.0003_catnum_constraint replaces the
# catalog number constraint with a configurable uniqueness rule.
DROPPED_UNIQUE_CONSTRAINTS = {
    ("collectionobject", ("collectionid", "catalognumber")),
}

# Indexes on varchar(1024) columns need a prefix to fit InnoDB's key limit.
PREFIX_INDEX_SQL = {
    ("locality", "localityNameIDX"): "CREATE INDEX `localityNameIDX` ON `locality` (`LocalityName`(768))",
    ("container", "ContainerNameIDX"): "CREATE INDEX `ContainerNameIDX` ON `container` (`Name`(768))",
    ("agentidentifier", "agentidentifier_identifier_idx"):
        "CREATE INDEX `agentidentifier_identifier_idx` ON `agentidentifier` (`Identifier`(768))",
}


def _constraints(connection, table):
    with connection.cursor() as cursor:
        return connection.introspection.get_constraints(cursor, table)


def _lower(columns):
    return [c.lower() for c in columns]


def _has_index(constraints, columns, name=None):
    """True if an index with this name, or a non-unique index on exactly these columns, exists."""
    if name is not None and name in constraints:
        return True
    wanted = _lower(columns)
    return any(
        _lower(c["columns"]) == wanted
        for c in constraints.values()
        if (c["index"] or c["foreign_key"]) and not (c["unique"] or c["primary_key"])
    )


def _has_unique(constraints, columns):
    wanted = sorted(_lower(columns))
    return any(c["unique"] and sorted(_lower(c["columns"])) == wanted for c in constraints.values())


def _has_foreign_key(constraints, column):
    return any(c["foreign_key"] and _lower(c["columns"]) == [column.lower()] for c in constraints.values())


def needs_repair(connection):
    if SIGNATURE_TABLE not in connection.introspection.table_names():
        return False
    return SIGNATURE_INDEX not in _constraints(connection, SIGNATURE_TABLE)


def _planned_statements(apps, schema_editor):
    """Yield (description, sql) for every missing index, unique constraint and foreign key."""
    connection = schema_editor.connection
    tables = set(connection.introspection.table_names())
    models = [
        m for m in apps.get_app_config("specify").get_models()
        if m._meta.managed and not m._meta.proxy and m._meta.db_table in tables
    ]
    indexes, uniques, foreign_keys = [], [], []
    for model in models:
        meta = model._meta
        table = meta.db_table
        existing = _constraints(connection, table)

        for field in meta.local_fields:
            if field.db_index and not field.unique and not field.remote_field and not _has_index(existing, [field.column]):
                for sql in schema_editor._field_indexes_sql(model, field):
                    indexes.append((f"index {table}({field.column})", str(sql)))

        for index in meta.indexes:
            columns = [meta.get_field(name.lstrip("-")).column for name in index.fields]
            if not _has_index(existing, columns, index.name):
                sql = PREFIX_INDEX_SQL.get((table, index.name)) or str(index.create_sql(model, schema_editor))
                indexes.append((f"index {index.name} on {table}", sql))

        for field_names in meta.unique_together:
            fields = [meta.get_field(name) for name in field_names]
            if (table, tuple(_lower(f.column for f in fields))) in DROPPED_UNIQUE_CONSTRAINTS:
                continue
            if not _has_unique(existing, [f.column for f in fields]):
                uniques.append((f"unique {table}{tuple(f.column for f in fields)}",
                                str(schema_editor._create_unique_sql(model, fields))))

        for field in meta.local_fields:
            if (field.remote_field and field.db_constraint
                    and field.remote_field.model._meta.db_table in tables
                    and not _has_foreign_key(existing, field.column)):
                foreign_keys.append((f"foreign key {table}.{field.column}",
                                     str(schema_editor._create_fk_sql(model, field, "_fk_%(to_table)s_%(to_column)s"))))
    yield from indexes
    yield from uniques
    yield from foreign_keys


def restore_missing_constraints(apps, schema_editor, dry_run=False, force=False):
    """
    Create missing indexes, then unique constraints, then foreign keys.

    A unique constraint or foreign key that cannot be created because of existing
    data (duplicates or orphaned references) is logged and skipped so the rest of
    the repair still completes. Returns a dict of planned, applied and failed items.
    """
    report = {"planned": [], "applied": [], "failed": []}
    if not force and not needs_repair(schema_editor.connection):
        logger.info("Schema constraints are intact; nothing to restore.")
        return report
    for description, sql in list(_planned_statements(apps, schema_editor)):
        report["planned"].append((description, sql))
        if dry_run:
            continue
        try:
            schema_editor.execute(sql)
            report["applied"].append(description)
        except DatabaseError as e:
            logger.warning("Could not restore %s: %s", description, e)
            report["failed"].append((description, str(e)))
    logger.info(
        "Restored %d of %d missing schema constraints (%d failed).",
        len(report["applied"]), len(report["planned"]), len(report["failed"]),
    )
    return report

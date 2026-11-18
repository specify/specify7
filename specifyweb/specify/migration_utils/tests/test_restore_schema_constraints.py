from django.apps import apps
from django.db import connection
from django.test import TransactionTestCase

from specifyweb.specify.migration_utils.restore_schema_constraints import (
    needs_repair,
    restore_missing_constraints,
)


def constraints(table):
    with connection.cursor() as cursor:
        return connection.introspection.get_constraints(cursor, table)


def foreign_key_name(table, column):
    return next(
        name for name, c in constraints(table).items()
        if c["foreign_key"] and [col.lower() for col in c["columns"]] == [column.lower()]
    )


def unique_name(table, columns):
    wanted = sorted(col.lower() for col in columns)
    return next(
        name for name, c in constraints(table).items()
        if c["unique"] and not c["primary_key"] and sorted(col.lower() for col in c["columns"]) == wanted
    )


class RestoreSchemaConstraintsTests(TransactionTestCase):
    """Simulates a database left behind by a partially applied specify.0001_initial."""

    def run_repair(self, **kwargs):
        with connection.schema_editor(atomic=False) as editor:
            return restore_missing_constraints(apps, editor, **kwargs)

    def test_healthy_database_is_left_untouched(self):
        self.assertFalse(needs_repair(connection))
        report = self.run_repair()
        self.assertEqual(report["planned"], [])

    def test_healthy_database_has_nothing_missing(self):
        report = self.run_repair(dry_run=True, force=True)
        self.assertEqual(report["planned"], [])

    def test_restores_dropped_indexes_uniques_and_foreign_keys(self):
        fk = foreign_key_name("collectionobject", "CollectingEventID")
        unique = unique_name("accessionagent", ["Role", "AgentID", "AccessionID"])
        with connection.cursor() as cursor:
            cursor.execute(f"ALTER TABLE `collectionobject` DROP FOREIGN KEY `{fk}`")
            cursor.execute("DROP INDEX `localityNameIDX` ON `locality`")
            cursor.execute("DROP INDEX `ColObjGuidIDX` ON `collectionobject`")
            cursor.execute(f"ALTER TABLE `accessionagent` DROP INDEX `{unique}`")
        try:
            self.assertTrue(needs_repair(connection))
            report = self.run_repair()
            self.assertEqual(report["failed"], [])

            locality = constraints("locality")
            self.assertIn("localityNameIDX", locality)
            self.assertEqual([c.lower() for c in locality["localityNameIDX"]["columns"]], ["localityname"])
            self.assertIn("ColObjGuidIDX", constraints("collectionobject"))
            self.assertTrue(foreign_key_name("collectionobject", "CollectingEventID"))
            self.assertTrue(unique_name("accessionagent", ["Role", "AgentID", "AccessionID"]))

            self.assertFalse(needs_repair(connection))
            self.assertEqual(self.run_repair(dry_run=True, force=True)["planned"], [])
        finally:
            self.run_repair(force=True)

    def test_does_not_restore_catalog_number_constraint(self):
        """businessrules.0003_catnum_constraint deliberately removes this constraint."""
        report = self.run_repair(dry_run=True, force=True)
        self.assertFalse(any("CatalogNumber" in description for description, _ in report["planned"]))

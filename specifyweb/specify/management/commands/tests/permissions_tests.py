from unittest.mock import patch, sentinel

from specifyweb.specify.management.commands import run_key_migration_functions as rkm
from specifyweb.specify.management.commands.tests.test_migration_base import MigrationCommandTestCase


class PermissionsMigrationTests(MigrationCommandTestCase):
    def test_fix_permissions_runs_migrations_in_order(self):
        names = [
            "initialize_permissions",
            "add_permission", 
            "add_stats_edit_permission",
        ]
        self._assert_section_calls(
            rkm.fix_permissions,
            [(rkm, name) for name in names],
            names,
        )

    def test_initialize_permissions_passes_expected_options(self):
        with patch.object(rkm, "initialize") as initialize:
            rkm.initialize_permissions(sentinel.apps)
        
        initialize.assert_called_once_with(
            False,
            sentinel.apps,
            migrate_sp6_users=False,
        )
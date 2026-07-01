from unittest.mock import patch, sentinel

from specifyweb.specify.management.commands import run_key_migration_functions as rkm

from specifyweb.specify.management.commands.tests.test_migration_base import MigrationCommandTestCase


class KeyMigrationSectionTests(MigrationCommandTestCase):

    def test_log_and_run_without_stdout_still_calls_each_function(self):
        calls = []
        funcs = [
            self._recorder("first", calls),
            self._recorder("second", calls),
        ]

        with patch.object(rkm, "apps", sentinel.apps):
            rkm.log_and_run(funcs, stdout=None)

        self.assertEqual(calls, [("first", sentinel.apps), ("second", sentinel.apps)])

    def test_fix_tectonic_ranks_runs_migrations_in_order(self):
        names = [
            "create_default_tectonic_ranks",
            "create_root_tectonic_node",
            "fix_tectonic_unit_treedef_discipline_links",
        ]

        self._assert_section_calls(
            rkm.fix_tectonic_ranks,
            [(rkm, name) for name in names],
            names,
        )

    def test_fix_misc_runs_migrations_in_order(self):
        names = ["make_selectseries_false"]

        self._assert_section_calls(
            rkm.fix_misc,
            [(rkm, name) for name in names],
            names,
        )


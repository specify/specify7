from unittest.mock import Mock, patch, sentinel, call
from specifyweb.specify.management.commands import run_key_migration_functions as rkm
from specifyweb.specify.management.commands.tests.test_migration_base import MigrationCommandTestCase


class AppResourceTests(MigrationCommandTestCase):
    def test_create_missing_app_resource_dirs_writes_summary(self):
        stdout = Mock()

        ensure_dirs_path = (
            "specifyweb.backend.setup_tool.app_resource_defaults."
            "ensure_all_discipline_resource_dirs"
        )
        with patch(
            ensure_dirs_path,
            return_value={"total_disciplines": 4, "created": 2, "updated": 1},
        ) as ensure_dirs:
            rkm.create_missing_app_resource_dirs(stdout, sentinel.apps)

        ensure_dirs.assert_called_once_with()
        stdout.assert_called_once_with(
            "Ensured discipline app resource directories: total=4, created=2, updated=1"
        )

    def test_create_missing_app_resource_dirs_without_stdout_writes_nothing(self):
        ensure_dirs_path = (
            "specifyweb.backend.setup_tool.app_resource_defaults."
            "ensure_all_discipline_resource_dirs"
        )
        with patch(
            ensure_dirs_path,
            return_value={"total_disciplines": 4, "created": 2, "updated": 1},
        ) as ensure_dirs:
            rkm.create_missing_app_resource_dirs(None, sentinel.apps)

        ensure_dirs.assert_called_once_with()

    def test_fix_app_resource_dirs_runs_creation_then_deduplication(self):
        calls = []
        stdout = Mock()

        def create_missing_app_resource_dirs(stdout_arg, apps):
            calls.append(("create_missing_app_resource_dirs", stdout_arg, apps))

        def deduplicate_discipline_resource_dirs(apps):
            calls.append(("deduplicate_discipline_resource_dirs", apps))

        with (
            patch.object(rkm, "apps", sentinel.apps),
            patch.object(
                rkm,
                "create_missing_app_resource_dirs",
                create_missing_app_resource_dirs,
            ),
            patch.object(
                rkm,
                "deduplicate_discipline_resource_dirs",
                deduplicate_discipline_resource_dirs,
            ),
        ):
            rkm.fix_app_resource_dirs(stdout)

        self.assertEqual(
            calls,
            [
                ("create_missing_app_resource_dirs", stdout, sentinel.apps),
                ("deduplicate_discipline_resource_dirs", sentinel.apps),
            ],
        )
        self.assertEqual(
            stdout.call_args_list,
            [
                call("Running <lambda>..."),
                call("Running deduplicate_discipline_resource_dirs..."),
            ],
        )
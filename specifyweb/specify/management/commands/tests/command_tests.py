from io import StringIO
from unittest.mock import Mock, patch, sentinel

from specifyweb.specify.management.commands import run_key_migration_functions as rkm
from specifyweb.specify.management.commands.tests.test_migration_base import MigrationCommandTestCase


class KeyMigrationCommandTests(MigrationCommandTestCase):
    def test_full_pipeline_dispatches_sections_in_order_with_verbose_stdout(self):
        calls = []

        def section(name):
            def wrapped(stdout):
                calls.append((name, stdout is not None))
            return wrapped

        command = self._command()
        command.funcs = {name: section(name) for name in self.section_names}

        command.handle(functions=[], verbose=True)

        self.assertEqual(calls, [(name, True) for name in self.section_names])

    def test_selected_sections_run_in_requested_order_without_verbose_stdout(self):
        calls = []

        def section(name):
            def wrapped(stdout):
                calls.append((name, stdout))
            return wrapped

        command = self._command()
        command.funcs = {name: section(name) for name in self.section_names}

        command.handle(
            functions=["fix_misc", "fix_cots", "fix_permissions"],
            verbose=False,
        )

        self.assertEqual(
            calls,
            [
                ("fix_misc", None),
                ("fix_cots", None),
                ("fix_permissions", None),
            ],
        )

    def test_apply_patches_dispatch_passes_apps_registry_not_stdout(self):
        command = self._command()

        with patch.object(rkm, "apps", sentinel.apps), patch.object(rkm, "apply_patches") as apply_patches:
            command.handle(functions=["apply_patches"], verbose=True)

        apply_patches.assert_called_once_with(sentinel.apps)

    def test_unknown_function_writes_error_and_dispatches_nothing(self):
        stdout = StringIO()
        stderr = StringIO()
        command = rkm.Command(stdout=stdout, stderr=stderr)
        command.funcs = {"known": Mock()}

        command.handle(functions=["unknown"], verbose=True)

        command.funcs["known"].assert_not_called()
        self.assertIn("Unknown function: unknown", stderr.getvalue())
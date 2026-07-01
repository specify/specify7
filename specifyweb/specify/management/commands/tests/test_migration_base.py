from contextlib import ExitStack
from unittest.mock import Mock, sentinel, patch, call

from django.test import TestCase

from specifyweb.specify.management.commands import run_key_migration_functions as rkm
from specifyweb.specify.tests.test_api import ApiTests


class MigrationCommandTestCase(TestCase):
    """Base class for migration command tests"""
    
    section_names = (
        "apply_patches",
        "fix_cots", 
        "fix_permissions",
        "fix_business_rules",
        "fix_schema_config",
        "fix_app_resource_dirs",
        "fix_tectonic_ranks",
        "fix_misc",
    )

    def _command(self):
        return rkm.Command(stdout=self._stdout(), stderr=self._stderr())

    def _stdout(self):
        return Mock()

    def _stderr(self):
        return Mock()

    def _recorder(self, name, calls):
        def func(apps):
            calls.append((name, apps))

        func.__name__ = name
        return func

    def _patch_recorders(self, stack, patch_targets, calls):
        for target, attr in patch_targets:
            stack.enter_context(
                patch.object(target, attr, self._recorder(attr, calls))
            )

    def _assert_section_calls(self, section, patch_targets, expected_names):
        calls = []
        stdout = Mock()

        with ExitStack() as stack:
            stack.enter_context(patch.object(rkm, "apps", sentinel.apps))
            self._patch_recorders(stack, patch_targets, calls)
            section(stdout)

        self.assertEqual(calls, [(name, sentinel.apps) for name in expected_names])
        self.assertEqual(
            stdout.call_args_list,
            [call(f"Running {name}...") for name in expected_names],
        )

class MigrationDatabaseTestCase(ApiTests):
    """Base class for database-backed migration tests"""
    
    pass
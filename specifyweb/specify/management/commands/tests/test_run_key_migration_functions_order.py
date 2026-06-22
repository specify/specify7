from contextlib import ExitStack
from datetime import timedelta
from io import StringIO
from types import SimpleNamespace
from unittest.mock import Mock, call, patch, sentinel

from django.apps import apps as django_apps
from django.test import SimpleTestCase, TestCase
from django.utils import timezone

from specifyweb.backend.businessrules.models import (
    UniquenessRule,
    UniquenessRuleField,
)
from specifyweb.specify import models
from specifyweb.specify.management.commands import run_key_migration_functions as rkm
from specifyweb.specify.tests.test_api import ApiTests


class KeyMigrationSectionTests(SimpleTestCase):
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


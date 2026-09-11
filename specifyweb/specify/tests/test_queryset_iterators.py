"""Tests for queryset .iterator() usage in high-impact paths.

Verifies that key callsites that iterate over potentially large querysets
use .iterator(chunk_size=2000) to avoid caching all results in memory.
"""
import inspect
import textwrap
from django.test import TestCase


def _get_source(func):
    """Return dedented source code for a function."""
    return textwrap.dedent(inspect.getsource(func))


class TestIteratorUsageInSource(TestCase):
    """Verify that high-impact callsites use .iterator() in their source code.

    These are source-level checks — they inspect the actual Python source of
    functions that iterate over potentially large querysets, and verify that
    .iterator(chunk_size=2000) is present.
    """

    def test_serializers_to_many_uses_iterator(self):
        """to_many_to_data should use .iterator() when serializing dependent collections."""
        from specifyweb.specify.api.serializers import to_many_to_data
        source = _get_source(to_many_to_data)
        self.assertIn(
            '.iterator(chunk_size=2000)',
            source,
            "to_many_to_data should use .iterator(chunk_size=2000) on objs.all()"
        )

    def test_calculated_fields_deaccession_uses_iterator(self):
        """calculate_totals_deaccession should use .iterator() on the filter queryset."""
        from specifyweb.specify.api.calculated_fields import calculate_totals_deaccession
        source = _get_source(calculate_totals_deaccession)
        self.assertIn(
            '.iterator(chunk_size=2000)',
            source,
            "calculate_totals_deaccession should use .iterator(chunk_size=2000)"
        )

    def test_print_tree_taxon_uses_iterator(self):
        """print_tree management command should use .iterator() on Taxon.objects.all()."""
        from specifyweb.specify.management.commands.print_tree import Command
        source = _get_source(Command.handle)
        self.assertIn(
            '.iterator(chunk_size=2000)',
            source,
            "print_tree should use .iterator(chunk_size=2000) on Taxon.objects.all()"
        )

    def test_export_extract_query_uses_iterator(self):
        """extract_query should use .iterator() on query.fields.all()."""
        from specifyweb.backend.export.extract_query import extract_query
        source = _get_source(extract_query)
        self.assertIn(
            '.iterator(chunk_size=2000)',
            source,
            "extract_query should use .iterator(chunk_size=2000) on query.fields.all()"
        )

    def test_export_cache_build_uses_iterator(self):
        """build_cache_tables should use .iterator() on extensions.all()."""
        from specifyweb.backend.export.cache import build_cache_tables
        source = _get_source(build_cache_tables)
        self.assertIn(
            '.iterator(chunk_size=2000)',
            source,
            "build_cache_tables should use .iterator(chunk_size=2000) on extensions.all()"
        )

    def test_export_cache_fields_uses_iterator(self):
        """_build_single_cache should use .iterator() on fields.all()."""
        from specifyweb.backend.export.cache import _build_single_cache
        source = _get_source(_build_single_cache)
        self.assertIn(
            '.iterator(chunk_size=2000)',
            source,
            "_build_single_cache should use .iterator(chunk_size=2000) on fields.all()"
        )

    def test_cog_preps_child_cogs_uses_iterator(self):
        """get_cog_consolidated_preps should use .iterator() on child COG queries."""
        from specifyweb.backend.interactions.cog_preps import get_cog_consolidated_preps
        source = _get_source(get_cog_consolidated_preps)
        self.assertIn(
            '.iterator(chunk_size=2000)',
            source,
            "get_cog_consolidated_preps should use .iterator(chunk_size=2000)"
        )

    def test_permissions_serialize_role_uses_iterator(self):
        """serialize_role should use .iterator() on role.policies.all()."""
        from specifyweb.backend.permissions.views import serialize_role
        source = _get_source(serialize_role)
        self.assertIn(
            '.iterator(chunk_size=2000)',
            source,
            "serialize_role should use .iterator(chunk_size=2000) on role.policies.all()"
        )

    def test_tree_views_ranks_uses_iterator(self):
        """get_all_tree_information should use .iterator() on treedefitems."""
        from specifyweb.backend.trees.views import get_all_tree_information
        source = _get_source(get_all_tree_information)
        self.assertIn(
            '.iterator(chunk_size=2000)',
            source,
            "get_all_tree_information should use .iterator(chunk_size=2000) on ranks"
        )

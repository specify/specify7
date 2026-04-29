"""
Tests demonstrating and verifying the fix for N+1 query patterns
in inheritance post-query processing (#7875).
"""

from unittest.mock import patch

from django.test.utils import CaptureQueriesContext
from django.db import connection

from specifyweb.backend.interactions.tests.test_cog import TestCogInteractions
from specifyweb.specify.models import (
    Collectionobject,
    Collectionobjectgroup,
    Collectionobjectgroupjoin,
    Component,
)
from specifyweb.backend.inheritance.api import (
    parent_inheritance_post_query_processing,
    cog_inheritance_post_query_processing,
)


class _FakeFieldSpec:
    """Minimal stand-in for the field_specs entries used by the inheritance API."""

    def __init__(self, name, op_num=1, has_join_path=True):
        self.op_num = op_num

        class _JoinPathItem:
            def __init__(self, n):
                self.name = n

        class _Inner:
            def __init__(self, n):
                self.join_path = [_JoinPathItem(n)]

        class _NoJoinPath:
            join_path = []

        self.fieldspec = _Inner(name) if has_join_path else _NoJoinPath()


def _make_field_specs():
    """Return field_specs where catalogNumber is at result index 1.

    The id field has no join_path (it's the implicit row-id column at index 0).
    catalogNumber is the first field with a join_path, so
    catalog_number_field_index = 0 + 1 = 1, matching our (id, catnum) tuples.
    """
    return [
        _FakeFieldSpec('id', has_join_path=False),
        _FakeFieldSpec('catalogNumber', op_num=1),
    ]


class TestParentInheritanceNPlusOne(TestCogInteractions):
    """Verify parent_inheritance_post_query_processing query count is O(1), not O(N)."""

    @patch(
        'specifyweb.backend.inheritance.api.get_parent_cat_num_inheritance_setting',
        return_value=True,
    )
    def test_query_count_scales_constantly(self, _mock_setting):
        """With N rows that need catalog-number lookup, the number of DB
        queries should be constant (bulk prefetch), not proportional to N."""

        parent_co = self.collectionobjects[0]
        parent_co.catalognumber = 'PARENT-001'
        parent_co.save()

        # Create 20 Components with null catalogNumber pointing to parent_co
        n = 20
        components = []
        for i in range(n):
            comp = Component.objects.create(
                collectionobject=parent_co,
            )
            components.append(comp)

        # Build fake query results: (component_id, None) — catalogNumber is null
        # tableid 1029 = Component
        fake_results = [(comp.id, None) for comp in components]

        field_specs = _make_field_specs()

        with CaptureQueriesContext(connection) as ctx:
            result = parent_inheritance_post_query_processing(
                fake_results, 1029, field_specs, self.collection, self.specifyuser,
            )

        # Every row should have inherited the parent catalog number
        for row in result:
            self.assertEqual(row[1], 'PARENT-001')

        # With the N+1 bug, we'd see >= N queries (one per row).
        # After the fix, we expect a small constant number (at most ~3).
        query_count = len(ctx.captured_queries)
        self.assertLessEqual(
            query_count,
            5,
            f"Expected O(1) queries but got {query_count} for {n} rows — "
            f"N+1 pattern detected.",
        )


class TestCogInheritanceNPlusOne(TestCogInteractions):
    """Verify cog_inheritance_post_query_processing query count is O(1), not O(N)."""

    @patch(
        'specifyweb.backend.inheritance.api.get_cat_num_inheritance_setting',
        return_value=True,
    )
    def test_query_count_scales_constantly(self, _mock_setting):
        """With N rows needing COG primary lookup, DB queries should be constant."""

        primary_co = self.collectionobjects[0]
        primary_co.catalognumber = 'PRIMARY-001'
        primary_co.save()

        cog = self.test_cog_discrete

        # Link primary_co as primary member of the COG
        self._link_co_cog(primary_co, cog, isprimary=True, issubstrate=False)

        # Create 20 child COs with null catalog numbers, each linked as non-primary
        n = 20
        child_cos = []
        for i in range(n):
            co = Collectionobject.objects.create(
                collection=self.collection,
                catalognumber=None,
                collectionobjecttype=self.collectionobjecttype,
            )
            self._link_co_cog(co, cog, isprimary=False, issubstrate=False)
            child_cos.append(co)

        # Build fake query results: (child_co_id, None)
        # tableid 1 = CollectionObject
        fake_results = [(co.id, None) for co in child_cos]

        field_specs = _make_field_specs()

        with CaptureQueriesContext(connection) as ctx:
            result = cog_inheritance_post_query_processing(
                fake_results, 1, field_specs, self.collection, self.specifyuser,
            )

        # Every row should have inherited the primary's catalog number
        for row in result:
            self.assertEqual(row[1], 'PRIMARY-001')

        # With the N+1 bug we'd see >= 2*N queries (two per row).
        # After the fix, expect a small constant number (at most ~5).
        query_count = len(ctx.captured_queries)
        self.assertLessEqual(
            query_count,
            5,
            f"Expected O(1) queries but got {query_count} for {n} rows — "
            f"N+1 pattern detected.",
        )

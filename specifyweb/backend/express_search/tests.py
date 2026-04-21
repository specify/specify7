"""
Tests for express search, focusing on synonymy-related searches.

These tests verify the fix for issue #6783: Simple Search Returns All
Synonymized Taxon Records.

Root cause: When a related search (e.g., SynonymCollObjs) has an exclude
filter whose QueryFieldSpec matches the primary field's QueryFieldSpec,
using implicit_or=True in build_query causes those predicates to be OR'd
instead of AND'd. This means the WHERE clause becomes:

    WHERE (taxon.id IN (matching_ids) OR NOT (taxon.id = preferred.id))

instead of the correct:

    WHERE taxon.id IN (matching_ids) AND NOT (taxon.id = preferred.id)

The OR version returns ALL synonymized records regardless of the search
term, because NOT (taxon.id = preferred.id) is true for every synonymized
record.

Fix: Use implicit_or=False in build_related_query so all predicates are
AND'd together.
"""

from django.test import TestCase

from specifyweb.backend.express_search.related import RelatedSearch
from specifyweb.backend.stored_queries.queryfieldspec import QueryFieldSpec


class TestSynonymyPredicateGrouping(TestCase):
    """Regression test for issue #6783."""

    def test_synonym_collobj_fieldspec_collision(self):
        """SynonymCollObjs' exclude filter and primary field share the same
        fieldspec for the 'Collectionobject.determinations.taxon' definition.

        This collision causes predicates to be OR'd under implicit_or=True,
        which is the root cause of returning all synonymized records.
        """
        from specifyweb.backend.express_search.related_searches import SynonymCollObjs

        # The exclude filter's fieldspec: determinations.taxon.taxonid
        exclude_field = SynonymCollObjs.filter_fields[0]
        exclude_fs = exclude_field.fieldspec

        # The primary field for definition 'Collectionobject.determinations.taxon'
        # produces fieldspec: Collectionobject.determinations.taxon + add_id (taxonid)
        primary_fs = QueryFieldSpec.from_path(
            'Collectionobject.determinations.taxon'.split('.'), add_id=True
        )

        # These fieldspecs are equal, which means their predicates would
        # be grouped together under implicit_or=True
        self.assertEqual(
            primary_fs, exclude_fs,
            "The primary field and exclude filter share the same "
            "QueryFieldSpec. With implicit_or=True, their predicates "
            "would be incorrectly OR'd instead of AND'd."
        )

    def test_other_syns_collobj_fieldspec_collision(self):
        """OtherSynsCollObjs has the same fieldspec collision."""
        from specifyweb.backend.express_search.related_searches import OtherSynsCollObjs

        exclude_field = OtherSynsCollObjs.filter_fields[0]
        exclude_fs = exclude_field.fieldspec

        primary_fs = QueryFieldSpec.from_path(
            'Collectionobject.determinations.preferredtaxon.acceptedchildren'.split('.'),
            add_id=True
        )

        self.assertEqual(
            primary_fs, exclude_fs,
            "OtherSynsCollObjs has the same fieldspec collision."
        )

    def test_build_related_query_uses_implicit_or_false(self):
        """Verify that build_related_query passes implicit_or=False to
        build_query, preventing predicate OR-grouping."""
        import inspect
        source = inspect.getsource(RelatedSearch.build_related_query)
        self.assertIn(
            'implicit_or=False',
            source,
            "build_related_query must use implicit_or=False to prevent "
            "OR-grouping of primary field with exclude filter predicates"
        )

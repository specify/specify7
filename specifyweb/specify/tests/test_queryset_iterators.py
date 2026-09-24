"""Tests for queryset .iterator() usage in high-impact paths."""
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from django.db.models.query import QuerySet
from django.test import SimpleTestCase


class TestIteratorUsage(SimpleTestCase):
    """Verify that high-impact callsites iterate querysets in batches."""

    def assert_iterator_called_for(self, iterator, queryset):
        self.assertTrue(
            any(
                call.args[0] is queryset
                and call.kwargs == {'chunk_size': 2000}
                for call in iterator.call_args_list
            ),
            'Expected QuerySet.iterator(chunk_size=2000) for the target queryset',
        )

    def test_serializers_to_many_uses_iterator(self):
        from specifyweb.specify.api.serializers import to_many_to_data
        from specifyweb.specify.models import Taxon

        queryset = Taxon.objects.none()
        relation = MagicMock()
        relation.all.return_value = queryset
        obj = SimpleNamespace(children=relation)
        rel = SimpleNamespace(
            model=SimpleNamespace(
                specify_model=SimpleNamespace(
                    get_field=lambda name: SimpleNamespace(dependent=True))),
            get_accessor_name=lambda: 'children',
        )

        with patch.object(QuerySet, 'iterator', autospec=True, side_effect=QuerySet.iterator) as iterator:
            to_many_to_data(obj, rel, lambda value: None)

        self.assert_iterator_called_for(iterator, queryset)

    def test_calculated_fields_deaccession_uses_iterator(self):
        from specifyweb.specify.api.calculated_fields import calculate_totals_deaccession
        from specifyweb.specify.models import Taxon

        queryset = Taxon.objects.none()
        model = SimpleNamespace(objects=SimpleNamespace(filter=MagicMock(return_value=queryset)))

        with patch.object(QuerySet, 'iterator', autospec=True, side_effect=QuerySet.iterator) as iterator:
            calculate_totals_deaccession(object(), model, 'preparations')

        self.assert_iterator_called_for(iterator, queryset)

    def test_print_tree_taxon_uses_iterator(self):
        from specifyweb.specify.management.commands import print_tree
        from specifyweb.specify.models import Taxon

        queryset = Taxon.objects.none()
        taxon = MagicMock()
        taxon.objects.all.return_value.order_by.return_value = queryset
        treedef_item = MagicMock()
        treedef_item.objects.all.return_value.order_by.return_value = []

        with patch.object(print_tree, 'Taxon', taxon), \
             patch.object(print_tree, 'Taxontreedefitem', treedef_item), \
             patch.object(QuerySet, 'iterator', autospec=True, side_effect=QuerySet.iterator) as iterator:
            print_tree.Command().handle()

        self.assert_iterator_called_for(iterator, queryset)

    def test_export_extract_query_uses_iterator(self):
        from specifyweb.backend.export.extract_query import extract_query
        from specifyweb.specify.models import Taxon

        queryset = Taxon.objects.none()
        query = SimpleNamespace(
            name='test', contexttableid=1,
            fields=SimpleNamespace(all=lambda: queryset),
        )

        with patch.object(QuerySet, 'iterator', autospec=True, side_effect=QuerySet.iterator) as iterator:
            extract_query(query)

        self.assert_iterator_called_for(iterator, queryset)

    def test_export_cache_build_uses_iterator(self):
        from specifyweb.backend.export.cache import build_cache_tables
        from specifyweb.specify.models import Taxon

        queryset = Taxon.objects.none()
        extensions = SimpleNamespace(all=lambda: queryset)

        with patch.object(QuerySet, 'iterator', autospec=True, side_effect=QuerySet.iterator) as iterator:
            build_cache_tables(extensions)

        self.assert_iterator_called_for(iterator, queryset)

    def test_export_cache_fields_uses_iterator(self):
        from specifyweb.backend.export.cache import _build_single_cache
        from specifyweb.specify.models import Taxon

        queryset = Taxon.objects.none()
        extension = SimpleNamespace(
            id=1,
            mappingname='test',
            description='test',
            collectionmemberid=1,
            timestampexported=None,
            mappings=SimpleNamespace(all=lambda: queryset),
        )

        with patch.object(QuerySet, 'iterator', autospec=True, side_effect=QuerySet.iterator) as iterator:
            _build_single_cache(extension)

        self.assert_iterator_called_for(iterator, queryset)

    def test_cog_preps_child_cogs_uses_iterator(self):
        from specifyweb.backend.interactions import cog_preps
        from specifyweb.specify.models import Taxon

        queryset = Taxon.objects.none()
        joins = MagicMock()
        joins.objects.filter.return_value.values_list.return_value = queryset

        with patch.object(cog_preps, 'Collectionobjectgroupjoin', joins), \
             patch.object(cog_preps, 'is_consolidated_cog', return_value=True), \
             patch.object(QuerySet, 'iterator', autospec=True, side_effect=QuerySet.iterator) as iterator:
            cog_preps.get_cog_consolidated_preps(object())

        self.assertEqual(2, iterator.call_count)
        self.assert_iterator_called_for(iterator, queryset)

    def test_permissions_serialize_role_uses_iterator(self):
        from specifyweb.backend.permissions.views import serialize_role
        from specifyweb.specify.models import Taxon

        queryset = Taxon.objects.none()
        role = SimpleNamespace(
            id=1,
            name='test',
            description='test',
            policies=SimpleNamespace(all=lambda: queryset),
        )

        with patch.object(QuerySet, 'iterator', autospec=True, side_effect=QuerySet.iterator) as iterator:
            serialize_role(role)

        self.assert_iterator_called_for(iterator, queryset)

    def test_tree_views_ranks_uses_iterator(self):
        from specifyweb.backend.trees import views
        from specifyweb.specify.models import Taxon

        queryset = Taxon.objects.none()
        definition = SimpleNamespace(
            treedefitems=SimpleNamespace(order_by=lambda name: queryset),
        )
        treedef_model = SimpleNamespace(
            objects=SimpleNamespace(filter=lambda filters: SimpleNamespace(distinct=lambda: [definition])),
        )
        collection = SimpleNamespace(
            id=1,
            discipline=SimpleNamespace(is_paleo_geo=lambda: False),
        )

        with patch.object(views, 'COMMON_TREES', ('Taxon',)), \
             patch.object(views, 'has_table_permission', return_value=True), \
             patch.object(views, 'get_search_filters', return_value={}), \
             patch.object(views, 'obj_to_data', return_value={}), \
             patch.object(views, 'spmodels', SimpleNamespace(Taxontreedef=treedef_model)), \
             patch.object(QuerySet, 'iterator', autospec=True, side_effect=QuerySet.iterator) as iterator:
            views.get_all_tree_information(collection, 1)

        self.assert_iterator_called_for(iterator, queryset)

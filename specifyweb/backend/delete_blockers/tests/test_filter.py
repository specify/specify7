from specifyweb.backend.delete_blockers.field import django_field_to_blocker_field
from specifyweb.backend.delete_blockers.filter import (
    DeleteBlockerFilter,
    DeleteBlockerFilters,
    merge_delete_blocker_counts,
)
from specifyweb.backend.delete_blockers.paginate import ReferencePaginator
from specifyweb.specify import models
from specifyweb.specify.tests.test_api import ApiTests

class DeleteBlockerFilterTests(ApiTests):
    def setUp(self):
        super().setUp()
        self.accession = models.Accession.objects.create(
            accessionnumber="FILTER",
            division=self.division,
        )
        self.cos_to_test = len(self.collectionobjects) - 2
        co_ids = map(lambda co: co.pk, self.collectionobject[:self.cos_to_test])
        models.Collectionobject.objects.filter(pk__in=co_ids).update(
            accession=self.accession
        )

        django_field = models.Collectionobject._meta.get_field("accession")
        blocker_field = django_field_to_blocker_field(django_field)
        paginator = ReferencePaginator(self.accession, blocker_field, limit=2)
        self.filter = DeleteBlockerFilter(paginator)

    def test_count_reports_protected_references(self):
        self.assertEqual(
            self.filter.count(),
            {
                "table": "collectionobject",
                "field": "accession",
                "count": 3,
            },
        )

    def test_fetch_page_reports_cursor_metadata_and_completion(self):
        deferred, page = self.filter.fetch_page()
        self.assertFalse(deferred)
        self.assertEqual(page["ids"], [obj.id for obj in self.collectionobjects[:self.cos_to_test]])
        self.assertEqual(page["limit"], 2)
        self.assertFalse(page["complete"])
        self.assertIsNone(page["anchor"])
        self.assertFalse(page["backwards"])

    def test_cascaded_relationship_is_not_counted_as_a_direct_blocker(self):
        container = models.Splocalecontainer.objects.create(
            discipline=self.discipline,
            schematype=0,
            name="Cascade container",
        )
        django_field = models.Splocalecontainer._meta.get_field("discipline")
        blocker_field = django_field_to_blocker_field(django_field)
        paginator = ReferencePaginator(self.discipline, blocker_field)
        filter_ = DeleteBlockerFilter(paginator)
        self.assertIsNone(filter_.count())
        deferred, page = filter_.fetch_page()
        self.assertTrue(deferred)
        self.assertEqual(page["ids"], [container.id])

    def test_from_json_resolves_model_field_and_pagination_options(self):
        filter_json = {
            "table": "collectionobject",
            "field": "accession",
            "anchor": self.collectionobjects[0].id,
            "limit": 2,
            "backwards": False
        }
        configured_filter = DeleteBlockerFilter.from_json(self.accession,filter_json)
        self.assertEqual(
            configured_filter.paginator.fetch_page(),
            [obj.id for obj in self.collectionobjects[1:3]],
        )


class DeleteBlockerFiltersTests(ApiTests):
    def setUp(self):
        super().setUp()
        self.accession = models.Accession.objects.create(
            accessionnumber="FILTERS",
            division=self.division,
        )
        for collection_object in self.collectionobjects[:3]:
            collection_object.accession = self.accession
            collection_object.save()

    def test_fetch_separates_blocked_from_deferred(self):
        container = models.Splocalecontainer.objects.create(
            discipline=self.discipline,
            schematype=0,
            name="Deferred container",
        )
        accession_field = django_field_to_blocker_field(
            models.Collectionobject._meta.get_field("accession")
        )
        discipline_field = django_field_to_blocker_field(
            models.Splocalecontainer._meta.get_field("discipline")
        )
        filters = DeleteBlockerFilters(
            self.discipline,
            filters=[
                DeleteBlockerFilter(
                    ReferencePaginator(self.accession, accession_field, limit=2)
                ),
                DeleteBlockerFilter(
                    ReferencePaginator(self.discipline, discipline_field, limit=2)
                ),
            ],
        )

        blocked, deferred = filters.fetch()
        self.assertEqual(len(blocked), 1)
        self.assertEqual(blocked[0]["ids"], [obj.id for obj in self.collectionobjects[:2]])
        self.assertEqual(len(deferred), 1)
        self.assertEqual(deferred[0]["ids"], [container.id])

    def test_count_aggregates_nonempty_direct_blocker_counts(self):
        filters = DeleteBlockerFilters.from_json(
            self.accession,
            {
                "limit": 2,
                "filters": [
                    {
                        "table": "collectionobject",
                        "field": "accession",
                        "anchor": None,
                        "limit": 2,
                        "backwards": False,
                    },
                ],
            },
        )
        self.assertEqual(
            filters.count(),
            {
                "results": [
                    {
                        "table": "collectionobject",
                        "field": "accession",
                        "count": 3,
                    }
                ],
                "total_count": 3,
            },
        )

    def test_count_only_defaults_skip_cascaded_relationships(self):
        filters = DeleteBlockerFilters(self.discipline, count_only=True)
        fields_cascade = (item.paginator.blocker_field.cascades for item in filters.filters)
        self.assertTrue(all(not cascades for cascades in fields_cascade))


class MergeDeleteBlockerCountsTests(ApiTests):
    def test_ignores_missing_and_zero_counts(self):
        initial = {"results": [], "total_count": 0}
        self.assertEqual(merge_delete_blocker_counts(initial, None), initial)
        self.assertEqual(
            merge_delete_blocker_counts(
                initial,
                {"table": "collectionobject", "field": "accession", "count": 0},
            ),
            initial,
        )

    def test_appends_positive_count_and_updates_total(self):
        initial = {
            "results": [{"table": "accession", "field": "division", "count": 2}],
            "total_count": 2,
        }
        current = {"table": "collectionobject", "field": "accession", "count": 3}
        self.assertEqual(
            merge_delete_blocker_counts(initial, current),
            {"results": [*initial["results"], current], "total_count": 5},
        )

from django.test import SimpleTestCase

from specifyweb.backend.table_rows.views import (
    _has_unfiltered_query_filter,
    _has_unfiltered_query_projection,
)
from specifyweb.specify import models


class QueryProjectionTests(SimpleTestCase):
    def test_query_paths_from_other_roots_are_rejected(self):
        for model, path in (
            (models.Specifyuser, 'spquerys__name'),
            (models.Specifyuser, 'spquerys__sqlstr'),
            (models.Agent, 'specifyuser__spquerys__sqlstr'),
            (models.Spquery, 'specifyuser__spquerys__sqlstr'),
            (models.Spreport, 'query__fields__startvalue'),
        ):
            with self.subTest(model=model, path=path):
                self.assertTrue(_has_unfiltered_query_projection(model, path))

    def test_visible_query_paths_and_unrelated_fields_are_allowed(self):
        for model, path in (
            (models.Specifyuser, 'name'),
            (models.Agent, 'specifyuser__name'),
            (models.Spquery, 'name'),
            (models.Spquery, 'fields__startvalue'),
            (models.Spqueryfield, 'query__sqlstr'),
            (models.Spqueryfield, 'query_id'),
        ):
            with self.subTest(model=model, path=path):
                self.assertFalse(_has_unfiltered_query_projection(model, path))

    def test_query_filter_paths_from_other_roots_are_rejected(self):
        for model, path in (
            (models.Specifyuser, "spquerys__name__icontains"),
            (models.Agent, "specifyuser__spquerys__name"),
            (models.Spreport, "query__fields__startvalue__exact"),
        ):
            with self.subTest(model=model, path=path):
                self.assertTrue(_has_unfiltered_query_filter(model, path))

    def test_visible_query_filter_paths_and_unrelated_filters_are_allowed(self):
        for model, path in (
            (models.Specifyuser, "name__icontains"),
            (models.Spquery, "fields__startvalue__exact"),
            (models.Spqueryfield, "query__sqlstr__icontains"),
        ):
            with self.subTest(model=model, path=path):
                self.assertFalse(_has_unfiltered_query_filter(model, path))

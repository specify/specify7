from specifyweb.specify.models import Locality
from specifyweb.backend.stored_queries.execution import getCoordinateColumns, row_has_geocoords
from specifyweb.backend.stored_queries.tests.test_execution.test_kml_context import (
    TestKMLContext,
)
from specifyweb.backend.stored_queries.tests.utils import make_query_fields_test


class TestRowHasGeocoords(TestKMLContext):

    def _row_has_geocoords(self, use_null_type=True):

        # Unfortunately, the has buggy logic.
        # So, this tests the simple case where atleast
        # latitude1 and longitude1 is mapped.
        (
            *_,
            fields_value_value_value_value_null,
            fields_value_value_value_value_value,
        ) = self.direct_locality_fields(False)

        locality_count = Locality.objects.all().count()

        fields_to_use = (
            fields_value_value_value_value_null
            if use_null_type
            else fields_value_value_value_value_value
        )

        table, fields = make_query_fields_test("Locality", fields_to_use)

        cols = getCoordinateColumns(fields, True)

        rows = self._get_results(table, fields)

        expected_trues = [
            self._locality_value_value_null_null_null_0,
            self._locality_value_value_null_null_null_1,
            self._locality_value_value_value_value_value_l_0,
            self._locality_value_value_value_value_value_l_1,
            self._locality_value_value_value_value_value_r_0,
            self._locality_value_value_value_value_value_r_1,
        ]

        self.assertEqual(len(rows), locality_count)

        mapping = {row[0] for row in rows if row_has_geocoords(cols, row)}

        self.assertEqual(mapping, {obj.id for obj in expected_trues})

    def test_has_geocoords_null_type(self):
        self._row_has_geocoords(True)

    def test_has_geocoords_not_null_type(self):
        self._row_has_geocoords(False)

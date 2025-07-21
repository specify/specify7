from specifyweb.specify.models import Locality
from specifyweb.stored_queries.tests.test_execution.test_kml_context import (
    TestKMLContext,
)
from django.db.models import F, Value as V
from django.db.models.functions import Concat

fields_value_value_null_null_null = [
    ["localityName"],
    ["text1"],
    ["latitude1"],
    ["longitude1"],
]


class TestCreatePlacemark(TestKMLContext):

    # In this test suite, we have groups of rows that have geocoord.
    # From each group, we take a single row.
    # For that row, we take 1 field definition (3 in total)

    def noop(self):
        # Basic test to investigate things.
        rows_with_geocoords = [
            self._locality_value_value_null_null_null_0,
            self._locality_value_value_value_value_value_l_0,
            self._locality_value_value_value_value_value_r_0,
        ]

    def _update_name_text1(self):
        Locality.objects.update(
            localityname=Concat(V("Locality-"), "lat1text", V("-"), "long1text")
        )
        Locality.objects.update(
            text1=Concat(V("LocalityText-"), "lat1text", V("-"), "long1text")
        )

    def _lat_long_only(self, fields_to_use_idx=0):
        (
            *_,
            fields_value_value_value_value_null,
            fields_value_value_value_value_value,
        ) = self.direct_locality_fields(add_extras=True)

        all_fields = [
            fields_value_value_value_value_null,
            fields_value_value_value_value_value,
            fields_value_value_null_null_null,
        ]

        locality = self._locality_value_value_null_null_null_0

        # Delete all other localities to make things simpler
        Locality.objects.exclude(id=locality.id).delete()
        self._update_name_text1()

        fields_to_use = all_fields[fields_to_use_idx]

    def test_lat_long_only_field_latlong_latlong_null(self):
        self._lat_long_only(0)

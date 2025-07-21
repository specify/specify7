from specifyweb.specify.models import Locality
from specifyweb.stored_queries.tests.test_execution.test_kml_context import (
    TestKMLContext,
)
from django.db.models import F, Value as V
from django.db.models.functions import Concat


class TestCreatePlacemark(TestKMLContext):

    # In this test suite, we have groups of rows that have geocoord.
    # From each group, we take a single row.
    # For that row, we take 1 field definition (3 in total)

    def noop(self):
        # Basic test to investigate things.
        ...

    def test_latitude_longitude_point(self):
        fields_value_value_null_null_null = [
            ["localityName"],
            ["text1"],
            ["latitude1"],
            ["longitude1"],
        ]

        (
            *_,
            fields_value_value_value_value_null,
            fields_value_value_value_value_value,
        ) = self.direct_locality_fields(add_extras=True)

        Locality.objects.update(
            localityname=Concat(V("Locality-"), "lat1text", V("-"), "long1text")
        )
        Locality.objects.update(
            text1=Concat(V("LocalityText-"), "lat1text", V("-"), "long1text")
        )

        # In this case, we take, from each group, a single row, and pass it through all the fields that'll give some value.

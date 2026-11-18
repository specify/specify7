from collections import defaultdict
from specifyweb.specify.models import Collectingevent, Locality
from specifyweb.backend.stored_queries.tests.tests import SQLAlchemySetup

from specifyweb.backend.stored_queries.tests.utils import (
    make_query_fields_test,
    make_query_test,
)

from xml.dom.minidom import parseString
import re

from django.db.models import F, Value as V
from django.db.models.functions import Concat



def get_group(attr_name: str):
    return tuple(attr_name.split("_")[:-1])


class TestKMLContext(SQLAlchemySetup):

    def setUp(self):
        super().setUp()
        self._created_localities = defaultdict(list)
        self._all_localities = set()


    @classmethod
    def setUpClass(cls):
        cls._use_blank_nulls = True
        cls._use_decimal_format = True
        super().setUpClass()

    def _update_name_text1(self):
        Locality.objects.update(
            localityname=Concat(V("Locality-"), "lat1text", V("-"), "long1text")
        )
        Locality.objects.update(
            text1=Concat(V("LocalityText-"), "lat1text", V("-"), "long1text")
        )
        
    def no_locality_fields(self):
        self._update(self.collectionobjects[0], dict(text1="Text-0-1"))
        self._update(self.collectionobjects[1], dict(text1="Text-1-1"))
        self._update(self.collectionobjects[3], dict(text1="Text-3-1"))

        base_table, query_fields = make_query_fields_test(
            "Collectionobject", [["catalognumber"], ["collection", "collectionName"]]
        )

        return base_table, query_fields

    def __setattr__(self, key: str, value):
        if key.startswith("_locality_"):
            self._created_localities[get_group(key)].append(value)
            self._all_localities.add((key, value))
        super().__setattr__(key, value)

    def assert_xml_equal(self, base, other):
        self.maxDiff = None
        # We use a different format for showing the XML
        # So, this takes the generated xml, and parses the other, and formats them the same
        # and then compare the results.
        # This way, it can still be pretty printed.
        xml_other = parseString(re.sub(r"[\n\r\t]+", "", other))
        xml_other_str = xml_other.toprettyxml(indent="", newl="")

        if isinstance(base, str):
            base = parseString(re.sub(r"[\n\r\t]+", "", base))

        base_str = base.toprettyxml(indent="", newl="")
        self.assertEqual(xml_other_str, base_str)

    def create_localities(self):
        # [Latitude1] [Longitude1] [Latitude2] [Longitude2] [latlongtype]

        # [NULL] [NULL] [NULL] [NULL] [NULL]
        self._locality_null_null_null_null_null_0 = Locality.objects.create(
            discipline=self.discipline
        )
        self._locality_null_null_null_null_null_1 = Locality.objects.create(
            discipline=self.discipline
        )
        self._locality_null_null_null_null_null_2 = Locality.objects.create(
            discipline=self.discipline
        )

        # [VALUE] [NULL] [NULL] [NULL] [NULL]
        self._locality_value_null_null_null_null_0 = Locality.objects.create(
            discipline=self.discipline, latitude1=56.0, lat1text="56.0"
        )
        self._locality_value_null_null_null_null_1 = Locality.objects.create(
            discipline=self.discipline, latitude1=-20.0, lat1text="-20.0"
        )

        # [NULL] [VALUE] [NULL] [NULL] [NULL]
        self._locality_null_value_null_null_null_0 = Locality.objects.create(
            discipline=self.discipline, longitude1=60.8, long1text="60.8"
        )
        self._locality_null_value_null_null_null_1 = Locality.objects.create(
            discipline=self.discipline, longitude1=-30.6, long1text="-30.6"
        )

        # [VALUE] [VALUE] [NULL] [NULL] [NULL]
        self._locality_value_value_null_null_null_0 = Locality.objects.create(
            discipline=self.discipline,
            longitude1=40.67,
            long1text="40.67",
            latitude1=12.3,
            lat1text="12.3",
        )
        self._locality_value_value_null_null_null_1 = Locality.objects.create(
            discipline=self.discipline,
            longitude1=-32.89,
            long1text="-32.89",
            latitude1=10.3,
            lat1text="10.3",
        )

        # [VALUE] [NULL] [VALUE] [NULL] [NULL]
        self._locality_value_null_value_null_null_0 = Locality.objects.create(
            discipline=self.discipline,
            latitude1=32.57,
            lat1text="32.57",
            latitude2=28.24,
        )

        self._locality_value_null_value_null_null_1 = Locality.objects.create(
            discipline=self.discipline,
            latitude1=19.75,
            lat1text="19.75",
            latitude2=39.24,
        )

        # [NULL] [VALUE] [NULL] [VALUE] [NULL]
        self._locality_null_value_null_value_null_0 = Locality.objects.create(
            discipline=self.discipline,
            longitude1=16.90,
            long1text="16.90",
            longitude2=12.42,
        )

        self._locality_null_value_null_value_null_1 = Locality.objects.create(
            discipline=self.discipline,
            longitude1=67.23,
            long1text="67.23",
            longitude2=23.67,
        )

        # [VALUE] [VALUE] [VALUE] [VALUE] [VALUE=="Line"]
        self._locality_value_value_value_value_value_l_0 = Locality.objects.create(
            discipline=self.discipline,
            longitude1=16.90,
            long1text="16.90",
            longitude2=12.42,
            latitude1=23.12,
            lat1text="23.12",
            latitude2=67.87,
            latlongtype="Line",
        )

        self._locality_value_value_value_value_value_l_1 = Locality.objects.create(
            discipline=self.discipline,
            longitude1=67.23,
            long1text="67.23",
            longitude2=23.67,
            latitude1=76.54,
            lat1text="76.54",
            latitude2=13.32,
            latlongtype="Line",
        )

        # [VALUE] [VALUE] [VALUE] [VALUE] [VALUE=="Rectangle"]
        self._locality_value_value_value_value_value_r_0 = Locality.objects.create(
            discipline=self.discipline,
            longitude1=15.35,
            long1text="15.35",
            longitude2=18.53,
            latitude1=59.78,
            lat1text="59.78",
            latitude2=15.78,
            latlongtype="Rectangle",
        )

        self._locality_value_value_value_value_value_r_1 = Locality.objects.create(
            discipline=self.discipline,
            longitude1=47.83,
            long1text="47.83",
            longitude2=83.21,
            latitude1=84.45,
            lat1text="84.45",
            latitude2=19.54,
            latlongtype="Rectangle",
        )

    def simple_paths(self, add_extras=True):
        # [Latitude1] [Longitude1] [Latitude2] [Longitude2] [latlongtype]

        simple_extras = [["localityName"], ["text1"]]
        fields_value_null_null_null_null = [["latitude1"]]
        fields_null_value_null_null_null = [["longitude1"]]

        fields_value_null_value_null_null = [["latitude1"], ["latitude2"]]
        fields_null_value_null_value_null = [["longitude1"], ["longitude2"]]

        fields_value_value_value_value_null = [
            ["latitude1"],
            ["longitude1"],
            ["latitude2"],
            ["longitude2"],
        ]

        fields_value_value_value_value_value = [
            ["latitude1"],
            ["longitude1"],
            ["latitude2"],
            ["longitude2"],
            ["latlongtype"],
        ]

        field_defs = [
            fields_value_null_null_null_null,
            fields_null_value_null_null_null,
            fields_value_null_value_null_null,
            fields_null_value_null_value_null,
            fields_value_value_value_value_null,
            fields_value_value_value_value_value,
        ]

        return (
            [[*simple_extras, *field_def] for field_def in field_defs]
            if add_extras
            else field_defs
        )

    def direct_locality_fields(self, add_extras=True):
        self.create_localities()
        return tuple(self.simple_paths(add_extras))

    def to_many_locality_fields(self): ...

    def to_one_locality_fields(self):
        self.create_localities()

        for _, localities in self._created_localities.items():
            for locality in localities:
                Collectingevent.objects.create(
                    locality=locality, discipline=self.discipline
                )

        groups = self.simple_paths()
        added_paths = [[["locality", *line] for line in group] for group in groups]
        return tuple(added_paths)

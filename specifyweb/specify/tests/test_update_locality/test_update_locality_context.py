# This is a mega-class that can produce all the types of results
# There are four cases to consider:
# 1. Parse Error
# 2. Parse Success
# 3. Upload Error
# 4. Upload Success

# This context can create all of the above -- this allows to have end-to-end results (similar to batch edit)
# This context (and its constituents) are used to write all the other unit tests for different functions.
# This way, most logic is reused.

# Technically, the upload tests can be separated from this...


from decimal import Decimal
from typing import NamedTuple
from unittest.mock import Mock
from specifyweb.specify.models import Geocoorddetail, Locality
from specifyweb.specify.tests.test_api import ApiTests
from uuid import uuid4
import datetime

from specifyweb.specify.update_locality import (
    ParseError,
    ParsedRow,
    upload_locality_set,
)


class ProgressExpectation(NamedTuple):
    # In _most_ cases, expected = total.
    # Not in the cases where we encounter an error in the upload (and we have stop)
    expected: int
    total: int


def _get_ids(objs):
    return [obj.id for obj in objs]


class TestUpdateLocalityContext(ApiTests):

    def setUp(self):
        super().setUp()
        self._removable_coords = []

    def _make_locality(self, creation_spec):
        return_localities = []
        for count in creation_spec:
            guid = str(uuid4())
            localities = [
                Locality.objects.create(discipline=self.discipline)
                for _ in range(count)
            ]
            # Doing this to by-pass any business rules.
            Locality.objects.filter(id__in=_get_ids(localities)).update(guid=guid)
            return_localities.append((guid, localities))
        return return_localities

    # Allows creation of a dataset using dict as the row
    # Makes writing tests more comfortable.
    def _make_dataset(self, raw_rows):

        headers = list(set([key for row in raw_rows for key in row.keys()]))
        rows = [[rows.get(header, "") for header in headers] for rows in raw_rows]

        return headers, rows

    def _assert_parse_results_match(self, base, other):
        # print("\n\n\n################\n\n\n")
        # print(base)
        # print("\n\n\n################\n\n\n")
        # print(base[0])
        # print("\n\n\################\n\n")
        # print(other[0])
        self.assertEqual(base[0], other[0])
        # This is because errors are not determinstic (fields could have been reordered)
        self.assertCountEqual(base[1], other[1])

    def _simple_locality_data(self):
        locality = self._make_locality([1, 1, 1])
        dataset = [
            dict(latitude1="45.2 N", longitude1="66.8 E", guid=locality[0][0]),
            dict(datum="95", guid=locality[1][0]),
            dict(latitude1="26.2 N", guid=locality[2][0]),
        ]
        expected_parse_result = (
            [
                ParsedRow(
                    row_number=1,
                    locality={
                        "latitude1": 45.2,
                        "originallatlongunit": 0,
                        "lat1text": "45.2 N",
                        "longitude1": 66.8,
                        "long1text": "66.8 E",
                    },
                    geocoorddetail=None,
                    locality_id=locality[0][1][0].id,
                ),
                ParsedRow(
                    row_number=2,
                    locality={"datum": "95"},
                    geocoorddetail=None,
                    locality_id=locality[1][1][0].id,
                ),
                ParsedRow(
                    row_number=3,
                    locality={
                        "latitude1": 26.2,
                        "originallatlongunit": 0,
                        "lat1text": "26.2 N",
                    },
                    geocoorddetail=None,
                    locality_id=locality[2][1][0].id,
                ),
            ],
            [],
        )
        expected_upload_result = dict(
            type="Uploaded",
            results=[
                dict(locality=row["locality_id"], geocoorddetail=None)
                for row in expected_parse_result[0]
            ],
        )
        expected_upload_from_parsed = expected_upload_result
        return (
            dataset,
            expected_parse_result,
            expected_upload_result,
            expected_upload_from_parsed,
            ProgressExpectation(3, 3),
        )

    def _no_guid_in_header(self):
        dataset = [dict(latitude1="86"), dict(latitude1="20")]

        expected_parse_result = (
            [],
            [
                ParseError(
                    message="guidHeaderNotProvided",
                    field=None,
                    payload=None,
                    row_number=None,
                )
            ],
        )
        expected_upload_result = dict(
            type="ParseError", errors=expected_parse_result[1]
        )
        expected_upload_from_parsed = None
        return (
            dataset,
            expected_parse_result,
            expected_upload_result,
            expected_upload_from_parsed,
            ProgressExpectation(0, 0),
        )

    def _locality_matches(self):
        localities = self._make_locality([1, 3])
        no_match_guid = str(uuid4())
        dataset = [
            dict(guid=localities[0][0]),
            dict(guid=localities[1][0]),
            dict(guid=no_match_guid),
        ]

        expected_parse_result = (
            [
                {
                    "locality_id": localities[0][1][0].id,
                    "row_number": 1,
                    "locality": {},
                    "geocoorddetail": None,
                },
                {
                    "locality_id": None,
                    "row_number": 2,
                    "locality": {},
                    "geocoorddetail": None,
                },
                {
                    "locality_id": None,
                    "row_number": 3,
                    "locality": {},
                    "geocoorddetail": None,
                },
            ],
            [
                ParseError(
                    message="multipleLocalitiesWithGuid",
                    field=None,
                    payload={
                        "guid": localities[1][0],
                        "localityIds": _get_ids(localities[1][1]),
                    },
                    row_number=2,
                ),
                ParseError(
                    message="noLocalityMatchingGuid",
                    field="guid",
                    payload={"guid": no_match_guid},
                    row_number=3,
                ),
            ],
        )
        expected_upload_result = dict(
            type="ParseError", errors=expected_parse_result[1]
        )
        expected_upload_from_parsed = None

        return (
            dataset,
            expected_parse_result,
            expected_upload_result,
            expected_upload_from_parsed,
            ProgressExpectation(3, 3),
        )

    def _locality_parse_invalid(self):
        localities = self._make_locality([1, 3])
        no_match_guid = str(uuid4())

        dataset = [
            dict(
                guid=localities[0][0],
                # This will be ignored
                localityname="TestLocalityName",
                latitude1="45.2 N",
                longitude1="66.8 E",
                # This will also be ignored
                datum="",
            ),
            dict(
                guid=localities[1][0],
                # Even though there are multiple matches, the below error should
                # be reported.
                latitude1="96 N",
                longitude1="194 W",
                datum="95",
            ),
            dict(
                guid=localities[1][0],
                latitude1="26.2 N",
                longitude1="197 E",
                localityname="TestLocalityName2",
            ),
            dict(guid=no_match_guid),
        ]

        expected_parse_result = (
            [
                {
                    "locality_id": localities[0][1][0].id,
                    "row_number": 1,
                    "locality": {
                        "latitude1": 45.2,
                        "originallatlongunit": 0,
                        "lat1text": "45.2 N",
                        "longitude1": 66.8,
                        "long1text": "66.8 E",
                    },
                    "geocoorddetail": None,
                },
                {
                    "locality_id": None,
                    "row_number": 2,
                    "locality": {"datum": "95"},
                    "geocoorddetail": None,
                },
                {
                    "locality_id": None,
                    "row_number": 3,
                    "locality": {
                        "latitude1": 26.2,
                        "originallatlongunit": 0,
                        "lat1text": "26.2 N",
                    },
                    "geocoorddetail": None,
                },
                {
                    "locality_id": None,
                    "row_number": 4,
                    "locality": {},
                    "geocoorddetail": None,
                },
            ],
            [
                ParseError(
                    message="multipleLocalitiesWithGuid",
                    field=None,
                    payload={
                        "guid": localities[1][0],
                        "localityIds": _get_ids(localities[1][1]),
                    },
                    row_number=2,
                ),
                ParseError(
                    message="latitudeOutOfRange",
                    field="latitude1",
                    payload={"value": "96 N"},
                    row_number=2,
                ),
                ParseError(
                    message="longitudeOutOfRange",
                    field="longitude1",
                    payload={"value": "194 W"},
                    row_number=2,
                ),
                ParseError(
                    message="multipleLocalitiesWithGuid",
                    field=None,
                    payload={
                        "guid": localities[1][0],
                        "localityIds": _get_ids(localities[1][1]),
                    },
                    row_number=3,
                ),
                ParseError(
                    message="longitudeOutOfRange",
                    field="longitude1",
                    payload={"value": "197 E"},
                    row_number=3,
                ),
                ParseError(
                    message="noLocalityMatchingGuid",
                    field="guid",
                    payload={"guid": no_match_guid},
                    row_number=4,
                ),
            ],
        )

        expected_upload_result = dict(
            type="ParseError", errors=expected_parse_result[1]
        )
        expected_upload_from_parsed = None

        return (
            dataset,
            expected_parse_result,
            expected_upload_result,
            expected_upload_from_parsed,
            ProgressExpectation(4, 4),
        )

    def _geocoord_detail_parse(self):
        localities = self._make_locality([1, 3])
        no_match_guid = str(uuid4())

        dataset = [
            dict(
                guid=localities[0][0],
                # This will be ignored
                localityname="TestLocalityName",
                latitude1="45.2 N",
                longitude1="66.8 E",
                # This will also be ignored
                datum="",
                georefdetref="TestValue",
                integer1="Invalid Integer",
                georefdetdate="This is invalid date!",
            ),
            dict(
                guid=localities[1][0],
                # Even though there are multiple matches, the below error should
                # be reported.
                latitude1="96 N",
                longitude1="194 W",
                datum="95",
                integer1="40",
                georefdetdate="2025-11-07",
                source="Some source value!",
            ),
            dict(
                guid=localities[1][0],
                latitude1="26.2 N",
                longitude1="197 E",
                localityname="TestLocalityName2",
                yesno1="False",
            ),
            dict(
                guid=localities[1][0],
                datum="TestDatum",
                yesno1="Invalid Boolean value!",
            ),
            dict(guid=no_match_guid),
        ]
        expected_parse_result = (
            [
                {
                    "locality_id": localities[0][1][0].id,
                    "row_number": 1,
                    "locality": {
                        "latitude1": 45.2,
                        "originallatlongunit": 0,
                        "lat1text": "45.2 N",
                        "longitude1": 66.8,
                        "long1text": "66.8 E",
                    },
                    "geocoorddetail": {"georefdetref": "TestValue"},
                },
                {
                    "locality_id": None,
                    "row_number": 2,
                    "locality": {"datum": "95"},
                    "geocoorddetail": {
                        "source": "Some source value!",
                        "integer1": 40,
                        "georefdetdate": datetime.date(2025, 11, 7),
                    },
                },
                {
                    "locality_id": None,
                    "row_number": 3,
                    "locality": {
                        "latitude1": 26.2,
                        "originallatlongunit": 0,
                        "lat1text": "26.2 N",
                    },
                    "geocoorddetail": {"yesno1": False},
                },
                {
                    "locality_id": None,
                    "row_number": 4,
                    "locality": {"datum": "TestDatum"},
                    "geocoorddetail": None,
                },
                {
                    "locality_id": None,
                    "row_number": 5,
                    "locality": {},
                    "geocoorddetail": None,
                },
            ],
            [
                ParseError(
                    message="failedParsingDecimal",
                    field="integer1",
                    payload={"value": "Invalid Integer", "field": "integer1"},
                    row_number=1,
                ),
                ParseError(
                    message="invalidYear",
                    field="georefdetdate",
                    payload={"value": "This is invalid date!"},
                    row_number=1,
                ),
                ParseError(
                    message="multipleLocalitiesWithGuid",
                    field=None,
                    payload={
                        "guid": localities[1][0],
                        "localityIds": _get_ids(localities[1][1]),
                    },
                    row_number=2,
                ),
                ParseError(
                    message="latitudeOutOfRange",
                    field="latitude1",
                    payload={"value": "96 N"},
                    row_number=2,
                ),
                ParseError(
                    message="longitudeOutOfRange",
                    field="longitude1",
                    payload={"value": "194 W"},
                    row_number=2,
                ),
                ParseError(
                    message="multipleLocalitiesWithGuid",
                    field=None,
                    payload={
                        "guid": localities[1][0],
                        "localityIds": _get_ids(localities[1][1]),
                    },
                    row_number=3,
                ),
                ParseError(
                    message="longitudeOutOfRange",
                    field="longitude1",
                    payload={"value": "197 E"},
                    row_number=3,
                ),
                ParseError(
                    message="multipleLocalitiesWithGuid",
                    field=None,
                    payload={
                        "guid": localities[1][0],
                        "localityIds": _get_ids(localities[1][1]),
                    },
                    row_number=4,
                ),
                ParseError(
                    message="failedParsingBoolean",
                    field="yesno1",
                    payload={"value": "Invalid Boolean value!", "field": "yesno1"},
                    row_number=4,
                ),
                ParseError(
                    message="noLocalityMatchingGuid",
                    field="guid",
                    payload={"guid": no_match_guid},
                    row_number=5,
                ),
            ],
        )
        expected_upload_result = dict(
            type="ParseError", errors=expected_parse_result[1]
        )
        expected_upload_from_parsed = None

        return (
            dataset,
            expected_parse_result,
            expected_upload_result,
            expected_upload_from_parsed,
            ProgressExpectation(5, 5),
        )

    def _create_geocoorddetail(self, locality_id, count):
        geocoords = []
        for _ in range(count):
            gcd = Geocoorddetail.objects.create(locality_id=locality_id)
            geocoords.append(gcd)
        return geocoords

    def _geocoord_detail_for_upload(self):
        # In this case, the geocoord data contains the setup
        # necessary for the upload test (rather than failing during parse stage)
        # This is benefit of the class approach (we can reuse logic from other tests)
        dataset, (expected_parse_result, error), *_ = self._simple_locality_data()
        dataset[0]["source"] = "Some source value!"
        dataset[0]["integer1"] = "40"
        dataset[2]["yesno1"] = "False"

        expected_parse_result[0]["geocoorddetail"] = dict(
            source="Some source value!", integer1=40
        )
        expected_parse_result[2]["geocoorddetail"] = dict(yesno1=False)

        c1 = self._create_geocoorddetail(expected_parse_result[0]["locality_id"], 3)
        c2 = self._create_geocoorddetail(expected_parse_result[1]["locality_id"], 2)

        self._removable_coords.extend(_get_ids(c1))

        expected_upload_result = lambda: {
            "type": "Uploaded",
            "results": [
                {
                    "locality": expected_parse_result[0]["locality_id"],
                    "geocoorddetail": self._get_gcd_from_locality(
                        expected_parse_result[0]["locality_id"]
                    ),
                },
                {
                    "locality": expected_parse_result[1]["locality_id"],
                    "geocoorddetail": None,
                },
                {
                    "locality": expected_parse_result[2]["locality_id"],
                    "geocoorddetail": self._get_gcd_from_locality(
                        expected_parse_result[2]["locality_id"]
                    ),
                },
            ],
        }

        expected_upload_from_parse = expected_upload_result
        return (
            dataset,
            (expected_parse_result, error),
            expected_upload_result,
            expected_upload_from_parse,
            ProgressExpectation(3, 3),
        )

    def _get_gcd_from_locality(self, locality):
        # Here, the id will automatically make sure that more than 1 match gets caught.
        return Geocoorddetail.objects.get(locality_id=locality).id

    def _pre_upload_check(self):
        if self._removable_coords:
            self.assertTrue(
                Geocoorddetail.objects.filter(id__in=self._removable_coords).exists()
            )

    def _post_upload_check(self):
        if self._removable_coords:
            self.assertFalse(
                Geocoorddetail.objects.filter(id__in=self._removable_coords).exists()
            )

    def _assertValueMatches(self, obj, data):
        obj.refresh_from_db()
        for key, value in data.items():
            obj_value = getattr(obj, key)
            if value == None:
                self.assertIsNone(obj_value)
            compare_value = (
                float(obj_value) if isinstance(obj_value, Decimal) else obj_value
            )
            self.assertEqual(compare_value, value)

    def assertUploadResultMatches(self, upload_result, data):

        if upload_result["locality"]:
            self._assertValueMatches(
                Locality.objects.get(id=upload_result["locality"]), data["locality"]
            )

        if upload_result["geocoorddetail"]:
            self._assertValueMatches(
                Geocoorddetail.objects.get(id=upload_result["geocoorddetail"]),
                data["geocoorddetail"],
            )

    def _do_upload(self, test_name):
        (dataset, parsed, uploaded_or_error, _, __) = getattr(self, test_name)()
        headers, rows = self._make_dataset(dataset)

        self._pre_upload_check()

        result = upload_locality_set(self.collection, headers, rows, None)

        self._post_upload_check()

        if callable(uploaded_or_error):
            uploaded_or_error = uploaded_or_error()

        return result, uploaded_or_error, parsed

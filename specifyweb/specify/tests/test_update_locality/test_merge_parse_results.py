from specifyweb.specify.tests.test_update_locality.test_update_locality_context import (
    TestUpdateLocalityContext,
)
from specifyweb.specify.update_locality import (
    ParseError,
    ParseSuccess,
    merge_parse_results,
)


class TestMergeParseResult(TestUpdateLocalityContext):

    def test_merge_no_geocoord(self):

        parse_results = [
            ParseSuccess(dict(datum="Test"), "Locality", 5, 10),
            ParseError("failedParsingDecimal", "latitude1", None, 10),
            ParseError("failedParsingDecimal", "longitude1", None, 10),
        ]

        merge_result = merge_parse_results(parse_results, 5, 10)

        expected = (
            {
                "locality_id": 5,
                "row_number": 10,
                "locality": {"datum": "Test"},
                "geocoorddetail": None,
            },
            [
                ParseError(
                    message="failedParsingDecimal",
                    field="latitude1",
                    payload=None,
                    row_number=10,
                ),
                ParseError(
                    message="failedParsingDecimal",
                    field="longitude1",
                    payload=None,
                    row_number=10,
                ),
            ],
        )

        self._assert_parse_results_match(expected, merge_result)

    def test_merge_geocoord(self):

        parse_results = [
            ParseSuccess(dict(datum="Test"), "Locality", 5, 10),
            ParseSuccess(dict(remarks="TestRemarks"), "Geocoorddetail", 5, 10),
            ParseError("failedParsingDecimal", "latitude1", None, 10),
            ParseError("failedParsingDecimal", "longitude1", None, 10),
        ]
        merge_result = merge_parse_results(parse_results, 5, 10)
        expected = (
            {
                "locality_id": 5,
                "row_number": 10,
                "locality": {"datum": "Test"},
                "geocoorddetail": {"remarks": "TestRemarks"},
            },
            [
                ParseError(
                    message="failedParsingDecimal",
                    field="latitude1",
                    payload=None,
                    row_number=10,
                ),
                ParseError(
                    message="failedParsingDecimal",
                    field="longitude1",
                    payload=None,
                    row_number=10,
                ),
            ],
        )
        self._assert_parse_results_match(expected, merge_result)

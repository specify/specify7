from specifyweb.stored_queries.execution import getCoordinateColumns
from specifyweb.stored_queries.tests.test_execution.test_kml_context import (
    TestKMLContext,
)
from specifyweb.stored_queries.tests.utils import make_query_fields_test
from unittest import expectedFailure

get_id_incremented = lambda result: [
    (cell + 1 if cell != -1 else cell) for cell in result
]

expected_simple_results = [
    [-1, 2],
    [2, -1],
    [-1, 2],
    [2, -1],
    [3, 2, 5, 4],
    [3, 2, 5, 4, 6],
]


class TestGetCoordinateColumns(TestKMLContext):

    def test_no_locality_fields(self):
        _, query_fields = self.no_locality_fields()
        self.assertEqual(getCoordinateColumns(query_fields, False), [-1, -1])
        self.assertEqual(getCoordinateColumns(query_fields, True), [-1, -1])

    def test_direct_locality_fields(self):
        fields = self.direct_locality_fields()

        assert len(expected_simple_results) == len(fields)

        for field, expected_result in zip(list(fields), expected_simple_results):

            self.assertEqual(
                getCoordinateColumns(
                    make_query_fields_test("Locality", field)[1],
                    False,
                ),
                expected_result,
            )

            self.assertEqual(
                getCoordinateColumns(
                    make_query_fields_test("Locality", field)[1],
                    True,
                ),
                get_id_incremented(expected_result),
            )

    def test_to_one_locality_fields(self):
        raw_fields = self.to_one_locality_fields()

        simple_ce_fields = [["stationfieldnumber"], ["remarks"]]

        fields = [[*simple_ce_fields, *raw_field] for raw_field in raw_fields]

        for field, expected_result in zip(list(fields), expected_simple_results):

            expected_result = get_id_incremented(get_id_incremented(expected_result))

            self.assertEqual(
                getCoordinateColumns(
                    make_query_fields_test("Collectingevent", field)[1],
                    False,
                ),
                expected_result,
            )

            self.assertEqual(
                getCoordinateColumns(
                    make_query_fields_test("Collectingevent", field)[1],
                    True,
                ),
                get_id_incremented(expected_result),
            )

    @expectedFailure
    def test_formatted_fields(self):
        # This is a bug in the getCoordinateColumns function.
        # When the join path is empty, it doesn't increment the index.
        # But, this can happen in the cases where formatted is visible.
        _, fields = make_query_fields_test(
            "Locality",
            [
                [],
                ["createdbyagent"],
                ["geography"],
                ["discipline"],
                ["latitude1"],
                ["longitude1"],
            ],
        )

        self.assertEqual(
            getCoordinateColumns(
                fields,
                False,
            ),
            [5, 4],
        )

        self.assertEqual(
            getCoordinateColumns(
                fields,
                True,
            ),
            [6, 5],
        )

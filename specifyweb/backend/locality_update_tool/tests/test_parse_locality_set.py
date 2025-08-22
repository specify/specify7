from specifyweb.specify.tests.test_update_locality.test_update_locality_context import (
    TestUpdateLocalityContext,
)
from specifyweb.backend.locality_update_tool.update_locality import (
    LocalityUpdateStatus,
    parse_locality_set,
)

from unittest.mock import Mock, call


class TestParseLocalitySet(TestUpdateLocalityContext):

    parse_tests = [
        "_no_guid_in_header",
        "_locality_matches",
        "_locality_parse_invalid",
        "_geocoord_detail_parse",
        "_simple_locality_data",
        "_geocoord_detail_for_upload",
    ]


def make_test(test_name, add_progress=False):

    def test(self: TestParseLocalitySet):
        self.maxDiff = None
        mock = Mock()
        (dataset, expected, _, __, progress_exp) = getattr(self, test_name)()
        headers, rows = self._make_dataset(dataset)
        result = parse_locality_set(
            self.collection, headers, rows, mock if add_progress else None
        )
        self._assert_parse_results_match(result, expected)
        if not add_progress:
            return

        # Now, we validate that the calls are also expected.
        if progress_exp.expected == 0:
            mock.assert_not_called()
            return

        expected_calls = [
            call(LocalityUpdateStatus.PARSING, processed, progress_exp.total)
            for processed in range(1, progress_exp.expected + 1)
        ]

        self.assertEqual(expected_calls, mock.call_args_list)

    return test


for test_name in TestParseLocalitySet.parse_tests:
    setattr(TestParseLocalitySet, f"test{test_name}", make_test(test_name))
    setattr(
        TestParseLocalitySet, f"test_progress{test_name}", make_test(test_name, True)
    )

from unittest.mock import Mock, call
from specifyweb.specify.tests.test_update_locality.test_update_locality_context import (
    TestUpdateLocalityContext,
)
from specifyweb.specify.update_locality import (
    LocalityUpdateStatus,
    ParsedRow,
    upload_from_parsed,
)


class TestUploadFromParsed(TestUpdateLocalityContext):

    tests = ["_simple_locality_data", "_geocoord_detail_for_upload"]


def make_test(test_name, add_progress=False):

    def test(self: TestUploadFromParsed):
        mock = Mock()
        (_, (parsed, _), _, expected, progress_exp) = getattr(self, test_name)()

        self._pre_upload_check()

        result = upload_from_parsed(parsed, mock if add_progress else None)
        if callable(expected):
            # In some cases, we can't know the result till after the upload
            # has executed
            expected = expected()
        self.assertEqual(result, expected)
        for _result, _data in zip(result["results"], parsed):
            self.assertUploadResultMatches(_result, _data)

        self._post_upload_check()

        if not add_progress:
            return

        if progress_exp.expected == 0:
            mock.assert_not_called()
            return

        expected_calls = [
            call(LocalityUpdateStatus.PROGRESS, processed, progress_exp.total)
            for processed in range(1, progress_exp.expected + 1)
        ]

        self.assertEqual(expected_calls, mock.call_args_list)

    return test


for test_name in TestUploadFromParsed.tests:
    setattr(TestUploadFromParsed, f"test{test_name}", make_test(test_name))
    setattr(
        TestUploadFromParsed, f"test_progress{test_name}", make_test(test_name, True)
    )

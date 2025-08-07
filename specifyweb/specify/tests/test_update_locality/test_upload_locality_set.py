from specifyweb.specify.tests.test_update_locality.test_update_locality_context import (
    TestUpdateLocalityContext,
)
from specifyweb.specify.update_locality import upload_locality_set


class TestUploadLocalitySet(TestUpdateLocalityContext):

    parse_and_upload_tests = [
        "_no_guid_in_header",
        "_locality_matches",
        "_locality_parse_invalid",
        "_geocoord_detail_parse",
        "_simple_locality_data",
        "_geocoord_detail_for_upload",
    ]


def make_test(test_name):

    def test(self: TestUploadLocalitySet):

        result, uploaded_or_error, parsed = self._do_upload(test_name)

        if result["type"] == "ParseError":
            self.assertEqual(uploaded_or_error["type"], "ParseError")
            self.assertCountEqual(uploaded_or_error["errors"], result["errors"])
        else:
            self.assertEqual(uploaded_or_error["type"], "Uploaded")
            # Here, the order should be the same...
            self.assertEqual(uploaded_or_error["results"], result["results"])
            for _result, _data in zip(result["results"], parsed[0]):
                self.assertUploadResultMatches(_result, _data)

    return test


for test_name in TestUploadLocalitySet.parse_and_upload_tests:
    setattr(TestUploadLocalitySet, f"test{test_name}", make_test(test_name))

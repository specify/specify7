from specifyweb.notifications.models import LocalityUpdate, LocalityUpdateRowResult

from uuid import uuid4

from specifyweb.specify.tests.test_update_locality.test_update_locality_context import (
    TestUpdateLocalityContext,
)
from specifyweb.specify.update_locality import (
    LocalityUpdateStatus,
    resolve_localityupdate_result,
)


class TestResolveLocalityUpdateResult(TestUpdateLocalityContext):

    parse_and_upload_tests = [
        # "_no_guid_in_header", -- This is currently skipped.
        "_locality_matches",
        "_locality_parse_invalid",
        "_geocoord_detail_parse",
        "_simple_locality_data",
        "_geocoord_detail_for_upload",
    ]

    def setUp(self):
        super().setUp()
        taskid = str(uuid4())
        LocalityUpdate.objects.all().delete()
        self.lu = LocalityUpdate.objects.create(
            taskid=taskid, specifyuser=self.specifyuser, collection=self.collection
        )
        self.taskid = taskid


def make_test(test_name, use_parse_locality_set=True):

    def test_parse(self: TestResolveLocalityUpdateResult):
        _, parsed, *_ = getattr(self, test_name)()
        resolve_localityupdate_result(self.taskid, parsed, self.collection)
        to_upload, errors = parsed
        self.lu.refresh_from_db()

        if len(errors) > 0:
            self.assertEqual(self.lu.status, LocalityUpdateStatus.PARSE_FAILED)
            for error in errors:
                result = error.to_json()
                self.assertTrue(
                    LocalityUpdateRowResult.objects.filter(
                        localityupdate=self.lu, rownumber=result["rowNumber"]
                    ).exists(),
                    f"couldn't find for {error.to_json()}",
                )
            self.assertEqual(
                LocalityUpdateRowResult.objects.filter(localityupdate=self.lu).count(),
                len(errors),
            )
            return

        self.assertEqual(self.lu.status, LocalityUpdateStatus.PARSED)
        for parsed in to_upload:
            self.assertTrue(
                LocalityUpdateRowResult.objects.filter(
                    localityupdate=self.lu, rownumber=parsed["row_number"]
                ).exists(),
                f"couldn't find for {parsed}",
            )
        self.assertEqual(
            LocalityUpdateRowResult.objects.filter(localityupdate=self.lu).count(),
            len(to_upload),
        )

    def test_upload_result(self: TestResolveLocalityUpdateResult):
        _, uploaded_or_error, _ = self._do_upload(test_name)

        resolve_localityupdate_result(self.taskid, uploaded_or_error, self.collection)

        self.lu.refresh_from_db()
        if uploaded_or_error["type"] == "ParseError":
            self.assertEqual(self.lu.status, LocalityUpdateStatus.PARSE_FAILED)
            for error in uploaded_or_error["errors"]:
                result = error.to_json()
                self.assertTrue(
                    LocalityUpdateRowResult.objects.filter(
                        localityupdate=self.lu, rownumber=error.row_number
                    ).exists(),
                    f"couldn't find for {result}",
                )
            self.assertEqual(
                LocalityUpdateRowResult.objects.filter(localityupdate=self.lu).count(),
                len(uploaded_or_error["errors"]),
            )
            return

        self.assertEqual(uploaded_or_error["type"], "Uploaded")
        self.assertEqual(self.lu.status, LocalityUpdateStatus.SUCCEEDED)
        for i in range(len(uploaded_or_error["results"])):
            self.assertTrue(
                LocalityUpdateRowResult.objects.filter(
                    localityupdate=self.lu, rownumber=i + 1
                ).exists(),
                f"couldn't find for {uploaded_or_error['results'][i]}",
            )
        self.assertEqual(
            LocalityUpdateRowResult.objects.filter(localityupdate=self.lu).count(),
            len(uploaded_or_error["results"]),
        )

    return test_parse if use_parse_locality_set else test_upload_result


for test_name in TestResolveLocalityUpdateResult.parse_and_upload_tests:

    setattr(
        TestResolveLocalityUpdateResult,
        f"test_upload{test_name}",
        make_test(test_name, False),
    )
    setattr(
        TestResolveLocalityUpdateResult,
        f"test_parse{test_name}",
        make_test(test_name, True),
    )

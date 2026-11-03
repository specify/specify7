from unittest import skip
from unittest.mock import Mock, patch
from django import http
from django.test import SimpleTestCase
from specifyweb.backend.merge.record_merging import FailedMergingException, resolve_record_merge_response
from specifyweb.backend.stored_queries.access import QueryWriteDenied
from specifyweb.specify.tests.test_api import ApiTests


class TestQueryMergeDenialResponse(SimpleTestCase):
    def test_query_write_denial_returns_403_without_traceback(self):
        error = QueryWriteDenied("Only the query owner can modify its definition.")
        for silent in (True, False):
            with self.subTest(silent=silent):
                merge = Mock(side_effect=error)
                with patch(
                    "specifyweb.backend.merge.record_merging.traceback.format_exc"
                ) as format_traceback:
                    response = resolve_record_merge_response(merge, silent=silent)

                self.assertEqual(response.status_code, 403)
                self.assertJSONEqual(response.content, error.to_json())
                format_traceback.assert_not_called()
                merge.assert_called_once_with()


class TestResolveRecordMergeResponse(ApiTests):

    def test_no_error(self):
        response = resolve_record_merge_response(lambda: None)
        self._assertStatusCodeEqual(response, 204)
        self._assertContentEqual(response, "")

    def _raise_error(self, error):
    
        def _raise():
            raise error
        return _raise
    
    def test_failed_merging_exception(self):

        not_found = http.HttpResponseNotFound("model_name: Agent does not exist.")
        
        response = resolve_record_merge_response(
            self._raise_error(
                FailedMergingException(not_found)
                )
            )
        
        self.assertEqual(response, not_found)

    def test_silent_error(self):

        response = resolve_record_merge_response(
            self._raise_error(Exception("Trying to merge into itself!")),
        )
        
        self._assertStatusCodeEqual(response, http.HttpResponseServerError.status_code)
        self.assertTrue("Trying to merge into itself!" in response.content.decode())

    @skip("The type comparison in record merging is incorrect")
    def test_not_found_not_silent(self):
        not_found = http.HttpResponseNotFound("model_name: Agent does not exist.")
        response = resolve_record_merge_response(
            self._raise_error(
                Exception(not_found)
                ),
            silent=False
            )
        
        self.assertEqual(response, not_found)

    def test_not_silent_error(self):
        exception = Exception("Some generic exception!")

        with self.assertRaises(Exception) as context:
            response = resolve_record_merge_response(
                self._raise_error(exception),
                silent=False
            )
        
        self.assertEqual(context.exception, exception)

from unittest.mock import Mock, patch
from specifyweb.specify.tests.test_api import ApiTests
from specifyweb.specify.views import upload_locality_set_foreground

def get_success_result(*args, **kwargs):
    success_result = dict(type="Uploaded", results=[])
    return success_result

def get_failure_result(*args, **kwargs):
    failure_result = dict(type="ParseError", errors=[])
    return failure_result

# NOTE: The function _upload_locality_set is currently mocked.
# When tests are added for the specifyweb.specify.upload_locality.py file, comprehensive tests for
# specifyweb.specify.upload_locality.upload_locality_set need to be added.
class TestUploadLocalitySetForeground(ApiTests):


    @patch('specifyweb.specify.views._upload_locality_set', get_success_result)
    def test_success(self):

        result = upload_locality_set_foreground(
            self.collection,
            self.specifyuser,
            self.agent,
            ["localityname"],
            [],
            False
        )

        self.assertEqual(result, dict(type="Uploaded", results=[], recordsetid=None))


    @patch('specifyweb.specify.views.create_localityupdate_recordset')
    @patch('specifyweb.specify.views._upload_locality_set', get_success_result)
    def test_success_record_set(self, create_recordset: Mock):
        recordset = Mock()
        recordset.pk = 9
        create_recordset.return_value = recordset

        result = upload_locality_set_foreground(
            self.collection,
            self.specifyuser,
            self.agent,
            ["localityname"],
            [],
            True
        )

        self.assertEqual(result, dict(type="Uploaded", results=[], recordsetid=9))

    @patch('specifyweb.specify.views._upload_locality_set', get_failure_result)
    def test_failure(self):

        result = upload_locality_set_foreground(
            self.collection,
            self.specifyuser,
            self.agent,
            ["localityname"],
            [],
            True
        )

        self.assertEqual(result, dict(type="ParseError", errors=[]))
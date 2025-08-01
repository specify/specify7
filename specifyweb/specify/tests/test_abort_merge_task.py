from unittest import skip
from unittest.mock import Mock, patch
from django import http
from django.test import Client
from specifyweb.notifications.models import Message, Spmerging
from specifyweb.specify.tests.test_api import ApiTests

class MockResult:

    def __init__(self, state):
        self.state = state

class TestAbortMerge(ApiTests):

    def setUp(self):
        super().setUp()
        c = Client()
        c.force_login(self.specifyuser)
        self.c = c
    
    @skip(".get() in abort_merge_task is not correct")
    def test_merge_not_found(self):
        task_id = "aaaa"

        response = self.c.post(f"/api/specify/merge/abort/{task_id}/")

        self._assertStatusCodeEqual(response, http.HttpResponseNotFound.status_code)

    def _revoke_setup(self, record_merge_task: Mock, app_control: Mock, state):
        Message.objects.all().delete()

        test_id = "aaaa"
        merge_obj = Spmerging.objects.create(
            taskid=test_id,
            collection=self.collection,
            specifyuser=self.specifyuser,
            table="Agent",
            newrecordid=5
        )
        record_merge_task.AsyncResult = Mock(return_value=MockResult(state))
        app_control.revoke = Mock(return_value=None)

        response = self.c.post(f"/api/specify/merge/abort/{test_id}/")

        self._assertStatusCodeEqual(response, 200)

        merge_obj.refresh_from_db()
        return (test_id, merge_obj, response)
    
    def _revoke_test(self, record_merge_task: Mock, app_control: Mock, state):

        test_id, merge_obj, response = self._revoke_setup(record_merge_task, app_control, state)

        self.assertEqual(merge_obj.status, "ABORTED")
        self.assertEqual(
            response.content.decode(),
            f'Task {merge_obj.taskid} has been aborted.'
            )
        
        self.assertEqual(Message.objects.all().count(), 1)
        record_merge_task.AsyncResult.assert_called_once_with(test_id)
        app_control.revoke.assert_called_once_with(test_id, terminate=True)

    @patch("specifyweb.specify.views.app.control")
    @patch("specifyweb.specify.views.record_merge_task")
    def test_revoke_pending(self, record_merge_task: Mock, app_control: Mock):
        self._revoke_test(record_merge_task, app_control, "PENDING")

    @patch("specifyweb.specify.views.app.control")
    @patch("specifyweb.specify.views.record_merge_task")
    def test_revoke_merging(self, record_merge_task: Mock, app_control: Mock):
        self._revoke_test(record_merge_task, app_control, "MERGING")


    @patch("specifyweb.specify.views.app.control")
    @patch("specifyweb.specify.views.record_merge_task")
    def test_no_revoke(self, record_merge_task: Mock, app_control: Mock):
        test_id, merge_obj, response = self._revoke_setup(record_merge_task, app_control, "ABORTED")

        self.assertEqual(
            response.content.decode(),
            f'Task {test_id} is not running and cannot be aborted.'
            )
        
        self.assertEqual(Message.objects.all().count(), 0)
        record_merge_task.AsyncResult.assert_called_once_with(test_id)
        app_control.revoke.assert_not_called()
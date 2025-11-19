from unittest.mock import Mock, patch
from django import http
from django.test import Client
from specifyweb.backend.notifications.models import LocalityUpdate, Message
from specifyweb.specify.tests.test_api import ApiTests
from specifyweb.backend.locality_update_tool.update_locality import LocalityUpdateStatus

import json

class TestAbortLocalityUpdateTask(ApiTests):
    
    def setUp(self):
        super().setUp()
        c = Client()
        c.force_login(self.specifyuser)
        self.c = c

    def test_locality_update_not_exist(self):
        
        taskid = 'aaaa'
        response = self.c.post(f'/locality_update_tool/localityset/abort/{taskid}/')

        self._assertStatusCodeEqual(response, http.HttpResponseNotFound.status_code)
        self.assertEqual(response.content.decode(), f"The localityupdate with taskid: {taskid} is not found" )

    def _revoke_test(self, taskid, state, callback: Mock, revoke_callback: Mock):

        Message.objects.all().delete()
        
        mock_result = Mock()
        mock_result.state = state
        callback.return_value = mock_result

        lu = LocalityUpdate.objects.create(
            taskid=taskid,
            specifyuser=self.specifyuser,
            collection=self.collection
        )

        response = self.c.post(f'/locality_update_tool/localityset/abort/{taskid}/')

        self._assertStatusCodeEqual(response, 200)

        self.assertEqual(Message.objects.all().count(), 1)
        
        lu.refresh_from_db()
        self.assertEqual(lu.status, LocalityUpdateStatus.ABORTED)

        revoke_callback.assert_called_once_with(
            taskid, terminate=True
        )

        self.assertEqual(
            json.loads(response.content.decode()),
            dict(type="ABORTED", message=f'Task {taskid} has been aborted.' )    
        )
    
    @patch('specifyweb.backend.merge.record_merging.record_merge_task.app.control.revoke')
    @patch('specifyweb.backend.merge.record_merging.record_merge_task.AsyncResult')
    def test_revoke_pending(self, AsyncResult, revoke):
        self._revoke_test("aaaa", LocalityUpdateStatus.PENDING, AsyncResult, revoke)

    @patch('specifyweb.backend.merge.record_merging.record_merge_task.app.control.revoke')
    @patch('specifyweb.backend.merge.record_merging.record_merge_task.AsyncResult')
    def test_revoke_parsing(self, AsyncResult, revoke):
        self._revoke_test("aaaa", LocalityUpdateStatus.PARSING, AsyncResult, revoke)


    @patch('specifyweb.backend.merge.record_merging.record_merge_task.app.control.revoke')
    @patch('specifyweb.backend.merge.record_merging.record_merge_task.AsyncResult')
    def test_revoke_progress(self, AsyncResult, revoke):
        self._revoke_test("aaaa", LocalityUpdateStatus.PROGRESS, AsyncResult, revoke)

    @patch('specifyweb.backend.merge.record_merging.record_merge_task.app.control.revoke')
    @patch('specifyweb.backend.merge.record_merging.record_merge_task.AsyncResult')
    def test_not_running(self, AsyncResult, revoke):

        taskid = "aaaa"

        Message.objects.all().delete()
        
        mock_result = Mock()
        mock_result.state = LocalityUpdateStatus.PARSE_FAILED
        AsyncResult.return_value = mock_result

        lu = LocalityUpdate.objects.create(
            taskid=taskid,
            specifyuser=self.specifyuser,
            collection=self.collection,
            status=LocalityUpdateStatus.PARSE_FAILED
        )

        response = self.c.post(f'/locality_update_tool/localityset/abort/{taskid}/')

        self._assertStatusCodeEqual(response, 200)

        self.assertEqual(Message.objects.all().count(), 0)
        
        lu.refresh_from_db()

        # No change.
        self.assertEqual(lu.status, LocalityUpdateStatus.PARSE_FAILED)

        revoke.assert_not_called()

        self.assertEqual(
            json.loads(response.content.decode()),
            dict(type="NOT_RUNNING", message=f'Task {taskid} is not running and cannot be aborted')    
        )
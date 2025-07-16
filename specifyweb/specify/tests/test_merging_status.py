from django import http
from django.test import Client

from specifyweb.backend.notifications.models import Spmerging
from specifyweb.specify.tests.test_api import ApiTests

from unittest.mock import patch, Mock
import json

class MockResult(object):
    
    def __init__(self, info):
        self.info = info

class TestMergingStatus(ApiTests):

    def test_not_found(self):
        c = Client()
        c.force_login(self.specifyuser)

        response = c.get("/api/specify/merge/status/aaaa/")

        self.assertEqual(response.status_code, http.HttpResponseNotFound.status_code)
        self.assertEqual(response.content.decode(), 'The merge task id is not found: aaaa')

    def _existing_merge(self, info, record_merge_task):
        record_merge_task.AsyncResult = Mock(return_value=MockResult(info))
        Spmerging.objects.create(
            taskid="aaaa",
            collection=self.collection,
            specifyuser=self.specifyuser
        )

        c = Client()
        c.force_login(self.specifyuser)

        response = c.get("/api/specify/merge/status/aaaa/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            json.loads(response.content.decode()),
            {'response': '',
             'taskid': 'aaaa',
             'taskprogress': info if isinstance(info, dict) else repr(info),
             'taskstatus': ''
            }
        )
        
    @patch("specifyweb.specify.views.record_merge_task")
    def test_existing_merge_dict_info(self, record_merge_task: Mock):

        self._existing_merge(dict(key="value"), record_merge_task)

    @patch("specifyweb.specify.views.record_merge_task")
    def test_existing_merge_simple_info(self, record_merge_task: Mock):

        self._existing_merge("some simple str", record_merge_task)
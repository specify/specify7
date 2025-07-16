from unittest.mock import Mock, patch
from django import http
from django.test import Client
from specifyweb.celery_tasks import CELERY_TASK_STATE
from specifyweb.notifications.models import LocalityUpdate, LocalityUpdateRowResult
from specifyweb.specify.tests.test_api import ApiTests
from django.core.serializers.json import DjangoJSONEncoder

import json

from specifyweb.specify.update_locality import LocalityUpdateStatus

class TestLocalityUpdateStatus(ApiTests):

    def setUp(self):
        super().setUp()
        c = Client()
        c.force_login(self.specifyuser)
        self.c = c

    def _create_locality_update(self, taskid, **kwargs):
        return LocalityUpdate.objects.create(
            taskid=taskid,
            specifyuser=self.specifyuser,
            collection=self.collection,
            **kwargs
        )
    
    def test_localityupdate_not_exist(self):
        
        task_id = "aaaa"
        response = self.c.get(
            f"/api/localityset/status/{task_id}/"
        )

        self._assertStatusCodeEqual(response, http.HttpResponseNotFound.status_code)
        self.assertEqual(response.content.decode(), f"The localityupdate with task id '{task_id}' was not found")

    @patch("specifyweb.specify.views.update_locality_task.AsyncResult")
    def test_failed(self, AsyncResult: Mock):
        mock_result = Mock()
        mock_result.state = CELERY_TASK_STATE.FAILURE
        mock_result.info = None
        mock_result.result = "MockResult"
        mock_result.traceback = "MockTraceback"

        AsyncResult.return_value = mock_result

        task_id = "aaaa"

        self._create_locality_update(task_id)

        response = self.c.get(
            f"/api/localityset/status/{task_id}/"
        )

        self._assertStatusCodeEqual(response, 200)

        result = json.loads(response.content.decode())
        
        self.assertEqual(
            result, 
            {
                "taskstatus": "FAILED", 
                "taskinfo": 
                    {
                        "error": "MockResult", 
                        "traceback": "MockTraceback"
                    }
            }
        )

    @patch("specifyweb.specify.views.update_locality_task.AsyncResult")
    def test_parse_failed(self, AsyncResult: Mock):
        mock_result = Mock()
        mock_result.state = CELERY_TASK_STATE.SUCCESS
        mock_result.info = {"errors": []}

        AsyncResult.return_value = mock_result

        task_id = "aaaa"

        self._create_locality_update(task_id, status=LocalityUpdateStatus.PARSE_FAILED)

        response = self.c.get(
            f"/api/localityset/status/{task_id}/"
        )

        self._assertStatusCodeEqual(response, 200)

        result = json.loads(response.content.decode())

        self.assertEqual(
            result,
            {
                'taskstatus': 'PARSE_FAILED', 
                'taskinfo': {'errors': [] }
            }
        )
    
    @patch("specifyweb.specify.views.update_locality_task.AsyncResult")
    def test_parsed(self, AsyncResult: Mock):
        mock_result = Mock()
        mock_result.state = CELERY_TASK_STATE.SUCCESS
        mock_result.info = {}

        AsyncResult.return_value = mock_result

        task_id = "aaaa"

        lu = self._create_locality_update(task_id, status=LocalityUpdateStatus.PARSED)
        static_results = [
            dict(
                row_number=0,
                locality={'localityname': "Test"},
                geocoorddetail={"text1": "Text"},
                locality_id=5
            ),
            dict(
                row_number=1,
                locality={'guid': "TestGuid"},
                geocoorddetail=None,
                locality_id=6
            )
        ]

        for parsed in static_results:
            LocalityUpdateRowResult.objects.create(
                localityupdate=lu,
                rownumber=parsed["row_number"],
                result=json.dumps(parsed, cls=DjangoJSONEncoder)
            )
        
        response = self.c.get(
            f"/api/localityset/status/{task_id}/"
        )

        self._assertStatusCodeEqual(response, 200)

        result = json.loads(response.content.decode())

        self.assertEqual(
            result, 
            {
                'taskstatus': 'PARSED', 
                'taskinfo': {
                    'rows': static_results
                }
            }
        )

    @patch("specifyweb.specify.views.update_locality_task.AsyncResult")
    def test_succeeded(self, AsyncResult: Mock):
        mock_result = Mock()
        mock_result.state = LocalityUpdateStatus.SUCCEEDED
        mock_result.info = dict(localities=[5, 6, 7, 8], geocoorddetails=[4, 5, 6, 7])

        AsyncResult.return_value = mock_result

        task_id = "aaaa"

        self._create_locality_update(task_id, status=LocalityUpdateStatus.SUCCEEDED)

        response = self.c.get(
            f"/api/localityset/status/{task_id}/"
        )

        self._assertStatusCodeEqual(response, 200)

        result = json.loads(response.content.decode())

        self.assertEqual(
            result, 
            {
                'taskstatus': 'SUCCEEDED', 
                'taskinfo': {
                    'recordsetid': None, 
                    'localities': [5, 6, 7, 8], 
                    'geocoorddetails': [4, 5, 6, 7]
                }
            }
        )

    @patch("specifyweb.specify.views.update_locality_task.AsyncResult")
    def test_succeeded_locality_rows(self, AsyncResult: Mock):
        mock_result = Mock()
        mock_result.state = LocalityUpdateStatus.SUCCEEDED
        mock_result.info = None

        AsyncResult.return_value = mock_result

        task_id = "aaaa"

        lu  = self._create_locality_update(task_id, status=LocalityUpdateStatus.SUCCEEDED)
        
        static_results = [
            dict(
                row_number=0,
                locality=4,
                geocoorddetail=3,
            ),
            dict(
                row_number=1,
                locality=3,
                geocoorddetail=None,
            )
        ]

        for parsed in static_results:
            LocalityUpdateRowResult.objects.create(
                localityupdate=lu,
                rownumber=parsed["row_number"],
                result=json.dumps(parsed, cls=DjangoJSONEncoder)
            )

        response = self.c.get(
            f"/api/localityset/status/{task_id}/"
        )

        self._assertStatusCodeEqual(response, 200)

        result = json.loads(response.content.decode())

        self.assertEqual(
            result, 
            {
                'taskstatus': 'SUCCEEDED', 
                'taskinfo': {
                    'recordsetid': None, 
                    'localities': [4, 3], 
                    'geocoorddetails': [3]
                }
            }
        )
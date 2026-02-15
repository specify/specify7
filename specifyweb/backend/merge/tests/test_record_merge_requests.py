from typing import Dict, Any
from django import http
from django.test import Client
from specifyweb.backend.notifications.models import Spmerging, Message
from specifyweb.backend.permissions.models import UserPolicy
from specifyweb.specify.models import Agent
from specifyweb.specify.tests.test_api import ApiTests

import json
from unittest.mock import Mock, patch

class MockResult:

    def __init__(self, _id):
        self.id = _id

class TestMergeContext:
    _data: dict[str, Any]

    def __init__(self):
        self._data = {}

    def setup(self):
        self._data['init_count'] = Spmerging.objects.all().count()
        self._data['init_msg_count'] = Message.objects.all().count()

    def check(self, tester: "TestRecordMergeRequests"):

        self._data['later_count'] = Spmerging.objects.all().count()
        self._data['later_msg_count'] = Message.objects.all().count()
        # vals = Spmerging.objects.all().values_list('status', 'taskid', 'newrecordata')
        # # print(f"\n\n\n\nVALS: \n{vals}\n\n\n\n")
        # # print("\n\nNEW COUNT: \n\n\n", self._data['later_count'])
        tester.assertEqual(self._data['later_count'] - self._data['init_count'], 1)
        tester.assertEqual(self._data['later_msg_count'] - self._data['init_msg_count'], 1)


class TestRecordMergeRequests(ApiTests):

    def setUp(self):
        super().setUp()
        c = Client()
        c.force_login(self.specifyuser)
        self.c = c

    def _check_permission_enforced(self, background):

        UserPolicy.objects.all().delete()

        UserPolicy.objects.create(
            collection_id=self.collection.id,
            specifyuser_id=self.specifyuser.id,
            resource='/system/sp7/collection',
            action='access'
        )

        agent_1 = Agent.objects.create(
            agenttype=0,
            division=self.division
        )

        agent_2 = Agent.objects.create(
            agenttype=0,
            division=self.division
        )

        response = self.c.post(
            f'/merge/agent/replace/{agent_2.id}/',
            data=json.dumps({
                'old_record_ids': [agent_1.id],
                'background': background
            }),
            content_type='application/json'
        )

        self.assertEqual(response.status_code, http.HttpResponseForbidden.status_code)

        content = json.loads(response.content.decode())
        expected_content = {
            'NoMatchingRuleException': [
                {'collectionid': self.collection.id, 'userid': self.specifyuser.id, 'resource': '/record/merge', 'action': 'update'},
                {'collectionid': self.collection.id, 'userid': self.specifyuser.id, 'resource': '/record/merge', 'action': 'delete'}
                ]
        }

        self.assertEqual(content, expected_content)

        for (resource, action) in [('/record/merge', 'update'), ('/record/merge', 'delete')]:
            UserPolicy.objects.create(
                collection_id=self.collection.id,
                specifyuser_id=self.specifyuser.id,
                resource=resource,
                action=action
            )

        response = self.c.post(
            f'/merge/agent/replace/{agent_2.id}/',
            data=json.dumps({
                'old_record_ids': [agent_1.id],
                'background': background
            }),
            content_type='application/json'
        )

        return response

    def _assert_invalid_request(self, response: http.HttpResponse):
        self.assertEqual(response.status_code, http.HttpResponseBadRequest.status_code)
        self.assertEqual(
            response.content.decode(),
            "There were no old record IDs given to be replaced by the new ID.")

    def _check_no_old_record_id(self, background: bool):
        agent_1 = Agent.objects.create(
            agenttype=0,
            division=self.division
        )
        response = self.c.post(
            f'/merge/agent/replace/{agent_1.id}/',
            data=json.dumps({
                'old_record_ids': None,
                'background': background
            }),
            content_type='application/json'
        )
        self._assert_invalid_request(response)

        response = self.c.post(
            f'/merge/agent/replace/{agent_1.id}/',
            data=json.dumps({
                'old_record_ids': [],
                'background': background
            }),
            content_type='application/json'
        )
        self._assert_invalid_request(response)

    @patch("specifyweb.specify.views.record_merge_task")
    def test_permissions_enforced_background(self, record_merge_task):
        test_id = "UUID_TEST_ID"
        _apply_async = Mock(return_value=MockResult(test_id))
        record_merge_task.apply_async = _apply_async

        response = self._check_permission_enforced(background=True)
        self._assertStatusCodeEqual(response, 200)
        _apply_async.assert_called_once()

    def test_permissions_enforced_foreground(self):
        response = self._check_permission_enforced(background=False)
        self._assertStatusCodeEqual(response, 204)

    def test_check_no_old_record_id_background(self):
        self._check_no_old_record_id(background=True)

    def test_check_no_old_record_id_foreground(self):
        self._check_no_old_record_id(background=False)

    def _validate_merge_setup(
            self,
            task_id,
            new_model_id,
            old_model_ids,
            new_record_data,
            model_name='agent'
        ):
        filter_params = dict(
            name="Merge_" + model_name + "_" + str(new_model_id),
            taskid=task_id,
            status="MERGING",
            table=model_name.title(),
            newrecordid=new_model_id,
        )
        self.assertTrue(Spmerging.objects.filter(**filter_params).exists())

    @patch("specifyweb.specify.views.uuid4")
    @patch("specifyweb.specify.views.record_merge_task")
    def test_other_merge_no_result(self, record_merge_task, uuid4):

        def __async_result(taskid):
            if taskid == '1':
                return True
            raise Exception(f"unexpected value!: {repr(taskid)}")

        test_id = "UUID_TEST_ID"
        uuid4.return_value = test_id

        _apply_async = Mock(return_value=MockResult(test_id))
        _async_result = Mock(wraps=__async_result)

        record_merge_task.AsyncResult = _async_result
        record_merge_task.apply_async = _apply_async

        old_merge = Spmerging.objects.create(
            taskid='1',
            specifyuser=self.specifyuser,
            collection=self.collection,
            status="MERGING"
        )

        agent_1 = Agent.objects.create(
            agenttype=0,
            division=self.division
        )

        agent_2 = Agent.objects.create(
            agenttype=0,
            division=self.division
        )

        test_context = TestMergeContext()
        test_context.setup()

        response = self.c.post(
            f'/merge/agent/replace/{agent_1.id}/',
            data=json.dumps({
                'old_record_ids': [agent_2.id],
                'background': True
            }),
            content_type='application/json'
        )

        self._assertStatusCodeEqual(response, 200)

        self.assertEqual(json.loads(response.content.decode()), test_id)

        test_context.check(self)

        old_merge.refresh_from_db()

        self.assertEqual(old_merge.status, "FAILED")

        self._validate_merge_setup(
            test_id,
            agent_1.id,
            [agent_2.id],
            None,
        )

        _apply_async.assert_called_once()
        _async_result.assert_called_once()
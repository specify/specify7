from unittest.mock import Mock, patch
from specifyweb.backend.notifications.models import LocalityUpdate, Message
from specifyweb.specify.tests.test_api import ApiTests
from uuid import uuid4 as base_uuid4

from specifyweb.backend.locality_update_tool.update_locality import LocalityUpdateStatus
from specifyweb.specify.views import start_locality_set_background


class TestStartLocalityBackground(ApiTests):

    def _test_start_locality_set(self, parse_only: bool, task: Mock, uuid4: Mock):
        Message.objects.all().delete()
        LocalityUpdate.objects.all().delete()

        static_uuid = str(base_uuid4())
        uuid4.return_value = static_uuid
        task_mock = Mock()
        task_mock.id = static_uuid

        task.apply_async.return_value = task_mock
        column_headers = ["localityname"]
        data = [["TestName"]]

        result = start_locality_set_background(
            self.collection,
            self.specifyuser,
            self.agent,
            column_headers,
            data,
            parse_only=parse_only
        )

        self.assertEqual(result, static_uuid)
        task.apply_async.assert_called_once()

        self.assertEqual(Message.objects.all().count(), 1)
        self.assertExists(LocalityUpdate.objects.filter(
            taskid=static_uuid,
            status=LocalityUpdateStatus.PENDING,
            collection_id=self.collection.id,
            specifyuser_id=self.specifyuser.id,
            createdbyagent_id=self.agent.id,
            modifiedbyagent_id=self.agent.id
        ))

    @patch('specifyweb.specify.views.uuid4')
    @patch('specifyweb.specify.views.parse_locality_task')
    def test_parse_only_task(self, parse_locality_task: Mock, uuid4: Mock):
        self._test_start_locality_set(True, parse_locality_task, uuid4)

    @patch('specifyweb.specify.views.uuid4')
    @patch('specifyweb.specify.views.update_locality_task')
    def test_upload_task(self, update_locality_task: Mock, uuid4: Mock):
        self._test_start_locality_set(False, update_locality_task, uuid4)
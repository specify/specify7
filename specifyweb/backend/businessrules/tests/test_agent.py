import unittest
from unittest.mock import patch

from specifyweb.specify import models
from specifyweb.specify.api.crud import delete_resource, post_resource
from specifyweb.specify.api.serializers import uri_for_model
from specifyweb.specify.tests.test_api import ApiTests
from ..exceptions import BusinessRuleException

class AgentTests(ApiTests):
    def test_agent_delete_cascades(self):
        agent = models.Agent.objects.create(
            agenttype=0,
            firstname="Test",
            lastname="Agent",
            division=self.division,)

        agent.addresses.create(address="somewhere")

        geography = models.Geography.objects.create(
            name="Earth",
            definition=self.geographytreedef,
            definitionitem=self.geographytreedef.treedefitems.all()[0]
            )
        agent.agentgeographies.create(geography=geography)

        agent.agentspecialties.create(
            ordernumber=0,
            specialtyname="testing")

        agent.delete()

    @patch('specifyweb.backend.attachment_gw.views.delete_attachment_file')
    def test_delete_attachment_from_agent(self, delete_file):
        join = post_resource(
            self.collection,
            self.agent,
            'agentattachment',
            {
                'agent': uri_for_model('agent', self.agent.id),
                'ordinal': 0,
                'attachment': {
                    'origfilename': 'agent.jpg',
                    'attachmentlocation': 'uploaded-agent.jpg',
                    'mimetype': 'image/jpeg',
                    'title': 'Agent attachment',
                },
            },
        )
        attachment_id = join.attachment_id

        delete_resource(
            self.collection,
            self.agent,
            'agentattachment',
            join.id,
            join.version,
        )

        self.assertNotExists(models.Agentattachment.objects.filter(id=join.id))
        self.assertNotExists(models.Attachment.objects.filter(id=attachment_id))
        self.assertExists(models.Agent.objects.filter(id=self.agent.id))
        delete_file.assert_called_once_with('uploaded-agent.jpg')

    def test_specifyuser_blocks_delete(self):
        agent = models.Agent.objects.create(
            agenttype=0,
            firstname="Test",
            lastname="Agent",
            division=self.division,
            specifyuser=self.specifyuser)

        with self.assertRaises(BusinessRuleException):
            agent.delete()

    def test_agent_without_specifyuser_can_be_deleted(self):
        agent = models.Agent.objects.create(
            agenttype=0,
            firstname="Test",
            lastname="Agent",
            division=self.division,
            specifyuser=None)

        agent.delete()

    @unittest.expectedFailure
    def test_agent_division_and_agenttype_cannot_be_null(self):
        with self.assertRaises(BusinessRuleException):
            models.Agent.objects.create(
                agenttype=0,
                firstname="Test",
                lastname="Agent",
                division=None)

        with self.assertRaises(BusinessRuleException):
            models.Agent.objects.create(
                agenttype=None,
                firstname="Test",
                lastname="Agent",
                division=self.division)

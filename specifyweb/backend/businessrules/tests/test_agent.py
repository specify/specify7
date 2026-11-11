import unittest
from unittest.mock import patch

from specifyweb.specify import models
from specifyweb.specify.api.crud import delete_resource, post_resource
from specifyweb.specify.api.serializers import uri_for_model
from specifyweb.specify.tests.test_api import ApiTests
from specifyweb.specify.utils.agent_types import agent_types
from specifyweb.specify.utils.scoping import ScopeType
from ..exceptions import BusinessRuleException

class AgentTests(ApiTests):
    def _add_attachment(self):
        return post_resource(
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

    def test_add_address_to_agent(self):
        address = post_resource(
            self.collection,
            self.agent,
            'address',
            {
                'agent': uri_for_model('agent', self.agent.id),
                'address': '123 Main St',
                'city': 'Gainesville',
                'state': 'FL',
                'isprimary': True,
            },
        )

        saved = models.Address.objects.get(id=address.id)
        self.assertEqual(saved.agent_id, self.agent.id)
        self.assertEqual(saved.address, '123 Main St')
        self.assertEqual(saved.city, 'Gainesville')
        self.assertEqual(saved.state, 'FL')
        self.assertIs(saved.isprimary, True)

    def test_add_group_member_to_agent(self):
        group = models.Agent.objects.create(
            agenttype=agent_types.index('Group'),
            lastname='Test Group',
            division=self.division,
        )
        membership = post_resource(
            self.collection,
            self.agent,
            'groupperson',
            {
                'group': uri_for_model('agent', group.id),
                'member': uri_for_model('agent', self.agent.id),
                'division': uri_for_model('division', self.division.id),
                'ordernumber': 0,
            },
        )

        saved = models.Groupperson.objects.get(id=membership.id)
        self.assertEqual(saved.group_id, group.id)
        self.assertEqual(saved.member_id, self.agent.id)
        self.assertEqual(saved.division_id, self.division.id)
        self.assertEqual(saved.ordernumber, 0)

    def test_add_variant_to_agent(self):
        variant = post_resource(
            self.collection,
            self.agent,
            'agentvariant',
            {
                'agent': uri_for_model('agent', self.agent.id),
                'name': 'A. Poudel',
                'vartype': 0,
                'language': 'en',
                'country': 'US',
            },
        )

        saved = models.Agentvariant.objects.get(id=variant.id)
        self.assertEqual(saved.agent_id, self.agent.id)
        self.assertEqual(saved.name, 'A. Poudel')
        self.assertEqual(saved.vartype, 0)
        self.assertEqual(saved.language, 'en')
        self.assertEqual(saved.country, 'US')

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
        join = self._add_attachment()
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

    def test_add_attachment_to_agent(self):
        join = self._add_attachment()

        saved = models.Agentattachment.objects.get(id=join.id)
        self.assertEqual(saved.agent_id, self.agent.id)
        self.assertEqual(saved.ordinal, 0)

        attachment = models.Attachment.objects.get(id=saved.attachment_id)
        self.assertEqual(attachment.origfilename, 'agent.jpg')
        self.assertEqual(attachment.tableid, models.Agent.specify_model.tableId)
        self.assertEqual(attachment.scopeid, self.division.id)
        self.assertEqual(attachment.scopetype, ScopeType.DIVISION.value)

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

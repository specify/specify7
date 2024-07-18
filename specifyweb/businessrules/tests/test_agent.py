
import unittest

from specifyweb.specify import models
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

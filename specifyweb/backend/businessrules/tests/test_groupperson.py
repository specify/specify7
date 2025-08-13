from specifyweb.specify import models
from specifyweb.specify.tests.test_api import ApiTests
from specifyweb.specify.agent_types import agent_types
from ..exceptions import BusinessRuleException

class GroupPersonTests(ApiTests):
    def test_agent_cannot_be_in_self(self):
        with self.assertRaises(BusinessRuleException):
            models.Groupperson.objects.create(
                ordernumber=0,
                group=self.agent,
                member=self.agent,
                division=self.division)

    def test_group_members_unique_within_group(self):
        group = models.Agent.objects.create(
            agenttype=agent_types.index('Group'),
            lastname="A Group",
            division=self.division)

        models.Groupperson.objects.create(
            ordernumber=0,
            group=group,
            member=self.agent,
            division=self.division)

        with self.assertRaises(BusinessRuleException):
            models.Groupperson.objects.create(
                ordernumber=1,
                group=group,
                member=self.agent,
                division=self.division)


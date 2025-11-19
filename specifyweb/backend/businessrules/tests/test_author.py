from specifyweb.specify import models
from specifyweb.specify.tests.test_api import ApiTests
from ..exceptions import BusinessRuleException

class AuthorTests(ApiTests):
    def test_agent_is_unique_in_referencework(self):
        referencework = models.Referencework.objects.create(
            institution=self.institution,
            referenceworktype=0)

        referencework.authors.create(
            ordernumber=0,
            agent=self.agent)

        with self.assertRaises(BusinessRuleException):
            referencework.authors.create(
                ordernumber=1,
                agent=self.agent)

        referencework.authors.create(
            ordernumber=1,
            agent=models.Agent.objects.create(
                agenttype=0,
                firstname="Test2",
                lastname="Agent",
                division=self.division))

    def test_ordernumber_unique(self):
        referencework = models.Referencework.objects.create(
            institution=self.institution,
            referenceworktype=0)

        referencework.authors.create(
            ordernumber=0,
            agent=self.agent)

        with self.assertRaises(BusinessRuleException):
            referencework.authors.create(
                ordernumber=0,
                agent=models.Agent.objects.create(
                    agenttype=0,
                    firstname="Test2",
                    lastname="Agent",
                    division=self.division))

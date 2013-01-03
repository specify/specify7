from specify import models
from specify.api_tests import ApiTests
from ..exceptions import BusinessRuleException

class CollectorTests(ApiTests):
    def test_agent_unique_in_collecting_event(self):
        collectingevent = models.Collectingevent.objects.create(
            discipline=self.discipline)

        collectingevent.collectors.create(
            isprimary=True,
            ordernumber=0,
            division=self.division,
            agent=self.agent)

        with self.assertRaises(BusinessRuleException):
            collectingevent.collectors.create(
                isprimary=False,
                ordernumber=1,
                division=self.division,
                agent=self.agent)

    def test_division_cannot_be_null(self):
        collectingevent = models.Collectingevent.objects.create(
            discipline=self.discipline)

        with self.assertRaises(BusinessRuleException):
            collectingevent.collectors.create(
                isprimary=True,
                ordernumber=0,
                division=None,
                agent=self.agent)

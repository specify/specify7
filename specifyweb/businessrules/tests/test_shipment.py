
from unittest import skip
from specifyweb.specify import models
from specifyweb.specify.tests.test_api import ApiTests
from ..exceptions import BusinessRuleException

@skip("these business rules were removed in https://github.com/specify/specify7/issues/474")
class ShipmentTests(ApiTests):
    def test_shipped_to_agent_must_exist(self):
        self.agent.addresses.create(address="somewhere")

        with self.assertRaises(BusinessRuleException):
            models.Shipment.objects.create(
                shipmentnumber='1',
                discipline=self.discipline,
                shippedto=None)

        models.Shipment.objects.create(
            shipmentnumber='1',
            discipline=self.discipline,
            shippedto=self.agent)

    def test_shipped_to_agent_must_have_address(self):
        agent = models.Agent.objects.create(
            agenttype=0,
            firstname="Test",
            lastname="Agent",
            division=self.division,)

        with self.assertRaises(BusinessRuleException):
            models.Shipment.objects.create(
                shipmentnumber='1',
                discipline=self.discipline,
                shippedto=agent)

        agent.addresses.create(address="somewhere")

        models.Shipment.objects.create(
            shipmentnumber='1',
            discipline=self.discipline,
            shippedto=agent)

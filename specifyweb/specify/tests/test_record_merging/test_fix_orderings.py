from specifyweb.specify.api import obj_to_data
from specifyweb.specify.models import Address, Agentspecialty, Agent
from specifyweb.specify.record_merging import fix_orderings
from specifyweb.specify.tests.test_api import ApiTests

from copy import deepcopy


class TestFixOrderings(ApiTests):

    def setUp(self):
        super().setUp()
        Agentspecialty.objects.create(agent=self.agent, specialtyname="TestSpecialty1")
        Agentspecialty.objects.create(agent=self.agent, specialtyname="TestSpecialty2")
        Agentspecialty.objects.create(agent=self.agent, specialtyname="TestSpecialty3")
        Address.objects.create(agent=self.agent, address="House 1")
        Address.objects.create(agent=self.agent, address="House 2")
        Address.objects.create(agent=self.agent, address="House 3")

    def test_no_change(self):

        agent_obj = obj_to_data(self.agent)
        agent_obj_copy = deepcopy(agent_obj)

        fix_orderings(Agent.specify_model, agent_obj)

        self.assertEqual(agent_obj, agent_obj_copy)

    def test_new_resources_moved_before(self):
        agent_obj = obj_to_data(self.agent)

        del agent_obj["agentspecialties"][0]["id"]
        del agent_obj["agentspecialties"][1]["id"]

        del agent_obj["addresses"][0]["id"]
        del agent_obj["addresses"][1]["id"]

        agent_obj["agentspecialties"][0]["ordernumber"] = 1
        agent_obj["agentspecialties"][1]["ordernumber"] = 1
        agent_obj["agentspecialties"][2]["ordernumber"] = 10

        agent_obj_copy = deepcopy(agent_obj)

        fix_orderings(Agent.specify_model, agent_obj)

        self.assertEqual(agent_obj["agentspecialties"][0]["ordernumber"], 10)

        self.assertEqual(
            agent_obj["agentspecialties"][0], agent_obj_copy["agentspecialties"][2]
        )

        self.assertEqual(
            agent_obj["agentspecialties"][1],
            {**agent_obj_copy["agentspecialties"][0], "ordernumber": None},
        )

        self.assertEqual(
            agent_obj["agentspecialties"][2],
            {**agent_obj_copy["agentspecialties"][1], "ordernumber": None},
        )

        self.assertEqual(agent_obj["addresses"], agent_obj_copy["addresses"])

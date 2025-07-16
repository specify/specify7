from django.test import Client
from specifyweb.specify.models import Agent, Division, Specifyuser
from specifyweb.specify.tests.test_api import ApiTests

import json
from unittest.mock import patch

from specifyweb.specify.views import AgentInUseException, MultipleAgentsException

EMPTY_CALL = lambda x: None

class TestSetUserAgents(ApiTests):

    def setUp(self):
        super().setUp()
        c = Client()
        c.force_login(self.specifyuser)
        self.c = c

    @patch("specifyweb.specify.views.check_collection_access_against_agents", EMPTY_CALL)
    def test_user_agent_simple(self):


        new_agent = Agent.objects.create(
            agenttype=0,
            firstname="John",
            lastname="Doe",
            division=self.division,
            specifyuser=self.specifyuser,
        )

        response = self.c.post(
            f"/api/set_agents/{self.specifyuser.id}/",
            json.dumps([new_agent.id]),
            content_type='application/x-www-form-urlencoded'
        )

        self._assertStatusCodeEqual(response, 204)

        self.agent.refresh_from_db()
        new_agent.refresh_from_db()

        self.assertIsNone(self.agent.specifyuser_id)
        self.assertEqual(new_agent.specifyuser_id, self.specifyuser.id)

    def test_user_agent_in_use(self):
        new_specify_user = Specifyuser.objects.create(
            isloggedin=False,
            isloggedinreport=False,
            name="newtest_userr",
            password="")

        self._add_user_policy(new_specify_user)

        new_agent = Agent.objects.create(
            agenttype=0,
            firstname="John",
            lastname="Doe",
            division=self.division,
            specifyuser=new_specify_user,
        )

        response = self.c.post(
            f"/api/set_agents/{self.specifyuser.id}/",
            json.dumps([new_agent.id]),
            content_type='application/x-www-form-urlencoded'
        )

        self._assertStatusCodeEqual(response, AgentInUseException.status_code)

        exception = json.loads(response.content.decode())
        self.assertEqual(exception, {
            "AgentInUseException": [new_agent.id]
        })

    def test_multiple_agents(self):

        def _create_agent(**kwargs):
            return  Agent.objects.create(agenttype=0, **kwargs)

        new_agent_1 = _create_agent(
            firstname="John",
            lastname="Doe",
            division=self.division,
        )

        new_agent_2 = _create_agent(
            firstname="Jane",
            lastname="Doe",
            division=self.division,
        )

        division_2 = Division.objects.create(institution=self.institution, name='Second Division')
        new_agent_3 = _create_agent(
            firstname="Jane",
            lastname="Doe",
            division=division_2,
        )

        division_3 = Division.objects.create(institution=self.institution, name='Third Division')
        new_agent_4 = _create_agent(
            firstname="new john",
            lastname="Doe",
            division=division_3,
        )
        new_agent_5 = _create_agent(
            firstname="new jane",
            lastname="Doe",
            division=division_3,
        )

        response = self.c.post(
            f"/api/set_agents/{self.specifyuser.id}/",
            json.dumps([new_agent_1.id, new_agent_2.id, new_agent_3.id, new_agent_4.id, new_agent_5.id]),
            content_type='application/x-www-form-urlencoded'
        )

        self._assertStatusCodeEqual(response, MultipleAgentsException.status_code)
        exception = json.loads(response.content.decode())

        self.assertEqual(exception,
            {
                'MultipleAgentsException': [
                    {'divisonid': self.division.id, 'agentid1': new_agent_1.id, 'agentid2': new_agent_2.id},
                    {'divisonid': division_3.id, 'agentid1': new_agent_4.id, 'agentid2': new_agent_5.id}
                ]
            }
        )

        # Here, the changes are all atomic. So, this agent shouldn't be affected.
        self.agent.refresh_from_db()

        self.assertEqual(self.agent.specifyuser_id, self.specifyuser.id)

        self.assertEqual(Agent.objects.filter(specifyuser_id__isnull=False).count(), 1)

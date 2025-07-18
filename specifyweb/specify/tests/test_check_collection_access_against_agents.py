from specifyweb.permissions.models import UserPolicy
from specifyweb.specify.models import Agent, Specifyuser
from specifyweb.specify.tests.test_api import ApiTests
from specifyweb.specify.views import MissingAgentForAccessibleCollection, check_collection_access_against_agents

from unittest.mock import patch

class TestCollectionAgainstAgents(ApiTests):

    @patch("specifyweb.context.views.users_collections_for_sp6", lambda x, y: [])
    def test_simple(self):
        check_collection_access_against_agents(self.specifyuser.id)

    @patch("specifyweb.context.views.users_collections_for_sp6", lambda x, y: [])
    def test_no_access_simple(self):

        new_specify_user = Specifyuser.objects.create(
            isloggedin=False,
            isloggedinreport=False,
            name="newtestuser",
            password="")

        UserPolicy.objects.create(
            collection_id=self.collection.id,
            specifyuser_id=new_specify_user.id,
            resource="/system/sp7/collection",
            action='access'
        )

        with self.assertRaises(MissingAgentForAccessibleCollection) as context:
            check_collection_access_against_agents(new_specify_user.id)
        

        self.assertEqual(
            context.exception.to_json(),
            {
                'MissingAgentForAccessibleCollection': {
                'missing_for_6': [], 
                'missing_for_7': [self.collection.id], 
                'all_accessible_divisions': [self.division.id]
                }
            }
        )

        agent = Agent.objects.create(
            agenttype=0,
            division=self.division,
            specifyuser=new_specify_user
        )

        # Should not cause any exceptions now.
        check_collection_access_against_agents(new_specify_user.id)


        


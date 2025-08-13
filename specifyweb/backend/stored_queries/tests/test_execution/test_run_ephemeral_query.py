from specifyweb.backend.stored_queries.execution import run_ephemeral_query
from specifyweb.backend.stored_queries.tests.test_execution.simple_query import simple_query
from specifyweb.backend.stored_queries.tests.tests import SQLAlchemySetup
from unittest.mock import patch, Mock


class TestRunEphemeralQuery(SQLAlchemySetup):

    @patch("specifyweb.backend.stored_queries.execution.models.session_context")
    def test_query(self, context: Mock):
        context.return_value = TestRunEphemeralQuery.test_session_context()
        result = run_ephemeral_query(self.collection, self.specifyuser, simple_query)
        self.assertCountEqual(
            {"results": [(co.id, co.catalognumber) for co in self.collectionobjects]},
            result,
        )

from specifyweb.backend.inheritance.api import cog_inheritance_post_query_processing
from specifyweb.backend.interactions.tests.test_cog_consolidated_prep_context import (
    TestCogConsolidatedPrepContext,
)
from specifyweb.backend.stored_queries.execution import (
    build_query,
)
from specifyweb.backend.stored_queries.tests.tests import SQLAlchemySetup
from specifyweb.backend.stored_queries.tests.utils import make_query_fields_test
from unittest.mock import Mock, patch


class TestCogInheritancePostQueryProcessing(
    SQLAlchemySetup, TestCogConsolidatedPrepContext
):

    def test_non_collectionobject_table(self):
        table, query_fields = make_query_fields_test(
            "Agent", [["firstname"], ["agenttype"]]
        )
        with TestCogInheritancePostQueryProcessing.test_session_context() as session:
            query, _ = build_query(
                session,
                self.collection,
                self.specifyuser,
                table.tableId,
                query_fields,
            )

            query = cog_inheritance_post_query_processing(
                query, table.tableId, query_fields, self.collection, self.specifyuser
            )

            result = list(query)

        self.assertEqual(result, [(self.agent.id, "Test", 0)])

    def test_collectionobject_table_simple(self):
        table, query_fields = make_query_fields_test(
            "Collectionobject", [["catalognumber"], ["guid"]]
        )
        with TestCogInheritancePostQueryProcessing.test_session_context() as session:
            query, _ = build_query(
                session,
                self.collection,
                self.specifyuser,
                table.tableId,
                query_fields,
            )

            query = cog_inheritance_post_query_processing(
                query, table.tableId, query_fields, self.collection, self.specifyuser
            )

            result = list(query)

        self.assertCountEqual(
            result,
            [(co.id, co.catalognumber, co.guid) for co in self.collectionobjects],
        )

    @patch("specifyweb.backend.inheritance.api.get_cat_num_inheritance_setting")
    def test_collectionobject_table_cojo(self, func: Mock):
        func.return_value = True
        table, query_fields = make_query_fields_test(
            "Collectionobject", [["catalognumber"], ["guid"]]
        )
        query_fields = [query_fields[0]._replace(op_num=1, value=None)]
        TestCogConsolidatedPrepContext._link_co_cog(
            self.collectionobjects[0], self.test_cog_discrete
        )

        TestCogConsolidatedPrepContext._link_co_cog(
            self.collectionobjects[1], self.test_cog_discrete
        )

        TestCogConsolidatedPrepContext._link_co_cog(
            self.collectionobjects[2], self.test_cog_discrete
        )

        self._update(self.collectionobjects[0], dict(catalognumber=None))
        self._update(self.collectionobjects[1], dict(catalognumber=None))

        with TestCogInheritancePostQueryProcessing.test_session_context() as session:
            query, _ = build_query(
                session,
                self.collection,
                self.specifyuser,
                table.tableId,
                query_fields,
            )

            query = cog_inheritance_post_query_processing(
                query, table.tableId, query_fields, self.collection, self.specifyuser
            )

            result = list(query)

        self.assertCountEqual(
            [
                (self.collectionobjects[0].id, "num-2"),
                (self.collectionobjects[1].id, "num-2"),
            ],
            result,
        )

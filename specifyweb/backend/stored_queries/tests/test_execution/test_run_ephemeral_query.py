from specifyweb.backend.stored_queries.execution import run_ephemeral_query
from specifyweb.backend.stored_queries.tests.test_execution.simple_query import simple_query
from specifyweb.backend.stored_queries.tests.tests import SQLAlchemySetup
from specifyweb.backend.trees.tests.test_trees import SqlTreeSetup
from specifyweb.specify import models
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


class TestRunEphemeralQueryByRank(SqlTreeSetup):

    @patch("specifyweb.backend.stored_queries.execution.models.session_context")
    def test_negated_contains_on_tree_rank_field(self, context: Mock):
        context.return_value = TestRunEphemeralQueryByRank.test_session_context()

        life = self.make_taxontree("Life", "Taxonomy Root")
        animalia = self.make_taxontree("Animalia", "Kingdom", parent=life)
        phylum = self.make_taxontree("TestPhylum", "Phylum", parent=animalia)

        models.Determination.objects.create(
            collectionobject=self.collectionobjects[0],
            taxon=phylum,
            iscurrent=True,
        )

        query = {
            "contexttableid": 1,
            "countonly": False,
            "formatauditrecids": False,
            "selectdistinct": False,
            "fields": [
                {
                    "fieldname": "Phylum",
                    "formatname": None,
                    "isdisplay": True,
                    "isnot": True,
                    "isrelfld": False,
                    "operstart": 11,
                    "position": 0,
                    "sorttype": 0,
                    "startvalue": "Ooof",
                    "stringid": "1,9-determinations,4.taxon.Phylum",
                    "isstrict": False,
                }
            ],
        }

        result = run_ephemeral_query(self.collection, self.specifyuser, query)

        self.assertCountEqual(
            result["results"],
            [
                (self.collectionobjects[0].id, "TestPhylum"),
                (self.collectionobjects[1].id, None),
                (self.collectionobjects[2].id, None),
                (self.collectionobjects[3].id, None),
                (self.collectionobjects[4].id, None),
            ],
        )

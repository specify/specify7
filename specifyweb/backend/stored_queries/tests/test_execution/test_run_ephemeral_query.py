from copy import deepcopy
from datetime import datetime

from specifyweb.backend.stored_queries.execution import run_ephemeral_query
from specifyweb.backend.stored_queries.tests.test_execution.simple_query import simple_query
from specifyweb.backend.stored_queries.tests.tests import SQLAlchemySetup
from specifyweb.backend.trees.tests.test_trees import SqlTreeSetup
from specifyweb.specify import models
from unittest.mock import patch, Mock


class TestRunEphemeralQuery(SQLAlchemySetup):

    @staticmethod
    def _make_field(position: int, string_id: str, field_name: str) -> dict:
        return {
            "tablelist": "1",
            "stringid": string_id,
            "fieldname": field_name,
            "isrelfld": False,
            "sorttype": 0,
            "position": position,
            "isdisplay": True,
            "operstart": 8,
            "startvalue": "",
            "isnot": False,
            "isstrict": False,
        }

    @patch("specifyweb.backend.stored_queries.execution.models.session_context")
    def test_query(self, context: Mock):
        context.return_value = TestRunEphemeralQuery.test_session_context()
        result = run_ephemeral_query(self.collection, self.specifyuser, simple_query)
        self.assertEqual(
            {"results": [(co.id, co.catalognumber) for co in self.collectionobjects]},
            result,
        )

    @patch("specifyweb.backend.stored_queries.execution.models.session_context")
    def test_query_with_displayed_date_parts(self, context: Mock):
        context.return_value = TestRunEphemeralQuery.test_session_context()

        self._update(
            self.collectionobjects[0],
            dict(
                catalogeddate=datetime(2024, 5, 17),
                catalogeddateprecision=1,
            ),
        )
        self._update(
            self.collectionobjects[1],
            dict(
                catalogeddate=datetime(2024, 6, 1),
                catalogeddateprecision=2,
            ),
        )
        self._update(
            self.collectionobjects[2],
            dict(
                catalogeddate=datetime(2024, 1, 1),
                catalogeddateprecision=3,
            ),
        )

        query = deepcopy(simple_query)
        query["fields"] = [
            self._make_field(0, "1.collectionobject.catalogNumber", "catalogNumber"),
            self._make_field(
                1,
                "1.collectionobject.catalogedDateNumericDay",
                "catalogedDateNumericDay",
            ),
            self._make_field(
                2,
                "1.collectionobject.catalogedDateNumericMonth",
                "catalogedDateNumericMonth",
            ),
            self._make_field(
                3,
                "1.collectionobject.catalogedDateNumericYear",
                "catalogedDateNumericYear",
            ),
        ]

        result = run_ephemeral_query(self.collection, self.specifyuser, query)

        self.assertEqual(
            {
                "results": [
                    (self.collectionobjects[0].id, "num-0", 17, 5, 2024),
                    (self.collectionobjects[1].id, "num-1", None, 6, 2024),
                    (self.collectionobjects[2].id, "num-2", None, None, 2024),
                    (self.collectionobjects[3].id, "num-3", None, None, None),
                    (self.collectionobjects[4].id, "num-4", None, None, None),
                ]
            },
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
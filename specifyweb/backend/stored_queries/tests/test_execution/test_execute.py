from specifyweb.specify.models import Collectionobject, Recordset, Recordsetitem
from specifyweb.backend.stored_queries.execution import execute
from specifyweb.backend.stored_queries.tests.tests import SQLAlchemySetup
from specifyweb.backend.stored_queries.tests.utils import make_query_fields_test


class TestExecute(SQLAlchemySetup):

    def _make_numeric_cos(self):
        Collectionobject.objects.all().delete()

        collectionobjects = self.make_co(10)

        for _id, co in enumerate(collectionobjects):
            self._update(co, dict(catalognumber=str(_id + 1).rjust(3, "0")))
            co.refresh_from_db()

        collectionobjects[3].delete()  # 004
        collectionobjects[7].delete()  # 008

        return collectionobjects

    def _populate_text1(self):
        self._update(self.collectionobjects[0], dict(text1="G1"))
        self._update(self.collectionobjects[1], dict(text1="G1"))
        self._update(self.collectionobjects[2], dict(text1="G1"))

        self._update(self.collectionobjects[3], dict(text1="G2"))
        self._update(self.collectionobjects[4], dict(text1="G2"))

    def test_simple_query(self):

        table, query_fields = make_query_fields_test(
            "Collectionobject", [["catalognumber"]]
        )

        with TestExecute.test_session_context() as session:
            result = execute(
                session,
                self.collection,
                self.specifyuser,
                table.tableId,
                distinct=False,
                series=False,
                count_only=False,
                field_specs=query_fields,
                limit=0,
                offset=0,
            )

        self.assertEqual(
            {
                "results": [
                    (self.collectionobjects[0].id, "num-0"),
                    (self.collectionobjects[1].id, "num-1"),
                    (self.collectionobjects[2].id, "num-2"),
                    (self.collectionobjects[3].id, "num-3"),
                    (self.collectionobjects[4].id, "num-4"),
                ]
            },
            result,
        )

    def test_simple_query_count(self):
        table, query_fields = make_query_fields_test(
            "Collectionobject", [["catalognumber"]]
        )

        with TestExecute.test_session_context() as session:
            result = execute(
                session,
                self.collection,
                self.specifyuser,
                table.tableId,
                distinct=False,
                series=False,
                count_only=True,
                field_specs=query_fields,
                limit=0,
                offset=0,
            )

        self.assertEqual(result, {"count": 5})

    def test_simple_query_distinct(self):
        table, query_fields = make_query_fields_test("Collectionobject", [["text1"]])

        self._populate_text1()

        with TestExecute.test_session_context() as session:
            result = execute(
                session,
                self.collection,
                self.specifyuser,
                table.tableId,
                distinct=True,
                series=False,
                count_only=False,
                field_specs=query_fields,
                limit=0,
                offset=0,
            )

        self.assertEqual(
            result,
            {
                "results": [
                    (
                        f"{self.collectionobjects[0].id},{self.collectionobjects[1].id},{self.collectionobjects[2].id}",
                        "G1",
                    ),
                    (
                        f"{self.collectionobjects[3].id},{self.collectionobjects[4].id}",
                        "G2",
                    ),
                ]
            },
        )

    def test_simple_query_distinct_count(self):
        table, query_fields = make_query_fields_test("Collectionobject", [["text1"]])

        self._populate_text1()

        with TestExecute.test_session_context() as session:
            result = execute(
                session,
                self.collection,
                self.specifyuser,
                table.tableId,
                distinct=True,
                series=False,
                count_only=True,
                field_specs=query_fields,
                limit=0,
                offset=0,
            )

        self.assertEqual(result, {"count": 2})

    def test_simple_query_recordset_limit(self):

        table, query_fields = make_query_fields_test(
            "Collectionobject", [["catalognumber"], ["text1"]]
        )

        self._populate_text1()

        test_rs = Recordset.objects.create(
            collectionmemberid=self.collection.id,
            dbtableid=table.tableId,
            name="TestCoRS",
            specifyuser=self.specifyuser,
            type=0,
        )

        for i, co in enumerate(self.collectionobjects[:2]):
            Recordsetitem.objects.create(recordset=test_rs, recordid=co.id)

        with TestExecute.test_session_context() as session:
            result = execute(
                session,
                self.collection,
                self.specifyuser,
                table.tableId,
                series=False,
                count_only=False,
                field_specs=query_fields,
                limit=3,
                offset=0,
                recordsetid=test_rs.id,
                distinct=False,
            )

            result_count_only = execute(
                session,
                self.collection,
                self.specifyuser,
                table.tableId,
                distinct=False,
                series=False,
                count_only=True,
                field_specs=query_fields,
                limit=3,
                offset=0,
                recordsetid=test_rs.id,
            )

        self.assertEqual(
            {
                "results": [
                    (self.collectionobjects[0].id, "num-0", "G1"),
                    (self.collectionobjects[1].id, "num-1", "G1"),
                ],
            },
            result,
        )

        self.assertEqual(result_count_only, dict(count=2))

    def test_simple_query_series(self):
        table, query_fields = make_query_fields_test(
            "Collectionobject", [["catalognumber"]]
        )

        self.collectionobjects[2].delete()
        with TestExecute.test_session_context() as session:
            result = execute(
                session,
                self.collection,
                self.specifyuser,
                table.tableId,
                distinct=False,
                series=True,
                count_only=False,
                field_specs=query_fields,
                limit=0,
                offset=0,
            )

            result_count_only = execute(
                session,
                self.collection,
                self.specifyuser,
                table.tableId,
                distinct=False,
                series=True,
                count_only=True,
                field_specs=query_fields,
                limit=0,
                offset=0,
            )

        self.assertEqual(
            result,
            {
                "results": [
                    [
                        f"{self.collectionobjects[0].id},{self.collectionobjects[1].id}",
                        "num-0 - num-1",
                    ],
                    [
                        f"{self.collectionobjects[3].id},{self.collectionobjects[4].id}",
                        "num-3 - num-4",
                    ],
                ]
            },
        )

        self.assertEqual(result_count_only, dict(count=2))

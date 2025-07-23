from specifyweb.specify.models import Collectionobject
from specifyweb.stored_queries.execution import (
    BuildQueryProps,
    build_query,
    series_post_query,
)
from specifyweb.stored_queries.tests.tests import SQLAlchemySetup
from specifyweb.stored_queries.tests.utils import make_query_fields_test


class TestSeriesPostQuery(SQLAlchemySetup):

    def _get_id(self, co_list):
        def _getter(index):
            return co_list[index].id

        return _getter

    def _make_numeric_cos(self):
        Collectionobject.objects.all().delete()

        collectionobjects = self.make_co(10)

        for _id, co in enumerate(collectionobjects):
            self._update(co, dict(catalognumber=str(_id + 1).rjust(3, "0")))
            co.refresh_from_db()

        collectionobjects[3].delete()  # 004
        collectionobjects[7].delete()  # 008

        return collectionobjects

    def _make_numeric_numeric_cos(self):
        Collectionobject.objects.all().delete()

        collectionobjects = self.make_co(10)

        self._update(collectionobjects[0], dict(catalognumber="000-090"))
        self._update(collectionobjects[2], dict(catalognumber="000-091"))
        self._update(collectionobjects[1], dict(catalognumber="000-092"))

        self._update(collectionobjects[4], dict(catalognumber="001-001"))
        self._update(collectionobjects[3], dict(catalognumber="001-002"))

        self._update(collectionobjects[6], dict(catalognumber="003-001"))
        self._update(collectionobjects[5], dict(catalognumber="003-002"))

        self._update(collectionobjects[7], dict(catalognumber="003-004"))

        self._update(collectionobjects[8], dict(catalognumber="090-002"))

        self._update(collectionobjects[9], dict(catalognumber="100-004"))
        return collectionobjects

    def test_numeric_series_just_cn_field(self):

        collectionobjects = self._make_numeric_cos()

        table, query_fields = make_query_fields_test(
            "Collectionobject", [["catalognumber"]]
        )

        with TestSeriesPostQuery.test_session_context() as session:
            query, _ = build_query(
                session,
                self.collection,
                self.specifyuser,
                table.tableId,
                query_fields,
                BuildQueryProps(series=True),
            )

            results = series_post_query(query)

        id_getter = self._get_id(collectionobjects)

        self.assertEqual(
            [
                [f"{id_getter(0)},{id_getter(1)},{id_getter(2)}", "001 - 003"],
                [f"{id_getter(4)},{id_getter(5)},{id_getter(6)}", "005 - 007"],
                [f"{id_getter(8)},{id_getter(9)}", "009 - 010"],
            ],
            results,
        )

    def test_numeric_series_with_same_fields(self):
        collectionobjects = self._make_numeric_cos()

        table, query_fields = make_query_fields_test(
            "Collectionobject",
            [["catalognumber"], ["text1"], ["collection", "collectionname"]],
        )

        with TestSeriesPostQuery.test_session_context() as session:
            query, _ = build_query(
                session,
                self.collection,
                self.specifyuser,
                table.tableId,
                query_fields,
                BuildQueryProps(series=True),
            )

            results = series_post_query(query)

        id_getter = self._get_id(collectionobjects)

        self.assertEqual(
            [
                [
                    f"{id_getter(0)},{id_getter(1)},{id_getter(2)}",
                    "001 - 003",
                    None,
                    "TestCollection",
                ],
                [
                    f"{id_getter(4)},{id_getter(5)},{id_getter(6)}",
                    "005 - 007",
                    None,
                    "TestCollection",
                ],
                [f"{id_getter(8)},{id_getter(9)}", "009 - 010", None, "TestCollection"],
            ],
            results,
        )

    def test_series_unique_distinct_field(self):
        self.maxDiff = None
        collectionobjects = self._make_numeric_cos()

        table, query_fields = make_query_fields_test(
            "Collectionobject",
            [["catalognumber"], ["text1"], ["collection", "collectionname"], ["guid"]],
        )

        with TestSeriesPostQuery.test_session_context() as session:
            query, _ = build_query(
                session,
                self.collection,
                self.specifyuser,
                table.tableId,
                query_fields,
                BuildQueryProps(series=True),
            )

            results = series_post_query(query)

        expected = [
            [
                str(co.id),
                co.catalognumber,
                co.text1,
                co.collection.collectionname,
                co.guid,
            ]
            for co in collectionobjects
            if co.id is not None
        ]

        self.assertCountEqual(expected, results)

    # Tests for 1234-5678
    def test_numeric_numeric_just_cn_field(self):

        collectionobjects = self._make_numeric_numeric_cos()

        table, query_fields = make_query_fields_test(
            "Collectionobject",
            [["catalognumber"]],
        )

        with TestSeriesPostQuery.test_session_context() as session:
            query, _ = build_query(
                session,
                self.collection,
                self.specifyuser,
                table.tableId,
                query_fields,
                BuildQueryProps(series=True),
            )

            results = series_post_query(query)

        id_getter = self._get_id(collectionobjects)

        expected = [
            [f"{id_getter(0)},{id_getter(2)},{id_getter(1)}", "000-090 - 000-092"],
            [f"{id_getter(4)},{id_getter(3)}", "001-001 - 001-002"],
            [f"{id_getter(6)},{id_getter(5)}", "003-001 - 003-002"],
            [f"{id_getter(7)}", "003-004"],
            [f"{id_getter(8)}", "090-002"],
            [f"{id_getter(9)}", "100-004"],
        ]

        self.assertEqual(expected, results)

    # Tests for 1234-5678
    def test_numeric_numeric_with_same_fields(self):

        collectionobjects = self._make_numeric_numeric_cos()

        table, query_fields = make_query_fields_test(
            "Collectionobject",
            [["catalognumber"], ["text1"], ["collection", "collectionname"]],
        )

        with TestSeriesPostQuery.test_session_context() as session:
            query, _ = build_query(
                session,
                self.collection,
                self.specifyuser,
                table.tableId,
                query_fields,
                BuildQueryProps(series=True),
            )

            results = series_post_query(query)

        id_getter = self._get_id(collectionobjects)

        expected = [
            [
                f"{id_getter(0)},{id_getter(2)},{id_getter(1)}",
                "000-090 - 000-092",
                None,
                "TestCollection",
            ],
            [
                f"{id_getter(4)},{id_getter(3)}",
                "001-001 - 001-002",
                None,
                "TestCollection",
            ],
            [
                f"{id_getter(6)},{id_getter(5)}",
                "003-001 - 003-002",
                None,
                "TestCollection",
            ],
            [f"{id_getter(7)}", "003-004", None, "TestCollection"],
            [f"{id_getter(8)}", "090-002", None, "TestCollection"],
            [f"{id_getter(9)}", "100-004", None, "TestCollection"],
        ]

        self.assertEqual(expected, results)

    def test_numeric_numeric_unique_distinct_fields(self):

        collectionobjects = self._make_numeric_numeric_cos()

        table, query_fields = make_query_fields_test(
            "Collectionobject",
            [["catalognumber"], ["guid"], ["text1"], ["collection", "collectionname"]],
        )

        with TestSeriesPostQuery.test_session_context() as session:
            query, _ = build_query(
                session,
                self.collection,
                self.specifyuser,
                table.tableId,
                query_fields,
                BuildQueryProps(series=True),
            )

            results = series_post_query(query)

        expected = [
            [
                str(co.id),
                co.catalognumber,
                co.guid,
                co.text1,
                co.collection.collectionname,
            ]
            for co in collectionobjects
            if co.id is not None
        ]

        self.assertCountEqual(expected, results)

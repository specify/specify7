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

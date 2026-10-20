from unittest import TestCase
from unittest.mock import Mock, patch

from sqlalchemy.dialects import mysql
from sqlalchemy.orm import Session

from specifyweb.backend.stored_queries import models
from specifyweb.backend.stored_queries.execution import add_fields_to_query
from specifyweb.backend.stored_queries.query_construct import QueryConstruct
from specifyweb.backend.stored_queries.queryfield import fields_from_json


class TestAgeQueryColumns(TestCase):
    def build_query(
        self, sql_type, op_num, display=True, age_first=True, strict=False,
        sort_type=0
    ):
        attrs = {
            "isrelfld": False,
            "isnot": False,
            "isdisplay": True,
            "sorttype": 0,
            "isstrict": False,
        }
        age = {
            **attrs,
            "stringid": "1.collectionobject.age",
            "operstart": op_num,
            "startvalue": "100,50" if op_num == 16 else "Test period",
            "isdisplay": display,
            "isstrict": strict,
            "sorttype": sort_type,
        }
        catalog_number = {
            **attrs,
            "stringid": "1.collectionobject.catalogNumber",
            "operstart": 8,
            "startvalue": "",
        }
        fields = fields_from_json(
            [
                {**field, "position": position}
                for position, field in enumerate(
                    [age, catalog_number] if age_first else [catalog_number, age]
                )
            ]
        )
        formatter = Mock()
        formatter.fieldformat.side_effect = lambda query_field, expression: expression
        period = Mock(startperiod=100, endperiod=50)
        with (
            Session() as session,
            patch(
                "specifyweb.backend.stored_queries.geology_time.GEO_TIME_QUERY_IMPLEMENTATION",
                "sqlalchemy",
            ),
            patch(
                "specifyweb.backend.stored_queries.geology_time.GEO_TIME_QUERY_SQL_TYPE",
                sql_type,
            ),
            patch(
                "specifyweb.backend.stored_queries.geology_time.Geologictimeperiod.objects"
            ) as periods,
            patch(
                "specifyweb.backend.stored_queries.queryfieldspec.get_uiformatter",
                return_value=None,
            ),
        ):
            periods.filter.return_value.first.return_value = period
            query = QueryConstruct(
                collection=None,
                objectformatter=formatter,
                query=session.query(models.CollectionObject._id),
            )
            return add_fields_to_query(None, None, query, fields)

    def test_displayed_age_has_one_column_in_field_order(self):
        for sql_type in ("meta", "modify"):
            for op_num in (16, 17):
                for age_first in (True, False):
                    for strict in (True, False):
                        with self.subTest(
                            sql_type=sql_type, op_num=op_num,
                            age_first=age_first, strict=strict
                        ):
                            query, selected, _ = self.build_query(
                                sql_type, op_num, age_first=age_first, strict=strict
                            )
                            expected = ["_id", "age", "catalogNumber"]
                            if not age_first:
                                expected = ["_id", "catalogNumber", "age"]
                            self.assertEqual(
                                [
                                    column["name"]
                                    for column in query.query.column_descriptions
                                ],
                                expected,
                            )
                            self.assertEqual(len(selected), 2)
                            sql = str(
                                query.query.statement.compile(dialect=mysql.dialect())
                            )
                            self.assertIn("JOIN", sql)
                            self.assertIn(
                                "HAVING" if sql_type == "meta" else "WHERE", sql
                            )

    def test_hidden_age_does_not_add_a_result_column(self):
        for sql_type in ("meta", "modify"):
            for op_num in (16, 17):
                with self.subTest(sql_type=sql_type, op_num=op_num):
                    query, selected, _ = self.build_query(
                        sql_type, op_num, display=False
                    )
                    self.assertEqual(
                        [
                            column["name"]
                            for column in query.query.column_descriptions
                        ],
                        ["_id", "catalogNumber"],
                    )
                    self.assertEqual(len(selected), 1)
                    sql = str(
                        query.query.statement.compile(dialect=mysql.dialect())
                    )
                    self.assertIn("JOIN", sql)
                    self.assertIn("HAVING" if sql_type == "meta" else "WHERE", sql)

    def test_query_without_computed_column_preserves_result_shape(self):
        for op_num in (16, 17):
            for display in (True, False):
                with (
                    self.subTest(op_num=op_num, display=display),
                    patch(
                        "specifyweb.backend.stored_queries.geology_time.query_co_in_time_range_with_joins",
                        side_effect=lambda query, *_: query.filter(
                            models.CollectionObject._id.in_([1, 2])
                        ),
                    ),
                ):
                    query, selected, sorts = self.build_query(
                        "filter", op_num, display=display
                    )
                    self.assertEqual(
                        [
                            column["name"]
                            for column in query.query.column_descriptions
                        ],
                        ["_id", None, "catalogNumber"]
                        if display else ["_id", "catalogNumber"],
                    )
                    self.assertEqual(len(selected), 1)
                    self.assertEqual(sorts, [])
                    sql = str(
                        query.query.statement.compile(dialect=mysql.dialect())
                    )
                    self.assertIn("WHERE collectionobject.`CollectionObjectID` IN", sql)

    def test_age_sort_uses_the_computed_expression(self):
        for sql_type in ("meta", "modify"):
            for op_num in (16, 17):
                for sort_type in (1, 2):
                    with self.subTest(
                        sql_type=sql_type, op_num=op_num, sort_type=sort_type
                    ):
                        query, _, sorts = self.build_query(
                            sql_type, op_num, sort_type=sort_type
                        )
                        self.assertEqual(len(sorts), 1)
                        sql = str(
                            query.query.order_by(*sorts).statement.compile(
                                dialect=mysql.dialect()
                            )
                        )
                        self.assertIn("ORDER BY age", sql)
                        if sort_type == 2:
                            self.assertTrue(sql.endswith("DESC"))

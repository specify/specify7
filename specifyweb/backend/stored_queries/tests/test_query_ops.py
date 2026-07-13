from unittest import TestCase
from sqlalchemy import column
from specifyweb.backend.stored_queries.query_ops import QueryOps

class TestQueryOps(TestCase):

    def setUp(self):
        self.ops = QueryOps(uiformatter=None)

    def assert_op_sql(self, op_method, value, expected_sql):
        result = op_method(column("catalogNumber"), value)
        sql = str(result.compile(compile_kwargs={"literal_binds": True}))
        self.assertEqual(sql, expected_sql)

    def test_op_like_basic(self):
        self.assert_op_sql(self.ops.op_like, "%test%", '"catalogNumber" LIKE \'%test%\'')

    def test_op_like_percent_wildcard(self):
        self.assert_op_sql(self.ops.op_like, "2025%", '"catalogNumber" LIKE \'2025%\'')

    def test_op_like_underscore_wildcard(self):
        self.assert_op_sql(self.ops.op_like, "202_", '"catalogNumber" LIKE \'202_\'')

    def test_op_like_no_wildcard(self):
        self.assert_op_sql(self.ops.op_like, "exact", '"catalogNumber" LIKE \'exact\'')
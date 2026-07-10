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

    def test_op_equals_basic(self):
        self.assert_op_sql(self.ops.op_equals, "test-value", '"catalogNumber" = \'test-value\'')
    
    def test_op_equals_empty_string(self):
        self.assert_op_sql(self.ops.op_equals, "", '"catalogNumber" = \'\'') # for empty strings

    def test_op_equals_number_string(self):
        self.assert_op_sql(self.ops.op_equals, "123", '"catalogNumber" = \'123\'') # for numbers as string

    def test_op_greaterthan_basic(self):
        self.assert_op_sql(self.ops.op_greaterthan, "100", '"catalogNumber" > \'100\'')

    def test_op_lessthan_basic(self):
        self.assert_op_sql(self.ops.op_lessthan, "100", '"catalogNumber" < \'100\'')

    def test_op_greaterthanequals_basic(self):
        self.assert_op_sql(self.ops.op_greaterthanequals, "100", '"catalogNumber" >= \'100\'')

    def test_op_lessthanequals_basic(self):
        self.assert_op_sql(self.ops.op_lessthanequals, "100", '"catalogNumber" <= \'100\'')

    def test_op_between_basic(self):
        self.assert_op_sql(self.ops.op_between, "10,20", '"catalogNumber" BETWEEN \'10\' AND \'20\'')

    def test_op_contains_basic(self):
        self.assert_op_sql(self.ops.op_contains, "test", '"catalogNumber" LIKE \'%\' || \'test\' || \'%\'')

    def test_op_in_basic(self):
        self.assert_op_sql(self.ops.op_in, "a,b", '"catalogNumber" IN (\'a\', \'b\')')

    def test_op_startswith_basic(self):
        self.assert_op_sql(self.ops.op_startswith, "test", '"catalogNumber" LIKE \'test%\'')

    def test_op_endswith_basic(self):
        self.assert_op_sql(self.ops.op_endswith, "test", '"catalogNumber" LIKE \'%test\'')

    def test_op_empty_basic(self):
        self.assert_op_sql(self.ops.op_empty, "", '"catalogNumber" IS NULL')

    
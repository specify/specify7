from unittest import TestCase
from sqlalchemy import column
from specifyweb.backend.stored_queries.query_ops import QueryOps

class TestQueryOps(TestCase):

    def setUp(self):
        self.ops = QueryOps(uiformatter=None) # clearing the formatting

    def test_op_like_basic(self):
        result = self.ops.op_like(column("catalogNumber"), "%test%") # returns a SQLAlchemy object
        sql = str(result.compile(compile_kwargs={"literal_binds": True})) # converts the whole thing into string
        self.assertEqual(sql, '"catalogNumber" LIKE \'%test%\'')
    
    def test_op_like_percent_wildcard(self):
        result = self.ops.op_like(column("catalogNumber"), "2025%")
        sql = str(result.compile(compile_kwargs={"literal_binds": True}))
        self.assertEqual(sql, '"catalogNumber" LIKE \'2025%\'')

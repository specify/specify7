from unittest import TestCase
from unittest.mock import Mock, patch

from specifyweb.backend.stored_queries.query_ops import QueryOps


class TestAgeQueryOps(TestCase):
    def setUp(self):
        self.ops = QueryOps(uiformatter=None)
        self.field = Mock()
        self.field.in_.return_value = "age predicate"
        self.query = Mock()

    @patch("specifyweb.backend.stored_queries.query_ops.geo_time_query")
    def test_age_range_parses_negative_and_decimal_values(self, geo_time_query: Mock):
        geo_time_query.return_value = {1, 2}

        result = self.ops.op_age_range(
            self.field,
            " -10.5 , 20.25 ",
            self.query,
            is_strict=True,
        )

        geo_time_query.assert_called_once_with(
            -10.5,
            20.25,
            require_full_overlap=True,
            query=self.query.query,
        )
        self.field.in_.assert_called_once_with({1, 2})
        self.assertEqual(result, "age predicate")

from specifyweb.specify.tests.test_api import ApiTests, MockDateTime
from specifyweb.stored_queries.relative_date_utils import apply_absolute_date, relative_to_absolute_date
from unittest.mock import patch, Mock
import datetime

from specifyweb.stored_queries.tests.utils import make_query_fields_test
    
class TestApplyAbsoluteDate(ApiTests):
    
    def test_not_date(self):
        _, query_fields = make_query_fields_test('Collectionobject', [['catalognumber']])
        self.assertEqual(query_fields[0], apply_absolute_date(query_fields[0]))

    def test_not_full_date(self):
        _, query_fields = make_query_fields_test('Collectionobject', [['catalogeddate']])
        query_field = query_fields[0]._replace(fieldspec=query_fields[0].fieldspec._replace(date_part="NumericDay"))
        self.assertEqual(query_field, apply_absolute_date(query_field))

    def test_normal_full_date(self):
        _, query_fields = make_query_fields_test('Collectionobject', [['catalogeddate']])
        query_field = query_fields[0]._replace(value="2024-07-20")
        self.assertEqual(query_field, apply_absolute_date(query_field))

    @patch('specifyweb.stored_queries.relative_date_utils.datetime', MockDateTime)
    def test_relative_full_date(self):
        _, query_fields = make_query_fields_test('Collectionobject', [['catalogeddate']])
        query_field = query_fields[0]._replace(value="today + 1 year")
        self.assertEqual(query_field._replace(value="2026-07-20"), apply_absolute_date(query_field))

class TestRelativeToAbsoluteDate(ApiTests):

    def test_noop(self):
        value = relative_to_absolute_date("Not a match")
        self.assertEqual(value, "Not a match")

    @patch('specifyweb.stored_queries.relative_date_utils.datetime', MockDateTime)
    def test_second(self):
        value = relative_to_absolute_date("today + 10 second")
        self.assertEqual(value, "2025-07-20")

    @patch('specifyweb.stored_queries.relative_date_utils.datetime', MockDateTime)
    def test_minute(self):
        value = relative_to_absolute_date("today + 10 minute")
        self.assertEqual(value, "2025-07-20")

    @patch('specifyweb.stored_queries.relative_date_utils.datetime', MockDateTime)
    def test_hour(self):
        value = relative_to_absolute_date("today + 10 hour")
        self.assertEqual(value, "2025-07-21")

    @patch('specifyweb.stored_queries.relative_date_utils.datetime', MockDateTime)
    def test_week(self):
        value = relative_to_absolute_date("today + 1 week")
        self.assertEqual(value, "2025-07-27")

    @patch('specifyweb.stored_queries.relative_date_utils.datetime', MockDateTime)
    def test_month(self):
        value = relative_to_absolute_date("today + 1 month")
        self.assertEqual(value, "2025-08-19")

    @patch('specifyweb.stored_queries.relative_date_utils.datetime', MockDateTime)
    def test_year(self):
        value = relative_to_absolute_date("today + 1 year")
        self.assertEqual(value, "2026-07-20")
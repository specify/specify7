from specifyweb.specify.tests.test_api import ApiTests, MockDateTime
from unittest.mock import Mock, patch

from specifyweb.stored_queries.views import format_export_file_name

class TestFormatExportFileName(ApiTests):
    
    @patch('specifyweb.stored_queries.views.datetime', MockDateTime)
    def test_new_no_extenstion(self):
        self.assertEqual(
            format_export_file_name(dict(name="TestName", contextname="Agent")), 
            "TestName Agent - Sun Jul 20 2025"
        )

    @patch('specifyweb.stored_queries.views.datetime', MockDateTime)
    def test_new_extenstion(self):
        self.assertEqual(
            format_export_file_name(dict(name="TestName", contextname="Agent"), 'csv'), 
            "TestName Agent - Sun Jul 20 2025.csv"
        )

    @patch('specifyweb.stored_queries.views.datetime', MockDateTime)
    def test_old_no_extenstion(self):
        self.assertEqual(
            format_export_file_name(dict(name="TestName", contextname="Agent", id=4)), 
            "TestName - Sun Jul 20 2025"
        )

    @patch('specifyweb.stored_queries.views.datetime', MockDateTime)
    def test_old_extenstion(self):
        self.assertEqual(
            format_export_file_name(dict(name="TestName", contextname="Agent", id=5), 'csv'), 
            "TestName - Sun Jul 20 2025.csv"
        )
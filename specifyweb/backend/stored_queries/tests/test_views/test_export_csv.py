from specifyweb.backend.stored_queries.tests.tests import SQLAlchemySetup
from .raw_query import get_simple_query
from django.test import Client
from unittest.mock import patch, Mock

class TestExportCSV(SQLAlchemySetup):
    
    @patch("specifyweb.backend.stored_queries.views.Thread")
    def test_export(self, thread: Mock):
        
        c = Client()
        c.force_login(self.specifyuser)

        response = c.post(
            f'/stored_query/exportcsv/', 
            get_simple_query(self.specifyuser), 
            content_type="application/json"
        )

        self._assertStatusCodeEqual(response, 200)
        thread.assert_called_once()
        self.assertTrue(thread.return_value.daemon)
        thread.return_value.start.assert_called_once()
        self._assertContentEqual(response, "OK")



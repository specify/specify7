from specifyweb.specify.tests.test_api import ApiTests
from specifyweb.backend.stored_queries.format import ObjectFormatter
from specifyweb.backend.stored_queries.tests.base_format import SIMPLE_DEF
from unittest.mock import patch, Mock
from specifyweb.backend.datamodel.models import datamodel

class TestHasFormatterDef(ApiTests):
    
    @patch('specifyweb.backend.stored_queries.format.app_resource.get_app_resource')
    def test_no_name(self, get_app_resource: Mock):
        get_app_resource.return_value = (SIMPLE_DEF, None, None)
        obj_format = ObjectFormatter(self.collection, self.specifyuser, False)
        self.assertFalse(obj_format.hasFormatterDef(datamodel.get_table("Accession"), None))

    @patch('specifyweb.backend.stored_queries.format.app_resource.get_app_resource')
    def test_different_model(self, get_app_resource: Mock):
        get_app_resource.return_value = (SIMPLE_DEF, None, None)
        obj_format = ObjectFormatter(self.collection, self.specifyuser, False)
        self.assertFalse(obj_format.hasFormatterDef(datamodel.get_table("Accession"), 'CollectingEvent'))

    @patch('specifyweb.backend.stored_queries.format.app_resource.get_app_resource')
    def test_found(self, get_app_resource: Mock):
        get_app_resource.return_value = (SIMPLE_DEF, None, None)
        obj_format = ObjectFormatter(self.collection, self.specifyuser, False)
        self.assertTrue(obj_format.hasFormatterDef(datamodel.get_table("Accession"), 'Accession'))
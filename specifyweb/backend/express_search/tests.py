import json
from unittest.mock import MagicMock, patch
from django.test import TestCase, RequestFactory
from specifyweb.backend.express_search.config_views import config_api

class ExpressSearchConfigTests(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.user = MagicMock()
        self.user.id = 1
        self.user.name = "testuser"
        self.user.usertype = "manager"
        self.user.is_authenticated = True
        
        self.collection = MagicMock()
        self.collection.id = 1
        self.collection.discipline = MagicMock()
        
    @patch('specifyweb.backend.express_search.config_views.get_express_search_config_str')
    @patch('specifyweb.backend.express_search.config_views._get_schema_metadata')
    def test_get_config(self, mock_schema, mock_get_xml):
        # Mocking the XML response
        mock_get_xml.return_value = '<?xml version="1.0" encoding="UTF-8"?><search><tables><searchtable><tableName>CollectionObject</tableName><displayOrder>0</displayOrder><searchFields><searchfield><fieldName>catalogNumber</fieldName><order>0</order></searchfield></searchFields></searchtable></tables></search>'
        mock_schema.return_value = []
        
        request = self.factory.get('/express_search/config/')
        request.specify_collection = self.collection
        request.specify_user = self.user
        request.user = self.user
        
        response = config_api(request)
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.content)
        self.assertIn('config', data)
        self.assertEqual(data['config']['tables'][0]['tableName'], 'CollectionObject')

    @patch('specifyweb.backend.express_search.config_views._save_express_search_config')
    def test_put_config(self, mock_save):
        config_data = {
            "tables": [
                {
                    "tableName": "CollectionObject",
                    "displayOrder": 0,
                    "searchFields": [
                        {"fieldName": "catalogNumber", "order": 0, "inUse": True}
                    ],
                    "displayFields": [
                        {"fieldName": "catalogNumber", "inUse": True}
                    ]
                }
            ],
            "relatedQueries": []
        }
        
        request = self.factory.put(
            '/express_search/config/',
            data=json.dumps(config_data),
            content_type='application/json'
        )
        request.specify_collection = self.collection
        request.specify_user = self.user
        request.user = self.user
        
        response = config_api(request)
        self.assertEqual(response.status_code, 200)
        
        # Verify that _save_express_search_config was called with XML
        args, _ = mock_save.call_args
        xml_str = args[2]
        self.assertIn('<tableName>CollectionObject</tableName>', xml_str)
        self.assertIn('<fieldName>catalogNumber</fieldName>', xml_str)

    def test_put_invalid_json(self):
        request = self.factory.put(
            '/express_search/config/',
            data="not json",
            content_type='application/json'
        )
        request.specify_collection = self.collection
        request.specify_user = self.user
        request.user = self.user
        
        with self.assertRaises(json.JSONDecodeError):
            config_api(request)

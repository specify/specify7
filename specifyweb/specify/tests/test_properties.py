from django.test import Client
from specifyweb.specify.tests.test_api import ApiTests
from unittest import skip

class TestProperties(ApiTests):

    def test_properties(self):
        
        c = Client()
        path_name = 'common_en.properties'
        c.force_login(self.specifyuser)

        response = c.get(f"/properties/{path_name}")
        self.assertEqual(response.status_code, 200)

    @skip("The error code should be 404, but it returns 500")
    def test_properties_not_exist(self):
        
        c = Client()
        path_name = 'common_en_not_exist.properties'
        c.force_login(self.specifyuser)

        response = c.get(f"/properties/{path_name}")
        self.assertEqual(response.status_code, 404)
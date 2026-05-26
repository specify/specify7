from django.test import Client
from specifyweb.specify.tests.test_api import ApiTests


class TestImages(ApiTests):

    def test_image(self):
        
        c = Client()
        path_name = 'biogeomancer.png'
        c.force_login(self.specifyuser)

        response = c.get(f"/images/{path_name}")
        self.assertEqual(response.status_code, 200)

    def test_image_not_exist(self):
        
        c = Client()
        path_name = 'biogeomancerNotExist.png'
        c.force_login(self.specifyuser)

        response = c.get(f"/images/{path_name}")
        self.assertEqual(response.status_code, 404)
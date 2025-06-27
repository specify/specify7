from django.test import Client
from specifyweb.specify.tests.test_api import ApiTests
from unittest import skip

class TestSetPassword(ApiTests):

    @skip("doesn't work yet")
    def test_set_password(self):
        c = Client()
        c.force_login(self.specifyuser)

        response = c.post(
            f"/api/set_password/{self.specifyuser.id}/",
            {
                'password': "changed_password"
            }
        )
        
        self.assertEqual(response.status_code, 204)
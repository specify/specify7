from django.test import Client
from specifyweb.specify.models import Specifyuser
from specifyweb.specify.tests.test_api import ApiTests

class TestSetPassword(ApiTests):


    def test_set_password(self):
        c = Client()
        c.force_login(self.specifyuser)

        self._update(self.specifyuser, dict(usertype='Manager'))
        response = c.post(
            f"/api/set_password/{self.specifyuser.id}/",
            {
                'password': "changed_password"
            }
        )
        
        self.assertEqual(response.status_code, 204)

        spuser = Specifyuser.objects.get(id=self.specifyuser.id)
        is_valid = spuser.check_password('changed_password')

        self.assertTrue(is_valid, "password change failed!")
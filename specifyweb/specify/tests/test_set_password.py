from django.test import Client
from specifyweb.specify.models import Specifyuser
from specifyweb.specify.tests.test_api import ApiTests

class TestSetPassword(ApiTests):


    def test_set_password(self):
        c = Client()
        c.force_login(self.specifyuser)

        self._update(self.specifyuser, dict(usertype='Manager'))
        response = c.post(
            f"/accounts/set_password/{self.specifyuser.id}/",
            {
                'password': "changed_password"
            }
        )
        
        self.assertEqual(response.status_code, 204)

        spuser = Specifyuser.objects.get(id=self.specifyuser.id)
        is_valid = spuser.check_password('changed_password')

        self.assertTrue(is_valid, "password change failed!")

    def test_set_password_for_another_user(self):
        c = Client()
        c.force_login(self.specifyuser)

        user2 = Specifyuser.objects.create( # type: ignore
            isloggedin=False,
            isloggedinreport=False,
            name="testuser2",
            password="")
        user2.set_password('old_password')
        user2.save()

        response = c.post(
            f"/accounts/set_password/{user2.id}/",
            {
                'password': "new_password"
            }
        )

        self.assertEqual(response.status_code, 204)

        c2 = Client()
        self.assertTrue(c2.login(name='testuser2', password='new_password'))

        c3 = Client()
        self.assertFalse(c3.login(name='testuser2', password='old_password'))
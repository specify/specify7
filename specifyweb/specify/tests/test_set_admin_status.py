from django.test import Client
from specifyweb.specify.tests.test_api import ApiTests

from unittest.mock import patch

class TestSetAdminStatus(ApiTests):
    
    @patch("specifyweb.specify.views.spmodels.Specifyuser.set_admin")
    @patch("specifyweb.specify.views.spmodels.Specifyuser.clear_admin")
    def test_set_admin(self, clear_admin, set_admin):

        set_admin.return_value = None
        clear_admin.return_value = None

        c = Client()
        c.force_login(self.specifyuser)

        response = c.post(
            f'/accounts/set_admin_status/{self.specifyuser.id}/',
            dict(admin_status='true')
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content.decode(), 'true')

        set_admin.assert_called_once()
        clear_admin.assert_not_called()

    @patch("specifyweb.specify.views.spmodels.Specifyuser.set_admin")
    @patch("specifyweb.specify.views.spmodels.Specifyuser.clear_admin")
    def test_clear_admin(self, clear_admin, set_admin):

        set_admin.return_value = None
        clear_admin.return_value = None

        c = Client()
        c.force_login(self.specifyuser)

        response = c.post(
            f'/accounts/set_admin_status/{self.specifyuser.id}/',
            dict(admin_status='false')
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content.decode(), 'false')

        set_admin.assert_not_called()
        clear_admin.assert_called_once()
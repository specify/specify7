import json

from django.test import Client

from specifyweb.backend.context.models import LoginNotice
from specifyweb.backend.context.sanitizers import sanitize_login_notice_html
from specifyweb.specify.tests.test_api import ApiTests


class LoginNoticeTests(ApiTests):
    def setUp(self) -> None:
        super().setUp()
        self.client = Client()

    def test_public_endpoint_returns_204_when_disabled(self) -> None:
        response = self.client.get('/context/login_notice/')
        self.assertEqual(response.status_code, 204)

        LoginNotice.objects.create(content='', is_enabled=False)
        response = self.client.get('/context/login_notice/')
        self.assertEqual(response.status_code, 204)

    def test_public_endpoint_returns_sanitized_content(self) -> None:
        LoginNotice.objects.create(
            content='<p>Hello</p><script>alert(1)</script>',
            is_enabled=True,
        )

        response = self.client.get('/context/login_notice/')
        self.assertEqual(response.status_code, 200)
        payload = json.loads(response.content)
        self.assertEqual(payload['message'], '<p>Hello</p>alert(1)')

    def test_manage_requires_administrator(self) -> None:
        non_admin = self.specifyuser.__class__.objects.create(
            isloggedin=False,
            isloggedinreport=False,
            name='readonly',
            password='205C0D906445E1C71CA77C6D714109EB6D582B03A5493E4C',
        )
        client = Client()
        client.force_login(non_admin)

        response = client.get('/context/login_notice/manage/')
        self.assertEqual(response.status_code, 403)

    def test_manage_update_sanitizes_and_persists(self) -> None:
        self.client.force_login(self.specifyuser)
        payload = {
            'enabled': True,
            'content': '<p>Welcome</p><img src=x onerror="alert(1)">',
        }

        response = self.client.put(
            '/context/login_notice/manage/',
            data=json.dumps(payload),
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertTrue(data['enabled'])
        self.assertEqual(
            data['content'],
            sanitize_login_notice_html(payload['content']),
        )

        notice = LoginNotice.objects.get(scope='login')
        self.assertTrue(notice.is_enabled)
        self.assertEqual(
            notice.content,
            sanitize_login_notice_html(payload['content']),
        )

        public_response = self.client.get('/context/login_notice/')
        self.assertEqual(public_response.status_code, 200)
        public_payload = json.loads(public_response.content)
        self.assertEqual(public_payload['message'], notice.content)

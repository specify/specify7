import json
from datetime import timedelta

from django.test import Client
from django.utils import timezone

from specifyweb.backend.accounts.models import UserPresence
from specifyweb.backend.accounts.presence import get_user_presence_statuses
from specifyweb.specify.tests.test_api import ApiTests


class PresenceApiTest(ApiTests):
    def test_presence_heartbeat_updates_timestamps(self) -> None:
        client = Client()
        client.force_login(self.specifyuser)

        response = client.post(
            '/accounts/presence/',
            data=json.dumps({'active': True}),
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 204)
        presence = UserPresence.objects.get(specifyuser=self.specifyuser)
        first_activity = presence.last_activity
        self.assertIsNotNone(first_activity)

        response = client.post(
            '/accounts/presence/',
            data=json.dumps({'active': False}),
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 204)
        presence.refresh_from_db()
        self.assertEqual(presence.last_activity, first_activity)
        self.assertGreaterEqual(presence.last_heartbeat, first_activity)

    def test_presence_heartbeat_rejects_invalid_payloads(self) -> None:
        client = Client()
        client.force_login(self.specifyuser)

        for data in ('not json', json.dumps({'active': 'true'}), json.dumps([])):
            with self.subTest(data=data):
                response = client.post(
                    '/accounts/presence/',
                    data=data,
                    content_type='application/json',
                )
                self.assertEqual(response.status_code, 400)

    def test_presence_status_uses_heartbeat_and_activity_age(self) -> None:
        now = timezone.now()
        UserPresence.objects.create(
            specifyuser=self.specifyuser,
            last_heartbeat=now,
            last_activity=now,
        )

        self.assertEqual(
            get_user_presence_statuses([self.specifyuser.id]),
            {self.specifyuser.id: 'active'},
        )

        UserPresence.objects.filter(specifyuser=self.specifyuser).update(
            last_activity=now - timedelta(minutes=6),
        )
        self.assertEqual(
            get_user_presence_statuses([self.specifyuser.id]),
            {self.specifyuser.id: 'inactive'},
        )

        UserPresence.objects.filter(specifyuser=self.specifyuser).update(
            last_heartbeat=now - timedelta(minutes=6),
        )
        self.assertEqual(
            get_user_presence_statuses([self.specifyuser.id]),
            {self.specifyuser.id: 'offline'},
        )

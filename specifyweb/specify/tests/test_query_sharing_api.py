import json

from django.test import Client

from specifyweb.backend.permissions.models import SpqueryShare, UserPolicy
from specifyweb.specify import models
from specifyweb.specify.tests.test_api import ApiTests


class SharedQueryApiTests(ApiTests):
    def setUp(self):
        super().setUp()
        self.query = models.Spquery.objects.create(
            name=f"Shared query {self.collection.id}",
            contextname="Collectionobject",
            contexttableid=models.Collectionobject.specify_model.tableId,
            specifyuser=self.specifyuser,
        )
        self.recipient = models.Specifyuser.objects.create(
            name=f"recipient{self.collection.id}",
            password="unusable",
            isloggedin=False,
            isloggedinreport=False,
        )
        UserPolicy.objects.create(
            collection=None,
            specifyuser=self.specifyuser,
            resource="%",
            action="%",
        )
        self.client = Client()
        self.client.force_login(self.specifyuser)
        self.url = f"/stored_query/query/{self.query.id}/shares/"

    def test_owner_can_replace_and_revoke_recipient_grants(self):
        response = self.client.put(
            self.url,
            data=json.dumps({"recipientIds": [self.recipient.id]}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"recipientIds": [self.recipient.id]})
        self.assertTrue(
            SpqueryShare.objects.filter(
                query=self.query, recipient=self.recipient
            ).exists()
        )

        response = self.client.get(self.url)
        self.assertEqual(response.json(), {"recipientIds": [self.recipient.id]})

        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, 204)
        self.assertFalse(SpqueryShare.objects.filter(query=self.query).exists())

    def test_non_owner_administrator_cannot_manage_query_shares(self):
        other_admin = models.Specifyuser.objects.create(
            name=f"otheradmin{self.collection.id}",
            password="unusable",
            isloggedin=False,
            isloggedinreport=False,
        )
        UserPolicy.objects.create(
            collection=None,
            specifyuser=other_admin,
            resource="%",
            action="%",
        )
        client = Client()
        client.force_login(other_admin)

        response = client.get(self.url)

        self.assertEqual(response.status_code, 403)

    def test_unknown_recipient_is_rejected_without_changing_grants(self):
        response = self.client.put(
            self.url,
            data=json.dumps({"recipientIds": [self.recipient.id, 999999999]}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertFalse(SpqueryShare.objects.filter(query=self.query).exists())

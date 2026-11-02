import json

from django.test import Client

from specifyweb.backend.permissions.models import SpqueryShare, UserPolicy
from specifyweb.backend.stored_queries.sharing import (
    ensure_query_access,
    filter_queries_for_user,
)
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

    def test_only_owners_and_granted_recipients_can_access_queries(self):
        other_query = models.Spquery.objects.create(
            name=f"Other query {self.collection.id}",
            contextname="Collectionobject",
            contexttableid=models.Collectionobject.specify_model.tableId,
            specifyuser=self.recipient,
        )

        visible_ids = set(
            filter_queries_for_user(
                models.Spquery.objects.all(), self.specifyuser.id
            ).values_list("id", flat=True)
        )
        self.assertIn(self.query.id, visible_ids)
        self.assertNotIn(other_query.id, visible_ids)

        SpqueryShare.objects.create(query=other_query, recipient=self.specifyuser)
        ensure_query_access(other_query.id, self.specifyuser.id)

        visible_ids = set(
            filter_queries_for_user(
                models.Spquery.objects.all(), self.specifyuser.id
            ).values_list("id", flat=True)
        )
        self.assertIn(other_query.id, visible_ids)

    def test_direct_query_resource_requires_owner_or_share_grant(self):
        private_query = models.Spquery.objects.create(
            name=f"Private query {self.collection.id}",
            contextname="Collectionobject",
            contexttableid=models.Collectionobject.specify_model.tableId,
            specifyuser=self.recipient,
        )
        url = f"/api/specify/spquery/{private_query.id}/"

        response = self.client.get(url)
        self.assertEqual(response.status_code, 404)

        SpqueryShare.objects.create(query=private_query, recipient=self.specifyuser)
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

    def test_query_collection_only_lists_owned_or_shared_queries(self):
        private_query = models.Spquery.objects.create(
            name=f"Private list query {self.collection.id}",
            contextname="Collectionobject",
            contexttableid=models.Collectionobject.specify_model.tableId,
            specifyuser=self.recipient,
        )
        url = "/api/specify/spquery/?domainfilter=false&limit=0"

        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        query_ids = {query["id"] for query in response.json()["objects"]}
        self.assertIn(self.query.id, query_ids)
        self.assertNotIn(private_query.id, query_ids)

        SpqueryShare.objects.create(query=private_query, recipient=self.specifyuser)
        response = self.client.get(url)
        query_ids = {query["id"] for query in response.json()["objects"]}
        self.assertIn(private_query.id, query_ids)

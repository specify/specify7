import json

from django.core.exceptions import PermissionDenied
from django.test import Client, SimpleTestCase

from specifyweb.backend.permissions.models import SpqueryShare, UserPolicy
from specifyweb.backend.stored_queries.sharing import (
    ensure_query_access,
    ensure_query_write_access,
    filter_queries_for_user,
)
from specifyweb.specify import models
from specifyweb.specify.api.serializers import obj_to_data
from specifyweb.specify.tests.test_api import ApiTests


class QueryWriteAccessTests(SimpleTestCase):
    def test_owner_can_modify_personal_or_shared_query(self):
        query = models.Spquery(specifyuser_id=1)
        ensure_query_write_access(query, 1)

    def test_non_owner_cannot_modify_query(self):
        query = models.Spquery(specifyuser_id=1)
        with self.assertRaises(PermissionDenied):
            ensure_query_write_access(query, 2)

    def test_only_parent_query_owner_can_modify_field(self):
        query = models.Spquery(id=1, specifyuser_id=1)
        field = models.Spqueryfield(query=query)
        ensure_query_write_access(field, 1)
        with self.assertRaises(PermissionDenied):
            ensure_query_write_access(field, 2)

    def test_unrelated_records_are_unaffected(self):
        ensure_query_write_access(models.Collectionobject(), 1)


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


class SharedQueryWriteApiTests(ApiTests):
    def setUp(self):
        super().setUp()
        self.owner = models.Specifyuser.objects.create(
            name="query_owner",
            password="unusable",
        )
        self.shared_query = models.Spquery.objects.create(
            name="Shared original",
            contextname="Collectionobject",
            contexttableid=models.Collectionobject.specify_model.tableId,
            specifyuser=self.owner,
        )
        self.personal_query = models.Spquery.objects.create(
            name="Personal query",
            contextname="Collectionobject",
            contexttableid=models.Collectionobject.specify_model.tableId,
            specifyuser=self.specifyuser,
        )
        SpqueryShare.objects.create(
            query=self.shared_query, recipient=self.specifyuser
        )
        self.field = models.Spqueryfield.objects.create(
            query=self.shared_query,
            fieldname="CatalogNumber",
            operstart=1,
            position=0,
            sorttype=0,
            startvalue="",
            stringid="1.collectionobject.catalognumber",
            tablelist="1",
        )
        self.client.force_login(self.specifyuser)
        self.query_url = f"/api/specify/spquery/{self.shared_query.id}/"
        self.field_url = f"/api/specify/spqueryfield/{self.field.id}/"

    def test_recipient_cannot_update_or_delete_original(self):
        for changes in (
            {"name": "Changed"},
            {"specifyuser": f"/api/specify/specifyuser/{self.specifyuser.id}/"},
            {"fields": []},
        ):
            with self.subTest(changes=changes):
                response = self.client.put(
                    self.query_url,
                    data={"version": self.shared_query.version, **changes},
                    content_type="application/json",
                )
                self.assertEqual(response.status_code, 403)

        response = self.client.delete(
            f"{self.query_url}?version={self.shared_query.version}"
        )
        self.assertEqual(response.status_code, 403)
        self.shared_query.refresh_from_db()
        self.assertEqual(self.shared_query.name, "Shared original")
        self.assertEqual(self.shared_query.specifyuser_id, self.owner.id)
        self.assertTrue(self.shared_query.fields.filter(pk=self.field.id).exists())

    def test_recipient_cannot_update_delete_or_move_original_field(self):
        for changes in (
            {"startvalue": "Changed"},
            {"query": f"/api/specify/spquery/{self.personal_query.id}/"},
        ):
            with self.subTest(changes=changes):
                response = self.client.put(
                    self.field_url,
                    data={"version": self.field.version, **changes},
                    content_type="application/json",
                )
                self.assertEqual(response.status_code, 403)

        response = self.client.delete(
            f"{self.field_url}?version={self.field.version}"
        )
        self.assertEqual(response.status_code, 403)
        self.field.refresh_from_db()
        self.assertEqual(self.field.startvalue, "")
        self.assertEqual(self.field.query_id, self.shared_query.id)

    def test_recipient_cannot_add_field_to_original(self):
        data = obj_to_data(self.field)
        del data["id"]
        response = self.client.post(
            "/api/specify/spqueryfield/",
            data=data,
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(self.shared_query.fields.count(), 1)

    def test_recipient_cannot_move_personal_field_into_original(self):
        self.field.query = self.personal_query
        self.field.save()
        response = self.client.put(
            self.field_url,
            data={
                "version": self.field.version,
                "query": self.query_url,
            },
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)
        self.field.refresh_from_db()
        self.assertEqual(self.field.query_id, self.personal_query.id)

    def test_nested_update_cannot_steal_original_field(self):
        response = self.client.put(
            f"/api/specify/spquery/{self.personal_query.id}/",
            data={
                "version": self.personal_query.version,
                "fields": [obj_to_data(self.field)],
            },
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)
        self.field.refresh_from_db()
        self.assertEqual(self.field.query_id, self.shared_query.id)

    def test_personal_query_cannot_overwrite_shared_query_by_changing_id(self):
        response = self.client.put(
            f"/api/specify/spquery/{self.personal_query.id}/",
            data={
                "version": self.personal_query.version,
                "id": self.shared_query.id,
                "name": "Overwritten",
            },
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)
        self.shared_query.refresh_from_db()
        self.assertEqual(self.shared_query.name, "Shared original")

    def test_create_cannot_overwrite_shared_query_using_its_id(self):
        response = self.client.post(
            "/api/specify/spquery/",
            data={
                "id": self.shared_query.id,
                "name": "Overwritten",
                "contextname": "Collectionobject",
                "contexttableid": models.Collectionobject.specify_model.tableId,
                "specifyuser": f"/api/specify/specifyuser/{self.specifyuser.id}/",
            },
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)
        self.shared_query.refresh_from_db()
        self.assertEqual(self.shared_query.name, "Shared original")

    def test_personal_query_remains_editable_and_deletable_without_admin(self):
        UserPolicy.objects.filter(specifyuser=self.specifyuser).delete()
        UserPolicy.objects.create(
            specifyuser=self.specifyuser,
            resource="/table/%",
            action="%",
        )
        UserPolicy.objects.create(
            specifyuser=self.specifyuser,
            resource="/field/%",
            action="%",
        )
        UserPolicy.objects.create(
            specifyuser=self.specifyuser,
            resource="/system/sp7/collection",
            action="access",
        )
        url = f"/api/specify/spquery/{self.personal_query.id}/"
        response = self.client.put(
            url,
            data={"version": self.personal_query.version, "name": "Edited"},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.personal_query.refresh_from_db()
        self.assertEqual(self.personal_query.name, "Edited")
        response = self.client.delete(
            f"{url}?version={self.personal_query.version}"
        )
        self.assertEqual(response.status_code, 204)

    def test_owner_can_edit_shared_query_and_its_fields_then_delete(self):
        self.shared_query.specifyuser = self.specifyuser
        self.shared_query.save()
        response = self.client.put(
            self.query_url,
            data={"version": self.shared_query.version, "name": "Owner edit"},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        response = self.client.put(
            self.field_url,
            data={"version": self.field.version, "startvalue": "Owner filter"},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.field.refresh_from_db()
        self.assertEqual(self.field.startvalue, "Owner filter")
        self.shared_query.refresh_from_db()
        response = self.client.delete(
            f"{self.query_url}?version={self.shared_query.version}"
        )
        self.assertEqual(response.status_code, 204)

    def test_recipient_can_create_and_edit_independent_clone(self):
        data = obj_to_data(self.shared_query)
        del data["id"]
        data["name"] = "Personal clone"
        data["specifyuser"] = f"/api/specify/specifyuser/{self.specifyuser.id}/"
        for field in data["fields"]:
            del field["id"]
            field["query"] = None

        response = self.client.post(
            "/api/specify/spquery/",
            data=data,
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 201)
        clone = models.Spquery.objects.get(pk=response.json()["id"])
        self.assertEqual(clone.specifyuser_id, self.specifyuser.id)
        self.assertFalse(clone.share_grants.exists())
        self.assertEqual(clone.fields.count(), 1)
        self.assertNotEqual(clone.fields.get().id, self.field.id)

        response = self.client.put(
            f"/api/specify/spquery/{clone.id}/",
            data={"version": clone.version, "name": "Edited clone"},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.shared_query.refresh_from_db()
        self.assertEqual(self.shared_query.name, "Shared original")

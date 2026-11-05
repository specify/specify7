import json

from unittest.mock import patch

from django.core.exceptions import PermissionDenied
from django.test import Client, SimpleTestCase

from specifyweb.backend.permissions.models import SpqueryShare, UserPolicy
from specifyweb.backend.permissions.permissions import CollectionAccessPT
from specifyweb.backend.stored_queries.access import (
    ensure_query_access,
    ensure_query_write_access,
    filter_queries_for_user,
)
from specifyweb.backend.stored_queries.tests.tests import SQLAlchemySetup
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


class SharedQueryFixture:
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

    def _recipient_client(self) -> Client:
        models.Agent.objects.get_or_create(
            specifyuser=self.recipient,
            division=self.division,
            defaults={"agenttype": 0, "lastname": "Recipient"},
        )
        for resource, action in (
            (CollectionAccessPT.resource, CollectionAccessPT.access.action()),
            ("/table/spquery", "read"),
            ("/table/spqueryfield", "read"),
        ):
            UserPolicy.objects.get_or_create(
                collection=self.collection,
                specifyuser=self.recipient,
                resource=resource,
                action=action,
            )
        client = Client()
        client.force_login(self.recipient)
        client.cookies["collection"] = str(self.collection.id)
        return client

    def _grant_recipient(self, resource: str, action: str) -> None:
        UserPolicy.objects.create(
            collection=self.collection,
            specifyuser=self.recipient,
            resource=resource,
            action=action,
        )

    def _add_catalog_number_field(self) -> None:
        models.Spqueryfield.objects.create(
            query=self.query,
            fieldname="CatalogNumber",
            isdisplay=True,
            operstart=1,
            position=0,
            sorttype=0,
            startvalue="",
            stringid="1.collectionobject.catalognumber",
            tablelist="1",
        )


class SharedQueryApiTests(SharedQueryFixture, ApiTests):

    def test_query_fields_are_limited_to_owned_or_shared_queries(self):
        private_query = models.Spquery.objects.create(
            name=f"Private query {self.collection.id}",
            contextname="Collectionobject",
            contexttableid=models.Collectionobject.specify_model.tableId,
            specifyuser=self.specifyuser,
        )
        recipient_query = models.Spquery.objects.create(
            name=f"Recipient query {self.collection.id}",
            contextname="Collectionobject",
            contexttableid=models.Collectionobject.specify_model.tableId,
            specifyuser=self.recipient,
        )
        SpqueryShare.objects.create(query=self.query, recipient=self.recipient)

        visible_field = models.Spqueryfield.objects.create(
            query=self.query,
            fieldname="SharedField",
            operstart=1,
            position=0,
            sorttype=0,
            startvalue="",
            stringid="1.collectionobject.catalognumber",
            tablelist="1",
        )
        private_field = models.Spqueryfield.objects.create(
            query=private_query,
            fieldname="PrivateField",
            operstart=1,
            position=0,
            sorttype=0,
            startvalue="",
            stringid="1.collectionobject.catalognumber",
            tablelist="1",
        )
        recipient_field = models.Spqueryfield.objects.create(
            query=recipient_query,
            fieldname="RecipientField",
            operstart=1,
            position=0,
            sorttype=0,
            startvalue="",
            stringid="1.collectionobject.catalognumber",
            tablelist="1",
        )
        orphaned_field = models.Spqueryfield.objects.create(
            query=None,
            fieldname="OrphanedField",
            operstart=1,
            position=0,
            sorttype=0,
            startvalue="",
            stringid="1.collectionobject.catalognumber",
            tablelist="1",
        )

        response = self._recipient_client().get(
            "/table_rows/specify_rows/spqueryfield/",
            {"fields": "id,query_id"},
        )

        self.assertEqual(response.status_code, 200, response.content)
        rows = {tuple(row) for row in response.json()}
        self.assertEqual(
            rows,
            {
                (visible_field.id, self.query.id),
                (recipient_field.id, recipient_query.id),
            },
        )
        self.assertNotIn((private_field.id, private_query.id), rows)
        self.assertNotIn((orphaned_field.id, None), rows)

        client = self._recipient_client()
        collection_url = "/api/specify/spqueryfield/?domainfilter=false&limit=0"
        response = client.get(collection_url)
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(
            {field["id"] for field in response.json()["objects"]},
            {visible_field.id, recipient_field.id},
        )

        for field, status in (
            (visible_field, 200),
            (recipient_field, 200),
            (private_field, 404),
            (orphaned_field, 404),
        ):
            with self.subTest(field=field.fieldname):
                response = client.get(f"/api/specify/spqueryfield/{field.id}/")
                self.assertEqual(response.status_code, status, response.content)

        SpqueryShare.objects.filter(
            query=self.query, recipient=self.recipient
        ).delete()
        response = client.get(f"/api/specify/spqueryfield/{visible_field.id}/")
        self.assertEqual(response.status_code, 404)
        response = client.get(collection_url)
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(
            {field["id"] for field in response.json()["objects"]},
            {recipient_field.id},
        )

    def test_owner_can_replace_and_revoke_recipient_grants(self):
        response = self.client.put(
            self.url,
            data=json.dumps({"recipientIds": [self.recipient.id], "version": self.query.version}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.query.refresh_from_db()
        self.assertEqual(response.json(), {"recipientIds": [self.recipient.id], "version": self.query.version})
        self.assertTrue(
            SpqueryShare.objects.filter(
                query=self.query, recipient=self.recipient
            ).exists()
        )

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(
            response.json()["recipientIds"], [self.recipient.id]
        )

        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, 204)
        self.assertFalse(SpqueryShare.objects.filter(query=self.query).exists())

        response = self._recipient_client().get(
            f"/api/specify/spquery/{self.query.id}/"
        )
        self.assertEqual(response.status_code, 404)

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
        SpqueryShare.objects.create(query=self.query, recipient=self.recipient)

        response = client.get(self.url)

        self.assertEqual(response.status_code, 403)

        response = client.put(
            self.url,
            data=json.dumps({"recipientIds": []}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)

        response = client.delete(self.url)
        self.assertEqual(response.status_code, 403)
        self.assertTrue(
            SpqueryShare.objects.filter(
                query=self.query, recipient=self.recipient
            ).exists()
        )

    def test_unknown_recipient_is_rejected_without_changing_grants(self):
        response = self.client.put(
            self.url,
            data=json.dumps({"recipientIds": [self.recipient.id, 999999999]}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertFalse(SpqueryShare.objects.filter(query=self.query).exists())

    def test_stale_share_save_preserves_current_grants_and_can_retry_after_reload(self):
        initial = self.client.get(self.url).json()
        response = self.client.put(
            self.url,
            data={"recipientIds": [self.recipient.id], "version": initial["version"]},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200, response.content)
        grant = SpqueryShare.objects.get(query=self.query, recipient=self.recipient)
        current_version = response.json()["version"]
        self.assertEqual(current_version, initial["version"] + 1)

        response = self.client.put(
            self.url,
            data={"recipientIds": [], "version": initial["version"]},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 409, response.content)
        self.assertTrue(SpqueryShare.objects.filter(pk=grant.id).exists())
        current = self.client.get(self.url).json()
        self.assertEqual(current["recipientIds"], [self.recipient.id])
        self.assertEqual(current["version"], current_version)

        response = self.client.put(
            self.url,
            data={"recipientIds": [], "version": current["version"]},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200, response.content)
        self.assertFalse(SpqueryShare.objects.filter(query=self.query).exists())

    def test_missing_or_invalid_version_preserves_grants(self):
        grant = SpqueryShare.objects.create(query=self.query, recipient=self.recipient)
        for version in (None, "invalid"):
            with self.subTest(version=version):
                data = {"recipientIds": []}
                if version is not None:
                    data["version"] = version
                response = self.client.put(self.url, data=data, content_type="application/json")
                self.assertEqual(response.status_code, 400, response.content)
                self.assertTrue(SpqueryShare.objects.filter(pk=grant.id).exists())

    def test_revoking_shares_invalidates_pending_save(self):
        version = self.client.get(self.url).json()["version"]
        SpqueryShare.objects.create(query=self.query, recipient=self.recipient)
        self.assertEqual(self.client.delete(self.url).status_code, 204)
        response = self.client.put(
            self.url,
            data={"recipientIds": [self.recipient.id], "version": version},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 409, response.content)
        self.assertFalse(SpqueryShare.objects.filter(query=self.query).exists())

    def test_share_recipient_list_is_grouped_by_collection_and_discipline(self):
        unassigned = models.Specifyuser.objects.create(
            name=f"unassigned{self.collection.id}",
            password="unusable",
            isloggedin=False,
            isloggedinreport=False,
        )
        UserPolicy.objects.create(
            collection=self.collection,
            specifyuser=self.recipient,
            resource=CollectionAccessPT.resource,
            action=CollectionAccessPT.access.action(),
        )

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 200)
        data = response.json()
        collection = next(
            collection
            for collection in data["collections"]
            if collection["id"] == self.collection.id
        )
        self.assertEqual(collection["name"], self.collection.collectionname)
        self.assertEqual(
            collection["discipline"],
            {
                "id": self.discipline.id,
                "name": self.discipline.name,
                "division": {
                    "id": self.discipline.division_id,
                    "name": self.discipline.division.name,
                },
            },
        )
        self.assertEqual(
            {user["id"] for user in collection["users"]},
            {self.specifyuser.id, self.recipient.id},
        )
        self.assertIn(
            {"id": unassigned.id, "name": unassigned.name},
            data["usersWithoutCollection"],
        )

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

    def test_recipient_sees_owner_updates_to_shared_query(self):
        SpqueryShare.objects.create(query=self.query, recipient=self.recipient)
        resource_url = f"/api/specify/spquery/{self.query.id}/"

        response = self.client.put(
            resource_url,
            data={"version": self.query.version, "name": "Updated by owner"},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200, response.content)

        response = self._recipient_client().get(resource_url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["name"], "Updated by owner")


class SharedQueryMergeApiTests(SharedQueryFixture, ApiTests):
    def test_user_merge_transfers_recipient_grants(self):
        original_version = self.query.version
        SpqueryShare.objects.create(query=self.query, recipient=self.recipient)
        existing_grant = SpqueryShare.objects.create(
            query=self.query, recipient=self.specifyuser
        )
        survivor = models.Specifyuser.objects.create(
            name="surviving_recipient", password="unusable"
        )
        UserPolicy.objects.create(
            collection=None, specifyuser=survivor, resource="%", action="%"
        )
        response = self.client.post(
            f"/merge/specifyuser/replace/{survivor.id}/",
            data={"old_record_ids": [self.recipient.id], "background": False},
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 204, response.content)
        self.assertFalse(models.Specifyuser.objects.filter(pk=self.recipient.id).exists())
        self.assertCountEqual(
            self.query.share_grants.values_list("recipient_id", flat=True),
            [survivor.id, self.specifyuser.id],
        )
        self.assertTrue(SpqueryShare.objects.filter(pk=existing_grant.id).exists())
        self.query.refresh_from_db()
        self.assertEqual(self.query.specifyuser_id, self.specifyuser.id)
        self.assertEqual(self.query.version, original_version + 1)
        ensure_query_access(self.query.id, survivor.id)

        response = self.client.put(
            f"/api/specify/spquery/{self.query.id}/",
            data={"version": original_version, "name": "Stale edit"},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 409, response.content)
        response = self.client.put(
            f"/stored_query/query/{self.query.id}/shares/",
            data={"version": original_version, "recipientIds": []},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 409, response.content)
        ensure_query_access(self.query.id, survivor.id)

    def test_user_merge_skips_duplicate_recipient_grants(self):
        other_recipient = models.Specifyuser.objects.create(
            name="other_recipient", password="unusable"
        )
        other_query = models.Spquery.objects.create(
            name="Another shared query",
            contextname="Collectionobject",
            contexttableid=models.Collectionobject.specify_model.tableId,
            specifyuser=self.specifyuser,
        )
        existing_grant = SpqueryShare.objects.create(
            query=self.query, recipient=self.specifyuser
        )
        for query in (self.query, other_query):
            for recipient in (self.recipient, other_recipient):
                SpqueryShare.objects.create(query=query, recipient=recipient)

        original_version = self.query.version
        other_original_version = other_query.version
        response = self.client.post(
            f"/merge/specifyuser/replace/{self.specifyuser.id}/",
            data={
                "old_record_ids": [self.recipient.id, other_recipient.id],
                "background": False,
            },
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 204, response.content)
        self.assertFalse(models.Specifyuser.objects.filter(
            pk__in=[self.recipient.id, other_recipient.id]
        ).exists())
        for query in (self.query, other_query):
            self.assertEqual(
                list(query.share_grants.values_list("recipient_id", flat=True)),
                [self.specifyuser.id],
            )
        self.assertTrue(SpqueryShare.objects.filter(pk=existing_grant.id).exists())
        self.query.refresh_from_db()
        other_query.refresh_from_db()
        self.assertEqual(self.query.version, original_version)
        self.assertEqual(other_query.version, other_original_version + 1)

    def test_user_merge_denies_grants_to_non_admin_survivor(self):
        survivor = models.Specifyuser.objects.create(
            name="non_admin_survivor", password="unusable"
        )
        source = models.Specifyuser.objects.create(
            name="another_merge_source", password="unusable"
        )
        grant = SpqueryShare.objects.create(query=self.query, recipient=source)
        original_version = self.query.version
        self.assertFalse(survivor.is_admin())

        for duplicate in (False, True):
            with self.subTest(duplicate=duplicate):
                if duplicate:
                    SpqueryShare.objects.create(query=self.query, recipient=survivor)
                original_grants = set(self.query.share_grants.values_list("id", flat=True))
                response = self.client.post(
                    f"/merge/specifyuser/replace/{survivor.id}/",
                    data={
                        "old_record_ids": [self.recipient.id, source.id],
                        "background": False,
                    },
                    content_type="application/json",
                )

                self.assertEqual(response.status_code, 403, response.content)
                self.assertIn("Specify Administrator", response.json()["QueryWriteDenied"])
                self.assertEqual(
                    models.Specifyuser.objects.filter(
                        pk__in=[self.recipient.id, source.id, survivor.id]
                    ).count(),
                    3,
                )
                grant.refresh_from_db()
                self.assertEqual(grant.recipient_id, source.id)
                self.assertEqual(
                    set(self.query.share_grants.values_list("id", flat=True)),
                    original_grants,
                )
                self.query.refresh_from_db()
                self.assertEqual(self.query.version, original_version)

    def test_user_merge_without_grants_allows_non_admin_survivor(self):
        survivor = models.Specifyuser.objects.create(
            name="non_admin_survivor", password="unusable"
        )
        self.assertFalse(survivor.is_admin())
        original_version = self.query.version
        response = self.client.post(
            f"/merge/specifyuser/replace/{survivor.id}/",
            data={"old_record_ids": [self.recipient.id], "background": False},
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 204, response.content)
        self.assertFalse(models.Specifyuser.objects.filter(pk=self.recipient.id).exists())
        self.assertTrue(models.Specifyuser.objects.filter(pk=survivor.id).exists())
        self.query.refresh_from_db()
        self.assertEqual(self.query.version, original_version)

    def test_shared_source_blocks_entire_query_merge_without_losing_access(self):
        sources = [
            models.Spquery.objects.create(
                name=f"Merge source {index}",
                contextname="Collectionobject",
                contexttableid=models.Collectionobject.specify_model.tableId,
                specifyuser=self.specifyuser,
            )
            for index in range(2)
        ]
        SpqueryShare.objects.create(query=self.query, recipient=self.recipient)
        recipient_client = self._recipient_client()
        original_data = [obj_to_data(query) for query in [*sources, self.query]]

        for shared_source in sources:
            with self.subTest(shared_source=shared_source.id):
                grant = SpqueryShare.objects.create(
                    query=shared_source, recipient=self.recipient
                )
                response = self.client.post(
                    f"/merge/spquery/replace/{self.query.id}/",
                    data={
                        "old_record_ids": [source.id for source in sources],
                        "background": False,
                    },
                    content_type="application/json",
                )

                self.assertEqual(response.status_code, 403, response.content)
                self.assertIn("Shared source queries cannot be merged", response.json()["QueryWriteDenied"])
                for query, expected in zip([*sources, self.query], original_data):
                    query.refresh_from_db()
                    self.assertEqual(obj_to_data(query), expected)
                self.assertTrue(SpqueryShare.objects.filter(pk=grant.id).exists())
                for query in (shared_source, self.query):
                    self.assertEqual(
                        recipient_client.get(f"/api/specify/spquery/{query.id}/").status_code,
                        200,
                    )
                grant.delete()

    def test_unshared_source_can_merge_into_shared_target(self):
        source = models.Spquery.objects.create(
            name="Unshared merge source",
            contextname="Collectionobject",
            contexttableid=models.Collectionobject.specify_model.tableId,
            specifyuser=self.specifyuser,
        )
        grant = SpqueryShare.objects.create(query=self.query, recipient=self.recipient)
        response = self.client.post(
            f"/merge/spquery/replace/{self.query.id}/",
            data={"old_record_ids": [source.id], "background": False},
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 204, response.content)
        self.assertFalse(models.Spquery.objects.filter(pk=source.id).exists())
        self.assertTrue(SpqueryShare.objects.filter(pk=grant.id, query=self.query).exists())
        self.assertEqual(
            self._recipient_client().get(f"/api/specify/spquery/{self.query.id}/").status_code,
            200,
        )

    def test_user_merge_cannot_transfer_another_users_queries(self):
        recipient_grant = SpqueryShare.objects.create(
            query=self.query, recipient=self.recipient
        )
        for shared in (False, True):
            with self.subTest(shared=shared):
                query = models.Spquery.objects.create(
                    name=f"User merge query {shared}",
                    contextname="Collectionobject",
                    contexttableid=models.Collectionobject.specify_model.tableId,
                    specifyuser=self.recipient,
                )
                if shared:
                    SpqueryShare.objects.create(query=query, recipient=self.specifyuser)

                response = self.client.post(
                    f"/merge/specifyuser/replace/{self.specifyuser.id}/",
                    data={
                        "old_record_ids": [self.recipient.id],
                        "background": False,
                    },
                    content_type="application/json",
                )

                self.assertEqual(response.status_code, 403, response.content)
                self.assertIn("QueryWriteDenied", response.json())
                recipient_grant.refresh_from_db()
                self.assertEqual(recipient_grant.recipient_id, self.recipient.id)
                self.assertFalse(SpqueryShare.objects.filter(
                    query=self.query, recipient=self.specifyuser
                ).exists())
                query.refresh_from_db()
                self.assertEqual(query.specifyuser_id, self.recipient.id)
                self.assertEqual(query.share_grants.count(), int(shared))
                self.assertTrue(
                    models.Specifyuser.objects.filter(pk=self.recipient.id).exists()
                )
                query.delete()

    def test_user_merge_checks_queries_of_every_source_user(self):
        other_owner = models.Specifyuser.objects.create(
            name="other_query_owner", password="unusable"
        )
        other_query = models.Spquery.objects.create(
            name="Other user's query",
            contextname="Collectionobject",
            contexttableid=models.Collectionobject.specify_model.tableId,
            specifyuser=other_owner,
        )
        response = self.client.post(
            f"/merge/specifyuser/replace/{self.recipient.id}/",
            data={
                "old_record_ids": [self.specifyuser.id, other_owner.id],
                "background": False,
            },
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 403, response.content)
        self.assertIn("QueryWriteDenied", response.json())
        self.query.refresh_from_db()
        self.assertEqual(self.query.specifyuser_id, self.specifyuser.id)
        self.assertTrue(models.Specifyuser.objects.filter(pk=self.specifyuser.id).exists())
        self.agent.refresh_from_db()
        self.assertEqual(self.agent.specifyuser_id, self.specifyuser.id)
        other_query.refresh_from_db()
        self.assertEqual(other_query.specifyuser_id, other_owner.id)
        self.assertTrue(models.Specifyuser.objects.filter(pk=other_owner.id).exists())

    def test_merging_query_definitions_requires_ownership_of_all_records(self):
        for model_name in ("spquery", "spqueryfield"):
            for source_owned, target_owned in (
                (True, True),
                (False, True),
                (True, False),
                (False, False),
            ):
                with self.subTest(
                    model=model_name,
                    source_owned=source_owned,
                    target_owned=target_owned,
                ):
                    records = []
                    for index, owned in enumerate((True, source_owned, target_owned)):
                        query = models.Spquery.objects.create(
                            name=f"Merge query {model_name} {index}",
                            contextname="Collectionobject",
                            contexttableid=models.Collectionobject.specify_model.tableId,
                            specifyuser=self.specifyuser if owned else self.recipient,
                        )
                        if not owned:
                            SpqueryShare.objects.create(
                                query=query, recipient=self.specifyuser
                            )
                        record = query
                        if model_name == "spqueryfield":
                            record = models.Spqueryfield.objects.create(
                                query=query,
                                fieldname="CatalogNumber",
                                operstart=1,
                                position=0,
                                sorttype=0,
                                startvalue="",
                                stringid="1.collectionobject.catalognumber",
                                tablelist="1",
                            )
                        records.append(record)

                    owned_source, source, target = records
                    original_data = [obj_to_data(record) for record in records]
                    source_ids = [owned_source.id, source.id]
                    response = self.client.post(
                        f"/merge/{model_name}/replace/{target.id}/",
                        data={
                            "old_record_ids": source_ids,
                            "background": False,
                        },
                        content_type="application/json",
                    )

                    authorized = source_owned and target_owned
                    self.assertEqual(
                        response.status_code,
                        204 if authorized else 403,
                        response.content,
                    )
                    model = type(target)
                    self.assertTrue(model.objects.filter(pk=target.id).exists())
                    self.assertEqual(
                        model.objects.filter(pk__in=source_ids).count(),
                        0 if authorized else len(source_ids),
                    )
                    if not authorized:
                        for record, expected in zip(records, original_data):
                            record.refresh_from_db()
                            self.assertEqual(obj_to_data(record), expected)


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


class SharedQueryExecutionTests(SharedQueryFixture, SQLAlchemySetup):
    def setUp(self):
        super().setUp()
        patcher = patch(
            "specifyweb.backend.stored_queries.execution.models.session_context",
            side_effect=lambda: type(self).test_session_context(),
        )
        patcher.start()
        self.addCleanup(patcher.stop)

    def test_direct_links_fail_after_access_is_revoked(self):
        self._add_catalog_number_field()
        self._grant_recipient("/querybuilder/query", "execute")
        self._grant_recipient("/table/collectionobject", "read")
        self.client.put(
            self.url,
            data=json.dumps({"recipientIds": [self.recipient.id], "version": self.query.version}),
            content_type="application/json",
        )
        recipient = self._recipient_client()
        resource_url = f"/api/specify/spquery/{self.query.id}/"
        run_url = f"/stored_query/query/{self.query.id}/"

        self.assertEqual(recipient.get(resource_url).status_code, 200)
        self.assertEqual(recipient.get(run_url).status_code, 200)

        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, 204)

        self.assertEqual(recipient.get(resource_url).status_code, 404)
        self.assertEqual(recipient.get(run_url).status_code, 404)

    def test_shared_query_execution_respects_recipient_permissions(self):
        self._add_catalog_number_field()
        SpqueryShare.objects.create(query=self.query, recipient=self.recipient)
        recipient = self._recipient_client()
        run_url = f"/stored_query/query/{self.query.id}/"

        self.assertEqual(self.client.get(run_url).status_code, 200)
        self.assertEqual(recipient.get(run_url).status_code, 403)

        self._grant_recipient("/querybuilder/query", "execute")
        self.assertEqual(recipient.get(run_url).status_code, 403)

        self._grant_recipient("/table/collectionobject", "read")
        self.assertEqual(recipient.get(run_url).status_code, 200)

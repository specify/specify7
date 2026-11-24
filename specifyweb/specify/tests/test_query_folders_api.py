import json

from django.test import Client

from specifyweb.backend.permissions.models import SpqueryShare
from specifyweb.backend.stored_queries import models as stored_query_models
from specifyweb.specify import models
from specifyweb.specify.tests.test_api import ApiTests
from specifyweb.specify.tests.test_query_sharing_api import SharedQueryFixture


class QueryFolderApiTests(ApiTests):
    def setUp(self):
        super().setUp()
        self.client = Client()
        self.client.force_login(self.specifyuser)
        self.client.cookies["collection"] = str(self.collection.id)
        self.url = "/stored_query/folders/"

    def test_create_top_level_and_nested_folders_and_list_only_owned_folders(self):
        response = self.client.post(
            self.url,
            data=json.dumps({"name": "  Parent folder  ", "parentId": None}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201, response.content)
        parent = stored_query_models.QueryFolder.objects.get(
            pk=response.json()["id"]
        )
        self.assertEqual(parent.name, "Parent folder")
        self.assertEqual(parent.owner_id, self.specifyuser.id)
        self.assertIsNone(parent.parent_id)
        self.assertEqual(parent.section, "personal")

        response = self.client.post(
            self.url,
            data=json.dumps({"name": "Child folder", "parentId": parent.id}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201, response.content)
        child = stored_query_models.QueryFolder.objects.get(
            pk=response.json()["id"]
        )
        self.assertEqual(child.parent_id, parent.id)
        self.assertEqual(child.owner_id, self.specifyuser.id)

        other_user = models.Specifyuser.objects.create(
            name="other_folder_owner",
            password="unusable",
            isloggedin=False,
            isloggedinreport=False,
        )
        other_folder = stored_query_models.QueryFolder.objects.create(
            name="Private folder", owner=other_user
        )
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 200, response.content)
        folders_by_id = {
            folder["id"]: folder for folder in response.json()["folders"]
        }
        self.assertEqual(
            folders_by_id,
            {
                parent.id: {
                    "id": parent.id,
                    "name": parent.name,
                    "parentId": None,
                    "section": "personal",
                },
                child.id: {
                    "id": child.id,
                    "name": child.name,
                    "parentId": parent.id,
                    "section": "personal",
                },
            },
        )
        self.assertNotIn(
            other_folder.id,
            {folder["id"] for folder in response.json()["folders"]},
        )

    def test_rejects_empty_names_and_folders_owned_by_another_user_as_parent(self):
        other_user = models.Specifyuser.objects.create(
            name="another_folder_owner",
            password="unusable",
            isloggedin=False,
            isloggedinreport=False,
        )
        other_folder = stored_query_models.QueryFolder.objects.create(
            name="Private parent", owner=other_user
        )

        for name in ("", "   "):
            with self.subTest(name=name):
                response = self.client.post(
                    self.url,
                    data=json.dumps({"name": name, "parentId": None}),
                    content_type="application/json",
                )
                self.assertEqual(response.status_code, 400, response.content)

        response = self.client.post(
            self.url,
            data=json.dumps({"name": "Child", "parentId": other_folder.id}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400, response.content)
        self.assertEqual(stored_query_models.QueryFolder.objects.count(), 1)

    def test_sections_persist_and_reject_cross_section_parents(self):
        for section in ("personal", "sharing", "shared"):
            with self.subTest(section=section):
                response = self.client.post(
                    self.url,
                    data=json.dumps({"name": "Parent", "section": section}),
                    content_type="application/json",
                )
                self.assertEqual(response.status_code, 201, response.content)
                parent_id = response.json()["id"]
                self.assertEqual(response.json()["section"], section)

                response = self.client.post(
                    self.url,
                    data=json.dumps({
                        "name": "Child", "section": section, "parentId": parent_id,
                    }),
                    content_type="application/json",
                )
                self.assertEqual(response.status_code, 201, response.content)
                self.assertEqual(response.json()["parentId"], parent_id)
                self.assertEqual(response.json()["section"], section)

                for other_section in {"personal", "sharing", "shared"} - {section}:
                    response = self.client.post(
                        self.url,
                        data=json.dumps({
                            "name": "Invalid child", "section": other_section,
                            "parentId": parent_id,
                        }),
                        content_type="application/json",
                    )
                    self.assertEqual(response.status_code, 400, response.content)

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200, response.content)
        self.assertCountEqual(
            [folder["section"] for folder in response.json()["folders"]],
            ["personal", "personal", "sharing", "sharing", "shared", "shared"],
        )
        self.assertEqual(
            stored_query_models.QueryFolder.objects.filter(name="Child").count(), 3
        )

    def test_rejects_invalid_sections(self):
        for section in ("", "invalid", None, 1, [], {}):
            with self.subTest(section=section):
                response = self.client.post(
                    self.url,
                    data=json.dumps({"name": "Folder", "section": section}),
                    content_type="application/json",
                )
                self.assertEqual(response.status_code, 400, response.content)
        self.assertFalse(stored_query_models.QueryFolder.objects.exists())


class QueryFolderMoveTests(SharedQueryFixture, ApiTests):
    def setUp(self):
        super().setUp()
        self.client.cookies["collection"] = str(self.collection.id)
        self.move_url = f"/stored_query/query/{self.query.id}/folder/"
        self.collection_url = "/api/specify/spquery/"

    def _list_queries(self, client, section, folder=None, **filters):
        params = {
            "domainfilter": "false",
            "query_folder_section": section,
            "limit": 0,
            **filters,
        }
        if folder is not None:
            params["query_folder_id"] = folder.id
        response = client.get(self.collection_url, params)
        self.assertEqual(response.status_code, 200, response.content)
        return response.json()

    def _move(self, client, folder):
        return client.post(
            self.move_url,
            data=json.dumps({"folderId": folder.id}),
            content_type="application/json",
        )

    def test_moves_and_reassigns_query_without_changing_definition(self):
        parent = stored_query_models.QueryFolder.objects.create(
            name="Parent", owner=self.specifyuser
        )
        nested = stored_query_models.QueryFolder.objects.create(
            name="Nested", owner=self.specifyuser, parent=parent
        )
        other_query = models.Spquery.objects.create(
            name="Another query",
            contextname=self.query.contextname,
            contexttableid=self.query.contexttableid,
            specifyuser=self.specifyuser,
        )
        version = self.query.version
        for folder in (parent, nested, nested):
            response = self._move(self.client, folder)
            self.assertEqual(response.status_code, 200, response.content)
            self.assertEqual(
                response.json(),
                {"queryId": self.query.id, "folderId": folder.id, "section": "personal"},
            )

        membership = stored_query_models.QueryFolderMembership.objects.get(
            owner=self.specifyuser, query=self.query, section="personal"
        )
        self.assertEqual(membership.folder_id, nested.id)
        self.assertEqual(stored_query_models.QueryFolderMembership.objects.count(), 1)
        self.query.refresh_from_db()
        self.assertEqual(self.query.version, version)

        main = self._list_queries(
            self.client, "personal", limit=1, orderby="name",
            specifyuser=self.specifyuser.id, share_grants__isnull="true",
        )
        self.assertEqual(main["meta"]["total_count"], 1)
        self.assertEqual([query["id"] for query in main["objects"]], [other_query.id])
        nested_list = self._list_queries(self.client, "personal", nested)
        self.assertEqual([query["id"] for query in nested_list["objects"]], [self.query.id])
        self.assertEqual(self._list_queries(self.client, "personal", parent)["objects"], [])
        self.assertEqual(
            self._list_queries(self.client, "personal", nested, name__icontains="missing")["objects"],
            [],
        )
        self.assertEqual(
            self._list_queries(self.client, "personal", nested, offset=1)["objects"], []
        )
        # Without the organizer parameters, existing API clients still receive every query.
        response = self.client.get(self.collection_url, {"domainfilter": "false", "limit": 0})
        self.assertEqual(response.status_code, 200, response.content)
        self.assertIn(self.query.id, [query["id"] for query in response.json()["objects"]])

    def test_shared_query_organization_is_private_and_respects_revoked_access(self):
        grant = SpqueryShare.objects.create(query=self.query, recipient=self.recipient)
        owner_folder = stored_query_models.QueryFolder.objects.create(
            name="Owner folder", owner=self.specifyuser, section="sharing"
        )
        recipient_folder = stored_query_models.QueryFolder.objects.create(
            name="Recipient folder", owner=self.recipient, section="shared"
        )
        recipient_client = self._recipient_client()
        version = self.query.version
        response = self._move(recipient_client, recipient_folder)
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(
            self._list_queries(recipient_client, "shared", share_grants__recipient=self.recipient.id)["objects"],
            [],
        )
        self.assertEqual(
            [query["id"] for query in self._list_queries(
                self.client, "sharing", specifyuser=self.specifyuser.id,
                share_grants__isnull="false",
            )["objects"]],
            [self.query.id],
        )
        self.assertEqual(self._move(self.client, owner_folder).status_code, 200)
        self.assertEqual(
            [query["id"] for query in self._list_queries(
                recipient_client, "shared", recipient_folder
            )["objects"]],
            [self.query.id],
        )
        self.query.refresh_from_db()
        self.assertEqual(self.query.version, version)
        self.assertTrue(SpqueryShare.objects.filter(pk=grant.id).exists())
        self.assertEqual(stored_query_models.QueryFolderMembership.objects.count(), 2)

        grant.delete()
        self.assertEqual(
            self._list_queries(recipient_client, "shared", recipient_folder)["objects"], []
        )
        self.assertEqual(self._move(recipient_client, recipient_folder).status_code, 404)

    def test_rejects_foreign_folders_wrong_sections_and_invalid_input(self):
        foreign_folder = stored_query_models.QueryFolder.objects.create(
            name="Private", owner=self.recipient
        )
        wrong_section = stored_query_models.QueryFolder.objects.create(
            name="Sharing", owner=self.specifyuser, section="sharing"
        )
        for folder in (foreign_folder, wrong_section):
            response = self._move(self.client, folder)
            self.assertEqual(response.status_code, 400, response.content)
        for body in (
            "invalid JSON", "[]", "{}",
            *[json.dumps({"folderId": value}) for value in (None, True, 0, -1, "1", [])],
        ):
            response = self.client.post(
                self.move_url, data=body, content_type="application/json"
            )
            self.assertEqual(response.status_code, 400, response.content)
        self.assertFalse(stored_query_models.QueryFolderMembership.objects.exists())

        for params in (
            {"query_folder_section": "invalid"},
            {"query_folder_id": foreign_folder.id},
            {"query_folder_section": "personal", "query_folder_id": foreign_folder.id},
            {"query_folder_section": "personal", "query_folder_id": wrong_section.id},
            {"query_folder_section": "personal", "query_folder_id": "-1"},
        ):
            response = self.client.get(self.collection_url, params)
            self.assertEqual(response.status_code, 400, response.content)

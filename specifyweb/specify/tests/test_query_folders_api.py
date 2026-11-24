import json

from django.test import Client

from specifyweb.backend.stored_queries import models as stored_query_models
from specifyweb.specify import models
from specifyweb.specify.tests.test_api import ApiTests


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

import json
from importlib import import_module

from django.apps import apps
from django.db import connection
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


class QueryFavoriteApiTests(SharedQueryFixture, ApiTests):
    def setUp(self):
        super().setUp()
        self.client.cookies["collection"] = str(self.collection.id)
        self.favorite_url = f"/stored_query/query/{self.query.id}/favorite/"
        self.list_url = "/stored_query/favorites/"
        self.collection_url = "/api/specify/spquery/"

    def test_favorites_are_idempotent_persistent_and_independent_of_folders(self):
        folder = stored_query_models.QueryFolder.objects.create(
            name="Favorites source", owner=self.specifyuser
        )
        stored_query_models.QueryFolderMembership.objects.create(
            owner=self.specifyuser, query=self.query, section="personal", folder=folder
        )
        version = self.query.version
        for _ in range(2):
            response = self.client.post(self.favorite_url)
            self.assertEqual(response.status_code, 200, response.content)
            self.assertEqual(response.json(), {"queryId": self.query.id})
        self.assertEqual(stored_query_models.QueryFavorite.objects.count(), 1)
        self.query.refresh_from_db()
        self.assertEqual(self.query.version, version)
        self.assertTrue(
            stored_query_models.QueryFolderMembership.objects.filter(
                query=self.query, folder=folder
            ).exists()
        )
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.json(), {"queryIds": [self.query.id]})

        models.Spquery.objects.create(
            name="Not favorited",
            contextname=self.query.contextname,
            contexttableid=self.query.contexttableid,
            specifyuser=self.specifyuser,
        )
        params = {"domainfilter": "false", "query_favorites": "true", "limit": 1}
        response = self.client.get(self.collection_url, params)
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.json()["meta"]["total_count"], 1)
        self.assertEqual(
            [query["id"] for query in response.json()["objects"]], [self.query.id]
        )
        for filters in ({"name__icontains": "missing"}, {"offset": 1}):
            response = self.client.get(self.collection_url, {**params, **filters})
            self.assertEqual(response.status_code, 200, response.content)
            self.assertEqual(response.json()["objects"], [])

    def test_shared_favorites_are_private_and_respect_visibility(self):
        grant = SpqueryShare.objects.create(query=self.query, recipient=self.recipient)
        recipient_client = self._recipient_client()
        response = recipient_client.post(self.favorite_url)
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(
            self.client.get(self.list_url).json(), {"queryIds": []}
        )
        self.assertEqual(
            recipient_client.get(self.list_url).json(), {"queryIds": [self.query.id]}
        )
        response = self.client.get(self.collection_url, {
            "query_favorites": "true", "domainfilter": "false",
        })
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.json()["objects"], [])
        # Owned and shared queries can coexist in the same user's favorites.
        owned = models.Spquery.objects.create(
            name="Recipient query",
            contextname=self.query.contextname,
            contexttableid=self.query.contexttableid,
            specifyuser=self.recipient,
        )
        response = recipient_client.post(f"/stored_query/query/{owned.id}/favorite/")
        self.assertEqual(response.status_code, 200, response.content)
        response = recipient_client.get(self.collection_url, {
            "query_favorites": "true", "domainfilter": "false", "limit": 0,
        })
        self.assertEqual(response.status_code, 200, response.content)
        self.assertCountEqual(
            [query["id"] for query in response.json()["objects"]],
            [self.query.id, owned.id],
        )
        grant.delete()
        response = recipient_client.get(self.list_url)
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.json(), {"queryIds": [owned.id]})
        response = recipient_client.get(self.collection_url, {
            "query_favorites": "true", "domainfilter": "false",
        })
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual([query["id"] for query in response.json()["objects"]], [owned.id])
        self.assertEqual(recipient_client.post(self.favorite_url).status_code, 404)

    def test_rejects_inaccessible_queries_and_invalid_favorite_filters(self):
        recipient_client = self._recipient_client()
        response = recipient_client.post(self.favorite_url)
        self.assertEqual(response.status_code, 404, response.content)
        self.assertFalse(stored_query_models.QueryFavorite.objects.exists())
        for value in ("false", "invalid", ""):
            response = self.client.get(self.collection_url, {"query_favorites": value})
            self.assertEqual(response.status_code, 400, response.content)


    def test_unfavorite_removes_only_the_current_users_bookmark(self):
        grant = SpqueryShare.objects.create(query=self.query, recipient=self.recipient)
        owner_favorite = stored_query_models.QueryFavorite.objects.create(
            owner=self.specifyuser, query=self.query
        )
        stored_query_models.QueryFavorite.objects.create(owner=self.recipient, query=self.query)
        recipient_client = self._recipient_client()
        version = self.query.version
        for _ in range(2):
            response = recipient_client.post(f"/stored_query/query/{self.query.id}/unfavorite/")
            self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(
            recipient_client.get(self.list_url).json(), {"queryIds": []}
        )
        self.assertTrue(stored_query_models.QueryFavorite.objects.filter(pk=owner_favorite.pk).exists())
        self.assertTrue(SpqueryShare.objects.filter(pk=grant.pk).exists())
        self.query.refresh_from_db()
        self.assertEqual(self.query.version, version)


class QueryArchiveApiTests(SharedQueryFixture, ApiTests):
    def setUp(self):
        super().setUp()
        self.client.cookies["collection"] = str(self.collection.id)
        self.archive_url = f"/stored_query/query/{self.query.id}/archive/"
        self.collection_url = "/api/specify/spquery/"

    def _list(self, client, archive, **filters):
        response = client.get(self.collection_url, {
            "domainfilter": "false", "query_archive": archive, "limit": 0, **filters,
        })
        self.assertEqual(response.status_code, 200, response.content)
        return response.json()

    def test_archives_personal_queries_without_deleting_them(self):
        second_query = models.Spquery.objects.create(
            name="Second personal query",
            contextname=self.query.contextname,
            contexttableid=self.query.contexttableid,
            specifyuser=self.specifyuser,
        )
        folder = stored_query_models.QueryFolder.objects.create(
            name="Source", owner=self.specifyuser, section="personal"
        )
        stored_query_models.QueryFolderMembership.objects.create(
            owner=self.specifyuser, query=second_query, section="personal", folder=folder
        )
        stored_query_models.QueryFavorite.objects.create(owner=self.specifyuser, query=second_query)
        versions = {query.id: query.version for query in (self.query, second_query)}
        for query in (self.query, second_query, second_query):
            response = self.client.post(f"/stored_query/query/{query.id}/archive/")
            self.assertEqual(response.status_code, 200, response.content)
            self.assertEqual(response.json(), {"queryId": query.id})
        self.assertEqual(stored_query_models.QueryArchive.objects.count(), 2)
        for query in (self.query, second_query):
            query.refresh_from_db()
            self.assertEqual(query.version, versions[query.id])
        self.assertFalse(stored_query_models.QueryFavorite.objects.filter(query=second_query).exists())
        self.assertTrue(stored_query_models.QueryFolderMembership.objects.filter(query=second_query).exists())
        response = self.client.post(f"/stored_query/query/{second_query.id}/favorite/")
        self.assertEqual(response.status_code, 400, response.content)
        self.assertFalse(stored_query_models.QueryFavorite.objects.filter(query=second_query).exists())
        self.assertEqual(
            self.client.get("/stored_query/favorites/").json(), {"queryIds": []}
        )

        for filters in (
            {"query_folder_section": "personal", "share_grants__isnull": "true"},
            {"query_folder_section": "sharing", "share_grants__isnull": "false"},
            {"query_folder_section": "personal", "query_folder_id": folder.id},
            {"query_favorites": "true"},
        ):
            self.assertEqual(self._list(self.client, "false", **filters)["objects"], [])
        archived = self._list(self.client, "true", limit=1, orderby="id")
        self.assertEqual(archived["meta"]["total_count"], 2)
        self.assertEqual([query["id"] for query in archived["objects"]], [self.query.id])
        page_two = self._list(self.client, "true", limit=1, offset=1, orderby="id")
        self.assertEqual([query["id"] for query in page_two["objects"]], [second_query.id])
        self.assertEqual(
            self._list(self.client, "true", name__icontains="missing")["objects"], []
        )
        # Existing API consumers and direct query access remain unchanged.
        response = self.client.get(self.collection_url, {"domainfilter": "false", "limit": 0})
        self.assertEqual(response.status_code, 200, response.content)
        self.assertCountEqual(
            [query["id"] for query in response.json()["objects"]], [self.query.id, second_query.id]
        )

    def test_neither_owner_nor_recipient_can_archive_a_shared_query(self):
        grant = SpqueryShare.objects.create(query=self.query, recipient=self.recipient)
        stored_query_models.QueryFavorite.objects.create(owner=self.specifyuser, query=self.query)
        stored_query_models.QueryFavorite.objects.create(owner=self.recipient, query=self.query)
        recipient_client = self._recipient_client()
        response = recipient_client.post(self.archive_url)
        self.assertEqual(response.status_code, 403, response.content)
        self.assertFalse(stored_query_models.QueryArchive.objects.exists())
        self.assertEqual(self.client.post(self.archive_url).status_code, 400)
        self.assertEqual(
            [query["id"] for query in self._list(
                recipient_client, "false", share_grants__recipient=self.recipient.id
            )["objects"]],
            [self.query.id],
        )
        self.assertEqual(self._list(recipient_client, "true")["objects"], [])
        self.assertEqual(
            recipient_client.get(f"/api/specify/spquery/{self.query.id}/").status_code, 200
        )
        self.assertEqual(stored_query_models.QueryArchive.objects.count(), 0)
        self.assertTrue(stored_query_models.QueryFavorite.objects.filter(
            owner=self.specifyuser, query=self.query
        ).exists())
        self.assertTrue(stored_query_models.QueryFavorite.objects.filter(
            owner=self.recipient, query=self.query
        ).exists())
        self.assertTrue(SpqueryShare.objects.filter(pk=grant.pk).exists())

    def test_restore_returns_a_personal_query_to_the_main_list(self):
        folder = stored_query_models.QueryFolder.objects.create(
            name="Former folder", owner=self.specifyuser
        )
        stored_query_models.QueryFolderMembership.objects.create(
            owner=self.specifyuser, query=self.query, folder=folder, section="personal"
        )
        self.assertEqual(self.client.post(self.archive_url).status_code, 200)
        version = self.query.version
        restore_url = f"/stored_query/query/{self.query.id}/restore/"
        response = self.client.post(restore_url)
        self.assertEqual(response.status_code, 200, response.content)
        self.assertFalse(stored_query_models.QueryArchive.objects.filter(query=self.query).exists())
        self.assertFalse(stored_query_models.QueryFolderMembership.objects.filter(query=self.query).exists())
        self.assertFalse(stored_query_models.QueryFavorite.objects.filter(query=self.query).exists())
        self.assertEqual(
            [query["id"] for query in self._list(
                self.client, "false", query_folder_section="personal",
                share_grants__isnull="true",
            )["objects"]],
            [self.query.id],
        )
        self.query.refresh_from_db()
        self.assertEqual(self.query.version, version)
        self.assertEqual(self.client.post(restore_url).status_code, 400)

    def test_restore_requires_an_archived_personal_query_owned_by_the_user(self):
        self.assertEqual(self.client.post(self.archive_url).status_code, 200)
        grant = SpqueryShare.objects.create(query=self.query, recipient=self.recipient)
        restore_url = f"/stored_query/query/{self.query.id}/restore/"
        response = self._recipient_client().post(restore_url)
        self.assertEqual(response.status_code, 403, response.content)
        response = self.client.post(restore_url)
        self.assertEqual(response.status_code, 400, response.content)
        self.assertTrue(stored_query_models.QueryArchive.objects.filter(query=self.query).exists())
        self.assertTrue(SpqueryShare.objects.filter(pk=grant.pk).exists())

    def test_rejects_inaccessible_queries_and_invalid_archive_filters(self):
        response = self._recipient_client().post(self.archive_url)
        self.assertEqual(response.status_code, 404, response.content)
        self.assertFalse(stored_query_models.QueryArchive.objects.exists())
        for value in ("invalid", ""):
            response = self.client.get(self.collection_url, {"query_archive": value})
            self.assertEqual(response.status_code, 400, response.content)

    def test_cleanup_removes_only_the_archiving_users_existing_favorites(self):
        archived_favorite = stored_query_models.QueryFavorite.objects.create(
            owner=self.specifyuser, query=self.query
        )
        recipient_favorite = stored_query_models.QueryFavorite.objects.create(
            owner=self.recipient, query=self.query
        )
        active_query = models.Spquery.objects.create(
            name="Active favorite",
            contextname=self.query.contextname,
            contexttableid=self.query.contexttableid,
            specifyuser=self.specifyuser,
        )
        active_favorite = stored_query_models.QueryFavorite.objects.create(
            owner=self.specifyuser, query=active_query
        )
        stored_query_models.QueryArchive.objects.create(
            owner=self.specifyuser, query=self.query
        )
        migration = import_module(
            "specifyweb.backend.stored_queries.migrations.0005_remove_archived_favorites"
        )
        migration.remove_archived_favorites(apps, connection.schema_editor())
        self.assertFalse(stored_query_models.QueryFavorite.objects.filter(
            pk=archived_favorite.pk
        ).exists())
        self.assertTrue(stored_query_models.QueryFavorite.objects.filter(
            pk=recipient_favorite.pk
        ).exists())
        self.assertTrue(stored_query_models.QueryFavorite.objects.filter(
            pk=active_favorite.pk
        ).exists())

    def test_shared_archive_cleanup_preserves_grants_and_returns_to_sharing_main_list(self):
        grant = SpqueryShare.objects.create(query=self.query, recipient=self.recipient)
        stored_query_models.QueryArchive.objects.create(owner=self.specifyuser, query=self.query)
        folder = stored_query_models.QueryFolder.objects.create(
            name="Former sharing folder", owner=self.specifyuser, section="sharing"
        )
        stored_query_models.QueryFolderMembership.objects.create(
            owner=self.specifyuser, query=self.query, folder=folder, section="sharing"
        )
        personal_query = models.Spquery.objects.create(
            name="Personal archive", specifyuser=self.specifyuser,
            contextname=self.query.contextname, contexttableid=self.query.contexttableid,
        )
        personal_archive = stored_query_models.QueryArchive.objects.create(
            owner=self.specifyuser, query=personal_query
        )
        migration = import_module(
            "specifyweb.backend.stored_queries.migrations.0006_unarchive_shared_queries"
        )
        migration.unarchive_shared_queries(apps, connection.schema_editor())
        self.assertFalse(stored_query_models.QueryArchive.objects.filter(query=self.query).exists())
        self.assertFalse(stored_query_models.QueryFolderMembership.objects.filter(
            owner=self.specifyuser, query=self.query, section="sharing"
        ).exists())
        self.assertTrue(stored_query_models.QueryArchive.objects.filter(pk=personal_archive.pk).exists())
        self.assertTrue(SpqueryShare.objects.filter(pk=grant.pk).exists())
        self.assertEqual(
            [query["id"] for query in self._list(
                self.client, "false", query_folder_section="sharing",
                share_grants__isnull="false",
            )["objects"]],
            [self.query.id],
        )

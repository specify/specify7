import jwt
import uuid
import json
from unittest.mock import patch
from datetime import datetime, timezone, timedelta

from django.test import Client

from specifyweb.specify.models import Collection, Specifyuser, Agent
from specifyweb.backend.permissions.models import UserPolicy
from specifyweb.specify.api.serializers import toJson, _obj_to_data
from specifyweb.backend.accounts.access_token_utils import generate_access_token, decode_access_token, DEFAULT_AUTH_LIFESPAN_SECONDS, AUTH_TOKEN_ALGORITHMS
from specifyweb.specify.tests.test_api import ApiTests


class AccessTokenTests(ApiTests):
    def setUp(self) -> None:
        super().setUp()
        self.password = "testuser"
        self.specifyuser.save()
        self.other_collection = Collection.objects.create(
            catalognumformatname='test',
            collectionname='OtherCollection',
            isembeddedcollectingevent=False,
            discipline=self.discipline,
        )
        self.other_user = self._set_up_other_user()

    def get_auth_header(self, access_token: str):
        return {
            "Authorization": f"Bearer {access_token}"
        }

    def acquire_access_token(self, client: Client, **data):
        response = client.post("/accounts/token/", data=data)
        return response.status_code, response.json()

    def _set_up_other_user(self) -> Specifyuser:
        other_user = Specifyuser.objects.create(
            isloggedin=False,
            isloggedinreport=False,
            name="otheruser",
            password="205C0D906445E1C71CA77C6D714109EB6D582B03A5493E4C"  # testuser
        )

        def user_policy(resource, action):
            return UserPolicy(
                collection=self.other_collection,
                specifyuser=other_user,
                resource=resource,
                action=action
            )

        user_policies = [
            user_policy('/system/sp7/collection', 'access'),
            user_policy('/table/collectionobject', 'read'),
            user_policy('/table/collectionobject', 'create'),
            user_policy('/table/collectionobject', 'update')
        ]

        UserPolicy.objects.bulk_create(user_policies)

        Agent.objects.create(
            agenttype=0,
            firstname="John",
            lastname="Doe",
            division=self.division,
            specifyuser=other_user,
        )

        return other_user


class AccessTokenApiTests(AccessTokenTests):
    def test_acquire_access_token_returns_signed_token(self) -> None:
        client = Client()
        client.force_login(self.specifyuser)
        status_code, response = self.acquire_access_token(
            client,
            grant_type="password",
            username=self.specifyuser.name,
            password=self.password,
            collectionid=self.collection.id,
            expires_in=120
        )

        self.assertEqual(status_code, 200)
        self.assertEqual(response["expires_in"], 120)
        claims = decode_access_token(response["access_token"])
        self.assertIsNotNone(claims)
        self.assertEqual(claims["sub"], str(self.specifyuser.id))
        self.assertEqual(claims["username"], self.specifyuser.name)
        self.assertEqual(claims["collection"], self.collection.id)

    def test_acquire_access_token_succeeds_when_user_is_not_logged_in(self) -> None:
        client = Client()

        status_code, response = self.acquire_access_token(
            client,
            grant_type="password",
            username=self.specifyuser.name,
            password=self.password,
            collectionid=self.collection.id
        )

        self.assertEqual(status_code, 200)
        self.assertIn("access_token", response)
        self.assertEqual(response["expires_in"], DEFAULT_AUTH_LIFESPAN_SECONDS)

        claims = decode_access_token(response["access_token"])
        self.assertIsNotNone(claims)
        self.assertEqual(claims["sub"], str(self.specifyuser.id))
        self.assertEqual(claims["username"], self.specifyuser.name)
        self.assertEqual(claims["collection"], self.collection.id)

    def test_acquire_access_token_rejects_missing_or_unsupported_grant_type(self) -> None:
        client = Client()
        status_code, response = self.acquire_access_token(client)
        self.assertEqual(status_code, 400)
        self.assertEqual(response["error"], "invalid_request")

        status_code, response = self.acquire_access_token(
            client, grant_type="unknown")
        self.assertEqual(status_code, 400)
        self.assertEqual(response["error"], "unsupported_grant_type")

    def test_acquire_access_token_rejects_invalid_password(self) -> None:
        client = Client()
        status_code, response = self.acquire_access_token(
            client,
            grant_type="password",
            username=self.specifyuser.name,
            password="incorrect",
            collectionid=self.collection.id,
        )

        self.assertEqual(status_code, 401)
        self.assertEqual(response["error"], "invalid_client")

    def test_acquire_access_token_rejects_invalid_collection_access(self):
        client = Client()
        status_code, response = self.acquire_access_token(
            client,
            grant_type="password",
            username=self.other_user.name,
            password=self.password,
            collectionid=self.collection.id,
        )
        self.assertEqual(status_code, 401)
        self.assertEqual(response["error"], "invalid_client")

    def test_revoke_access_token_revokes_valid_token(self) -> None:
        client = Client()
        client.force_login(self.specifyuser)
        _, response = self.acquire_access_token(
            client,
            grant_type="password",
            username=self.specifyuser.name,
            password=self.password,
            collectionid=self.collection.id,
        )
        access_token = response["access_token"]

        response = client.post(
            "/accounts/token/revoke/",
            data={"token": access_token}
        )

        self.assertEqual(response.status_code, 204)

    def test_revoke_access_token_rejects_invalid_token(self) -> None:
        client = Client()
        client.force_login(self.specifyuser)
        with patch("specifyweb.backend.accounts.views.revoke_token") as revoke:
            response = client.post(
                "/accounts/token/revoke/",
                data={"token": "invalid_token"}
            )

        self.assertEqual(response.status_code, 204)
        revoke.assert_not_called()


class AccessTokenAuthorizationTests(AccessTokenTests):
    def serialize_obj(self, obj):
        return _obj_to_data(obj, lambda _obj: None)

    def test_authorization_with_access_token(self):
        client = Client()
        _, response = self.acquire_access_token(
            client,
            grant_type="password",
            username=self.specifyuser.name,
            password=self.password,
            collectionid=self.collection.id
        )
        access_token = response['access_token']

        co_to_get = self.collectionobjects[0]
        object_response = client.get(
            f"/api/specify/collectionobject/{co_to_get.id}/",
            headers=self.get_auth_header(access_token)
        )
        self.assertEqual(object_response.status_code, 200)
        response_content = object_response.json()
        expected_content = self.serialize_obj(co_to_get)
        self.assertEqual(json.dumps(response_content),
                         toJson(expected_content))

    def test_authorization_with_unsafe_method(self):
        client = Client()
        _, response = self.acquire_access_token(
            client,
            grant_type="password",
            username=self.specifyuser.name,
            password=self.password,
            collectionid=self.collection.id
        )
        access_token = response['access_token']
        co_to_modify = self.collectionobjects[0]
        serialized_co = self.serialize_obj(co_to_modify)
        old_version = co_to_modify.version
        new_text_1 = "foo"
        self.assertNotEqual(co_to_modify.text1, new_text_1)

        serialized_co["text1"] = new_text_1

        object_response = client.put(
            f"/api/specify/collectionobject/{co_to_modify.id}/",
            data=toJson(serialized_co),
            content_type='application/json',
            headers=self.get_auth_header(access_token)
        )
        co_to_modify.refresh_from_db()
        self.assertEqual(object_response.status_code, 200)
        self.assertNotEqual(co_to_modify.version, old_version)
        self.assertEqual(co_to_modify.text1, new_text_1)

    def test_invalid_token(self):
        client = Client()
        invalid_token = "foo"
        object_response = client.get(
            f"/api/specify/collectionobject/",
            headers=self.get_auth_header(invalid_token)
        )
        self.assertEqual(object_response.status_code, 401)
        self.assertTrue(object_response.has_header("WWW-Authenticate"))

    def test_revoking_collection_access_invalidates_access(self):
        client = Client()
        _, response = self.acquire_access_token(
            client,
            grant_type="password",
            username=self.other_user.name,
            password=self.password,
            collectionid=self.other_collection.id
        )
        access_token = response['access_token']

        UserPolicy.objects.filter(
            specifyuser=self.other_user,
            collection=self.other_collection,
            resource='/system/sp7/collection',
            action='access'
        ).delete()

        object_response = client.get(
            f"/api/specify/collectionobject/",
            headers=self.get_auth_header(access_token)
        )

        self.assertEqual(object_response.status_code, 403)

    def test_revoking_token_invalidates_access(self):
        client = Client()
        _, response = self.acquire_access_token(
            client,
            grant_type="password",
            username=self.other_user.name,
            password=self.password,
            collectionid=self.other_collection.id
        )
        old_access_token = response['access_token']

        _, response = self.acquire_access_token(
            client,
            grant_type="password",
            username=self.other_user.name,
            password=self.password,
            collectionid=self.other_collection.id
        )
        access_token = response['access_token']

        revoke_response = client.post(
            "/accounts/token/revoke/",
            data={"token": old_access_token},
            headers=self.get_auth_header(access_token)
        )
        self.assertEqual(revoke_response.status_code, 204)

        object_response = client.get(
            f"/api/specify/collectionobject/",
            headers=self.get_auth_header(old_access_token)
        )
        self.assertEqual(object_response.status_code, 401)

    def test_token_can_revoke_self(self):
        client = Client()
        _, response = self.acquire_access_token(
            client,
            grant_type="password",
            username=self.other_user.name,
            password=self.password,
            collectionid=self.other_collection.id
        )
        access_token = response['access_token']

        revoke_response = client.post(
            "/accounts/token/revoke/",
            data={"token": access_token},
            headers=self.get_auth_header(access_token)
        )
        self.assertEqual(revoke_response.status_code, 204)

        object_response = client.get(
            f"/api/specify/collectionobject/",
            headers=self.get_auth_header(access_token)
        )

        self.assertEqual(object_response.status_code, 401)

    def test_access_tokens_expire(self):
        client = Client()

        # We're going to manually create a token that expired 10 seconds ago
        access_token = generate_access_token(
            self.specifyuser, self.collection.id, -10)

        object_response = client.get(
            f"/api/specify/collectionobject/",
            headers=self.get_auth_header(access_token)
        )

        self.assertEqual(object_response.status_code, 401)
        self.assertTrue(object_response.has_header("WWW-Authenticate"))

    def test_tokens_must_be_signed_by_secret_key(self):
        client = Client()
        # This is a valid Specify Access Token (JWT) payload
        jwt_payload = {
            "sub": str(self.specifyuser.id),
            "username": self.specifyuser.name,
            "collection": self.collection.id,
            "jti": str(uuid.uuid4()),
            "iat": datetime.now(timezone.utc),
            "exp": datetime.now(timezone.utc) + timedelta(seconds=DEFAULT_AUTH_LIFESPAN_SECONDS)
        }
        fake_secret_key = "foobarbaz"
        access_token = jwt.encode(
            jwt_payload, fake_secret_key, algorithm=AUTH_TOKEN_ALGORITHMS[0])

        object_response = client.get(
            f"/api/specify/collectionobject/",
            headers=self.get_auth_header(access_token)
        )

        self.assertEqual(object_response.status_code, 401)
        self.assertTrue(object_response.has_header("WWW-Authenticate"))

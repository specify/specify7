import json

from django.test import TestCase, Client

from specifyweb.specify.api_tests import ApiTests

class PermissionsApiTest(ApiTests):
    def test_set_user_policies(self) -> None:
        c = Client()
        response = c.put(
            f'/permissions/user_policies/{self.collection.id}/{self.specifyuser.id}/',
            data=[
                {'resource': '/table/%', 'action': '%'},
                {'resource': '/field/%', 'action': '%'},
            ],
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 204)

        response = c.get(f'/permissions/user_policies/{self.collection.id}/{self.specifyuser.id}/')
        data = json.loads(response.content)
        self.assertIn({'resource': '/table/%', 'action': '%'}, data)
        self.assertIn({'resource': '/field/%', 'action': '%'}, data)

    def test_create_get_delete_role(self) -> None:
        c = Client()
        response = c.post(
            f'/permissions/roles/{self.collection.id}/',
            data={
                'name': 'fullaccess',
                'policies': [
                    {'resource': '/table/%', 'action': '%'},
                    {'resource': '/field/%', 'action': '%'},
                ],
            },
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 201)
        data_role = json.loads(response.content)

        response = c.get(f'/permissions/roles/{self.collection.id}/')
        data_roles = json.loads(response.content)

        self.assertEqual(data_roles, [data_role])
        roleid = data_role['id']

        response = c.get(f'/permissions/role/{roleid}/')
        data_get = json.loads(response.content)
        self.assertEqual(data_get, data_role)

        response = c.delete(f'/permissions/role/{roleid}/')
        self.assertEqual(response.status_code, 204)

        response = c.get(f'/permissions/roles/{self.collection.id}/')
        data_roles = json.loads(response.content)

        self.assertEqual(data_roles, [])

    def test_set_role_policies(self) -> None:
        c = Client()
        response = c.post(
            f'/permissions/roles/{self.collection.id}/',
            data={
                'name': 'fullaccess',
                'policies': [
                    {'resource': '/table/%', 'action': 'read'},
                    {'resource': '/field/%', 'action': 'read'},
                ],
            },
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 201)
        roleid = json.loads(response.content)['id']

        update_data = {
            'name': 'fullaccess_updated',
            'policies': [
                {'resource': '/table/%', 'action': '%'},
                {'resource': '/field/%', 'action': '%'},
            ],
        }

        response = c.put(
            f'/permissions/role/{roleid}/',
            data=update_data,
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 204)

        response = c.get(f'/permissions/role/{roleid}/')
        data_get = json.loads(response.content)
        self.assertEqual(data_get, {'id': roleid, **update_data})


    def test_set_get_user_roles(self) -> None:
        full_access = {
            'name': 'fullaccess',
            'policies': [
                {'resource': '/table/%', 'action': 'read'},
                {'resource': '/field/%', 'action': 'read'},
            ],
        }

        c = Client()

        # create a role
        response = c.post(
            f'/permissions/roles/{self.collection.id}/',
            data=full_access,
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 201)
        role = json.loads(response.content)

        # assign user to role
        response = c.put(
            f'/permissions/user_roles/{self.collection.id}/{self.specifyuser.id}/',
            data=[{'id': role['id']}],
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 204)

        # check user roles contains assigned role
        response = c.get(f'/permissions/user_roles/{self.collection.id}/{self.specifyuser.id}/')
        data = json.loads(response.content)
        self.assertEqual(data, [role])

        # set user roles to empty
        response = c.put(
            f'/permissions/user_roles/{self.collection.id}/{self.specifyuser.id}/',
            data=[],
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 204)

        # check user roles are empty
        response = c.get(f'/permissions/user_roles/{self.collection.id}/{self.specifyuser.id}/')
        data = json.loads(response.content)
        self.assertEqual(data, [])


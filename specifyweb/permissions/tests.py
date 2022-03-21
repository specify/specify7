import json

from django.test import TestCase, Client

from specifyweb.specify.api_tests import ApiTests

class PermissionsApiTest(ApiTests):
    def test_set_user_policies(self) -> None:
        c = Client()
        c.force_login(self.specifyuser)
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
        c.force_login(self.specifyuser)
        response = c.post(
            f'/permissions/roles/{self.collection.id}/',
            data={
                'name': 'fullaccess',
                'description': 'fullaccess role',
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
        c.force_login(self.specifyuser)
        response = c.post(
            f'/permissions/roles/{self.collection.id}/',
            data={
                'name': 'fullaccess',
                'description': 'fullaccess role',
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
            'description': 'fullaccess_updated role',
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

    def test_create_get_delete_library_role(self) -> None:
        c = Client()
        c.force_login(self.specifyuser)
        response = c.post(
            f'/permissions/library_roles/',
            data={
                'name': 'fullaccess library',
                'description': 'fullaccess library role',
                'policies': [
                    {'resource': '/table/%', 'action': '%'},
                    {'resource': '/field/%', 'action': '%'},
                ],
            },
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 201)
        data_role = json.loads(response.content)

        response = c.get(f'/permissions/library_roles/')
        data_roles = json.loads(response.content)

        self.assertEqual(data_roles, [data_role])
        roleid = data_role['id']

        response = c.get(f'/permissions/library_role/{roleid}/')
        data_get = json.loads(response.content)
        self.assertEqual(data_get, data_role)

        response = c.delete(f'/permissions/library_role/{roleid}/')
        self.assertEqual(response.status_code, 204)

        response = c.get(f'/permissions/library_roles/')
        data_roles = json.loads(response.content)

        self.assertEqual(data_roles, [])

    def test_copy_role_from_library(self) -> None:
        c = Client()
        c.force_login(self.specifyuser)
        response = c.post(
            f'/permissions/library_roles/',
            data={
                'name': 'fullaccess library',
                'description': 'fullaccess library role',
                'policies': [
                    {'resource': '/table/%', 'action': '%'},
                    {'resource': '/field/%', 'action': '%'},
                ],
            },
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 201)
        lib_role = json.loads(response.content)

        response = c.post(
            f'/permissions/roles/{self.collection.id}/',
            data={'libraryroleid': lib_role['id']},
            content_type='application/json',
        )
        role = json.loads(response.content)
        for f in "name description policies".split():
            self.assertEqual(role[f], lib_role[f])


    def test_set_library_role_policies(self) -> None:
        c = Client()
        c.force_login(self.specifyuser)
        response = c.post(
            f'/permissions/library_roles/',
            data={
                'name': 'fullaccess library',
                'description': 'fullaccess lib role',
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
            'name': 'fullaccess_updated lib',
            'description': 'fullaccess role updated lib',
            'policies': [
                {'resource': '/table/%', 'action': '%'},
                {'resource': '/field/%', 'action': '%'},
            ],
        }

        response = c.put(
            f'/permissions/library_role/{roleid}/',
            data=update_data,
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 204)

        response = c.get(f'/permissions/library_role/{roleid}/')
        data_get = json.loads(response.content)
        self.assertEqual(data_get, {'id': roleid, **update_data})

    def test_set_get_user_roles(self) -> None:
        full_access = {
            'name': 'fullaccess',
            'description': 'fullaccess role',
            'policies': [
                {'resource': '/table/%', 'action': 'read'},
                {'resource': '/field/%', 'action': 'read'},
            ],
        }

        c = Client()
        c.force_login(self.specifyuser)

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

    def test_query(self) -> None:
        c = Client()
        c.force_login(self.specifyuser)

        response = c.post(
            '/permissions/query/',
            data={
                'queries': [{'resource': '/table/collectionobject', 'actions': ['create', 'update', 'delete']}]
            },
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 200)

        data = json.loads(response.content)

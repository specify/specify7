import json

from django.test import TestCase, Client
from jsonschema import validate  # type: ignore
from jsonschema.exceptions import ValidationError  # type: ignore

from specifyweb.specify.tests.test_api import ApiTests
from . import viewsets


class ViewTests(ApiTests):
    def setUp(self):
        super(ViewTests, self).setUp()

        # some views are not defined above the discipline level
        self.discipline.type = "fish"
        self.discipline.save()

    def test_get_view(self):
        viewsets.get_view(self.collection, self.specifyuser, "CollectionObject")

class OpenApiTests(TestCase):
    def test_operations_spec(self) -> None:
        from .views import generate_openapi_for_endpoints
        from .openapi_schema import schema

        spec = generate_openapi_for_endpoints(all_endpoints=True)
        validate(instance=spec, schema=schema)

class UserResorucesTests(ApiTests):
    def test_create_user_resource(self) -> None:
        c = Client()
        c.force_login(self.specifyuser)

        # Create a resource
        new_resource = {
            'name': 'TestResource',
            'mimetype': 'text/plain',
            'metadata': 'meta',
        }

        response = c.post(
            f'/context/user_resource/',
            data={'data': "foobar", **new_resource},
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 201)
        data = json.loads(response.content)
        new_resource_id = data['id']

        # Get resource list
        response = c.get('/context/user_resource/')
        data = json.loads(response.content)
        self.assertIn({'id': new_resource_id, **new_resource}, data)

        # Get resource
        response = c.get(f'/context/user_resource/{new_resource_id}/')
        data = json.loads(response.content)
        self.assertEqual(data, {'id': new_resource_id, 'data': "foobar", **new_resource})

        # Update resource
        update_resource = {
            'name': 'TestResource Update',
            'mimetype': '',
            'metadata': 'metameta',
            'data': "fizzbuzz",
        }

        response = c.put(
            f'/context/user_resource/{new_resource_id}/',
            data=update_resource,
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 204)

        response = c.get(f'/context/user_resource/{new_resource_id}/')
        data = json.loads(response.content)
        self.assertEqual(data, {'id': new_resource_id, **update_resource})

        # Delete resource
        response = c.delete(f'/context/user_resource/{new_resource_id}/')
        self.assertEqual(response.status_code, 204)

        response = c.get(f'/context/user_resource/{new_resource_id}/')
        self.assertEqual(response.status_code, 404)

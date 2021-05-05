from jsonschema import validate  # type: ignore
from jsonschema.exceptions import ValidationError  # type: ignore

from django.test import TestCase, TransactionTestCase

from specifyweb.specify import models, api
from specifyweb.specify.api_tests import ApiTests
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

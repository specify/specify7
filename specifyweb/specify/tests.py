"""
Test suite entry point
"""

from django.conf import settings
from django.test import TestCase
from jsonschema import validate  # type: ignore
from jsonschema.exceptions import ValidationError  # type: ignore

from .api_tests import *
from .test_load_datamodel import *

if settings.TEST_RUNNER == 'selenium_testsuite_runner.SeleniumTestSuiteRunner':
    from .selenium_tests import *

class OpenApiTests(TestCase):
    def test_tables_spec(self) -> None:
        from .schema import generate_openapi_for_tables
        from specifyweb.context.openapi_schema import schema

        spec = generate_openapi_for_tables()
        validate(instance=spec, schema=schema)

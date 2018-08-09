from django.test import TestCase
from django.conf import settings

from .api_tests import *
from .test_load_datamodel import *

if settings.TEST_RUNNER == 'selenium_testsuite_runner.SeleniumTestSuiteRunner':
    from .selenium_tests import *


from specifyweb.specify import models
from specifyweb.specify.api_tests import ApiTests
from ..exceptions import BusinessRuleException

class DivisionTests(ApiTests):
    def test_name_unique_in_institution(self):
        models.Division.objects.create(
            institution=self.institution,
            name='foobar')

        with self.assertRaises(BusinessRuleException):
            models.Division.objects.create(
                institution=self.institution,
                name='foobar')

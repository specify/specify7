from specifyweb.specify import models
from specifyweb.specify.tests.test_api import ApiTests
from ..exceptions import BusinessRuleException

class DivisionTests(ApiTests):
    def test_name_unique_in_institution(self):
        models.Division.objects.create(
            institution=self.institution,
            name='foobar')

        with self.assertRaises(BusinessRuleException) as business_rule_exception:
            models.Division.objects.create(
                institution=self.institution,
                name='foobar')

        naive_insitution = business_rule_exception.exception.args[1].get('parentField', None)
        self.assertEquals(naive_insitution is not None and naive_insitution.lower() == 'institution', True)

    
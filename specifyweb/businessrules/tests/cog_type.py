
from specifyweb.businessrules.exceptions import BusinessRuleException
from specifyweb.specify.models import CollectionObjectGroupType
from specifyweb.specify.tests.test_api import ApiTests


class COGTypeTest(ApiTests):
    def test_cog_type_select_values(self):
        cot_1 = CollectionObjectGroupType.objects.create(name='microscope slide', cogtype='discrete')

        with self.assertRaises(BusinessRuleException):
            CollectionObjectGroupType.objects.create(name='taco', cogtype='consolidated')

        with self.assertRaises(BusinessRuleException):
            CollectionObjectGroupType.objects.create(name='whole rock', cogtype='burrito')
            
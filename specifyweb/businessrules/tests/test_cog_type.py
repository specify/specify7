from specifyweb.businessrules.exceptions import BusinessRuleException
from specifyweb.specify.models import CollectionObjectGroupType
from specifyweb.specify.tests.test_api import ApiTests
from django.db import transaction

# NOTE: Edit this test when a new COG type rule is decided upon.
# class COGTypeTest(ApiTests):
    # def test_cog_type_select_values(self):
    #     cot_1 = CollectionObjectGroupType.objects.create(name='microscope slide', type='discrete', collection=self.collection)

    #     with self.assertRaises(BusinessRuleException), transaction.atomic():
    #         CollectionObjectGroupType.objects.create(name='taco', type='consolidated', collection=self.collection)

    #     with self.assertRaises(BusinessRuleException), transaction.atomic():
    #         CollectionObjectGroupType.objects.create(name='whole rock', type='burrito', collection=self.collection))
            
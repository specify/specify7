from specifyweb.businessrules.exceptions import BusinessRuleException
from specifyweb.specify.models import Collectionobjectgrouptype, Picklist, Picklistitem
from specifyweb.specify.tests.test_api import DefaultsSetup
from django.db import transaction

# NOTE: Edit this test when a new COG type rule is decided upon.
class COGTypeTest(DefaultsSetup):
    def test_cog_type_select_values(self):
        Collectionobjectgrouptype.objects.create(name='microscope slide', type='Discrete', collection=self.collection)

        with self.assertRaises(BusinessRuleException), transaction.atomic():
            Collectionobjectgrouptype.objects.create(name='whole rock', type='Burrito', collection=self.collection)
            
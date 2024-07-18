from specifyweb.businessrules.exceptions import BusinessRuleException
from specifyweb.specify.models import CollectionObjectGroupType, Picklist, Picklistitem
from specifyweb.specify.tests.test_api import ApiTests
from django.db import transaction

# NOTE: Edit this test when a new COG type rule is decided upon.
class COGTypeTest(ApiTests):
    def test_cog_type_select_values(self):
        cog_type_picklist = Picklist.objects.create(
            name='Default Collection Object Group Types',
            tablename='CollectionObjectGroupType',
            issystem=False,
            type=1,
            readonly=False,
            collection=self.collection
        )
        Picklistitem.objects.create(
            title='Discrete',
            value='Discrete',
            picklist=cog_type_picklist
        )

        CollectionObjectGroupType.objects.create(name='microscope slide', type='Discrete', collection=self.collection)

        with self.assertRaises(BusinessRuleException), transaction.atomic():
            CollectionObjectGroupType.objects.create(name='whole rock', type='Burrito', collection=self.collection)
            
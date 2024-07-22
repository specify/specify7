from specifyweb.specify.models import CollectionObjectGroup, CollectionObjectGroupJoin, CollectionObjectGroupType, Picklist, Picklistitem
from specifyweb.specify.tests.test_api import DefaultsSetup

class CoJoTest(DefaultsSetup):
    def test_cojo_rules_enforcement(self):
        cog_type = CollectionObjectGroupType.objects.create(name='microscope slide', type='Discrete', collection=self.collection)
        cog_1 = CollectionObjectGroup.objects.create(
            collection=self.collection,
            cogtype=cog_type
        )
        cog_2 = CollectionObjectGroup.objects.create(
            collection=self.collection,
            cogtype=cog_type
        )
        cog_3 = CollectionObjectGroup.objects.create(
            collection=self.collection,
            cogtype=cog_type
        )
        cojo_1 = CollectionObjectGroupJoin.objects.create(
            parentcog=cog_1,
            childcog=cog_2,
            isprimary=True,
            issubstrate=True
        )
        cojo_2 = CollectionObjectGroupJoin.objects.create(
            parentcog=cog_1,
            childcog=cog_3,
            isprimary=True,
            issubstrate=True
        )

        cojo_1 = CollectionObjectGroupJoin.objects.get(id=cojo_1.id)
        cojo_2 = CollectionObjectGroupJoin.objects.get(id=cojo_2.id)

        self.assertFalse(cojo_1.isprimary)
        self.assertFalse(cojo_1.issubstrate)
        self.assertTrue(cojo_2.isprimary)
        self.assertTrue(cojo_2.issubstrate)

        cog_4 = CollectionObjectGroup.objects.create(
            collection=self.collection,
            cogtype=cog_type
        )
        cojo_3 = CollectionObjectGroupJoin.objects.create(
            parentcog=cog_1,
            childcog=cog_4,
            isprimary=False,
            issubstrate=False
        )

        cojo_1 = CollectionObjectGroupJoin.objects.get(id=cojo_1.id)
        cojo_2 = CollectionObjectGroupJoin.objects.get(id=cojo_2.id)
        cojo_3 = CollectionObjectGroupJoin.objects.get(id=cojo_3.id)

        self.assertFalse(cojo_1.isprimary)
        self.assertFalse(cojo_1.issubstrate)
        self.assertTrue(cojo_2.isprimary)
        self.assertTrue(cojo_2.issubstrate)
        self.assertFalse(cojo_3.isprimary)
        self.assertFalse(cojo_3.issubstrate)

from specifyweb.specify.models import Collectionobjectgroup, Collectionobjectgroupjoin, Collectionobjectgrouptype, Picklist, Picklistitem
from specifyweb.specify.tests.test_api import DefaultsSetup

class CoJoTest(DefaultsSetup):
    def test_cojo_rules_enforcement(self):
        cog_type = Collectionobjectgrouptype.objects.create(name='microscope slide', type='Discrete', collection=self.collection)
        cog_1 = Collectionobjectgroup.objects.create(
            collection=self.collection,
            cogtype=cog_type
        )
        cog_2 = Collectionobjectgroup.objects.create(
            collection=self.collection,
            cogtype=cog_type
        )
        cog_3 = Collectionobjectgroup.objects.create(
            collection=self.collection,
            cogtype=cog_type
        )
        cojo_1 = Collectionobjectgroupjoin.objects.create(
            parentcog=cog_1,
            childcog=cog_2,
            isprimary=True,
            issubstrate=True
        )
        cojo_2 = Collectionobjectgroupjoin.objects.create(
            parentcog=cog_1,
            childcog=cog_3,
            isprimary=True,
            issubstrate=True
        )

        cojo_1 = Collectionobjectgroupjoin.objects.get(id=cojo_1.id)
        cojo_2 = Collectionobjectgroupjoin.objects.get(id=cojo_2.id)

        cojo_1.refresh_from_db()
        cojo_2.refresh_from_db()

        self.assertFalse(cojo_1.isprimary)
        self.assertFalse(cojo_1.issubstrate)
        self.assertTrue(cojo_2.isprimary)
        self.assertTrue(cojo_2.issubstrate)

        cog_4 = Collectionobjectgroup.objects.create(
            collection=self.collection,
            cogtype=cog_type
        )
        cojo_3 = Collectionobjectgroupjoin.objects.create(
            parentcog=cog_1,
            childcog=cog_4,
            isprimary=False,
            issubstrate=False
        )

        cojo_1.refresh_from_db()
        cojo_2.refresh_from_db()
        cojo_3.refresh_from_db()

        cojo_1 = Collectionobjectgroupjoin.objects.get(id=cojo_1.id)
        cojo_2 = Collectionobjectgroupjoin.objects.get(id=cojo_2.id)
        cojo_3 = Collectionobjectgroupjoin.objects.get(id=cojo_3.id)

        self.assertFalse(cojo_1.isprimary)
        self.assertFalse(cojo_1.issubstrate)
        self.assertTrue(cojo_2.isprimary)
        self.assertTrue(cojo_2.issubstrate)
        self.assertFalse(cojo_3.isprimary)
        self.assertFalse(cojo_3.issubstrate)

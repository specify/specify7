from specifyweb.specify.tests.test_api import DefaultsSetup
from specifyweb.interactions.cog_preps import is_consolidated_cog
from specifyweb.specify.models import Collectionobjectgroup, Collectionobjectgrouptype


class TestIsConsolidatedCog(DefaultsSetup):

    def test_not_consolidated_on_empty_cog(self):
        self.assertFalse(is_consolidated_cog(None))

    def test_consolidated_correctly_inferred(self):
        cog_consolidated = Collectionobjectgroup.objects.create(
            collection=self.collection,
            cogtype=Collectionobjectgrouptype.objects.create(
                name="microscope slide", type="Consolidated", collection=self.collection
            ),
        )
        cog_discrete = Collectionobjectgroup.objects.create(
            collection=self.collection,
            cogtype=Collectionobjectgrouptype.objects.create(
                name="microscope slide", type="Discrete", collection=self.collection
            ),
        )
        self.assertTrue(is_consolidated_cog(cog_consolidated))
        self.assertFalse(is_consolidated_cog(cog_discrete))

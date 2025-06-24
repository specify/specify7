from specifyweb.specify.tests.test_api import DefaultsSetup
from specifyweb.specify.models import (
    Collectionobjectgroup,
    Collectionobjectgrouptype,
    Collectionobjectgroupjoin,
    Preptype,
    Preparation,
)


class TestCogInteractions(DefaultsSetup):
    def setUp(self):
        super().setUp()
        self._create_prep_type()
        self.cogtype_consolidated = Collectionobjectgrouptype.objects.create(
            name="TestConsolidated", type="Consolidated", collection=self.collection
        )

        self.test_cog_consolidated = Collectionobjectgroup.objects.create(
            collection=self.collection,
            cogtype=self.cogtype_consolidated,
        )

        self.test_cog_discrete = Collectionobjectgroup.objects.create(
            collection=self.collection,
            cogtype=self.cogtype,
        )

    @property
    def discipline_uri(self):
        return f"/api/specify/discipline/{self.collection.discipline.id}/"

    @staticmethod
    def _link_co_cog(co, cog):
        Collectionobjectgroupjoin.objects.create(
            parentcog=cog, childco=co, isprimary=True, issubstrate=True
        )

    @staticmethod
    def _link_cog_cog(child_cog, cog):
        Collectionobjectgroupjoin.objects.create(
            parentcog=cog, childcog=child_cog, isprimary=True, issubstrate=True
        )

    def _preps_match(self, base, computed):
        self.assertCountEqual(
            [prep.id for prep in base], [prep.id for prep in computed]
        )

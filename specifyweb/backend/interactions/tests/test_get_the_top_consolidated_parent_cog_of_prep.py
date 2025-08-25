from specifyweb.backend.interactions.cog_preps import (
    get_the_top_consolidated_parent_cog_of_prep,
)
from specifyweb.backend.interactions.tests.test_cog import TestCogInteractions
from specifyweb.backend.datamodel.models import Collectionobjectgroup, Collectionobjectgroupjoin


class TestGetTopConsolidatedParentCogPrep(TestCogInteractions):

    def setUp(self):
        super().setUp()
        Collectionobjectgroupjoin.objects.all().delete()
        prep = self._create_prep(self.collectionobjects[0], None)
        self.first_co_prep = prep

    def test_none_preparation(self):
        self.assertIsNone(get_the_top_consolidated_parent_cog_of_prep(None))

    def test_unparented_co(self):
        self.assertIsNone(
            get_the_top_consolidated_parent_cog_of_prep(self.first_co_prep)
        )

    def test_discrete_cog_parent(self):
        TestGetTopConsolidatedParentCogPrep._link_co_cog(
            self.collectionobjects[0], self.test_cog_discrete
        )
        self.assertIsNone(
            get_the_top_consolidated_parent_cog_of_prep(self.first_co_prep)
        )

    def test_direct_consolidated_cog_parent(self):
        TestGetTopConsolidatedParentCogPrep._link_co_cog(
            self.collectionobjects[0], self.test_cog_consolidated
        )
        self.assertEqual(
            get_the_top_consolidated_parent_cog_of_prep(self.first_co_prep).id,
            self.test_cog_consolidated.id,
        )

    def test_indirect_consolidated_cog_parent(self):
        test_cog_consolidated_father = Collectionobjectgroup.objects.create(
            collection=self.collection,
            cogtype=self.cogtype_consolidated,
        )
        TestGetTopConsolidatedParentCogPrep._link_co_cog(
            self.collectionobjects[0], self.test_cog_consolidated
        )
        TestGetTopConsolidatedParentCogPrep._link_cog_cog(
            self.test_cog_consolidated, test_cog_consolidated_father
        )
        self.assertEqual(
            get_the_top_consolidated_parent_cog_of_prep(self.first_co_prep).id,
            test_cog_consolidated_father.id,
        )

    def test_terminated_indirect_consolidated_cog_parent(self):
        test_cog_consolidated_father = Collectionobjectgroup.objects.create(
            collection=self.collection,
            cogtype=self.cogtype_consolidated,
        )
        test_cog_discrete_grandfather = Collectionobjectgroup.objects.create(
            collection=self.collection,
            cogtype=self.cogtype,
        )
        TestGetTopConsolidatedParentCogPrep._link_co_cog(
            self.collectionobjects[0], self.test_cog_consolidated
        )
        TestGetTopConsolidatedParentCogPrep._link_cog_cog(
            self.test_cog_consolidated, test_cog_consolidated_father
        )
        TestGetTopConsolidatedParentCogPrep._link_cog_cog(
            test_cog_consolidated_father, test_cog_discrete_grandfather
        )
        self.assertEqual(
            get_the_top_consolidated_parent_cog_of_prep(self.first_co_prep).id,
            test_cog_consolidated_father.id,
        )

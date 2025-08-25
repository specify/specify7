from specifyweb.backend.interactions.tests.test_cog import TestCogInteractions
from specifyweb.backend.datamodel.models import (
    Collectionobjectgroup,
)


class TestCogConsolidatedPrepSiblingContext(TestCogInteractions):
    def _consolidated_cog_parent_simple(self):
        prep_list = []
        for num_preps, co in enumerate(self.collectionobjects):
            self._create_prep(co, prep_list)
            TestCogConsolidatedPrepSiblingContext._link_co_cog(
                co, self.test_cog_consolidated
            )
        return [prep_list]

    def _consolidated_cog_parent_indirect(self):
        # self.test_cog_consolidated is the "top"
        # TODO: Write some kind of automated way to make the COG and CO structure.
        # Perhaps be able to represent the tree in json, and these tests will automatically create
        # records.

        prep_list = []
        for _ in range(5):
            self._create_prep(self.collectionobjects[0], prep_list)

        for _ in range(5):
            self._create_prep(self.collectionobjects[1], None)

        TestCogConsolidatedPrepSiblingContext._link_co_cog(
            self.collectionobjects[0], self.test_cog_consolidated
        )

        TestCogConsolidatedPrepSiblingContext._link_cog_cog(
            self.test_cog_discrete, self.test_cog_consolidated
        )

        TestCogConsolidatedPrepSiblingContext._link_co_cog(
            self.collectionobjects[1], self.test_cog_discrete
        )

        cog_consolidated_grandchild = Collectionobjectgroup.objects.create(
            collection=self.collection,
            cogtype=self.cogtype_consolidated,
        )

        TestCogConsolidatedPrepSiblingContext._link_co_cog(
            self.collectionobjects[2], cog_consolidated_grandchild
        )

        TestCogConsolidatedPrepSiblingContext._link_cog_cog(
            cog_consolidated_grandchild, self.test_cog_consolidated
        )

        for _ in range(5):
            self._create_prep(self.collectionobjects[2], prep_list)

        cog_consolidated_greatgrandchild = Collectionobjectgroup.objects.create(
            collection=self.collection,
            cogtype=self.cogtype_consolidated,
        )

        TestCogConsolidatedPrepSiblingContext._link_co_cog(
            self.collectionobjects[3], cog_consolidated_greatgrandchild
        )

        TestCogConsolidatedPrepSiblingContext._link_cog_cog(
            cog_consolidated_greatgrandchild, cog_consolidated_grandchild
        )

        for _ in range(5):
            self._create_prep(self.collectionobjects[3], prep_list)

        cog_discrete_grandchild = Collectionobjectgroup.objects.create(
            collection=self.collection,
            cogtype=self.cogtype,
        )

        TestCogConsolidatedPrepSiblingContext._link_co_cog(
            self.collectionobjects[4], cog_discrete_grandchild
        )

        TestCogConsolidatedPrepSiblingContext._link_cog_cog(
            cog_discrete_grandchild, cog_consolidated_greatgrandchild
        )

        for _ in range(5):
            self._create_prep(self.collectionobjects[4], None)

        return [prep_list]

    def _consolidated_cog_parent_branched(self):
        # In this case, the COG at the top is consolidated, but has a child COG discrete, which then has consolidated children

        # So, there are two branches of preparation
        branch_1_prep_list = []
        branch_2_prep_list = []

        # All of the below is first branch
        for _ in range(5):
            self._create_prep(self.collectionobjects[0], branch_1_prep_list)

        TestCogConsolidatedPrepSiblingContext._link_co_cog(
            self.collectionobjects[0], self.test_cog_consolidated
        )

        cog_consolidated_grandchild = Collectionobjectgroup.objects.create(
            collection=self.collection,
            cogtype=self.cogtype_consolidated,
        )

        TestCogConsolidatedPrepSiblingContext._link_co_cog(
            self.collectionobjects[1], cog_consolidated_grandchild
        )

        TestCogConsolidatedPrepSiblingContext._link_cog_cog(
            cog_consolidated_grandchild, self.test_cog_consolidated
        )

        for _ in range(5):
            self._create_prep(self.collectionobjects[1], branch_1_prep_list)

        # All of the below is second branch

        TestCogConsolidatedPrepSiblingContext._link_cog_cog(
            self.test_cog_discrete, self.test_cog_consolidated
        )

        TestCogConsolidatedPrepSiblingContext._link_co_cog(
            self.collectionobjects[2], self.test_cog_discrete
        )

        for _ in range(5):
            self._create_prep(self.collectionobjects[2], None)

        # Below is branch 2

        cog_consolidated_grandchild_branch_2 = Collectionobjectgroup.objects.create(
            collection=self.collection,
            cogtype=self.cogtype_consolidated,
        )

        TestCogConsolidatedPrepSiblingContext._link_co_cog(
            self.collectionobjects[3], cog_consolidated_grandchild_branch_2
        )

        TestCogConsolidatedPrepSiblingContext._link_cog_cog(
            cog_consolidated_grandchild_branch_2, self.test_cog_discrete
        )

        for _ in range(5):
            self._create_prep(self.collectionobjects[3], branch_2_prep_list)

        cog_consolidated_greatgrandchild_branch_2 = (
            Collectionobjectgroup.objects.create(
                collection=self.collection,
                cogtype=self.cogtype_consolidated,
            )
        )

        TestCogConsolidatedPrepSiblingContext._link_co_cog(
            self.collectionobjects[4], cog_consolidated_greatgrandchild_branch_2
        )

        TestCogConsolidatedPrepSiblingContext._link_cog_cog(
            cog_consolidated_greatgrandchild_branch_2,
            cog_consolidated_grandchild_branch_2,
        )

        for _ in range(5):
            self._create_prep(self.collectionobjects[4], branch_2_prep_list)

        return [branch_1_prep_list, branch_2_prep_list]

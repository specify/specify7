from specifyweb.backend.interactions.cog_preps import add_consolidated_sibling_co_ids
from specifyweb.backend.interactions.tests.test_cog_consolidated_prep_context import (
    TestCogConsolidatedPrepContext,
)
from specifyweb.backend.datamodel.models import (
    Collectionobjectgroup,
    Collectionobjectgroupjoin,
    Collectionobject,
)


class TestAddConsolidatedSiblingCoIds(TestCogConsolidatedPrepContext):

    @staticmethod
    def _get_cog_from_co(co):
        return Collectionobjectgroupjoin.objects.filter(childco=co).first().parentcog

    def _check_siblings(self, input_cos, result_set, field):
        input_set = [getattr(co, field) for co in input_cos]
        expected_output = [getattr(co, field) for co in result_set]
        self.assertCountEqual(
            add_consolidated_sibling_co_ids(input_set, field),
            expected_output,
        )

    def test_sibling_discrete_cog_parent(self):
        TestCogConsolidatedPrepContext._link_co_cog(
            self.collectionobjects[0], self.test_cog_discrete
        )
        TestCogConsolidatedPrepContext._link_co_cog(
            self.collectionobjects[1], self.test_cog_discrete
        )
        TestCogConsolidatedPrepContext._link_co_cog(
            self.collectionobjects[2], self.test_cog_discrete
        )
        TestCogConsolidatedPrepContext._link_co_cog(
            self.collectionobjects[3], self.test_cog_discrete
        )
        self._create_prep(self.collectionobjects[0], None)
        self._create_prep(self.collectionobjects[1], None)
        self._create_prep(self.collectionobjects[2], None)
        self._create_prep(self.collectionobjects[3], None)

        test_cases = [
            [self.collectionobjects[0]],
            [self.collectionobjects[1]],
            [self.collectionobjects[2], self.collectionobjects[3]],
        ]

        for test_case in test_cases:
            self._check_siblings(test_case, test_case, "id")
            self._check_siblings(test_case, test_case, "catalognumber")

    def test_sibling_no_preparations_on_none_consolidated(self):
        self._no_preparation_on_none_consolidated()

        cos = [
            self.collectionobjects[1],
            self.collectionobjects[2],
            self.collectionobjects[3],
        ]

        self._check_siblings(cos, cos, "id")
        self._check_siblings(cos, cos, "catalognumber")

    def test_sibling_immediate_co_children_preparations(self):
        self._immediate_co_children_preparations()

        test_cases = [
            [self.collectionobjects[1]],
            [self.collectionobjects[2]],
            [self.collectionobjects[3]],
            [
                self.collectionobjects[1],
                self.collectionobjects[2],
            ],
            [
                self.collectionobjects[2],
                self.collectionobjects[3],
            ],
            [
                self.collectionobjects[0],
                self.collectionobjects[1],
                self.collectionobjects[4],
            ],
        ]

        for test_case in test_cases:
            self._check_siblings(test_case, self.collectionobjects, "catalognumber")

    def test_sibling_distant_co_preps_included(self):
        co_and_preps = self._distant_co_preps_included()

        some_cog_consolidated = TestAddConsolidatedSiblingCoIds._get_cog_from_co(
            self.collectionobjects[2]
        )
        child_cog_consolidated = Collectionobjectgroup.objects.create(
            collection=self.collection,
            cogtype=self.cogtype_consolidated,
        )
        TestAddConsolidatedSiblingCoIds._link_cog_cog(
            child_cog_consolidated, some_cog_consolidated
        )

        new_collectionobjects = [
            Collectionobject.objects.create(
                collection=self.collection,
                catalognumber=f"num-{_id}",
                collectionobjecttype=self.collectionobjecttype,
            )
            for _id in range(6, 10)
        ]

        for co in new_collectionobjects[:2]:
            TestAddConsolidatedSiblingCoIds._link_co_cog(co, child_cog_consolidated)

        for _ in range(5):
            for co in new_collectionobjects:
                self._create_prep(co, None)

        grandchild_cog_consolidated = Collectionobjectgroup.objects.create(
            collection=self.collection,
            cogtype=self.cogtype_consolidated,
        )
        TestAddConsolidatedSiblingCoIds._link_cog_cog(
            grandchild_cog_consolidated, child_cog_consolidated
        )

        for co in new_collectionobjects[2:]:
            TestAddConsolidatedSiblingCoIds._link_co_cog(
                co, grandchild_cog_consolidated
            )

        all_relevant_cos = [self.collectionobjects[2], *new_collectionobjects]

        test_cases = [[]]

        def _append_and_run(test_case, result_set, field):
            test_cases.append(test_case)
            self._check_siblings([new_co], result_set, field)

        for new_co in new_collectionobjects[:2]:
            _append_and_run([new_co], new_collectionobjects, "id")
            _append_and_run([new_co], new_collectionobjects, "catalognumber")

        # Test the result set together
        _append_and_run(new_collectionobjects[:2], new_collectionobjects, "id")
        _append_and_run(
            new_collectionobjects[:2], new_collectionobjects, "catalognumber"
        )

        for new_co in new_collectionobjects[2:]:
            _append_and_run([new_co], new_collectionobjects[2:], "id")
            _append_and_run([new_co], new_collectionobjects[2:], "catalognumber")

        # Test the result set together
        _append_and_run(new_collectionobjects[2:], new_collectionobjects[2:], "id")
        _append_and_run(
            new_collectionobjects[2:], new_collectionobjects[2:], "catalognumber"
        )

        for test_case in test_cases:
            self._check_siblings(
                [*test_case, self.collectionobjects[2]], all_relevant_cos, "id"
            )
            self._check_siblings(
                [*test_case, self.collectionobjects[2]],
                all_relevant_cos,
                "catalognumber",
            )

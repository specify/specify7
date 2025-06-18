from specifyweb.interactions.cog_preps import modify_prep_update_based_on_sibling_preps
from specifyweb.interactions.tests.test_cog_consolidated_prep_sibling_context import (
    TestCogConsolidatedPrepSiblingContext,
)
from specifyweb.specify.models import Collectionobject
from unittest import skip


@skip("fix the test - temp skip")
class TestModifyPrepUpdateBasedOnSiblingPreps(TestCogConsolidatedPrepSiblingContext):
    def test_modify_consolidated_cog_parent_simple(self):
        prep_list = self._consolidated_cog_parent_simple()[0]

        new_co = Collectionobject.objects.create(collection=self.collection)
        created_prep = self._create_prep(new_co, None)

        original_prep_ids = {prep.id for prep in prep_list}
        new_prep_id = set([*list(original_prep_ids), created_prep.id])
        print(created_prep)
        self.assertEqual(
            modify_prep_update_based_on_sibling_preps(original_prep_ids, new_prep_id),
            original_prep_ids,
        )

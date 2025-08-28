from specifyweb.backend.inheritance.utils import get_parent_cat_num_inheritance_setting
from specifyweb.specify.tests.test_utils.test_collection_preference_context import TestCollectionPreferenceContext

class TestCatNumInheritanceSetting(TestCollectionPreferenceContext):

    def test_no_preference(self):
        self._update_data({})
        self.assertFalse(get_parent_cat_num_inheritance_setting(self.collection, self.specifyuser))
        self._delete_all()
        self.assertFalse(get_parent_cat_num_inheritance_setting(self.collection, self.specifyuser))

    def test_invalid_preference_content(self):
        self._update_data("Invalid Type!")
        self.assertFalse(get_parent_cat_num_inheritance_setting(self.collection, self.specifyuser))

    def test_missing_behavior(self):
        self._update_data(dict(
            catalogNumberParentInheritance={}
        ))
        self.assertFalse(get_parent_cat_num_inheritance_setting(self.collection, self.specifyuser))

    def test_missing_inheritance(self):
        self._update_data(dict(
            catalogNumberParentInheritance=dict(
                behavior={}
            )
        ))
        self.assertFalse(get_parent_cat_num_inheritance_setting(self.collection, self.specifyuser))

    def test_inheritance_enabled(self):
        self._update_data(dict(
            catalogNumberParentInheritance=dict(
                behavior=dict(
                    inheritance=True
                )
            )
        ))
        self.assertTrue(get_parent_cat_num_inheritance_setting(self.collection, self.specifyuser))

    def test_invalid_types(self):
        self._update_data(dict(
            catalogNumberParentInheritance="Invalid Type!"
        ))
        self.assertFalse(get_parent_cat_num_inheritance_setting(self.collection, self.specifyuser))

        self._update_data(dict(
            catalogNumberParentInheritance=dict(
                behavior="Invalid Type!"
            )
        ))
        self.assertFalse(get_parent_cat_num_inheritance_setting(self.collection, self.specifyuser))

        self._update_data(dict(
            catalogNumberParentInheritance=dict(
                behavior=dict(
                    inheritance="Invalid Type!"
                )
            )
        ))
        self.assertFalse(get_parent_cat_num_inheritance_setting(self.collection, self.specifyuser))
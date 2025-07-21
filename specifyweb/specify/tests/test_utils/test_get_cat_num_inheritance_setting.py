from specifyweb.specify.tests.test_utils.test_collection_preference_context import TestCollectionPreferenceContext
from specifyweb.specify.utils import get_cat_num_inheritance_setting

class TestCatNumInheritanceSetting(TestCollectionPreferenceContext):

    def setUp(self):
        super().setUp()
        self.get_setting_func = get_cat_num_inheritance_setting
    
    def test_no_preference(self):
        self._update_data({})
        self.assertFalse(self.get_setting_func(self.collection, self.specifyuser))
        self._delete_all()
        self.assertFalse(self.get_setting_func(self.collection, self.specifyuser))

    def test_invalid_preference_content(self):
        self._update_data("Invalid Type!")
        self.assertFalse(self.get_setting_func(self.collection, self.specifyuser))
    
    def test_missing_behavior(self):
        self._update_data(dict(
            catalogNumberInheritance={}
        ))
        self.assertFalse(self.get_setting_func(self.collection, self.specifyuser))

    def test_missing_inheritance(self):
        self._update_data(dict(
            catalogNumberInheritance=dict(
                behavior={}
            )
        ))
        self.assertFalse(self.get_setting_func(self.collection, self.specifyuser))

    def test_inheritance_enabled(self):
        self._update_data(dict(
            catalogNumberInheritance=dict(
                behavior=dict(
                    inheritance=True
                )
            )
        ))
        self.assertTrue(self.get_setting_func(self.collection, self.specifyuser))

    def test_invalid_types(self):
        self._update_data(dict(
            catalogNumberInheritance="Invalid Type!"
        ))
        self.assertFalse(self.get_setting_func(self.collection, self.specifyuser))

        self._update_data(dict(
            catalogNumberInheritance=dict(
                behavior="Invalid Type!"
            )
        ))
        self.assertFalse(self.get_setting_func(self.collection, self.specifyuser))

        self._update_data(dict(
            catalogNumberInheritance=dict(
                behavior=dict(
                    inheritance="Invalid Type!"
                )
            )
        ))
        self.assertFalse(self.get_setting_func(self.collection, self.specifyuser))
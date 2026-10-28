import json

from django.test import Client

from specifyweb.backend.businessrules.exceptions import BusinessRuleException
from specifyweb.backend.inheritance.utils import get_parent_cat_num_inheritance_setting
from specifyweb.specify.api.crud import create_obj
from specifyweb.specify.api.serializers import uri_for_model
from specifyweb.specify.models import Component
from specifyweb.specify.tests.test_utils.test_collection_preference_context import (
    TestCollectionPreferenceContext,
)


class ComponentCatalogNumberTests(TestCollectionPreferenceContext):
    def set_preferences(self, inheritance=False, uniqueness=False):
        self._update_data({
            'catalogNumberParentInheritance': {'behavior': {'inheritance': inheritance}},
            'uniqueCatalogNumberAccrossComponentAndCO': {'behavior': {'uniqueness': uniqueness}},
        })

    def create_component(self, parent, catalog_number=None):
        return create_obj(self.collection, self.agent, 'component', {
            'collectionobject': uri_for_model('collectionobject', parent.id),
            'catalognumber': catalog_number,
        })

    def test_disabled_inheritance_saves_and_reloads_blank_catalog_number(self):
        self.set_preferences(inheritance=False)
        self.assertFalse(get_parent_cat_num_inheritance_setting(self.collection, self.specifyuser))
        component = self.create_component(self.collectionobjects[0])
        component.refresh_from_db()
        self.assertIsNone(component.catalognumber)
        self.assertEqual(component.collectionobject.catalognumber, 'num-0')

    def test_enabled_inheritance_is_derived_without_storing_parent_number(self):
        self.set_preferences(inheritance=True, uniqueness=True)
        self.assertTrue(get_parent_cat_num_inheritance_setting(self.collection, self.specifyuser))
        component = self.create_component(self.collectionobjects[0])
        component.refresh_from_db()
        self.assertIsNone(component.catalognumber)

        client = Client()
        client.force_login(self.specifyuser)
        response = client.post('/inheritance/catalog_number_from_parent/',
                               json.dumps({'id': component.id, 'catalognumber': None}),
                               content_type='application/json')
        self._assertStatusCodeEqual(response, 200)
        self.assertEqual(response.json(), 'num-0')
        component.refresh_from_db()
        self.assertIsNone(component.catalognumber)

    def test_explicit_parent_catalog_number_is_rejected_but_blank_siblings_save(self):
        self.set_preferences(inheritance=True, uniqueness=True)
        parent = self.collectionobjects[0]
        for _ in range(2):
            self.assertIsNone(self.create_component(parent).catalognumber)
        with self.assertRaisesRegex(BusinessRuleException, 'Collection Object'):
            self.create_component(parent, parent.catalognumber)
        self.assertEqual(parent.components.count(), 2)

    def test_duplicate_number_on_another_collection_object_is_rejected(self):
        self.set_preferences(uniqueness=True)
        with self.assertRaisesRegex(BusinessRuleException, 'Collection Object'):
            self.create_component(self.collectionobjects[0], self.collectionobjects[1].catalognumber)
        self.assertFalse(Component.objects.exists())

    def test_duplicate_component_number_is_rejected_and_failed_update_preserves_value(self):
        self.set_preferences(uniqueness=True)
        self.create_component(self.collectionobjects[0], 'component-1')
        component = self.create_component(self.collectionobjects[1], 'component-2')
        component.catalognumber = 'component-1'
        with self.assertRaisesRegex(BusinessRuleException, 'Component'):
            component.save()
        component.refresh_from_db()
        self.assertEqual(component.catalognumber, 'component-2')
        component.save()  # An unchanged value must not conflict with itself.

    def test_disabled_uniqueness_allows_explicit_parent_number(self):
        self.set_preferences(uniqueness=False)
        parent = self.collectionobjects[0]
        component = self.create_component(parent, parent.catalognumber)
        component.refresh_from_db()
        self.assertEqual(component.catalognumber, parent.catalognumber)

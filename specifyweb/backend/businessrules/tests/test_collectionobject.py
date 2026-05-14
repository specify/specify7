from specifyweb.specify.models import (
    Collection,
    Collectionobject,
    Collectionobjecttype,
    Component,
)
from specifyweb.specify.tests.test_api import ApiTests
from specifyweb.backend.businessrules.utils import (
    cache_unique_catnum_preferences,
    component_catalog_number_exists,
    get_unique_catnum_across_comp_co_coll_pref_by_ids,
)
from ..exceptions import BusinessRuleException


class CollectionObjectTests(ApiTests):
    def test_catalog_number_unique_in_collection(self):
        with self.assertRaises(BusinessRuleException):
            Collectionobject.objects.create(
                collection=self.collection,
                catalognumber=self.collectionobjects[0].catalognumber)

        Collectionobject.objects.create(
            collection=self.collection,
            catalognumber=self.collectionobjects[0].catalognumber + 'foo')

    def test_default_collectionobjecttype(self):
        default_type = Collectionobjecttype.objects.create(
            name="default type",
            collection=self.collection,
            taxontreedef=self.discipline.taxontreedef
        )
        self.collection.collectionobjecttype = default_type
        self.collection.save()

        test_co = Collectionobject.objects.create(
            collection=self.collection
        )

        self.assertIsNotNone(test_co.collectionobjecttype)
        self.assertEqual(test_co.collectionobjecttype, default_type)

    def test_unique_catnum_preference_lookup_handles_stale_ids(self):
        self.assertFalse(
            get_unique_catnum_across_comp_co_coll_pref_by_ids(
                self.collection.id,
                987654321,
            )
        )
        self.assertFalse(
            get_unique_catnum_across_comp_co_coll_pref_by_ids(
                987654321,
                self.agent.id,
            )
        )

    def test_component_catalog_number_cache_is_collection_scoped(self):
        other_collection = Collection.objects.create(
            catalognumformatname="test",
            collectionname="Other Test Collection",
            isembeddedcollectingevent=False,
            discipline=self.discipline,
        )
        Component.objects.create(
            collectionobject=self.collectionobjects[0],
            catalognumber="shared-component-catno",
        )

        with cache_unique_catnum_preferences():
            self.assertTrue(
                component_catalog_number_exists(
                    "shared-component-catno",
                    collection_id=self.collection.id,
                )
            )
            self.assertFalse(
                component_catalog_number_exists(
                    "shared-component-catno",
                    collection_id=other_collection.id,
                )
            )

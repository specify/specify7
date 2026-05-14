from specifyweb.specify.models import Collection, Collectionobject, Collectionobjecttype
from specifyweb.specify.tests.test_api import ApiTests
from specifyweb.backend.businessrules.utils import (
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

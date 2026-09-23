from specifyweb.specify.models import (
    Collection,
    Collectionobject,
    Collectionobjecttype,
    Component,
)
from specifyweb.specify.tests.test_api import ApiTests
from specifyweb.backend.businessrules.tests.test_component import enable_unique_catnum_pref

from ..exceptions import BusinessRuleException


class CollectionObjectTests(ApiTests):
    def setUp(self):
        super().setUp()
        self.other_collection = Collection.objects.create(
            catalognumformatname="test",
            collectionname="Other Test Collection",
            isembeddedcollectingevent=False,
            discipline=self.discipline,
        )

    def test_catalog_number_unique_in_collection(self):
        with self.assertRaises(BusinessRuleException):
            Collectionobject.objects.create(
                collection=self.collection,
                catalognumber=self.collectionobjects[0].catalognumber)

        test_co = Collectionobject.objects.create(
            collection=self.collection,
            catalognumber=self.collectionobjects[0].catalognumber + 'foo')
        test_co.delete()

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
        default_type.delete()
        test_co.delete()

    def test_unique_catnum_pref_disabled(self):
        shared_catalog_number = "shared_catalog_number"
        other_shared_catnum = shared_catalog_number + "-sup"
        main_co = Collectionobject.objects.create(
            collection=self.collection,
            createdbyagent=self.agent,
            catalognumber=shared_catalog_number
        )
        other_co = Collectionobject.objects.create(
            collection=self.other_collection,
            createdbyagent=self.agent,
            catalognumber=shared_catalog_number
        )
        main_component = Component.objects.create(
            collectionobject=main_co,
            createdbyagent=self.agent,
            catalognumber=shared_catalog_number
        )
        main_second_component = Component.objects.create(
            collectionobject=main_co,
            createdbyagent=self.agent,
            catalognumber=other_shared_catnum
        )
        main_other_co = Collectionobject.objects.create(
            collection=self.collection,
            createdbyagent=self.agent,
            catalognumber=other_shared_catnum
        )
        other_component = Component.objects.create(
            collectionobject=other_co,
            createdbyagent=self.agent,
            catalognumber=shared_catalog_number
        )
        co_across_collection = Collectionobject.objects.create(
            collection=self.other_collection,
            createdbyagent=self.agent,
            catalognumber=other_shared_catnum
        )
        other_component.delete()
        main_component.delete()
        main_second_component.delete()
        main_other_co.delete()
        co_across_collection.delete()
        other_co.delete()
        main_co.delete()

    @enable_unique_catnum_pref()
    def test_pref_enabled_component_in_same_collection(self):
        shared_catalog_number = "shared_catalognumber"
        main_co = Collectionobject.objects.create(
            collection=self.collection,
            createdbyagent=self.agent
        )
        main_component = Component.objects.create(
            collectionobject=main_co,
            catalognumber=shared_catalog_number,
            createdbyagent=self.agent
        )

        with self.assertRaises(BusinessRuleException):
            Collectionobject.objects.create(
                collection=self.collection,
                catalognumber=shared_catalog_number,
                createdbyagent=self.agent
            )
        main_component.delete()
        main_co.delete()

    @enable_unique_catnum_pref()
    def test_pref_enabled_component_in_other_collection(self):
        shared_catalog_number = "shared_catalognumber"
        main_co = Collectionobject.objects.create(
            collection=self.collection,
            createdbyagent=self.agent
        )
        main_component = Component.objects.create(
            collectionobject=main_co,
            catalognumber=shared_catalog_number,
            createdbyagent=self.agent
        )
        other_co = Collectionobject.objects.create(
            collection=self.other_collection,
            catalognumber=shared_catalog_number,
            createdbyagent=self.agent
        )
        other_co.delete()
        main_component.delete()
        main_co.delete()

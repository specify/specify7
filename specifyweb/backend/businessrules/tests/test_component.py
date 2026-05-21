from unittest.case import TestCase
from unittest.mock import Mock, patch
from functools import wraps

from specifyweb.specify.tests.test_api import ApiTests
from specifyweb.specify.models import (
    Collection,
    Collectionobject,
    Component,
)
import specifyweb.backend.businessrules.utils
from specifyweb.backend.businessrules.utils import (
    cache_unique_catnum_preferences,
    component_catalog_number_exists,
    get_unique_catnum_across_comp_co_coll_pref_by_ids,
)
from specifyweb.backend.businessrules.exceptions import BusinessRuleException

class enable_unique_catnum_pref:
    """
    Use this to enable the shared uniqueness rule for
    Component -> catalogNumber and CollectionObject -> catalogNumber

    This can be used as a decorator to apply the patch/override for an entire
    test, or a context manager to only enable the preference for a specific
    part of a test.

    Examples:
    ```py
    # as a decorator
    @enable_unique_catnum_pref()
    def test_something_1(self):
        ...
    
    # as a context manager
    def test_something_2(self):
        with enable_unique_catnum_pref():
            ...
        # if you need the mocked function object, use the context manager
        with enable_unique_catnum_pref() as mocked_pref_function:
            ...
    ```
    """
    def __call__(self, test_func):
        @wraps(test_func)
        def wrapper(*args, **kwargs):
            with self:
                return test_func(*args, **kwargs)
        return wrapper

    def __enter__(self):
        self._patcher = patch.object(
            specifyweb.backend.businessrules.utils,
            "_get_unique_catnum_across_comp_co_coll_pref",
            return_value=True
        )
        return self._patcher.start()

    def __exit__(self, exc_type, exc, tb):
        self._patcher.stop()


class ComponentTests(ApiTests):
    def setUp(self):
        super().setUp()
        self.other_collection = Collection.objects.create(
            catalognumformatname="test",
            collectionname="Other Test Collection",
            isembeddedcollectingevent=False,
            discipline=self.discipline,
        )

    def test_unique_catnum_preference_lookup_handles_stale_ids(self):
        self.assertFalse(
            get_unique_catnum_across_comp_co_coll_pref_by_ids(
                collection_id=self.collection.id,
                agent_id=987654321,
            )
        )
        self.assertFalse(
            get_unique_catnum_across_comp_co_coll_pref_by_ids(
                collection_id=987654321,
                agent_id=self.agent.id,
            )
        )

    def test_component_catalog_number_cache_is_collection_scoped(self):
        test_component = Component.objects.create(
            collectionobject=self.collectionobjects[0],
            catalognumber="shared-component-catno",
        )

        with cache_unique_catnum_preferences():
            self.assertTrue(
                component_catalog_number_exists(
                    catalog_number="shared-component-catno",
                    collection_id=self.collection.id,
                )
            )
            self.assertFalse(
                component_catalog_number_exists(
                    catalog_number="shared-component-catno",
                    collection_id=self.other_collection.id,
                )
            )
        
        test_component.delete()

    @enable_unique_catnum_pref()
    def test_collectionobject_across_collections(self):
        shared_catalognumber = "shared_co_comp_catnum"
        other_co = Collectionobject.objects.create(
            collection=self.other_collection,
            catalognumber=shared_catalognumber
        )

        main_co = Collectionobject.objects.create(
            collection=self.collection,
            catalognumber="some_other_catnum"
        )

        main_component = Component.objects.create(
            collectionobject=main_co,
            catalognumber=shared_catalognumber,
            createdbyagent=self.agent
        )

        with self.assertRaises(BusinessRuleException):
            Component.objects.create(
                collectionobject=other_co,
                catalognumber=shared_catalognumber,
                createdbyagent=self.agent
            )
        main_component.delete()
        main_co.delete()
        other_co.delete()

    @enable_unique_catnum_pref()
    def test_component_catalognumber_across_collections(self):
        shared_catalognumber = "shared_catnum"
        other_co = Collectionobject.objects.create(
            collection=self.other_collection
        )
        other_component = Component.objects.create(
            collectionobject=other_co,
            catalognumber=shared_catalognumber,
            createdbyagent=self.agent
        )
        main_co = Collectionobject.objects.create(
            collection=self.collection
        )
        main_component = Component.objects.create(
            collectionobject=main_co,
            catalognumber=shared_catalognumber,
            createdbyagent=self.agent
        )
        with self.assertRaises(BusinessRuleException):
            Component.objects.create(
                collectionobject=other_co,
                catalognumber=shared_catalognumber,
                createdbyagent=self.agent
            )
        with self.assertRaises(BusinessRuleException):
            Component.objects.create(
                collectionobject=main_co,
                catalognumber=shared_catalognumber,
                createdbyagent=self.agent
            )

        other_component.delete()
        other_co.delete()
        main_component.delete()
        main_co.delete()

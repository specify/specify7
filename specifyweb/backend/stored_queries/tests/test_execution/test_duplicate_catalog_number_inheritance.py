from specifyweb.backend.stored_queries.queryfieldspec import (
    co_components_ids,
    cog_primary_co_sibling_ids,
)
from specifyweb.backend.stored_queries.tests.tests import SQLAlchemySetup
from specifyweb.backend.stored_queries.tests.utils import make_query_fields_test
from specifyweb.specify.models import (
    Collection,
    Collectionobject,
    Collectionobjectgroup,
    Collectionobjectgroupjoin,
    Collectionobjectgrouptype,
    Component,
)
from specifyweb.specify.tests.test_utils.test_collection_preference_context import (
    TestCollectionPreferenceContext,
)


class DuplicateCatalogNumberInheritanceTests(SQLAlchemySetup, TestCollectionPreferenceContext):
    def setUp(self):
        super().setUp()
        self.first, self.second, self.first_sibling, self.second_sibling, self.override = self.collectionobjects
        self.catalog_number = self.first.catalognumber
        # Simulate existing data with duplicate catalog numbers, bypassing the
        # default application uniqueness rule without changing that rule.
        Collectionobject.objects.filter(id=self.second.id).update(catalognumber=self.catalog_number)
        self.second.refresh_from_db()
        Collectionobject.objects.filter(
            id__in=[self.first_sibling.id, self.second_sibling.id]
        ).update(catalognumber=None)

        self.other_collection = Collection.objects.create(
            collectionname='Other collection', catalognumformatname='test',
            isembeddedcollectingevent=False, discipline=self.discipline,
        )
        self.other_parent = Collectionobject.objects.create(
            collection=self.other_collection, catalognumber=self.catalog_number,
        )

    def query_ids(self, table_name, inheritance):
        self._update_data({inheritance: {'behavior': {'inheritance': True}}})
        table, fields = make_query_fields_test(table_name, [['catalognumber']])
        fields = [fields[0]._replace(op_num=1, value=self.catalog_number)]
        return {row[0] for row in self._get_results(table, fields)}

    def test_components_inherit_from_all_matching_parents_in_the_collection(self):
        first_component = Component.objects.create(collectionobject=self.first)
        second_component = Component.objects.create(collectionobject=self.second)
        explicit = Component.objects.create(
            collectionobject=self.override, catalognumber=self.catalog_number,
        )
        Component.objects.create(collectionobject=self.first, catalognumber='override')
        Component.objects.create(collectionobject=self.override)
        Component.objects.create(collectionobject=self.other_parent)
        Component.objects.create(
            collectionobject=self.other_parent, catalognumber=self.catalog_number,
        )

        expected = {first_component.id, second_component.id, explicit.id}
        self.assertSetEqual(set(co_components_ids(self.catalog_number, self.collection)),
                            {str(pk) for pk in expected})
        self.assertSetEqual(self.query_ids('Component', 'catalogNumberParentInheritance'), expected)
        first_component.refresh_from_db()
        second_component.refresh_from_db()
        self.assertIsNone(first_component.catalognumber)
        self.assertIsNone(second_component.catalognumber)

    def make_group(self, primary, sibling):
        group_type, _ = Collectionobjectgrouptype.objects.get_or_create(
            collection=self.collection, name='Duplicate catalog number test',
            defaults={'type': 'Discrete'},
        )
        group = Collectionobjectgroup.objects.create(collection=self.collection, cogtype=group_type)
        Collectionobjectgroupjoin.objects.create(parentcog=group, childco=primary, isprimary=True)
        Collectionobjectgroupjoin.objects.create(parentcog=group, childco=sibling, isprimary=False)
        return group

    def test_cog_filter_includes_all_matching_primaries_and_their_blank_siblings(self):
        first_group = self.make_group(self.first, self.first_sibling)
        self.make_group(self.second, self.second_sibling)
        Collectionobjectgroupjoin.objects.create(
            parentcog=first_group, childco=self.override, isprimary=False,
        )
        ungrouped = self.make_co(1)[0]
        Collectionobject.objects.filter(id=ungrouped.id).update(catalognumber=self.catalog_number)
        expected = {self.first.id, self.second.id, self.first_sibling.id,
                    self.second_sibling.id, ungrouped.id}

        self.assertSetEqual(set(cog_primary_co_sibling_ids(self.catalog_number, self.collection)),
                            {str(pk) for pk in expected})
        self.assertSetEqual(self.query_ids('CollectionObject', 'catalogNumberInheritance'), expected)

    def test_ungrouped_first_match_does_not_hide_a_later_primarys_siblings(self):
        self.make_group(self.second, self.second_sibling)
        expected = {self.first.id, self.second.id, self.second_sibling.id}
        self.assertSetEqual(self.query_ids('CollectionObject', 'catalogNumberInheritance'), expected)

    def test_non_primary_match_does_not_pass_its_number_to_siblings(self):
        group = self.make_group(self.override, self.first)
        Collectionobjectgroupjoin.objects.create(
            parentcog=group, childco=self.first_sibling, isprimary=False,
        )
        self.make_group(self.second, self.second_sibling)
        expected = {self.first.id, self.second.id, self.second_sibling.id}
        self.assertSetEqual(self.query_ids('CollectionObject', 'catalogNumberInheritance'), expected)

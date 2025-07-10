from specifyweb.specify.autonumbering import do_autonumbering
from specifyweb.specify.filter_by_col import filter_by_collection
from specifyweb.specify.models import Collectionobject, Collection

from unittest.mock import Mock, patch

from specifyweb.specify.tests.test_autonumbering import TestAutonumberingContext

# Thus test uses ApiTransactionTests because lock table performs implicit commit on the database.
# So, need to reset the state of the entire database.
class TestDoAutonumbering(TestAutonumberingContext):

    @patch("specifyweb.specify.uiformatters.get_autonumber_group_filter")
    def test_simple_autonumbering(self, group_filter: Mock):
        group_filter.return_value = lambda objs: filter_by_collection(
            objs, self.collection
        )
        fields = [
            (
                self.cnn_ui_formatter,
                ("#########",),
            )
        ]
        Collectionobject.objects.all().delete()

        co = Collectionobject(collection=self.collection, catalognumber="#########")

        do_autonumbering(self.collection, co, fields)

        co.refresh_from_db()
        # This CO must be created now.
        self.assertIsNotNone(co.id)
        self.assertEqual(co.catalognumber, "000000001")

        second_co = Collectionobject(
            collection=self.collection, catalognumber="#########"
        )

        do_autonumbering(self.collection, second_co, fields)

        second_co.refresh_from_db()
        # This second CO must be created now.
        self.assertIsNotNone(second_co.id)
        self.assertEqual(second_co.catalognumber, "000000002")

    @patch("specifyweb.specify.uiformatters.get_autonumber_group_filter")
    def test_multiple_fields_autonumbering(self, group_filter: Mock):
        group_filter.return_value = lambda objs: filter_by_collection(
            objs, self.collection
        )

        fields = lambda values: [
            (
                self.cnn_ui_formatter,
                ("#########",),
            ),
            (
                self.complicated_formatter,
                values
            )
        ]

        Collectionobject.objects.all().delete()

        co = Collectionobject(collection=self.collection, catalognumber="#########", text1="AB-###")

        do_autonumbering(self.collection, co, fields(('AB', '-', '###')))
        co.refresh_from_db()

        self.assertIsNotNone(co.id)
        self.assertEqual(co.text1, "AB-001")
        self.assertEqual(co.catalognumber, "000000001")

        second_co = Collectionobject(collection=self.collection, catalognumber="#########", text1="AB-###")
        do_autonumbering(self.collection, second_co, fields(('AB', '-', '###')))
        second_co.refresh_from_db()

        self.assertIsNotNone(second_co.id)
        self.assertEqual(second_co.text1, "AB-002")
        self.assertEqual(second_co.catalognumber, "000000002")

        third_co = Collectionobject(collection=self.collection, catalognumber="#########", text1="AA-###")
        do_autonumbering(self.collection, third_co, fields(('AA', '-', '###')))
        third_co.refresh_from_db()

        self.assertIsNotNone(third_co.id)
        self.assertEqual(third_co.text1, "AA-001")
        self.assertEqual(third_co.catalognumber, "000000003")

    @patch("specifyweb.specify.uiformatters.get_autonumber_group_filter")
    def test_increment_across_collections(self, group_filter: Mock):
        # This is as close as we can get...
        second_collection = Collection.objects.create(
            collectionname="TestCollection2",
            discipline=self.discipline,
        )

        group_filter.return_value = lambda objs: (
            objs.filter(collectionmemberid__in=[self.collection.id, second_collection.id])
        )

        fields = [
            (
                self.cnn_ui_formatter,
                ("#########",),
            )
        ]
        Collectionobject.objects.all().delete()

        co = Collectionobject(collection=self.collection, catalognumber="#########")

        do_autonumbering(self.collection, co, fields)

        co.refresh_from_db()
        # This CO must be created now.
        self.assertIsNotNone(co.id)
        self.assertEqual(co.catalognumber, "000000001")

        second_co = Collectionobject(
            collection=self.collection, catalognumber="#########"
        )

        do_autonumbering(self.collection, second_co, fields)

        second_co.refresh_from_db()
        # This second CO must be created now.
        self.assertIsNotNone(second_co.id)
        self.assertEqual(second_co.catalognumber, "000000002")

        third_co_different_collection = Collectionobject(
            collection=second_collection, catalognumber="#########"
        )

        do_autonumbering(self.collection, third_co_different_collection, fields)
        third_co_different_collection.refresh_from_db()
        # This third CO must be created now.
        self.assertIsNotNone(third_co_different_collection.id)
        # It should still have incrementing.
        self.assertEqual(third_co_different_collection.catalognumber, "000000003")

        # The collection here is now irrerevant to other ones.
        third_collection = Collection.objects.create(
            collectionname="TestCollection3",
            discipline=self.discipline,
        )

        group_filter.return_value = lambda objs: filter_by_collection(objs, third_collection)

        fourth_co_irrelevant_collection = Collectionobject(collection=third_collection, catalognumber="#########")

        do_autonumbering(self.collection, fourth_co_irrelevant_collection, fields)

        fourth_co_irrelevant_collection.refresh_from_db()
        # This CO must be created now.
        self.assertIsNotNone(fourth_co_irrelevant_collection.id)
        self.assertEqual(fourth_co_irrelevant_collection.catalognumber, "000000001")
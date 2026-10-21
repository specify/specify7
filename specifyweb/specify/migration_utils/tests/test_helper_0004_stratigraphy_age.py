from unittest.mock import patch, MagicMock

from django.apps import apps
from django.db.models import Prefetch
from django.test import TestCase

from specifyweb.specify.models import Picklist, Picklistitem, Collection
from specifyweb.specify.migration_utils.migration_helpers.helper_0004_stratigraphy_age import create_agetype_picklist, AGETYPE_PICKLIST_NAME, DEFAULT_AGE_TYPES, create_strat_table_schema_config_with_defaults, MIGRATION_0004_TABLES, revert_strat_table_schema_config_with_defaults
from specifyweb.specify.tests.test_api import ApiTests
from specifyweb.specify.migration_utils.schema_reader import SchemaReader, MissingRecordError

class CreateAgetypePicklistTests(ApiTests):

    def setUp(self):
        super().setUp()
        self.other_collection = Collection.objects.create(
            catalognumformatname='test',
            collectionname='OtherCollection',
            isembeddedcollectingevent=False,
            discipline=self.discipline,
        )

    def test_create_agetype_picklist_creates_items_for_new_picklist(self):
        create_agetype_picklist(apps)

        picklists = Picklist.objects.filter(
            name=AGETYPE_PICKLIST_NAME
        ).prefetch_related(
            Prefetch(
                "picklistitems",
                queryset=Picklistitem.objects.order_by("value"),
                to_attr="testitems"
            )
        )

        collection_count = Collection.objects.all().count()

        self.assertEqual(
            picklists.count(),
            collection_count
        )

        ordered_age_types = tuple(
            (val, val) for val in
            sorted(DEFAULT_AGE_TYPES)
        )
        for picklist in picklists:
            picklist_item_values = tuple(
                (item.title, item.value)
                for item in picklist.testitems
            )

            self.assertEqual(
                ordered_age_types,
                picklist_item_values
            )

class RevertStratSchemaConfigTests(ApiTests):
    def test_revert_deletes_schema_recors(self):
        # We don't really need tests for the forward version of this migration:
        # that is essentially just testing
        # update_table_schema_config_with_defaults with no supplied defaults
        # In the same vein, we don't really need this test here for the reverse
        # migration, but that's not tested yet so keeping this as-is for now

        # REFACTOR: Remove this test in favor of general tests for
        # revert_table_schema_config and revert_table_field_schema_config
        create_strat_table_schema_config_with_defaults(apps)
        schema_reader = SchemaReader(self.discipline.pk)
        table_name, _ = MIGRATION_0004_TABLES[0]
        # This will raise an error if the table can not be found or multiple
        # Splocalecontianer objects exist
        schema_reader.get_table(table_name)

        revert_strat_table_schema_config_with_defaults(apps)
        with self.assertRaises(MissingRecordError):
            schema_reader.get_table(table_name)

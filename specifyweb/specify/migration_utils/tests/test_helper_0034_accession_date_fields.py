from unittest.mock import patch

from django.apps import apps

from specifyweb.specify.models import Splocalecontainer, Splocalecontaineritem, Splocaleitemstr
from specifyweb.specify.tests.test_api import ApiTests
from specifyweb.specify.migration_utils.migration_helpers import helper_0034_accession_date_fields


class AccessionDateFieldsTests(ApiTests):

    def setUp(self):
        super().setUp()

        self.container = Splocalecontainer.objects.create(
            name="accession",
            schematype=0,
            discipline=self.discipline,
            aggregator="",
            defaultui="",
            format="",
            ishidden=False,
            issystem=False,
        )

        self.item = Splocalecontaineritem.objects.create(
            container=self.container,
            name="dateAccessionedPrecision",
            ishidden=False,
            issystem=False,
        )

        self.desc = Splocaleitemstr.objects.create(
            language="en",
            country="US",
            text="old-desc",
            itemdesc=self.item,
        )

        self.name = Splocaleitemstr.objects.create(
            language="en",
            country="US",
            text="old-name",
            itemname=self.item,
        )

    @patch(
        "specifyweb.specify.migration_utils.migration_helpers.helper_0034_accession_date_fields.update_table_field_schema_config_with_defaults"
    )
    def test_update_accession_date_fields_calls_schema_config_update(self, mock_update):
        helper_0034_accession_date_fields.update_accession_date_fields(apps)

        expected = len(helper_0034_accession_date_fields.MIGRATION_0034_FIELDS["Accession"])
        self.assertEqual(mock_update.call_count, expected)
        mock_update.assert_any_call("Accession", self.discipline.id, "dateAccessionedPrecision", apps)
        mock_update.assert_any_call("Accession", self.discipline.id, "date2Precision", apps)

    @patch(
        "specifyweb.specify.migration_utils.migration_helpers.helper_0034_accession_date_fields.update_table_field_schema_config_with_defaults"
    )
    def test_update_accession_date_fields_updates_field_descriptions(self, mock_update):
        helper_0034_accession_date_fields.update_accession_date_fields(apps)

        self.item.refresh_from_db()
        self.desc.refresh_from_db()
        self.name.refresh_from_db()

        self.assertTrue(self.item.ishidden)
        self.assertEqual(self.desc.text, "Date Accessioned Precision")
        self.assertEqual(self.name.text, "Date Accessioned Precision")

    @patch(
        "specifyweb.specify.migration_utils.migration_helpers.helper_0034_accession_date_fields.revert_table_field_schema_config"
    )
    def test_revert_update_accession_date_fields_reverts_field_config(self, mock_revert):
        helper_0034_accession_date_fields.revert_update_accession_date_fields(apps)

        expected = len(helper_0034_accession_date_fields.MIGRATION_0034_FIELDS["Accession"])
        self.assertEqual(mock_revert.call_count, expected)
        mock_revert.assert_any_call("Accession", "date1", apps)
        mock_revert.assert_any_call("Accession", "date2Precision", apps)

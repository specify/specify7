from django.test import TestCase
from unittest.mock import patch, MagicMock

from specifyweb.specify.migration_utils.schema_writer import (
    update_table_schema_config_with_defaults,
    revert_table_schema_config,
)


class SchemaWriterTests(TestCase):

    @patch("specifyweb.specify.migration_utils.schema_writer.datamodel")
    @patch("specifyweb.specify.migration_utils.schema_writer.Splocalecontainer")
    @patch("specifyweb.specify.migration_utils.schema_writer.Splocalecontaineritem")
    @patch("specifyweb.specify.migration_utils.schema_writer.Splocaleitemstr")
    @patch("specifyweb.specify.migration_utils.schema_writer.bulk_create_splocaleitemstr_idempotent")
    def test_update_table_schema_config_with_defaults(
        self,
        mock_bulk_create,
        mock_itemstr,
        mock_containeritem,
        mock_container,
        mock_datamodel,
    ):
        # ------------------------
        # Mock table
        # ------------------------
        mock_table = MagicMock()
        mock_table.name = "TestTable"
        mock_table.system = False
        mock_table._all_fields.return_value = []
        mock_datamodel.get_table.return_value = mock_table

        # ------------------------
        # Mock container lookup chain:
        # filter().order_by().first() -> None
        # ------------------------
        mock_container.objects.filter.return_value.order_by.return_value.first.return_value = None

        # containeritem does NOT exist
        mock_containeritem.objects.filter.return_value.exists.return_value = False

        # ------------------------
        # Call function
        # ------------------------
        update_table_schema_config_with_defaults("TestTable", 1)

        # ------------------------
        # Assert container creation
        # ------------------------
        mock_container.objects.create.assert_called_once()
        created_kwargs = mock_container.objects.create.call_args.kwargs

        self.assertEqual(created_kwargs["name"], "testtable")
        self.assertEqual(created_kwargs["discipline_id"], 1)
        self.assertEqual(created_kwargs["schematype"], 0)
        self.assertFalse(created_kwargs["issystem"])
        self.assertFalse(created_kwargs["ishidden"])

        # ------------------------
        # Assert bulk insert was triggered (table + desc rows)
        # ------------------------
        mock_bulk_create.assert_called_once()

    @patch("specifyweb.specify.migration_utils.schema_writer.Splocalecontainer")
    @patch("specifyweb.specify.migration_utils.schema_writer.Splocaleitemstr")
    @patch("specifyweb.specify.migration_utils.schema_writer.Splocalecontaineritem")
    def test_revert_table_schema_config(
        self,
        mock_containeritem,
        mock_itemstr,
        mock_container,
    ):
        # ------------------------
        # Mock containers queryset
        # ------------------------
        mock_containers_qs = MagicMock()
        mock_container.objects.filter.return_value = mock_containers_qs

        # Mock items queryset
        mock_items_qs = MagicMock()
        mock_containeritem.objects.filter.return_value = mock_items_qs

        # ------------------------
        # Call function
        # ------------------------
        revert_table_schema_config("TestTable")

        # ------------------------
        # Assertions
        # ------------------------
        mock_container.objects.filter.assert_called_once_with(
            name="testtable",
            schematype=0,
        )

        mock_containeritem.objects.filter.assert_called_once()
        mock_items_qs.delete.assert_called_once()
        mock_containers_qs.delete.assert_called_once()

        # Splocaleitemstr must be filtered and deleted
        mock_itemstr.objects.filter.assert_called_once()
        mock_itemstr.objects.filter.return_value.delete.assert_called_once()

    @patch("specifyweb.specify.migration_utils.schema_writer.datamodel")
    def test_update_table_schema_config_with_defaults_nonexistent_table(self, mock_datamodel):
        mock_datamodel.get_table.return_value = None

        with self.assertLogs(level="WARNING") as log:
            update_table_schema_config_with_defaults("NonexistentTable", 1)

        self.assertTrue(
            any("Table does not exist in latest state" in msg for msg in log.output)
        )
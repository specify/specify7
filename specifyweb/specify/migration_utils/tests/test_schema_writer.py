from django.test import TestCase
from unittest.mock import patch, MagicMock
from specifyweb.specify.migration_utils.schema_writer import (
    update_table_schema_config_with_defaults,
    revert_table_schema_config
)
from specifyweb.specify.models_utils.load_datamodel import FieldDoesNotExistError

class SchemaWriterTests(TestCase):
    @patch('specifyweb.specify.migration_utils.schema_writer.datamodel')
    @patch('specifyweb.specify.migration_utils.schema_writer.Splocalecontainer')
    @patch('specifyweb.specify.migration_utils.schema_writer.Splocalecontaineritem')
    @patch('specifyweb.specify.migration_utils.schema_writer.Splocaleitemstr')
    @patch('specifyweb.specify.migration_utils.schema_writer.bulk_create_splocaleitemstr_idempotent')
    def test_update_table_schema_config_with_defaults(self, mock_bulk_create, mock_itemstr, mock_containeritem, mock_container, mock_datamodel):
        # Setup mock table
        mock_table = MagicMock()
        mock_table.name = "TestTable"
        mock_table.system = False
        mock_table._all_fields.return_value = []
        mock_datamodel.get_table.return_value = mock_table

        # Setup mock container query
        mock_container.objects.filter.return_value.order_by.return_value.first.return_value = None
        mock_container_item = MagicMock()
        mock_containeritem.objects.filter.return_value.exists.return_value = False

        # Call function
        update_table_schema_config_with_defaults("TestTable", 1)

        # Assertions
        mock_container.objects.create.assert_called_once_with(
            name="testtable",
            discipline_id=1,
            schematype=0,
            ishidden=False,
            issystem=False,
            version=0
        )
        mock_bulk_create.assert_called_once()

    @patch('specifyweb.specify.migration_utils.schema_writer.Splocalecontainer')
    @patch('specifyweb.specify.migration_utils.schema_writer.Splocaleitemstr')
    @patch('specifyweb.specify.migration_utils.schema_writer.Splocalecontaineritem')
    def test_revert_table_schema_config(self, mock_containeritem, mock_itemstr, mock_container):
        # Setup mock queries
        mock_containers = MagicMock()
        mock_container.objects.filter.return_value = mock_containers
        mock_items = MagicMock()
        mock_containeritem.objects.filter.return_value = mock_items

        # Call function
        revert_table_schema_config("TestTable")

        # Assertions
        mock_container.objects.filter.assert_called_once_with(
            name="testtable",
            schematype=0
        )
        mock_containeritem.objects.filter.assert_called_once_with(container__in=mock_containers)
        mock_itemstr.objects.filter.assert_called_once()
        mock_items.delete.assert_called_once()
        mock_containers.delete.assert_called_once()

    @patch('specifyweb.specify.migration_utils.schema_writer.datamodel')
    def test_update_table_schema_config_with_defaults_nonexistent_table(self, mock_datamodel):
        mock_datamodel.get_table.return_value = None
        with self.assertLogs(level='WARNING') as log:
            update_table_schema_config_with_defaults("NonexistentTable", 1)
            self.assertIn("Table does not exist in latest state of the datamodel", log.output[0])
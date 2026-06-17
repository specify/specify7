from django.test import TestCase
from unittest.mock import patch, MagicMock

from specifyweb.specify.migration_utils.schema_writer import (
    update_table_schema_config_with_defaults,
    revert_table_field_schema_config,
)


class SchemaWriterTests(TestCase):

    @patch("specifyweb.specify.migration_utils.schema_writer.bulk_create_splocaleitemstr_idempotent")
    def test_update_table_schema_config_with_defaults(self, mock_bulk_create):
        mock_apps = MagicMock()
        # -----------------------
        # Mock models via apps.get_model
        # -----------------------
        mock_container = MagicMock()
        mock_containeritem = MagicMock()
        mock_itemstr = MagicMock()

        def get_model(app_label, model_name):
            if model_name == "Splocalecontainer":
                return mock_container
            if model_name == "Splocalecontaineritem":
                return mock_containeritem
            if model_name == "Splocaleitemstr":
                return mock_itemstr

        mock_apps.get_model.side_effect = get_model

        # -----------------------
        # Query behavior
        # -----------------------
        mock_container.objects.filter.return_value.order_by.return_value.first.return_value = None
        mock_containeritem.objects.filter.return_value.exists.return_value = False

        mock_table = MagicMock()
        mock_table.name = "TestTable"
        mock_table.system = False
        mock_table._all_fields.return_value = []

        with patch("specifyweb.specify.migration_utils.schema_writer.datamodel") as mock_datamodel:
            mock_datamodel.get_table.return_value = mock_table

            update_table_schema_config_with_defaults("TestTable", 1, apps=mock_apps)

        mock_bulk_create.assert_called_once()


    def test_revert_table_field_schema_config(self):
        mock_apps = MagicMock()

        mock_container = MagicMock()
        mock_itemstr = MagicMock()
        mock_containeritem = MagicMock()

        def get_model(app_label, model_name):
            if model_name == "Splocalecontainer":
                return mock_container
            if model_name == "Splocaleitemstr":
                return mock_itemstr
            if model_name == "Splocalecontaineritem":
                return mock_containeritem

        mock_apps.get_model.side_effect = get_model

        mock_container.objects.filter.return_value = MagicMock()
        mock_containeritem.objects.filter.return_value = MagicMock()

        revert_table_field_schema_config("TestTable", "field", apps=mock_apps)

        mock_containeritem.objects.filter.assert_called_once()
        mock_itemstr.objects.filter.assert_called_once()
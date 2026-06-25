from django.test import TestCase
from unittest.mock import patch, MagicMock

from specifyweb.specify.migration_utils.migration_helpers import helper_0018_cot_catnum_schema

class AddCotCatnumToSchemaTests(TestCase):

    @patch(
        "specifyweb.specify.migration_utils.migration_helpers.helper_0018_cot_catnum_schema.datamodel"
    )
    def test_add_cot_catnum_to_schema(self, mock_datamodel):
        mock_apps = MagicMock()

        container_model = MagicMock()
        item_model = MagicMock()
        itemstr_model = MagicMock()

        container = MagicMock()

        container_model.objects.filter.return_value = [container]

        field = MagicMock()
        field.name = "catalogNumberFormatName"
        field.type = "text"
        field.required = True

        table = MagicMock()
        table.get_field_strict.return_value = field

        mock_datamodel.get_table_strict.return_value = table

        created_item = MagicMock(isrequired=None)

        item_model.objects.get_or_create.return_value = (
            created_item,
            True,
        )

        def get_model(app_label, model_name):
            return {
                "Splocalecontainer": container_model,
                "Splocalecontaineritem": item_model,
                "Splocaleitemstr": itemstr_model,
            }[model_name]

        mock_apps.get_model.side_effect = get_model

        helper_0018_cot_catnum_schema.add_cot_catnum_to_schema(
            mock_apps
        )

        item_model.objects.get_or_create.assert_called_once()
        created_item.save.assert_called_once()
        self.assertEqual(
            itemstr_model.objects.get_or_create.call_count,
            2,
        )
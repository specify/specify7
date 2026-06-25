from django.test import TestCase
from unittest.mock import MagicMock

from specifyweb.specify.migration_utils.migration_helpers import helper_0003_cotype_picklist


from specifyweb.specify.migration_utils.migration_helpers import (
    helper_0033_update_paleo_desc,
)


class UpdatePaleoDescTests(TestCase):

    def test_update_paleo_desc(self):
        mock_apps = MagicMock()

        itemstr_model = MagicMock()

        def get_model(app_label, model_name):
            return itemstr_model

        mock_apps.get_model.side_effect = get_model

        helper_0033_update_paleo_desc.update_paleo_desc(
            mock_apps
        )

        itemstr_model.objects.filter.return_value.update.assert_called_once_with(
            text=helper_0033_update_paleo_desc.MIGRATION_0033_TABLES[0][1]
        )
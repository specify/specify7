from django.test import TestCase
from unittest.mock import patch, MagicMock

from specifyweb.specify.migration_utils.migration_helpers import helper_0021_update_hidden_geo_tables

class FixHiddenGeoPropTests(TestCase):

    def test_fix_hidden_geo_prop(self):
        mock_apps = MagicMock()

        discipline_model = MagicMock()
        container_model = MagicMock()
        item_model = MagicMock()

        discipline_model.objects.exclude.return_value = [
            MagicMock(id=1)
        ]

        container_model.objects.filter.return_value = [
            MagicMock()
        ]

        def get_model(app_label, model_name):
            return {
                "Discipline": discipline_model,
                "Splocalecontainer": container_model,
                "Splocalecontaineritem": item_model,
            }[model_name]

        mock_apps.get_model.side_effect = get_model

        helper_0021_update_hidden_geo_tables.fix_hidden_geo_prop(
            mock_apps
        )

        item_model.objects.filter.return_value.update.assert_called()
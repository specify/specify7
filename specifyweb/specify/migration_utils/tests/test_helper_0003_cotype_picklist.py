from django.test import TestCase
from unittest.mock import MagicMock

from specifyweb.specify.migration_utils.migration_helpers import helper_0003_cotype_picklist


class Helper0003CotypePicklistTest(TestCase):

    def test_create_cotype_splocalecontaineritem_new(self):
        mock_apps = MagicMock()
        # -----------------------
        # Mock models
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
        # Mock queryset chain for container
        # -----------------------
        container_qs = MagicMock()
        mock_container.objects.filter.return_value = container_qs
        container_qs.__iter__.return_value = [MagicMock()]

        # -----------------------
        # No existing container item
        # -----------------------
        item_qs = MagicMock()
        mock_containeritem.objects.filter.return_value = item_qs
        item_qs.order_by.return_value.first.return_value = None

        created_item = MagicMock()
        mock_containeritem.objects.create.return_value = created_item

        # -----------------------
        # No existing strings
        # -----------------------
        str_qs = MagicMock()
        mock_itemstr.objects.filter.return_value = str_qs
        str_qs.order_by.return_value.first.return_value = None

        # -----------------------
        # Act
        # -----------------------
        helper_0003_cotype_picklist.create_cotype_splocalecontaineritem(mock_apps)

        # -----------------------
        # Assert
        # -----------------------
        mock_containeritem.objects.create.assert_called_once()
        mock_itemstr.objects.create.assert_called()
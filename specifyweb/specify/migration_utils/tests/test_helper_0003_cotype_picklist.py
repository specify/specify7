from django.test import TestCase
from unittest.mock import patch, MagicMock, Mock

from specifyweb.specify.migration_utils.migration_helpers import helper_0003_cotype_picklist


class Helper0003CotypePicklistTest(TestCase):

    @patch("specifyweb.specify.migration_utils.migration_helpers.helper_0003_cotype_picklist.Splocalecontainer")
    @patch("specifyweb.specify.migration_utils.migration_helpers.helper_0003_cotype_picklist.Splocalecontaineritem")
    @patch("specifyweb.specify.migration_utils.migration_helpers.helper_0003_cotype_picklist.Splocaleitemstr")
    def test_create_cotype_splocalecontaineritem_new(
        self,
        mock_itemstr,
        mock_containeritem,
        mock_container,
    ):
        # ------------------------
        # Setup container
        # ------------------------
        container = MagicMock()
        mock_container.objects.filter.return_value = [container]

        # No existing container item
        mock_containeritem.objects.filter.return_value.order_by.return_value.first.return_value = None

        created_item = MagicMock()
        mock_containeritem.objects.create.return_value = created_item

        # No existing strings
        mock_itemstr.objects.filter.return_value.order_by.return_value.first.return_value = None

        # ------------------------
        # Call
        # ------------------------
        helper_0003_cotype_picklist.create_cotype_splocalecontaineritem(mock_container._mock_new_parent)

        # ------------------------
        # Assertions
        # ------------------------
        mock_containeritem.objects.create.assert_called_once()

        self.assertTrue(mock_itemstr.objects.create.called)


    @patch("specifyweb.specify.migration_utils.migration_helpers.helper_0003_cotype_picklist.Splocalecontainer")
    @patch("specifyweb.specify.migration_utils.migration_helpers.helper_0003_cotype_picklist.Splocalecontaineritem")
    @patch("specifyweb.specify.migration_utils.migration_helpers.helper_0003_cotype_picklist.Splocaleitemstr")
    def test_create_cotype_splocalecontaineritem_existing(
        self,
        mock_itemstr,
        mock_containeritem,
        mock_container,
    ):
        container = MagicMock()
        mock_container.objects.filter.return_value = [container]

        existing_item = MagicMock()
        mock_containeritem.objects.filter.return_value.order_by.return_value.first.return_value = existing_item

        mock_itemstr.objects.filter.return_value.order_by.return_value.first.return_value = None

        helper_0003_cotype_picklist.create_cotype_splocalecontaineritem(mock_container._mock_new_parent)

        mock_containeritem.objects.create.assert_not_called()
        self.assertTrue(mock_itemstr.objects.create.called)
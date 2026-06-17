from django.test import TestCase
from unittest.mock import patch, MagicMock, Mock
from specifyweb.specify.migration_utils.migration_helpers import helper_0003_cotype_picklist

class Helper0003CotypePicklistTest(TestCase):
    @patch('specifyweb.specify.migration_utils.migration_helpers.helper_0003_cotype_picklist.apps')
    @patch('specifyweb.specify.migration_utils.migration_helpers.helper_0003_cotype_picklist.Splocalecontainer')
    @patch('specifyweb.specify.migration_utils.migration_helpers.helper_0003_cotype_picklist.Splocalecontaineritem')
    @patch('specifyweb.specify.migration_utils.migration_helpers.helper_0003_cotype_picklist.Splocaleitemstr')
    def setUp(self, mock_itemstr, mock_containeritem, mock_container, mock_apps):
        self.container = MagicMock()
        mock_container.objects.filter.return_value = [self.container]
        self.mock_apps = mock_apps
        self.mock_container = mock_container
        self.mock_containeritem = mock_containeritem
        self.mock_itemstr = mock_itemstr

    def test_create_cotype_splocalecontaineritem_new(self):
        # Test case when no existing container_item exists
        self.Splocalecontaineritem.objects.filter.return_value.order_by.return_value.first.return_value = None
        self.Splocaleitemstr.objects.filter.return_value.order_by.return_value.first.return_value = None

        helper_0003_cotype_picklist.create_cotype_splocalecontaineritem(self.mock_apps)

        # Verify container item was created with correct attributes
        self.mock_containeritem.objects.create.assert_called_once_with(
            name=helper_0003_cotype_picklist.COT_FIELD_NAME,
            container=self.container,
            picklistname=helper_0003_cotype_picklist.COT_PICKLIST_NAME,
            type="ManyToOne",
            isrequired=True
        )

        # Verify field label was created
        created_item = self.mock_containeritem.objects.create.return_value
        self.mock_itemstr.objects.create.assert_any_call(
            language="en",
            itemname=created_item,
            text=helper_0003_cotype_picklist.COT_TEXT
        )

        # Verify field description was created
        self.mock_itemstr.objects.create.assert_any_call(
            language="en",
            itemdesc=created_item,
            text=helper_0003_cotype_picklist.COT_TEXT
        )

    def test_create_cotype_splocalecontaineritem_existing(self):
        # Test case when container_item already exists
        existing_item = Mock()
        self.Splocalecontaineritem.objects.filter.return_value.order_by.return_value.first.return_value = existing_item
        self.Splocaleitemstr.objects.filter.return_value.order_by.return_value.first.return_value = None

        helper_0003_cotype_picklist.create_cotype_splocalecontaineritem(self.mock_apps)

        # Verify no new container item was created
        self.mock_containeritem.objects.create.assert_not_called()

        # Verify field label was created with existing item
        self.mock_itemstr.objects.create.assert_any_call(
            language="en",
            itemname=existing_item,
            text=helper_0003_cotype_picklist.COT_TEXT
        )

    def test_create_cotype_splocalecontaineritem_existing_labels(self):
        # Test case when both container_item and labels already exist
        existing_item = Mock()
        existing_label = Mock()
        existing_desc = Mock()
        
        self.Splocalecontaineritem.objects.filter.return_value.order_by.return_value.first.return_value = existing_item
        self.Splocaleitemstr.objects.filter.return_value.order_by.return_value.first.side_effect = [existing_label, existing_desc]

        helper_0003_cotype_picklist.create_cotype_splocalecontaineritem(self.mock_apps)

        # Verify no new items or labels were created
        self.mock_containeritem.objects.create.assert_not_called()
        self.mock_itemstr.objects.create.assert_not_called()

    def test_create_cotype_splocalecontaineritem_multiple_containers(self):
        # Test that function handles multiple containers
        container1 = Mock()
        container2 = Mock()
        self.Splocalecontainer.objects.filter.return_value = [container1, container2]

        helper_0003_cotype_picklist.create_cotype_splocalecontaineritem(self.mock_apps)

        # Verify called for each container
        self.assertEqual(self.mock_containeritem.objects.filter.call_count, 2)
        self.assertEqual(self.mock_itemstr.objects.filter.call_count, 4) # label and desc for each container


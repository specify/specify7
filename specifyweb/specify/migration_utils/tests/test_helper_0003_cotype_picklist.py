import unittest
from unittest.mock import Mock, patch
from specifyweb.specify.migration_utils.migration_helpers import helper_0003_cotype_picklist

class Helper0003CotypePicklistTest(unittest.TestCase):
    def setUp(self):
        self.apps = Mock()
        self.Splocalecontainer = Mock()
        self.Splocalecontaineritem = Mock()
        self.Splocaleitemstr = Mock()
        
        self.apps.get_model.side_effect = lambda model: {
            'specify.Splocalecontainer': self.Splocalecontainer,
            'specify.Splocalecontaineritem': self.Splocalecontaineritem,
            'specify.Splocaleitemstr': self.Splocaleitemstr
        }[model]

        self.container = Mock()
        self.Splocalecontainer.objects.filter.return_value = [self.container]

    def test_create_cotype_splocalecontaineritem_new(self):
        # Test case when no existing container_item exists
        self.Splocalecontaineritem.objects.filter.return_value.order_by.return_value.first.return_value = None
        self.Splocaleitemstr.objects.filter.return_value.order_by.return_value.first.return_value = None

        helper_0003_cotype_picklist.create_cotype_splocalecontaineritem(self.apps)

        # Verify container item was created with correct attributes
        self.Splocalecontaineritem.objects.create.assert_called_once_with(
            name=helper_0003_cotype_picklist.COT_FIELD_NAME,
            container=self.container,
            picklistname=helper_0003_cotype_picklist.COT_PICKLIST_NAME,
            type="ManyToOne",
            isrequired=True
        )

        # Verify field label was created
        created_item = self.Splocalecontaineritem.objects.create.return_value
        self.Splocaleitemstr.objects.create.assert_any_call(
            language="en",
            itemname=created_item,
            text=helper_0003_cotype_picklist.COT_TEXT
        )

        # Verify field description was created
        self.Splocaleitemstr.objects.create.assert_any_call(
            language="en",
            itemdesc=created_item,
            text=helper_0003_cotype_picklist.COT_TEXT
        )

    def test_create_cotype_splocalecontaineritem_existing(self):
        # Test case when container_item already exists
        existing_item = Mock()
        self.Splocalecontaineritem.objects.filter.return_value.order_by.return_value.first.return_value = existing_item
        self.Splocaleitemstr.objects.filter.return_value.order_by.return_value.first.return_value = None

        helper_0003_cotype_picklist.create_cotype_splocalecontaineritem(self.apps)

        # Verify no new container item was created
        self.Splocalecontaineritem.objects.create.assert_not_called()

        # Verify field label was created with existing item
        self.Splocaleitemstr.objects.create.assert_any_call(
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

        helper_0003_cotype_picklist.create_cotype_splocalecontaineritem(self.apps)

        # Verify no new items or labels were created
        self.Splocalecontaineritem.objects.create.assert_not_called()
        self.Splocaleitemstr.objects.create.assert_not_called()

    def test_create_cotype_splocalecontaineritem_multiple_containers(self):
        # Test that function handles multiple containers
        container1 = Mock()
        container2 = Mock()
        self.Splocalecontainer.objects.filter.return_value = [container1, container2]

        helper_0003_cotype_picklist.create_cotype_splocalecontaineritem(self.apps)

        # Verify called for each container
        self.assertEqual(self.Splocalecontaineritem.objects.filter.call_count, 2)
        self.assertEqual(self.Splocaleitemstr.objects.filter.call_count, 4) # label and desc for each container

if __name__ == '__main__':
    unittest.main()
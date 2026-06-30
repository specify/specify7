from unittest.mock import patch

from django.apps import apps

from specifyweb.specify.models import Splocalecontainer, Splocalecontaineritem, Splocaleitemstr
from specifyweb.specify.tests.test_api import ApiTests
from specifyweb.specify.migration_utils.migration_helpers import helper_0040_components


class ComponentMigrationTests(ApiTests):

    def setUp(self):
        super().setUp()

        self.component_container = Splocalecontainer.objects.create(
            name="component",
            schematype=0,
            discipline=self.discipline,
            aggregator="",
            defaultui="",
            format="",
            ishidden=False,
            issystem=False,
        )

        self.component_type_item = Splocalecontaineritem.objects.create(
            container=self.component_container,
            name="type",
            ishidden=False,
            issystem=False,
        )

        self.component_name_item = Splocalecontaineritem.objects.create(
            container=self.component_container,
            name="name",
            ishidden=False,
            issystem=False,
        )

        self.component_desc = Splocaleitemstr.objects.create(
            language="en",
            country="US",
            text="old-type-desc",
            itemdesc=self.component_type_item,
        )

        self.component_name = Splocaleitemstr.objects.create(
            language="en",
            country="US",
            text="old-type-name",
            itemname=self.component_type_item,
        )

        self.collectionobject_container = Splocalecontainer.objects.create(
            name="collectionobject",
            schematype=0,
            discipline=self.discipline,
            aggregator="",
            defaultui="",
            format="",
            ishidden=False,
            issystem=False,
        )

        self.component_parent_item = Splocalecontaineritem.objects.create(
            container=self.collectionobject_container,
            name="componentParent",
            ishidden=False,
            issystem=False,
        )

        self.components_item = Splocalecontaineritem.objects.create(
            container=self.collectionobject_container,
            name="components",
            ishidden=False,
            issystem=False,
        )

        self.removed_desc = Splocaleitemstr.objects.create(
            language="en",
            country="US",
            text="remove-desc",
            itemdesc=self.component_parent_item,
        )

        self.removed_name = Splocaleitemstr.objects.create(
            language="en",
            country="US",
            text="remove-name",
            itemname=self.components_item,
        )

        self.hidden_item = Splocalecontaineritem.objects.create(
            container=self.collectionobject_container,
            name="components",
            ishidden=False,
            issystem=False,
        )

        self.hidden_field = Splocalecontaineritem.objects.create(
            container=self.component_container,
            name="type",
            ishidden=True,
            issystem=False,
        )

    @patch(
        "specifyweb.specify.migration_utils.migration_helpers.helper_0040_components.update_table_schema_config_with_defaults"
    )
    @patch(
        "specifyweb.specify.migration_utils.migration_helpers.helper_0040_components.update_table_field_schema_config_with_defaults"
    )
    def test_create_table_schema_config_with_defaults(self, mock_field_update, mock_table_update):
        helper_0040_components.create_table_schema_config_with_defaults(apps)

        self.assertEqual(
            mock_table_update.call_count,
            len(helper_0040_components.MIGRATION_0040_TABLES),
        )

        expected_field_calls = (
            self.discipline.__class__.objects.count()
            * sum(
                len(fields)
                for fields in helper_0040_components.MIGRATION_0040_FIELDS.values()
            )
        )
        self.assertEqual(mock_field_update.call_count, expected_field_calls)

    def test_update_schema_config_field_desc_for_components(self):
        helper_0040_components.update_schema_config_field_desc_for_components(apps)

        self.component_desc.refresh_from_db()
        self.component_name.refresh_from_db()

        expected_desc = helper_0040_components.MIGRATION_0040_UPDATE_FIELDS["Component"][0][2]
        expected_name = helper_0040_components.MIGRATION_0040_UPDATE_FIELDS["Component"][0][1]

        self.assertEqual(self.component_desc.text, expected_desc)
        self.assertEqual(self.component_name.text, expected_name)

    def test_update_hidden_prop_for_components(self):
        helper_0040_components.update_hidden_prop_for_components(apps)

        self.hidden_item.refresh_from_db()
        self.assertTrue(self.hidden_item.ishidden)

    def test_create_cotype_splocalecontaineritem_for_components(self):
        self.component_type_item.picklistname = ""
        self.component_type_item.isrequired = False
        self.component_type_item.type = ""
        self.component_type_item.save()

        helper_0040_components.create_cotype_splocalecontaineritem_for_components(apps)

        self.component_type_item.refresh_from_db()
        self.assertEqual(self.component_type_item.picklistname, "CollectionObjectType")
        self.assertTrue(self.component_type_item.isrequired)
        self.assertEqual(self.component_type_item.type, "ManyToOne")

    def test_remove_0029_schema_config_fields(self):
        helper_0040_components.remove_0029_schema_config_fields(apps)

        self.assertFalse(
            Splocalecontaineritem.objects.filter(id=self.component_parent_item.id).exists()
        )
        self.assertFalse(
            Splocalecontaineritem.objects.filter(id=self.components_item.id).exists()
        )
        self.assertFalse(
            Splocaleitemstr.objects.filter(id=self.removed_desc.id).exists()
        )
        self.assertFalse(
            Splocaleitemstr.objects.filter(id=self.removed_name.id).exists()
        )

    @patch(
        "specifyweb.specify.migration_utils.migration_helpers.helper_0040_components.revert_table_schema_config"
    )
    @patch(
        "specifyweb.specify.migration_utils.migration_helpers.helper_0040_components.revert_table_field_schema_config"
    )
    def test_revert_table_schema_config_with_defaults(self, mock_revert_field, mock_revert_table):
        helper_0040_components.revert_table_schema_config_with_defaults(apps)

        self.assertEqual(
            mock_revert_table.call_count,
            len(helper_0040_components.MIGRATION_0040_TABLES),
        )
        self.assertEqual(
            mock_revert_field.call_count,
            sum(len(fields) for fields in helper_0040_components.MIGRATION_0040_FIELDS.values()),
        )

    def test_reverse_hide_component_fields(self):
        self.hidden_field.ishidden = True
        self.hidden_field.save()

        helper_0040_components.reverse_hide_component_fields(apps)

        self.hidden_field.refresh_from_db()
        self.assertFalse(self.hidden_field.ishidden)

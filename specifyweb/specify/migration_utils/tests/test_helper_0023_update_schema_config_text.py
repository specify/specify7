from unittest.mock import patch

from django.apps import apps

from specifyweb.specify.models import Splocalecontainer, Splocalecontaineritem, Splocaleitemstr
from specifyweb.specify.tests.test_api import ApiTests
from specifyweb.specify.migration_utils.migration_helpers import helper_0023_update_schema_config_text


class UpdateSchemaConfigTextTests(ApiTests):

    def setUp(self):
        super().setUp()

        self.container = Splocalecontainer.objects.create(
            name="collectionobjectgroup",
            schematype=0,
            discipline=self.discipline,
            aggregator="",
            defaultui="",
            format="",
            ishidden=False,
            issystem=False,
        )

        self.item = Splocalecontaineritem.objects.create(
            container=self.container,
            name="guid",
            ishidden=False,
            issystem=False,
        )

        self.desc = Splocaleitemstr.objects.create(
            language="en",
            country="US",
            text="old-desc",
            itemdesc=self.item,
        )

        self.name = Splocaleitemstr.objects.create(
            language="en",
            country="US",
            text="old-name",
            itemname=self.item,
        )

        self.absolute_container = Splocalecontainer.objects.create(
            name="absoluteage",
            schematype=0,
            discipline=self.discipline,
            aggregator="",
            defaultui="",
            format="",
            ishidden=False,
            issystem=False,
        )

        self.yesno2 = Splocalecontaineritem.objects.create(
            container=self.absolute_container,
            name="yesno2",
            ishidden=False,
            issystem=False,
        )
        self.date1 = Splocalecontaineritem.objects.create(
            container=self.absolute_container,
            name="date1",
            ishidden=True,
            issystem=False,
        )
        self.date2 = Splocalecontaineritem.objects.create(
            container=self.absolute_container,
            name="date2",
            ishidden=False,
            issystem=False,
        )

        self.duplicate_keep = Splocalecontaineritem.objects.create(
            container=self.absolute_container,
            name="dupfield",
            ishidden=False,
            issystem=False,
        )
        self.duplicate_delete = Splocalecontaineritem.objects.create(
            container=self.absolute_container,
            name="dupfield",
            ishidden=False,
            issystem=False,
        )

        self.duplicate_desc = Splocaleitemstr.objects.create(
            language="en",
            country="US",
            text="dup-desc",
            itemdesc=self.duplicate_delete,
        )
        self.duplicate_name = Splocaleitemstr.objects.create(
            language="en",
            country="US",
            text="dup-name",
            itemname=self.duplicate_delete,
        )

    def test_update_schema_config_field_desc(self):
        helper_0023_update_schema_config_text.update_schema_config_field_desc(apps)

        self.desc.refresh_from_db()
        self.name.refresh_from_db()
        self.assertEqual(self.desc.text, "GUID")
        self.assertEqual(self.name.text, "GUID")

    def test_reverse_update_schema_config_field_desc(self):
        helper_0023_update_schema_config_text.reverse_update_schema_config_field_desc(apps)

        self.desc.refresh_from_db()
        self.name.refresh_from_db()
        self.assertEqual(self.desc.text, "guid")
        self.assertEqual(self.name.text, "guid")

    @patch(
        "specifyweb.specify.migration_utils.migration_helpers.helper_0023_update_schema_config_text._schema_override_hidden_values_for_discipline"
    )
    @patch(
        "specifyweb.specify.migration_utils.migration_helpers.helper_0023_update_schema_config_text._fields_without_explicit_hidden_override"
    )
    def test_update_hidden_prop_hides_and_reconciles_duplicates(
        self,
        mock_fields_without_override,
        mock_schema_override,
    ):
        mock_schema_override.return_value = {
            "absoluteage": {
                "yesno2": True,
                "date1": False,
            }
        }
        mock_fields_without_override.return_value = ["date2"]

        helper_0023_update_schema_config_text.update_hidden_prop(apps)

        self.yesno2.refresh_from_db()
        self.date1.refresh_from_db()
        self.date2.refresh_from_db()

        self.assertTrue(self.yesno2.ishidden)
        self.assertFalse(self.date1.ishidden)
        self.assertTrue(self.date2.ishidden)

        self.assertEqual(
            Splocalecontaineritem.objects.filter(
                container=self.absolute_container,
                name="dupfield",
            ).count(),
            1,
        )

        self.duplicate_desc.refresh_from_db()
        self.duplicate_name.refresh_from_db()

        self.assertEqual(self.duplicate_desc.itemdesc_id, self.duplicate_keep.id)
        self.assertEqual(self.duplicate_name.itemname_id, self.duplicate_keep.id)

    @patch(
        "specifyweb.specify.migration_utils.migration_helpers.helper_0023_update_schema_config_text._fields_without_explicit_hidden_override"
    )
    def test_reverse_update_hidden_prop_unhides_fields(self, mock_fields_without_override):
        self.date2.ishidden = True
        self.date2.save()
        mock_fields_without_override.return_value = ["date2"]

        helper_0023_update_schema_config_text.reverse_update_hidden_prop(apps)

        self.date2.refresh_from_db()
        self.assertFalse(self.date2.ishidden)

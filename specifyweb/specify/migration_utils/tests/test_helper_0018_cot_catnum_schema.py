from django.apps import apps
from unittest.mock import MagicMock, patch

from specifyweb.specify.models import (
    Splocalecontainer,
    Splocalecontaineritem,
    Splocaleitemstr,
)
from specifyweb.specify.tests.test_api import ApiTests
from specifyweb.specify.migration_utils.migration_helpers import helper_0018_cot_catnum_schema


class AddCotCatnumToSchemaTests(ApiTests):

    def setUp(self):
        super().setUp()
        self.collectionobjecttype_container = Splocalecontainer.objects.create(
            name='collectionobjecttype',
            schematype=0,
            discipline=self.discipline,
            aggregator='',
            defaultui='',
            format='',
            ishidden=False,
            issystem=False,
        )

    @patch(
        "specifyweb.specify.migration_utils.migration_helpers.helper_0018_cot_catnum_schema.datamodel"
    )
    def test_add_cot_catnum_to_schema(self, mock_datamodel):
        field = MagicMock()
        field.name = "catalogNumberFormatName"
        field.type = "text"
        field.required = True

        table = MagicMock()
        table.get_field_strict.return_value = field

        mock_datamodel.get_table_strict.return_value = table

        helper_0018_cot_catnum_schema.add_cot_catnum_to_schema(apps)

        schema_item = Splocalecontaineritem.objects.get(
            container=self.collectionobjecttype_container,
            name="catalogNumberFormatName",
        )
        self.assertEqual(schema_item.version, 0)
        self.assertTrue(schema_item.isrequired)
        self.assertEqual(schema_item.type, "text")
        self.assertTrue(
            Splocaleitemstr.objects.filter(
                itemname=schema_item,
                text="Catalog Number Format Name",
            ).exists()
        )
        self.assertTrue(
            Splocaleitemstr.objects.filter(
                itemdesc=schema_item,
                text="Catalog Number Format Name",
            ).exists()
        )

    @patch(
        "specifyweb.specify.migration_utils.migration_helpers.helper_0018_cot_catnum_schema.datamodel"
    )
    def test_remove_cot_catnum_from_schema(self, mock_datamodel):
        field = MagicMock()
        field.name = "catalogNumberFormatName"
        field.type = "text"
        field.required = True

        table = MagicMock()
        table.get_field_strict.return_value = field

        mock_datamodel.get_table_strict.return_value = table

        schema_item = Splocalecontaineritem.objects.create(
            container=self.collectionobjecttype_container,
            name="catalogNumberFormatName",
            type="text",
            ishidden=False,
            issystem=False,
        )
        Splocaleitemstr.objects.create(
            language='en',
            country='US',
            text='Catalog Number Format Name',
            itemname=schema_item,
        )
        Splocaleitemstr.objects.create(
            language='en',
            country='US',
            text='Catalog Number Format Name',
            itemdesc=schema_item,
        )

        helper_0018_cot_catnum_schema.remove_cot_catnum_from_schema(apps)

        self.assertFalse(
            Splocalecontaineritem.objects.filter(id=schema_item.id).exists()
        )
        self.assertFalse(
            Splocaleitemstr.objects.filter(itemname=schema_item).exists()
        )
        self.assertFalse(
            Splocaleitemstr.objects.filter(itemdesc=schema_item).exists()
        )

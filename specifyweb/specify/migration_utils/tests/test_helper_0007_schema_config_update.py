from unittest.mock import patch

from django.apps import apps
from specifyweb.specify.models import (
    Collection,
    Picklist,
    Splocalecontainer,
    Splocalecontaineritem,
    Splocaleitemstr,
)
from specifyweb.specify.migration_utils.migration_helpers import helper_0007_schema_config_update
from specifyweb.specify.tests.test_api import ApiTests


class UpdateCogTypeFieldsTests(ApiTests):

    def setUp(self):
        super().setUp()
        self.cog_container = Splocalecontainer.objects.create(
            name="collectionobject",
            schematype=0,
            discipline=self.discipline,
            aggregator="",
            defaultui="",
            format="",
            ishidden=False,
            issystem=False,
        )
        self.cog_item = Splocalecontaineritem.objects.create(
            container=self.cog_container,
            name="collectionObjectType",
            ishidden=False,
            issystem=False,
        )
        self.cog_item_name = Splocaleitemstr.objects.create(
            language="en",
            country="US",
            text="old-type-name",
            itemname=self.cog_item,
        )
        self.cog_item_desc = Splocaleitemstr.objects.create(
            language="en",
            country="US",
            text="old-type-desc",
            itemdesc=self.cog_item,
        )

    @patch(
        "specifyweb.specify.migration_utils.migration_helpers.helper_0007_schema_config_update.revert_table_field_schema_config"
    )
    @patch(
        "specifyweb.specify.migration_utils.migration_helpers.helper_0007_schema_config_update.update_table_field_schema_config_with_defaults"
    )
    def test_update_cog_type_fields(
        self,
        mock_update,
        mock_revert,
    ):
        helper_0007_schema_config_update.update_cog_type_fields(apps)

        mock_revert.assert_any_call(
            "CollectionObjectGroup",
            "children",
            apps,
        )

        mock_revert.assert_any_call(
            "CollectionObjectGroup",
            "cojo",
            apps,
        )

        self.assertEqual(
            mock_update.call_count,
            sum(
                len(fields)
                for fields in helper_0007_schema_config_update.MIGRATION_0007_FIELDS.values()
            ),
        )

        self.assertFalse(
            Splocaleitemstr.objects.filter(
                id__in=[self.cog_item_name.id, self.cog_item_desc.id]
            ).exists()
        )
        self.assertFalse(
            Splocalecontaineritem.objects.filter(id=self.cog_item.id).exists()
        )


class CreateCogTypePicklistTests(ApiTests):

    def setUp(self):
        super().setUp()
        self.other_collection = Collection.objects.create(
            catalognumformatname='test',
            collectionname='OtherCollection',
            isembeddedcollectingevent=False,
            discipline=self.discipline,
        )

    def test_create_cogtype_picklist(self):
        helper_0007_schema_config_update.create_cogtype_picklist(apps)

        picklists = Picklist.objects.filter(
            name=helper_0007_schema_config_update.COG_PICKLIST_NAME,
            tablename="collectionobjectgrouptype",
            formatter="CollectionObjectGroupType",
            type=1,
        )
        self.assertEqual(
            picklists.count(),
            Collection.objects.all().count(),
        )


class RevertCogTypePicklistTests(ApiTests):

    def setUp(self):
        super().setUp()
        self.target_picklist = Picklist.objects.create(
            name=helper_0007_schema_config_update.COG_PICKLIST_NAME,
            type=1,
            tablename="collectionobjectgrouptype",
            formatter="CollectionObjectGroupType",
            collection=self.collection,
            issystem=False,
            readonly=False,
            sizelimit=-1,
            sorttype=1,
        )

    def test_revert_cogtype_picklist(self):
        helper_0007_schema_config_update.revert_cogtype_picklist(apps)

        self.assertFalse(
            Picklist.objects.filter(name=helper_0007_schema_config_update.COG_PICKLIST_NAME).exists()
        )


class UpdateCogTypeSplocaleContainerItemTests(ApiTests):

    def setUp(self):
        super().setUp()
        self.cog_container = Splocalecontainer.objects.create(
            name="collectionobjectgroup",
            schematype=0,
            discipline=self.discipline,
            aggregator="",
            defaultui="",
            format="",
            ishidden=False,
            issystem=False,
        )
        self.cog_type_item = Splocalecontaineritem.objects.create(
            container=self.cog_container,
            name=helper_0007_schema_config_update.COGTYPE_FIELD_NAME,
            picklistname=None,
            type="",
            isrequired=False,
            ishidden=False,
            issystem=False,
        )

    def test_update_cogtype_splocalecontaineritem(self):
        helper_0007_schema_config_update.update_cogtype_splocalecontaineritem(apps)

        self.cog_type_item.refresh_from_db()
        self.assertEqual(
            self.cog_type_item.picklistname,
            helper_0007_schema_config_update.COG_PICKLIST_NAME,
        )
        self.assertEqual(self.cog_type_item.type, "ManyToOne")
        self.assertTrue(self.cog_type_item.isrequired)


class UpdateSystemCogTypesPicklistTests(ApiTests):

    def setUp(self):
        super().setUp()
        self.system_picklist = Picklist.objects.create(
            name="Default Collection Object Group Types",
            type=1,
            tablename="collectionobjectgrouptype",
            formatter="foo",
            collection=self.collection,
            issystem=False,
            readonly=False,
            sizelimit=0,
            sorttype=1,
        )

    def test_update_systemcogtypes_picklist(self):
        helper_0007_schema_config_update.update_systemcogtypes_picklist(apps)

        self.system_picklist.refresh_from_db()
        self.assertEqual(
            self.system_picklist.name,
            helper_0007_schema_config_update.HISTORICAL_COGTYPES_PICKLIST,
        )
        self.assertEqual(self.system_picklist.type, 0)
        self.assertTrue(self.system_picklist.issystem)
        self.assertTrue(self.system_picklist.readonly)
        self.assertEqual(self.system_picklist.sizelimit, 3)
        self.assertIsNone(self.system_picklist.tablename)

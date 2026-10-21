from django.apps import apps

from specifyweb.specify.models import (
    Collection,
    Picklist,
    Splocalecontainer,
    Splocalecontaineritem,
    Splocaleitemstr,
)
from specifyweb.specify.tests.test_api import ApiTests
from specifyweb.specify.migration_utils.migration_helpers import helper_0003_cotype_picklist


class Helper0003CotypePicklistTest(ApiTests):

    def setUp(self):
        super().setUp()
        self.other_collection = Collection.objects.create(
            catalognumformatname='test2',
            collectionname='OtherCollection',
            isembeddedcollectingevent=False,
            discipline=self.discipline,
        )
        self.collectionobject_container = Splocalecontainer.objects.create(
            name='collectionobject',
            schematype=0,
            discipline=self.discipline,
            aggregator='',
            defaultui='',
            format='',
            ishidden=False,
            issystem=False,
        )

    def test_create_cotype_picklist_creates_picklists_for_each_collection(self):
        helper_0003_cotype_picklist.create_cotype_picklist(apps)

        self.assertEqual(
            Picklist.objects.filter(
                name=helper_0003_cotype_picklist.COT_PICKLIST_NAME,
                tablename='collectionobjecttype',
                type=1,
            ).count(),
            Collection.objects.count(),
        )

    def test_create_cotype_splocalecontaineritem_creates_schema_items_and_strings(self):
        helper_0003_cotype_picklist.create_cotype_splocalecontaineritem(apps)

        schema_item = Splocalecontaineritem.objects.get(
            container=self.collectionobject_container,
            name=helper_0003_cotype_picklist.COT_FIELD_NAME,
        )
        self.assertEqual(
            schema_item.picklistname,
            helper_0003_cotype_picklist.COT_PICKLIST_NAME,
        )
        self.assertEqual(schema_item.type, 'ManyToOne')
        self.assertTrue(schema_item.isrequired)
        self.assertTrue(
            Splocaleitemstr.objects.filter(
                itemname=schema_item,
                text=helper_0003_cotype_picklist.COT_TEXT,
            ).exists()
        )
        self.assertTrue(
            Splocaleitemstr.objects.filter(
                itemdesc=schema_item,
                text=helper_0003_cotype_picklist.COT_TEXT,
            ).exists()
        )

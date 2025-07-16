from specifyweb.specify.models import Collection, Splocalecontainer, Splocalecontaineritem, Picklist, Picklistitem
from specifyweb.specify.tests.test_api import ApiTests
from specifyweb.specify.utils import get_picklists


class TestGetPicklists(ApiTests):
    def setUp(self):
        super().setUp()
        Splocalecontaineritem.objects.all().delete()
        Splocalecontainer.objects.all().delete()
        Picklistitem.objects.all().delete()
        Picklist.objects.all().delete()

        container = Splocalecontainer.objects.create(
            discipline=self.discipline,
            schematype=0,
            name="collectionobject",
        )
        schemaitem = Splocalecontaineritem.objects.create(
            container=container,
            name="text1",
            picklistname="COText1Picklist"
        )
        self.container = container
        self.schemaitem = schemaitem
    
    def _create_picklist(self, name, collection,picklists=None):
        picklist = Picklist.objects.create(
            collection=collection,
            issystem=False,
            name=name,
            readonly=False,
            type=0
        )
        if picklists is not None:
            picklists.append(picklist)
        return picklist
    
    def _validate_picklist(self, picklists, schemaitem_found, expected_picklist):
        self.assertEqual(picklists.count(), 1)
        self.assertEqual(picklists.first().id, expected_picklist.id)
        self.assertEqual(schemaitem_found.id, self.schemaitem.id)

    def test_unique_picklist(self):
        picklist = self._create_picklist(
            "COText1Picklist",
            self.collection
        )
        picklists, schemaitem_found = get_picklists(self.collection, "Collectionobject", "text1")
        self._validate_picklist(picklists, schemaitem_found, picklist)


    def test_duplicated_picklist_across_collections(self):
        new_collection = Collection.objects.create(
            collectionname="TestCollection2",
            isembeddedcollectingevent=False,
            discipline=self.discipline
        )

        initial_collection_picklist = self._create_picklist(
            "COText1Picklist",
            self.collection
        )

        other_collection_picklist = self._create_picklist(
            "COText1Picklist",
            new_collection
        )

        picklists, schemaitem_found = get_picklists(self.collection, "Collectionobject", "text1")

        self._validate_picklist(picklists, schemaitem_found, initial_collection_picklist)

        other_picklists, other_schemaitem_found = get_picklists(new_collection, "Collectionobject", "text1")

        self._validate_picklist(other_picklists, other_schemaitem_found, other_collection_picklist)

    def test_no_schemaitem(self):
        picklists, schemaitem_found = get_picklists(self.collection, "Collectingevent", "text1")
        self.assertIsNone(picklists)
        self.assertEqual(schemaitem_found.count(), 0)

    def test_no_picklist(self):
        picklists, schemaitem_found = get_picklists(self.collection, "Collectionobject", "text1")
        self.assertEqual(picklists.count(), 0)
        self.assertEqual(schemaitem_found.id, self.schemaitem.id)
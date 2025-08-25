from specifyweb.backend.datamodel.models import Storagetreedef, Preparation
from specifyweb.specify.tests.test_trees import GeographyTree
from specifyweb.specify.tree_extras import bulk_move


class TestBulkMove(GeographyTree):
    
    def setUp(self):
        super().setUp()
        self.storage_tree_def = Storagetreedef.objects.create(
            name="Test storage tree"
        )
        self._update(self.institution, dict(storagetreedef=self.storage_tree_def))
        self.storage_tree_def.treedefitems.create(name="Root", rankid=0)
        self.storage_tree_def.treedefitems.create(name="Building", rankid=50)
        self.storage_tree_def.treedefitems.create(name="Room", rankid=100)

        self.root = self.make_storagetree("Root", "Root")
        self.building_1 = self.make_storagetree("Building 1", "Building", parent=self.root)
        self.room_1 = self.make_storagetree("Room 1", "Room", parent=self.building_1)

        self.building_2 = self.make_storagetree("Building 2", "Building", parent=self.root)
        self.room_2 = self.make_storagetree("Room 2", "Room", parent=self.building_2)
        self.room_3 = self.make_storagetree("Room 3", "Room", parent=self.building_2)

        self._create_prep_type()

    def test_different_type(self):
        with self.assertRaises(AssertionError) as context:
            bulk_move(self.room_1, self.kansas, self.agent)

        self.assertEqual(context.exception.args[1]['operation'], "bulk_move")
        self.assertEqual(context.exception.args[1]['localizationKey'], "invalidNodeType")

    def test_different_definition(self):
        
        storage_tree_def_2 = Storagetreedef.objects.create(
            name="Test storage tree 2"
        )

        storage_tree_def_2.treedefitems.create(name="Root 2", rankid=0)
        storage_tree_def_2.treedefitems.create(name="Building 2", rankid=50)

        root_2 = self.make_storagetree("Root", "Root 2")
        building_2_def = self.make_storagetree("Building 2", "Building 2", parent=root_2)

        with self.assertRaises(AssertionError) as context:
            bulk_move(self.building_1, building_2_def, self.agent)

        self.assertEqual(context.exception.args[1]['operation'], "bulk move")
        self.assertEqual(context.exception.args[1]['localizationKey'], "operationAcrossTrees")

    def test_preparation_move(self):

        prep_1 = self._create_prep(self.collectionobjects[0], None, storage=self.room_1)
        prep_2 = self._create_prep(self.collectionobjects[0], None, storage=self.room_1)
        prep_3 = self._create_prep(self.collectionobjects[1], None, storage=self.room_1)
        prep_4 = self._create_prep(self.collectionobjects[1], None, storage=self.room_1)

        prep_5 = self._create_prep(self.collectionobjects[2], None, storage=self.room_2)
        prep_6 = self._create_prep(self.collectionobjects[2], None, storage=self.room_2)

        prep_7 = self._create_prep(self.collectionobjects[2], None, storage=self.room_3)
        prep_8 = self._create_prep(self.collectionobjects[2], None, storage=self.room_3)

        bulk_move(self.room_1, self.room_2, self.agent)

        prep_1.refresh_from_db()
        prep_2.refresh_from_db()
        prep_3.refresh_from_db()
        prep_4.refresh_from_db()
        prep_5.refresh_from_db()
        prep_6.refresh_from_db()
        prep_7.refresh_from_db()
        prep_8.refresh_from_db()

        self.assertEqual(prep_1.storage_id, self.room_2.id)
        self.assertEqual(prep_2.storage_id, self.room_2.id)
        self.assertEqual(prep_3.storage_id, self.room_2.id)
        self.assertEqual(prep_4.storage_id, self.room_2.id)


        self.assertEqual(prep_5.storage_id, self.room_2.id)
        self.assertEqual(prep_6.storage_id, self.room_2.id)

        self.assertEqual(prep_7.storage_id, self.room_3.id)
        self.assertEqual(prep_8.storage_id, self.room_3.id)

        self.assertEqual(Preparation.objects.filter(storage_id=self.room_1.id).count(), 0)
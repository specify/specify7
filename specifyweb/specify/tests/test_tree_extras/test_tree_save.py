from specifyweb.backend.businessrules.exceptions import TreeBusinessRuleException
from specifyweb.backend.datamodel.models import Taxon, Taxontreedefitem
from specifyweb.specify.tests.test_trees import GeographyTree

from unittest import skip
from unittest.mock import Mock, patch

class TestTreeSave(GeographyTree):


    def setUp(self):
        super().setUp()

    def _create_life(self):
        root = Taxon.objects.create(
            definition=self.taxontreedef,
            definitionitem=self.taxon_root,
            name="Life",
            fullname="Life"
        )
        root.refresh_from_db()
        return root
    
    def _get_taxon_def_item(self, rank_name):
        return Taxontreedefitem.objects.get(name=rank_name)
    
    def test_creating_root(self):
        root = self._create_life()
        self.assertIsNone(root.parent_id)
        self.assertEqual(root.rankid, self.taxon_root.rankid)
    
    def test_creating_node(self):
        root = self._create_life()

        kingdom = self.make_taxontree("Animalia", "Kingdom", parent=root)
        kingdom.refresh_from_db()

        self.assertEqual(kingdom.parent_id, root.id)
        self.assertEqual(kingdom.fullname, "Animalia")
        self.assertEqual(kingdom.rankid, self.taxon_kingdom.rankid)

    def test_fullname_on_creation(self):
        root = self._create_life()

        animalia = self.make_taxontree("Animalia", "Kingdom", parent=root)
        animalia.refresh_from_db()

        self._update(self.taxon_kingdom, dict(isinfullname=True))
        self._update(self._get_taxon_def_item("Phylum"), dict(isinfullname=True))

        test_phylum = self.make_taxontree("TestPhylum", "Phylum", parent=animalia)

        test_phylum.refresh_from_db()

        self.assertEqual(test_phylum.parent_id, animalia.id)
        self.assertEqual(test_phylum.rankid, self._get_taxon_def_item("Phylum").rankid)

        self.assertEqual(test_phylum.fullname, "AnimaliaTestPhylum")

    def test_moving_node(self):
        root = self._create_life()
        animalia = self.make_taxontree("Animalia", "Kingdom", parent=root)
        plantae = self.make_taxontree("Plantae", "Kingdom", parent=root)

        phylum_rank = self._get_taxon_def_item("Phylum")

        self._update(self.taxon_kingdom, dict(isinfullname=True))
        self._update(phylum_rank, dict(isinfullname=True))

        test_phylum = self.make_taxontree("TestPhylum", "Phylum", parent=animalia)
        test_phylum.refresh_from_db()

        self.assertEqual(test_phylum.fullname, "AnimaliaTestPhylum")
        test_phylum.parent_id = plantae.id
        test_phylum.save()
        test_phylum.refresh_from_db()
        self.assertEqual(test_phylum.fullname, "PlantaeTestPhylum")

    def _create_tree_structure(self):

        self._node_list = []
        root = self._create_life()
        animalia = self.make_taxontree("Animalia", "Kingdom", parent=root)
        plantae = self.make_taxontree("Plantae", "Kingdom", parent=root)

        phylum_rank = self._get_taxon_def_item("Phylum")
        class_rank = self._get_taxon_def_item("Class")

        self._update(self.taxon_kingdom, dict(isinfullname=True))
        self._update(phylum_rank, dict(isinfullname=True))
        self._update(class_rank, dict(isinfullname=True))

        test_phylum = self.make_taxontree("TestPhylum", "Phylum", parent=animalia)
        test_class_1 = self.make_taxontree("TestClass1", "Class", parent=test_phylum)
        test_class_2 = self.make_taxontree("TestClass2", "Class", parent=test_phylum)

        test_phylum_plantae = self.make_taxontree("TestPhylumPlantae", "Phylum", parent=plantae)

        test_plantae_class_1 = self.make_taxontree("TestClassPlantae_1", "Class", parent=test_phylum_plantae)
        test_plantae_class_2 = self.make_taxontree("TestClassPlantae_2", "Class", parent=test_phylum_plantae)

        return tuple(self._node_list)

    def test_renaming_node_resets_name_of_children(self):

        (animalia, plantae, test_phylum, test_class_1, test_class_2, test_phylum_plantae, test_plantae_class_1, test_plantae_class_2) = self._create_tree_structure()
        for node in self._node_list:
            node.refresh_from_db()
        
        expected_fullnames = [
            (test_phylum, "AnimaliaTestPhylum"),
            (test_class_1, "AnimaliaTestPhylumTestClass1"),
            (test_class_2, "AnimaliaTestPhylumTestClass2"),
            (test_phylum_plantae, "PlantaeTestPhylumPlantae"),
            (test_plantae_class_1, "PlantaeTestPhylumPlantaeTestClassPlantae_1"),
            (test_plantae_class_2, "PlantaeTestPhylumPlantaeTestClassPlantae_2")
        ]

        for (node, expected_fullname) in expected_fullnames:
            self.assertEqual(node.fullname, expected_fullname)

        animalia.name = "AnimaliaChanged"
        animalia.save()

        for node in self._node_list:
            node.refresh_from_db()

        expected_fullnames_post_change = [
            (test_phylum, "AnimaliaChangedTestPhylum"),
            (test_class_1, "AnimaliaChangedTestPhylumTestClass1"),
            (test_class_2, "AnimaliaChangedTestPhylumTestClass2"),
            (test_phylum_plantae, "PlantaeTestPhylumPlantae"),
            (test_plantae_class_1, "PlantaeTestPhylumPlantaeTestClassPlantae_1"),
            (test_plantae_class_2, "PlantaeTestPhylumPlantaeTestClassPlantae_2")
        ]

        for (node, expected_fullname) in expected_fullnames_post_change:
            self.assertEqual(node.fullname, expected_fullname)
    
    def test_save_skip_extras(self):
        (animalia, plantae, test_phylum, test_class_1, test_class_2, test_phylum_plantae, test_plantae_class_1, test_plantae_class_2) = self._create_tree_structure()
        for node in self._node_list:
            node.refresh_from_db()
        
        expected_fullnames = [
            (test_phylum, "AnimaliaTestPhylum"),
            (test_class_1, "AnimaliaTestPhylumTestClass1"),
            (test_class_2, "AnimaliaTestPhylumTestClass2"),
            (test_phylum_plantae, "PlantaeTestPhylumPlantae"),
            (test_plantae_class_1, "PlantaeTestPhylumPlantaeTestClassPlantae_1"),
            (test_plantae_class_2, "PlantaeTestPhylumPlantaeTestClassPlantae_2")
        ]

        for (node, expected_fullname) in expected_fullnames:
            self.assertEqual(node.fullname, expected_fullname)

        animalia.name = "AnimaliaChanged"
        animalia.save(skip_tree_extras=True)


        for (node, expected_fullname) in expected_fullnames:
            node.refresh_from_db()
            self.assertEqual(node.fullname, expected_fullname)
    
    def test_parent_rank_greater_error(self):
        root = self._create_life()
        animalia = self.make_taxontree("Animalia", "Kingdom", parent=root)
        phylum = self.make_taxontree("Phylum", "Phylum", parent=animalia)

        # It's otherwise tricky to raise the corresponding business rule exception
        # Since there is also validate node numbering
        Taxon.objects.filter(id=animalia.id).update(rankid=phylum.rankid+1)

        phylum.refresh_from_db()
        phylum.text1 = "Some change"
        
        with self.assertRaises(TreeBusinessRuleException) as context:
            phylum.save()

        self.assertEqual(context.exception.args[0], "Tree node's parent has rank greater than itself")
        self.assertEqual(context.exception.args[1]['localizationKey'], "nodeParentInvalidRank")

    def test_rank_greater_than_children_error(self):
        root = self._create_life()
        animalia = self.make_taxontree("Animalia", "Kingdom", parent=root)
        phylum = self.make_taxontree("Phylum", "Phylum", parent=animalia)

        Taxon.objects.filter(id=phylum.id).update(rankid=animalia.rankid-1)

        animalia.refresh_from_db()
        animalia.text1 = "Some change"

        with self.assertRaises(TreeBusinessRuleException) as context:
            animalia.save()

        self.assertEqual(context.exception.args[0], "Tree node's rank is greater than or equal to some of its children")
        self.assertEqual(context.exception.args[1]['localizationKey'], "nodeChildrenInvalidRank")

    def test_move_node_synonymized_parent(self):
        root = self._create_life()
        animalia = self.make_taxontree("Animalia", "Kingdom", parent=root)
        plantae = self.make_taxontree("Plantae", "Kingdom", parent=root)

        test_phylum = self.make_taxontree("TestPhylum", "Phylum", parent=animalia)
        test_phylum.refresh_from_db()

        plantae.accepted_id = animalia.id
        plantae.save()

        test_phylum.parent_id = plantae.id

        with self.assertRaises(TreeBusinessRuleException) as context:
            test_phylum.save()
        
        self.assertEqual(context.exception.args[1]['localizationKey'], "nodeOperationToSynonymizedParent")
    
    @skip("This should raise a business rule exception, but the code has an unrelated bug that raises a different exception")
    def test_add_node_synonymized_parent(self):

        root = self._create_life()
        animalia = self.make_taxontree("Animalia", "Kingdom", parent=root)
        plantae = self.make_taxontree("Plantae", "Kingdom", parent=root)

        animalia.accepted_id = plantae.id
        animalia.save()

        test_phylum = self.make_taxontree("TestPhylum", "Phylum", parent=animalia)

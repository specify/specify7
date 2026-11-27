from specifyweb.backend.businessrules.exceptions import TreeBusinessRuleException
from specifyweb.backend.trees.extras import moving_node, renumber_tree, validate_tree_numbering
from specifyweb.specify.models import Taxon, Taxontreedef, Taxontreedefitem
from specifyweb.backend.trees.tests.test_trees import GeographyTree

import random
from unittest import skip
from unittest.mock import Mock, patch

from django.db import connection
from django.db.models import F, Q
from django.test import skipUnlessDBFeature

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

    def test_adding_and_moving_validate_the_persisted_parent_definition(self):
        root = self._create_life()
        other_definition = Taxontreedef.objects.create(name="Other taxonomy")
        animalia = self.make_taxontree("Animalia", "Kingdom", parent=root)
        plantae = self.make_taxontree("Plantae", "Kingdom", parent=root)

        animalia.definition = other_definition
        phylum = self.make_taxontree("TestPhylum", "Phylum", parent=animalia)
        self.assertEqual(phylum.parent_id, animalia.id)

        plantae.definition = other_definition
        phylum.parent = plantae
        phylum.save()
        phylum.refresh_from_db()
        self.assertEqual(phylum.parent_id, plantae.id)

    def test_move_endpoint_rolls_back_rejected_cross_definition_move(self):
        root = self._create_life()
        animalia = self.make_taxontree("Animalia", "Kingdom", parent=root)
        plantae = self.make_taxontree("Plantae", "Kingdom", parent=root)
        phylum = self.make_taxontree("TestPhylum", "Phylum", parent=animalia)
        other_definition = Taxontreedef.objects.create(name="Other taxonomy")
        other_rank = other_definition.treedefitems.create(name="Other root", rankid=0)
        foreign_root = Taxon.objects.create(name="Other life", definitionitem=other_rank)
        original_text = phylum.text1

        def move_with_partial_write(node):
            Taxon.objects.filter(pk=node.pk).update(text1="Partial move")
            return moving_node(node)

        self.client.force_login(self.specifyuser)
        self.client.cookies["collection"] = self.collection.id
        url = f"/trees/specify_tree/taxon/{phylum.pk}/move/"
        with patch(
            "specifyweb.backend.trees.extras.moving_node", side_effect=move_with_partial_write,
        ):
            response = self.client.post(url, {"target": foreign_root.pk})
        self.assertEqual(response.status_code, 200, response.content)
        self.assertIs(response.json()["success"], False)
        self.assertIn("different tree definition", response.json()["error"])
        phylum.refresh_from_db()
        self.assertEqual(phylum.parent_id, animalia.pk)
        self.assertEqual(phylum.text1, original_text)

        response = self.client.post(url, {"target": plantae.pk})
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.json(), {"success": True})
        phylum.refresh_from_db()
        self.assertEqual(phylum.parent_id, plantae.pk)

    def test_unchanged_cross_definition_link_allows_unrelated_edits(self):
        root = self._create_life()
        kingdom = self.make_taxontree("Animalia", "Kingdom", parent=root)
        other_definition = Taxontreedef.objects.create(name="Other taxonomy")
        Taxon.objects.filter(pk=root.pk).update(definition=other_definition)
        kingdom.refresh_from_db()

        kingdom.text1 = "Updated description"
        kingdom.save()
        kingdom.refresh_from_db()
        self.assertEqual(kingdom.text1, "Updated description")
        self.assertEqual(kingdom.parent_id, root.id)
        self.assertEqual(kingdom.definition_id, self.taxontreedef.id)

    def test_changing_definition_checks_the_unchanged_parent_in_database(self):
        root = self._create_life()
        kingdom = self.make_taxontree("Animalia", "Kingdom", parent=root)
        other_definition = Taxontreedef.objects.create(name="Other taxonomy")
        other_definition.treedefitems.create(name="Other root", rankid=0)
        kingdom.definitionitem = other_definition.treedefitems.create(
            name="Other kingdom", rankid=10,
        )
        root.definition = other_definition

        with self.assertRaises(TreeBusinessRuleException) as context:
            kingdom.save()

        self.assertEqual(context.exception.args[1]['localizationKey'], "operationAcrossTrees")
        kingdom.refresh_from_db()
        self.assertEqual(kingdom.definition_id, self.taxontreedef.id)

    def test_saving_new_or_changed_accepted_link_checks_target_definition(self):
        root = self._create_life()
        first_target = self.make_taxontree("Animalia", "Kingdom", parent=root)
        second_target = self.make_taxontree("Plantae", "Kingdom", parent=root)
        other_definition = Taxontreedef.objects.create(name="Other taxonomy")
        other_rank = other_definition.treedefitems.create(name="Other root", rankid=0)
        foreign_target = Taxon.objects.create(name="Other life", definitionitem=other_rank)
        foreign_target.definition = self.taxontreedef

        with self.assertRaises(TreeBusinessRuleException) as context:
            Taxon.objects.create(
                name="Synonym root", definitionitem=self.taxon_root, acceptedtaxon=foreign_target,
            )
        self.assertEqual(context.exception.args[1]['localizationKey'], "operationAcrossTrees")

        synonym = Taxon(name="Synonym", definitionitem=self.taxon_kingdom, parent=root)
        synonym.acceptedtaxon = foreign_target
        with self.assertRaises(TreeBusinessRuleException) as context:
            synonym.save()
        self.assertEqual(context.exception.args[1]['localizationKey'], "operationAcrossTrees")
        self.assertIsNone(synonym.pk)

        synonym.acceptedtaxon = first_target
        synonym.save()
        synonym.refresh_from_db()
        self.assertEqual(synonym.accepted_id, first_target.pk)

        synonym.acceptedtaxon = foreign_target
        with self.assertRaises(TreeBusinessRuleException) as context:
            synonym.save()
        self.assertEqual(context.exception.args[1]['localizationKey'], "operationAcrossTrees")
        synonym.refresh_from_db()
        self.assertEqual(synonym.accepted_id, first_target.pk)

        synonym.acceptedtaxon = second_target
        synonym.save()
        synonym.refresh_from_db()
        self.assertEqual(synonym.accepted_id, second_target.pk)

    @skipUnlessDBFeature("has_select_for_update")
    def test_inserting_synonym_locks_parent_then_accepted_target_before_updating_intervals(self):
        root = self._create_life()
        accepted = self.make_taxontree("Animalia", "Kingdom", parent=root)
        operations = []

        def record_tree_operations(execute, sql, params, many, context):
            if '`taxon`' in sql:
                if sql.endswith("FOR UPDATE"):
                    operations.append(("lock", params[0]))
                elif sql.startswith("UPDATE"):
                    operations.append(("update", None))
            return execute(sql, params, many, context)

        with connection.execute_wrapper(record_tree_operations):
            Taxon.objects.create(
                name="Synonym", definitionitem=self.taxon_kingdom, parent=root, acceptedtaxon=accepted,
            )

        self.assertEqual(operations[:3], [("lock", root.pk), ("lock", accepted.pk), ("update", None)])

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

    def test_renumbering_tree(self):
        # Create a branching taxon tree to be renumbered
        (
            animalia,
            plantae,
            test_phylum,
            test_class_1,
            test_class_2,
            test_phylum_plantae,
            test_plantae_class_1,
            test_plantae_class_2,
        ) = self._create_tree_structure()


        extra_phylum_animalia = self.make_taxontree("ExtraPhylumAnimalia", "Phylum", parent=animalia)

        extra_order = self.make_taxontree("TestOrder1", "Order", parent=test_class_1)
        extra_family = self.make_taxontree("TestFamily1", "Family", parent=extra_order)
        extra_genus = self.make_taxontree("TestGenus1", "Genus", parent=extra_family)
        extra_species = self.make_taxontree("TestSpecies1", "Species", parent=extra_genus)

        plantae_order = self.make_taxontree("PlantaeOrder1", "Order", parent=test_plantae_class_1)
        plantae_family = self.make_taxontree("PlantaeFamily1", "Family", parent=plantae_order)
        plantae_genus = self.make_taxontree("PlantaeGenus1", "Genus", parent=plantae_family)
        plantae_species = self.make_taxontree("PlantaeSpecies1", "Species", parent=plantae_genus)

        if hasattr(self, "_node_list"):
            self._node_list.extend([
                extra_phylum_animalia,
                extra_order, extra_family, extra_genus, extra_species,
                plantae_order, plantae_family, plantae_genus, plantae_species,
            ])

        # Refresh values from DB before renumbering
        for node in self._node_list:
            node.refresh_from_db()

        # Randomly shuffle the existing node numbers
        all_taxa = list(Taxon.objects.all())
        count = len(all_taxa)
        nodenums = list(range(1, count + 1))
        random.shuffle(nodenums)
        highnums = list(range(1, count + 1))
        random.shuffle(highnums)

        # Assign each taxon a unique random nodenumber and highestchildnodenumber
        for t, nn, hcnn in zip(all_taxa, nodenums, highnums):
            t.nodenumber = nn
            t.highestchildnodenumber = hcnn

        Taxon.objects.bulk_update(all_taxa, ["nodenumber", "highestchildnodenumber"])

        table = 'taxon'
        renumber_tree(table)

        # Test that the node numbers in the tree are correct
        # NOTE: Using validate_tree_numbering now instead, but keeping query here for future reference and testing
        bad_node_number_count = (
            Taxon.objects
            .filter(parent__isnull=False)
            .filter(
                nodenumber__isnull=False,
                parent__nodenumber__isnull=False,
                parent__highestchildnodenumber__isnull=False,
            )
            .filter(
                Q(nodenumber__lt=F('parent__nodenumber')) |
                Q(nodenumber__gt=F('parent__highestchildnodenumber'))
            )
            .count()
        )

        # self.assertEqual(bad_node_number_count, 0)
        validate_tree_numbering('taxon')

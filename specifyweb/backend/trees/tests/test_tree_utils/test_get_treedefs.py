import unittest

from specifyweb.specify.models import Collectionobjecttype, Discipline, Taxontreedef, Geographytreedefitem, Taxontreedefitem
from specifyweb.backend.trees.tests.test_tree_utils import TestMultipleTaxonTreeContext
from specifyweb.backend.trees.tests.test_trees import GeographyTree
from specifyweb.backend.trees.utils import get_tree_defs_in_collection


class TestGetTreedefs(TestMultipleTaxonTreeContext, GeographyTree):
    
    def test_geography(self):
        geo_ranks = list(Geographytreedefitem.objects
            .filter(definition=self.geographytreedef)
            .order_by("rankid")
            .values_list("name", flat=True))
        tree_info = get_tree_defs_in_collection(
            collection=self.collection,
            tree_name="Geography"
        )

        self.assertEqual(len(tree_info), 1)
        resolved_ranks = [rank['name'] for rank in tree_info[0]['ranks']]
        self.assertEqual(geo_ranks, resolved_ranks)

    def test_taxon(self):
        # The setup environment is incorrect, so need to delete one of the trees.
        self._update(self.discipline, dict(taxontreedef=self.taxontreedef))
        Taxontreedef.objects.exclude(id=self.taxontreedef.id).delete()
        taxa_ranks = list(Taxontreedefitem.objects
            .filter(definition=self.taxontreedef)
            .order_by("rankid")
            .values_list("name", flat=True))

        tree_info = get_tree_defs_in_collection(
            collection=self.collection,
            tree_name="Taxon"
        )
        self.assertEqual(len(tree_info), 1)
        resolved_ranks = [rank['name'] for rank in tree_info[0]['ranks']]
        self.assertEqual(taxa_ranks, resolved_ranks)


    @unittest.skip("No longer raises AssertionError. See #8670")
    def test_no_taxon_case(self):
        # Because self._update will trigger business rules
        Discipline.objects.filter(id=self.discipline.id).update(taxontreedef_id=None)
        Taxontreedef.objects.exclude(id=self.taxontreedef.id).delete()
        Collectionobjecttype.objects.all().delete()
        with self.assertRaises(AssertionError) as context:
            # get_treedefs(self.collection, "Taxon")
            ...
        
        self.assertIn("No definition to query on", str(context.exception))

    def test_multiple_taxon_case(self):
        (collection_2, taxontreedef_1, taxontreedef_2) = self._create_multiple_taxon()
        self.make_taxon_ranks(taxontreedef_1)
        self.make_taxon_ranks(taxontreedef_2)
        taxontreedef_2.treedefitems.create(name="Variety", rankid=250)
        taxontreedef_2.treedefitems.create(name="Subvariety", rankid=270)

        expected_ranks = [
            list(Taxontreedefitem.objects
                .filter(definition=treedef)
                .order_by("rankid")
                .values_list("name", flat=True))
            for treedef in (taxontreedef_1, taxontreedef_2)
        ]

        # Both a tree present through a collection object type and a tree
        # scoped directly to the discipline must be returned.
        for same_discipline in (False, True):
            with self.subTest(same_discipline=same_discipline):
                if same_discipline:
                    self._update(taxontreedef_1, dict(discipline=collection_2.discipline))
                    # We're deleting the COT here so the trees don't get
                    # scoped by COT by get_tree_defs_in_collection
                    Collectionobjecttype.objects.filter(
                        collection=collection_2, taxontreedef=taxontreedef_1
                    ).delete()

                tree_info = get_tree_defs_in_collection(collection_2, "Taxon")

                # Tree order is unspecified; ranks within each tree are ordered.
                self.assertCountEqual(
                    [[rank["name"] for rank in tree["ranks"]] for tree in tree_info],
                    expected_ranks,
                )

    def test_multiple_taxon_case_excludes_other_disciplines(self):
        (_, taxontreedef_1, taxontreedef_2) = self._create_multiple_taxon()
        self.make_taxon_ranks(taxontreedef_1)
        self.make_taxon_ranks(taxontreedef_2)
        taxontreedef_2.treedefitems.create(name="Variety", rankid=250)
        taxontreedef_2.treedefitems.create(name="Subvariety", rankid=270)

        expected_ranks = list(Taxontreedefitem.objects
            .filter(definition=taxontreedef_1)
            .order_by("rankid")
            .values_list("name", flat=True))

        tree_info = get_tree_defs_in_collection(self.collection, "Taxon")
        self.assertEqual(
            [[rank["name"] for rank in tree["ranks"]] for tree in tree_info],
            [expected_ranks],
        )

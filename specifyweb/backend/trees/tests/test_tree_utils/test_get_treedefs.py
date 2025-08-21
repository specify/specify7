from specifyweb.specify.models import Collectionobjecttype, Discipline, Taxontreedef
from specifyweb.backend.trees.tests.test_tree_utils import TestMultipleTaxonTreeContext
from specifyweb.backend.trees.tests.test_trees import GeographyTree
from specifyweb.backend.trees.tree_utils import get_treedefs


class TestGetTreedefs(TestMultipleTaxonTreeContext, GeographyTree):
    
    def test_geography(self):
        self.assertEqual(
            get_treedefs(self.collection, "Geography"), 
            [(self.geographytreedef.id, 6)]
        )

    def test_taxon(self):
        # The setup environment is incorrect, so need to delete one of the trees.
        self._update(self.discipline, dict(taxontreedef=self.taxontreedef))
        Taxontreedef.objects.exclude(id=self.taxontreedef.id).delete()

        self.assertEqual(
            get_treedefs(self.collection, "Taxon"),
            [(self.taxontreedef.id, 11)]    
        )

    def test_no_taxon_case(self):
        # Because self._update will trigger business rules
        Discipline.objects.filter(id=self.discipline.id).update(taxontreedef_id=None)
        Taxontreedef.objects.exclude(id=self.taxontreedef.id).delete()
        Collectionobjecttype.objects.all().delete()
        with self.assertRaises(AssertionError) as context:
            get_treedefs(self.collection, "Taxon")
        
        self.assertIn("No definition to query on", str(context.exception))

    def test_multiple_taxon_case(self):
        
        (collection_2, taxontreedef_1, taxontreedef_2) = self._create_multiple_taxon()
        self.make_taxon_ranks(taxontreedef_1)
        self.make_taxon_ranks(taxontreedef_2)


        self.assertEqual(get_treedefs(self.collection, "Taxon"), [
            (taxontreedef_1.id, 11)
        ])

        taxontreedef_2.treedefitems.create(name="Variety", rankid=250)
        taxontreedef_2.treedefitems.create(name="Subvariety", rankid=270)

        # countEqual because they can ordered arbitarily.
        self.assertCountEqual(get_treedefs(collection_2, "Taxon"), [
            (taxontreedef_1.id, 11),
            (taxontreedef_2.id, 13)
        ])
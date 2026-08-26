from specifyweb.specify.tests.test_api import ApiTests
from specifyweb.specify import models

class TaxonTreeDefItemTests(ApiTests):
    def setUp(self):
        super().setUp()

        self.taxontreedef = models.Taxontreedef.objects.create(
            name="Test Taxon tree def")

        self.roottaxontreedefitem = self.taxontreedef.treedefitems.create(
            name="root",
            rankid=0)

        self.roottaxon = self.roottaxontreedefitem.treeentries.create(
            name="Life",
            definition=self.roottaxontreedefitem.treedef,
            rankid=self.roottaxontreedefitem.rankid)

    def test_delete_blocked_by_taxon(self):
        kingdom = self.roottaxontreedefitem.children.create(
            name="Kingdom",
            treedef=self.taxontreedef,
            rankid=self.roottaxontreedefitem.rankid+100)

        animals = kingdom.treeentries.create(
            parent=self.roottaxon,
            name="Animals",
            definition=kingdom.treedef,
            rankid=kingdom.rankid)
        animals.delete()

    def test_delete_unused_rank_reparents_children(self):
        kingdom = self.roottaxontreedefitem.children.create(
            name="Kingdom",
            treedef=self.taxontreedef,
            rankid=self.roottaxontreedefitem.rankid+100)
        phylum = kingdom.children.create(
            name="Phylum",
            treedef=self.taxontreedef,
            rankid=kingdom.rankid+100)

        models.Taxontreedefitem.objects.filter(id=kingdom.id).delete()

        phylum.refresh_from_db()
        self.assertEqual(phylum.parent_id, self.roottaxontreedefitem.id)
        self.assertFalse(models.Taxontreedefitem.objects.filter(id=kingdom.id).exists())

    def test_full_tree_delete_still_cascades(self):
        kingdom = self.roottaxontreedefitem.children.create(
            name="Kingdom",
            treedef=self.taxontreedef,
            rankid=self.roottaxontreedefitem.rankid+100)
        kingdom.treeentries.create(
            parent=self.roottaxon,
            name="Animals",
            definition=kingdom.treedef,
            rankid=kingdom.rankid)

        self.taxontreedef.delete()

        self.assertFalse(models.Taxontreedef.objects.filter(id=self.taxontreedef.id).exists())

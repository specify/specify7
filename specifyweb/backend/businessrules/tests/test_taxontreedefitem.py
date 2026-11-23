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

    def test_instance_delete_unused_rank_reparents_children(self):
        kingdom = self.roottaxontreedefitem.children.create(
            name="Kingdom",
            treedef=self.taxontreedef,
            rankid=100)
        phylum = kingdom.children.create(
            name="Phylum",
            treedef=self.taxontreedef,
            rankid=200)
        kingdom_id = kingdom.id

        kingdom.delete()

        phylum.refresh_from_db()
        self.assertEqual(phylum.parent_id, self.roottaxontreedefitem.id)
        self.assertFalse(models.Taxontreedefitem.objects.filter(id=kingdom_id).exists())

    def test_delete_adjacent_ranks_reparents_to_surviving_ancestor(self):
        kingdom = self.roottaxontreedefitem.children.create(
            name="Kingdom", treedef=self.taxontreedef, rankid=100)
        phylum = kingdom.children.create(
            name="Phylum", treedef=self.taxontreedef, rankid=200)
        class_rank = phylum.children.create(
            name="Class", treedef=self.taxontreedef, rankid=300)
        deleting_ids = [kingdom.id, phylum.id]

        models.Taxontreedefitem.objects.filter(id__in=deleting_ids).delete()

        class_rank.refresh_from_db()
        self.assertEqual(class_rank.parent_id, self.roottaxontreedefitem.id)
        self.assertFalse(models.Taxontreedefitem.objects.filter(id__in=deleting_ids).exists())

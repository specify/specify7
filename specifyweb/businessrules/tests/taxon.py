from django.db.models import ProtectedError

from specifyweb.specify import models
from specifyweb.specify.api_tests import ApiTests

class TaxonTests(ApiTests):
    def setUp(self):
        super(TaxonTests, self).setUp()

        self.taxontreedef = models.Taxontreedef.objects.create(
            name="Test Taxon tree def")

        self.roottaxontreedefitem = self.taxontreedef.treedefitems.create(
            name="root",
            rankid=0)

        self.roottaxon = self.roottaxontreedefitem.treeentries.create(
            name="Life",
            definition=self.roottaxontreedefitem.treedef,
            rankid=self.roottaxontreedefitem.rankid)

    def test_delete_blocked_by_collectingeventattributes(self):
        collectingeventattribute = models.Collectingeventattribute.objects.create(
            discipline=self.discipline,
            hosttaxon=self.roottaxon)

        with self.assertRaises(ProtectedError):
            self.roottaxon.delete()

        collectingeventattribute.hosttaxon = None
        collectingeventattribute.save()
        self.roottaxon.delete()

    def test_delete_cascades_to_commonnames(self):
        commonname = self.roottaxon.commonnames.create(
            name="test")

        self.roottaxon.delete()
        self.assertEqual(models.Commonnametx.objects.filter(id=commonname.id).count(), 0)

    def test_delete_blocked_by_determinations(self):
        det = self.collectionobjects[0].determinations.create(
            collectionmemberid=self.collection.id,
            iscurrent=True,
            taxon=self.roottaxon,
            preferredtaxon=self.roottaxon)

        with self.assertRaises(ProtectedError):
            self.roottaxon.delete()

        det.taxon = None
        det.save()

        with self.assertRaises(ProtectedError):
            self.roottaxon.delete()

        det.taxon = self.roottaxon
        det.preferredtaxon = None
        det.save()

        with self.assertRaises(ProtectedError):
            self.roottaxon.delete()

        det.taxon = None
        det.save()

        self.roottaxon.delete()

    def test_delete_blocked_by_hybridchildren(self):
        tax1 = self.roottaxon.hybridchildren1.create(
            name="Test 1",
            definition=self.roottaxontreedefitem.treedef,
            definitionitem=self.roottaxontreedefitem)

        with self.assertRaises(ProtectedError):
            self.roottaxon.delete()

        tax1.delete()

        tax2 = self.roottaxon.hybridchildren2.create(
            name="Test 2",
            definition=self.roottaxontreedefitem.treedef,
            definitionitem=self.roottaxontreedefitem)

        with self.assertRaises(ProtectedError):
            self.roottaxon.delete()

        tax2.delete()
        self.roottaxon.delete()

    def test_delete_blocked_by_taxoncitations(self):
        rw = models.Referencework.objects.create(
            institution=self.institution,
            referenceworktype=0)

        tc = self.roottaxon.taxoncitations.create(
            referencework=rw)

        with self.assertRaises(ProtectedError):
            self.roottaxon.delete()

        tc.delete()
        self.roottaxon.delete()

    def test_delete_cascades_to_deletable_children(self):
        kingdom = self.roottaxontreedefitem.children.create(
            name="Kingdom",
            treedef=self.taxontreedef,
            rankid=self.roottaxontreedefitem.rankid+100)

        animal = kingdom.treeentries.create(
            parent=self.roottaxon,
            name="Animal",
            definition=kingdom.treedef,
            rankid=kingdom.rankid)

        plant = kingdom.treeentries.create(
            parent=self.roottaxon,
            name="Plant",
            definition=kingdom.treedef,
            rankid=kingdom.rankid)

        det = self.collectionobjects[0].determinations.create(
            collectionmemberid=self.collection.id,
            iscurrent=True,
            taxon=animal)

        with self.assertRaises(ProtectedError):
            self.roottaxon.delete()

        det.delete()
        self.roottaxon.delete()
        self.assertEqual(models.Taxon.objects.filter(id__in=(animal.id, plant.id)).count(), 0)

    def test_accepted_children_acceptedparent_set_to_null_on_delete(self):
        kingdom = self.roottaxontreedefitem.children.create(
            name="Kingdom",
            treedef=self.taxontreedef,
            rankid=self.roottaxontreedefitem.rankid+100)

        animal = kingdom.treeentries.create(
            parent=self.roottaxon,
            name="Animal",
            definition=kingdom.treedef,
            rankid=kingdom.rankid)

        plant = kingdom.treeentries.create(
            parent=self.roottaxon,
            name="Plant",
            definition=kingdom.treedef,
            rankid=kingdom.rankid)

        acceptedchild = kingdom.treeentries.create(
            parent=self.roottaxon,
            name="test",
            definition=kingdom.treedef,
            rankid=kingdom.rankid,
            acceptedtaxon=plant)

        plant.delete()

        self.assertEqual(
            models.Taxon.objects.get(id=acceptedchild.id).acceptedtaxon,
            None)

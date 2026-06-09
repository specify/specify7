from unittest import skip

from django.db.models import ProtectedError

from specifyweb.specify import models
from specifyweb.specify.tests.test_api import ApiTests


class TaxonTests(ApiTests):
    def setUp(self):
        super().setUp()

        self.taxontreedef = models.Taxontreedef.objects.create(
            name="Test Taxon tree def")

        self.roottaxontreedefitem = self.taxontreedef.treedefitems.create(
            name="taxonomy_root",
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
        self.assertEqual(models.Commonnametx.objects.filter(
            id=commonname.id).count(), 0)

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

        # preferredtaxon now get set to taxon when
        # det is saved so the following tests
        # are invalid

        # with self.assertRaises(ProtectedError):
        #     self.roottaxon.delete()

        # det.taxon = self.roottaxon
        # det.preferredtaxon = None
        # det.save()

        # with self.assertRaises(ProtectedError):
        #     self.roottaxon.delete()

        # det.taxon = None
        # det.save()

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

    def test_isaccepted_on_save(self):
        kingdom = self.roottaxontreedefitem.children.create(
            name="Kingdom",
            treedef=self.taxontreedef)

        animalia = self.roottaxon.children.create(
            name="Animalia",
            definition=self.taxontreedef,
            definitionitem=kingdom
        )

        metazoa = self.roottaxon.children.create(
            name="Metazoa",
            acceptedtaxon=animalia,
            definition=self.taxontreedef,
            definitionitem=kingdom
        )

        self.assertTrue(animalia.isaccepted)
        self.assertFalse(metazoa.isaccepted)

    @skip("not sure if rule is valid")
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

    @skip("this behavior was eliminated by https://github.com/specify/specify7/issues/136")
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
        self.assertEqual(models.Taxon.objects.filter(
            id__in=(animal.id, plant.id)).count(), 0)

    @skip("not clear if this is correct.")
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

    def test_determination_preferredtaxon_updates_on_synonymization(self):
        """Test that Determinations are updated when a Taxon is synonymized"""
        kingdom = self.roottaxontreedefitem.children.create(
            name="Kingdom",
            treedef=self.taxontreedef)

        # Create two taxa: one that will be a synonym, one that will be the accepted
        synonym = self.roottaxon.children.create(
            name="OldName",
            definition=self.taxontreedef,
            definitionitem=kingdom
        )

        accepted = self.roottaxon.children.create(
            name="NewName",
            definition=self.taxontreedef,
            definitionitem=kingdom
        )

        # Create a determination with the synonym taxon
        det = self.collectionobjects[0].determinations.create(
            collectionmemberid=self.collection.id,
            iscurrent=True,
            taxon=synonym,
            preferredtaxon=synonym
        )

        # Verify initial state
        self.assertEqual(det.preferredtaxon.id, synonym.id)

        # Synonymize: set synonym's acceptedtaxon to accepted
        synonym.acceptedtaxon = accepted
        synonym.save()

        # Refresh from DB
        det.refresh_from_db()

        # PreferredTaxon should now be the accepted taxon
        self.assertEqual(det.preferredtaxon.id, accepted.id)

    def test_determination_preferredtaxon_updates_on_desynonymization(self):
        """Test that Determinations are updated when a Taxon is desynonymized"""
        kingdom = self.roottaxontreedefitem.children.create(
            name="Kingdom",
            treedef=self.taxontreedef)

        # Create two taxa: one will be a synonym, one will be the accepted
        accepted = self.roottaxon.children.create(
            name="NewName",
            definition=self.taxontreedef,
            definitionitem=kingdom
        )

        synonym = self.roottaxon.children.create(
            name="OldName",
            acceptedtaxon=accepted,
            definition=self.taxontreedef,
            definitionitem=kingdom
        )

        # Create a determination with the accepted taxon but via the synonym
        det = self.collectionobjects[0].determinations.create(
            collectionmemberid=self.collection.id,
            iscurrent=True,
            taxon=synonym,
            preferredtaxon=accepted
        )

        # Verify initial state (preferredtaxon points to accepted)
        self.assertEqual(det.preferredtaxon.id, accepted.id)

        # Desynonymize: clear acceptedtaxon on synonym
        synonym.acceptedtaxon = None
        synonym.save()

        # Refresh from DB
        det.refresh_from_db()

        # PreferredTaxon should now be the synonym (same as taxon)
        self.assertEqual(det.preferredtaxon.id, synonym.id)
        self.assertEqual(det.taxon.id, synonym.id)

    def test_acceptedchildren_repointed_on_synonymization(self):
        """Test that acceptedchildren are repointed when a Taxon is synonymized"""
        kingdom = self.roottaxontreedefitem.children.create(
            name="Kingdom",
            treedef=self.taxontreedef)

        # Create three taxa: one that will be synonymized, one accepted, and one child
        # that points to the first as its accepted taxon
        synonym = self.roottaxon.children.create(
            name="OldName",
            definition=self.taxontreedef,
            definitionitem=kingdom
        )

        accepted = self.roottaxon.children.create(
            name="NewName",
            definition=self.taxontreedef,
            definitionitem=kingdom
        )

        # Create a child taxon that has 'synonym' as its accepted taxon
        child = self.roottaxon.children.create(
            name="ChildTaxon",
            acceptedtaxon=synonym,
            definition=self.taxontreedef,
            definitionitem=kingdom
        )

        # Verify initial state
        self.assertEqual(child.acceptedtaxon.id, synonym.id)

        # Synonymize: set synonym's acceptedtaxon to accepted
        synonym.acceptedtaxon = accepted
        synonym.save()

        # Refresh from DB
        child.refresh_from_db()

        # The child's acceptedtaxon should now point to the new accepted taxon
        self.assertEqual(child.acceptedtaxon.id, accepted.id)

    def test_cannot_synonymize_to_synonymized_target(self):
        """Test that setting acceptedtaxon to a node that is already a synonym raises an error"""
        kingdom = self.roottaxontreedefitem.children.create(
            name="Kingdom",
            treedef=self.taxontreedef)

        # Create three taxa
        taxon_a = self.roottaxon.children.create(
            name="TaxonA",
            definition=self.taxontreedef,
            definitionitem=kingdom
        )

        taxon_b = self.roottaxon.children.create(
            name="TaxonB",
            definition=self.taxontreedef,
            definitionitem=kingdom
        )

        taxon_c = self.roottaxon.children.create(
            name="TaxonC",
            definition=self.taxontreedef,
            definitionitem=kingdom
        )

        # Make taxon_b a synonym of taxon_a
        taxon_b.acceptedtaxon = taxon_a
        taxon_b.save()

        # Verify taxon_b is now a synonym
        self.assertIsNotNone(taxon_b.acceptedtaxon_id)

        # Attempting to make taxon_c a synonym of taxon_b should fail
        # because taxon_b is itself a synonym
        from specifyweb.backend.businessrules.exceptions import TreeBusinessRuleException
        taxon_c.acceptedtaxon = taxon_b
        with self.assertRaises(TreeBusinessRuleException):
            taxon_c.save()

    def test_cannot_synonymize_node_with_children(self):
        """Test that setting acceptedtaxon on a node that has children raises an error"""
        kingdom = self.roottaxontreedefitem.children.create(
            name="Kingdom",
            treedef=self.taxontreedef)

        # Create a parent taxon and a child taxon
        parent = self.roottaxon.children.create(
            name="Parent",
            definition=self.taxontreedef,
            definitionitem=kingdom
        )

        child = parent.children.create(
            name="Child",
            definition=self.taxontreedef,
            definitionitem=kingdom
        )

        accepted = self.roottaxon.children.create(
            name="Accepted",
            definition=self.taxontreedef,
            definitionitem=kingdom
        )

        # Verify parent has children
        self.assertEqual(parent.children.count(), 1)

        # Attempting to synonymize parent (which has children) should fail
        from specifyweb.backend.businessrules.exceptions import TreeBusinessRuleException
        parent.acceptedtaxon = accepted
        with self.assertRaises(TreeBusinessRuleException):
            parent.save()

        # Clean up child so parent can be deleted
        child.delete()
        parent.delete()
        accepted.delete()

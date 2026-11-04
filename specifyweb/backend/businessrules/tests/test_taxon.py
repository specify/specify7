from unittest import skip

from django.db.models import ProtectedError

from specifyweb.specify import models
from specifyweb.specify.api.crud import delete_resource, post_resource, update_obj
from specifyweb.specify.api.serializers import uri_for_model
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

        self.kingdom = self.roottaxontreedefitem.children.create(
            name="Test Kingdom",
            rankid=100,
            treedef=self.taxontreedef,
        )

    def _taxon_data(self, name, **overrides):
        data = {
            "name": name,
            "parent": uri_for_model("taxon", self.roottaxon.id),
            "definitionitem": uri_for_model("taxontreedefitem", self.kingdom.id),
            "author": "Linnaeus",
            "remarks": "Test taxon",
        }
        data.update(overrides)
        return data

    def _create_taxon(self, name, **overrides):
        return post_resource(
            self.collection,
            self.agent,
            "taxon",
            self._taxon_data(name, **overrides),
        )

    def _create_existing_taxon(self, name):
        return self.roottaxon.children.create(
            name=name,
            definition=self.taxontreedef,
            definitionitem=self.kingdom,
            rankid=self.kingdom.rankid,
            author="Old author",
            remarks="Created before this version",
        )

    def test_add_taxon(self):
        taxon = self._create_taxon("Animalia")

        self.assertIsNotNone(taxon.id)
        self.assertExists(
            models.Taxon.objects.filter(
                id=taxon.id,
                name="Animalia",
                parent=self.roottaxon,
            )
        )
        self.assertEqual(taxon.definition_id, self.taxontreedef.id)
        self.assertEqual(taxon.definitionitem_id, self.kingdom.id)
        self.assertEqual(taxon.rankid, self.kingdom.rankid)

        taxon.delete()

    def test_clone_taxon(self):
        original = self._create_taxon(
            "Animalia",
            author="Linnaeus",
            remarks="Original remarks",
        )

        clone = self._create_taxon(
            original.name,
            author=original.author,
            remarks=original.remarks,
        )

        self.assertNotEqual(clone.id, original.id)
        self.assertEqual(clone.name, original.name)
        self.assertEqual(clone.parent_id, original.parent_id)
        self.assertEqual(clone.definitionitem_id, original.definitionitem_id)
        self.assertEqual(clone.author, original.author)
        self.assertEqual(clone.remarks, original.remarks)

        original.refresh_from_db()
        self.assertEqual(original.name, "Animalia")

        clone.delete()
        original.delete()

    def test_delete_new_taxon(self):
        taxon = self._create_taxon("Animalia")
        taxon_id = taxon.id

        delete_resource(
            self.collection,
            self.agent,
            "taxon",
            taxon_id,
            taxon.version,
        )

        self.assertNotExists(models.Taxon.objects.filter(id=taxon_id))

    def test_edit_taxon_created_in_previous_version(self):
        taxon = self._create_existing_taxon("Animalia")

        update_obj(
            self.collection,
            self.agent,
            "taxon",
            taxon.id,
            taxon.version,
            {"name": "Animalia updated", "author": "New author"},
        )

        taxon.refresh_from_db()
        self.assertEqual(taxon.name, "Animalia updated")
        self.assertEqual(taxon.author, "New author")
        self.assertEqual(taxon.version, 1)

        taxon.delete()

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

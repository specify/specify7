from specifyweb.specify.models import Determination, Taxon
from specifyweb.specify.tests.test_trees import GeographyTree
from specifyweb.specify.tree_extras import desynonymize, synonymize


class TestDesynonymize(GeographyTree):

    def test_geography(self):

        synonymize(self.springmo, self.springill, self.agent)

        synonymize(self.springill, self.doug, self.agent)

        self.refresh_all()

        desynonymize(self.springmo, self.agent)

        self.refresh_all()

        self.assertTrue(self.springmo.isaccepted)
        self.assertIsNone(self.springmo.accepted_id)

    def test_taxon(self):
        life = Taxon.objects.create(
            definition=self.taxontreedef,
            definitionitem=self.taxon_root,
            name="Life",
            fullname="Life"
        )

        animalia = self.make_taxontree("Animalia", "Kingdom", parent=life)
        plantae = self.make_taxontree("Plantae", "Kingdom", parent=life)

        det_anim_1 = Determination.objects.create(
            collectionobject=self.collectionobjects[0],
            taxon=animalia
        )

        det_anim_2 = Determination.objects.create(
            collectionobject=self.collectionobjects[1],
            taxon=animalia
        )

        det_anim_3 = Determination.objects.create(
            collectionobject=self.collectionobjects[2],
            taxon=animalia
        )

        det_plantae_1 = Determination.objects.create(
            collectionobject=self.collectionobjects[0],
            taxon=plantae
        )

        synonymize(animalia, plantae, self.agent)

        det_anim_1.refresh_from_db()
        det_anim_2.refresh_from_db()
        det_anim_3.refresh_from_db()
        det_plantae_1.refresh_from_db()

        desynonymize(animalia, self.agent)

        det_anim_1.refresh_from_db()
        det_anim_2.refresh_from_db()
        det_anim_3.refresh_from_db()
        det_plantae_1.refresh_from_db()

        self.assertEqual(det_anim_1.preferredtaxon_id, animalia.id)
        self.assertEqual(det_anim_2.preferredtaxon_id, animalia.id)
        self.assertEqual(det_anim_3.preferredtaxon_id, animalia.id)

        self.assertTrue(animalia.isaccepted)
        self.assertIsNone(animalia.accepted_id)

        self.assertEqual(det_plantae_1.preferredtaxon_id, plantae.id)
        self.assertEqual(det_plantae_1.taxon_id, plantae.id)
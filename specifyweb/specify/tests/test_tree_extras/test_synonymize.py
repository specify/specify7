from specifyweb.businessrules.exceptions import TreeBusinessRuleException
from specifyweb.specify.models import Determination, Taxon, Taxontreedef
from specifyweb.specify.tests.test_trees import GeographyTree
from specifyweb.specify.tree_extras import synonymize


class TestSynonymize(GeographyTree):

    def test_different_type(self):
        with self.assertRaises(AssertionError) as context:
            synonymize(self.na, self.collectionobjects[0], self.agent)

        self.assertEqual(context.exception.args[1]['localizationKey'], "invalidNodeType")

    def test_synonymize_across_definition(self):
        taxontreedef_2 = Taxontreedef.objects.create(name="Test Taxonomy 2")
        taxon_root_2 = taxontreedef_2.treedefitems.create(name="Taxonomy Root", rankid=0)
        taxon_kingdom_2 = taxontreedef_2.treedefitems.create(name="Kingdom2", rankid=10)

        life_1 = Taxon.objects.create(
            definition=self.taxontreedef,
            definitionitem=self.taxon_root,
            name="Life",
            fullname="Life"
        )

        life_2 = Taxon.objects.create(
            definition=taxontreedef_2,
            definitionitem=taxon_root_2,
            name="Life",
            fullname="Life"
        )

        animalia_1 = self.make_taxontree("Animalia", "Kingdom", parent=life_1)
        animalia_2 = self.make_taxontree("Animalia", "Kingdom2", parent=life_2)

        with self.assertRaises(AssertionError) as context:
            synonymize(animalia_1, animalia_2, self.agent)

        self.assertEqual(context.exception.args[1]['localizationKey'], "operationAcrossTrees")

    def test_already_synonymized(self):

        self._update(self.kansas, dict(accepted_id=self.ohio.id))

        with self.assertRaises(TreeBusinessRuleException) as context:
            synonymize(self.mo, self.kansas, self.agent)

        self.assertEqual(context.exception.args[1]['localizationKey'], "nodeSynonymizeToSynonymized")

    def test_synonymize_geography_no_target_children(self):

        synonymize(self.springmo, self.springill, self.agent)

        synonymize(self.springill, self.doug, self.agent)

        self.refresh_all()

        self.assertEqual(self.springill.accepted_id, self.doug.id)
        self.assertEqual(self.springmo.accepted_id, self.doug.id)

        self.assertFalse(self.springill.isaccepted)
        self.assertFalse(self.springmo.isaccepted)

    def test_synonymize_geography_target_children(self):

        with self.assertRaises(TreeBusinessRuleException) as context:
            synonymize(self.kansas, self.mo, self.agent)

        self.assertEqual(context.exception.args[1]['localizationKey'], "nodeSynonimizeWithChildren")

    def test_synonymize_taxon_no_target_children(self):

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

        det_none_1 = Determination.objects.create(
            collectionobject=self.collectionobjects[3]
        )

        det_none_2 = Determination.objects.create(
            collectionobject=self.collectionobjects[4]
        )

        det_plantae_1 = Determination.objects.create(
            collectionobject=self.collectionobjects[0],
            taxon=plantae
        )

        det_plantae_2 = Determination.objects.create(
            collectionobject=self.collectionobjects[0],
            taxon=plantae
        )

        synonymize(animalia, plantae, self.agent)

        det_anim_1.refresh_from_db()
        det_anim_2.refresh_from_db()
        det_anim_3.refresh_from_db()

        det_none_1.refresh_from_db()
        det_none_2.refresh_from_db()

        det_plantae_1.refresh_from_db()
        det_plantae_2.refresh_from_db()

        self.assertEqual(animalia.accepted_id, plantae.id)

        self.assertEqual(det_anim_1.preferredtaxon_id, plantae.id)
        self.assertEqual(det_anim_2.preferredtaxon_id, plantae.id)
        self.assertEqual(det_anim_3.preferredtaxon_id, plantae.id)

        self.assertEqual(det_none_1.preferredtaxon_id, None)
        self.assertEqual(det_none_1.taxon_id, None)

        self.assertEqual(det_none_2.preferredtaxon_id, None)
        self.assertEqual(det_none_2.taxon_id, None)


        self.assertEqual(det_plantae_1.preferredtaxon_id, plantae.id)
        self.assertEqual(det_plantae_2.preferredtaxon_id, plantae.id)
    
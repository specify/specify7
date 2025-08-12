from specifyweb.backend.businessrules.exceptions import TreeBusinessRuleException
from specifyweb.specify.models import Geography, Locality, Taxon, Taxontreedef
from specifyweb.specify.tests.test_trees import GeographyTree
from specifyweb.specify.tree_extras import merge

class TestMerge(GeographyTree):
    
    def test_different_type(self):
        with self.assertRaises(AssertionError) as context:
            merge(self.na, self.collectionobjects[0], self.agent)
        
        self.assertEqual(context.exception.args[1]['localizationKey'], "invalidNodeType")

    def test_merge_across_definition(self):
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
            merge(animalia_1, animalia_2, self.agent)

        self.assertEqual(context.exception.args[1]['localizationKey'], "operationAcrossTrees")
    
    def test_merge_into_synonymized(self):
        self.springmo.accepted_id = self.springill
        self.springmo.save()

        with self.assertRaises(TreeBusinessRuleException) as context:
            merge(self.sangomon, self.springmo, self.agent)

        self.assertEqual(context.exception.args[1]['localizationKey'], "nodeOperationToSynonymizedParent")

    def _make_locality(self, geo):
        return Locality.objects.create(
            discipline=self.discipline,
            geography=geo
        )
    
    def test_simple_merge(self):

        locality_1 = self._make_locality(self.springmo)
        locality_2 = self._make_locality(self.springmo)
        locality_3 = self._make_locality(self.springmo)

        locality_4 = self._make_locality(self.springill)
        merge(self.springmo, self.springill, self.agent)


        self.assertEqual(
            Locality.objects.filter(
                geography=self.springill,
                id__in=[locality_1.id, locality_2.id, locality_3.id, locality_4.id]
                ).count(), 
                4
            )
        
    def test_complicated_merge(self):

        initial_count = Geography.objects.all().count()

        mo_county_test_1 = self.make_geotree("MoCountyTest_1", "County", parent=self.mo)
        mo_county_test_2 = self.make_geotree("MoCountyTest_2", "County", parent=self.mo)

        mo_county_city_test_1 = self.make_geotree("MoCountyCityTest_1", "City", parent=mo_county_test_1)

        generic_city_1 = self.make_geotree("GenericCityTest_1", "City", parent=self.greene)
        generic_city_2 = self.make_geotree("GenericCityTest_2", "City", parent=self.greene)

        generic_city_oh_1 = self.make_geotree("GenericCityTest_1", "City", parent=self.greeneoh)
        generic_city_oh_2 = self.make_geotree("GenericCityTest_2", "City", parent=self.greeneoh)

        oh_county_test_1 = self.make_geotree("OhCountyTest_1", "County", parent=self.ohio)
        # This won't be merged (or deleted)
        oh_county_city_test_1 = self.make_geotree("MoCountyCityTest_1", "City", parent=oh_county_test_1)


        locality_mo_1 = self._make_locality(self.mo)
        locality_mo_2 = self._make_locality(self.mo)

        locality_gc_1 = self._make_locality(generic_city_1)
        locality_gc_1_2 = self._make_locality(generic_city_1)

        locality_gc_2 = self._make_locality(generic_city_2)

        self._update(
            self.sangomon,
            dict(accepted_id=self.greene.id)
        )

        self._update(
            self.ill,
            dict(accepted_id=self.mo.id)
        )

        merge(self.mo, self.ohio, self.agent)

        post_merge_count = Geography.objects.all().count()

        def exists(obj):
            self.assertTrue(Geography.objects.all().filter(id=obj.id).exists())

        def not_exists(obj):
            self.assertFalse(Geography.objects.all().filter(id=obj.id).exists())

        exists(self.ohio)
        not_exists(self.mo)

        exists(mo_county_test_1)
        exists(mo_county_test_2)
        exists(mo_county_city_test_1)

        not_exists(generic_city_1)
        not_exists(generic_city_2)

        exists(generic_city_oh_1)
        exists(generic_city_oh_2)

        exists(oh_county_test_1)
        exists(oh_county_city_test_1)

        self.assertEqual(post_merge_count - initial_count, 5)

        locality_mo_1.refresh_from_db()
        locality_mo_2.refresh_from_db()

        locality_gc_1.refresh_from_db()
        locality_gc_1_2.refresh_from_db()
        locality_gc_2.refresh_from_db()

        self.sangomon.refresh_from_db()
        self.ill.refresh_from_db()

        self.assertEqual(locality_mo_1.geography_id, self.ohio.id)
        self.assertEqual(locality_mo_2.geography_id, self.ohio.id)

        self.assertEqual(locality_gc_1.geography_id, generic_city_oh_1.id)
        self.assertEqual(locality_gc_1_2.geography_id, generic_city_oh_1.id)

        self.assertEqual(locality_gc_2.geography_id, generic_city_oh_2.id)

        self.assertEqual(self.sangomon.accepted_id, self.greeneoh.id)
        self.assertEqual(self.ill.accepted_id, self.ohio.id)
from specifyweb.backend.businessrules.exceptions import TreeBusinessRuleException
from specifyweb.specify.models import Geography, Locality, Taxon, Taxontreedef, Taxontreedefitem
from specifyweb.backend.trees.tests.test_trees import GeographyTree
from specifyweb.backend.trees.extras import merge, _batch_reparent_children, validate_tree_numbering

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


class TestBatchReparent(GeographyTree):
    """Tests for the _batch_reparent_children function used during merge."""

    def test_batch_reparent_single_child(self):
        """A single county can be reparented from Missouri to Ohio."""
        # Greene County (MO) has Springfield as a city child
        # Reparent Greene County from Missouri to Ohio
        _batch_reparent_children([self.greene], self.ohio, Geography)

        # Verify parent changed from Missouri to Ohio
        self.greene.refresh_from_db()
        self.assertEqual(self.greene.parent_id, self.ohio.id)

        # Verify Springfield still exists and has correct parent
        self.springmo.refresh_from_db()
        self.assertEqual(self.springmo.parent_id, self.greene.id)

        # Verify tree numbering is valid
        validate_tree_numbering('geography')

    def test_batch_reparent_multiple_counties(self):
        """Multiple counties can be reparented from one state to another in a single batch."""
        # Create additional counties under Missouri
        boone = self.make_geotree("Boone", "County", parent=self.mo)
        jasper = self.make_geotree("Jasper", "County", parent=self.mo)
        platte = self.make_geotree("Platte", "County", parent=self.mo)

        _batch_reparent_children([boone, jasper, platte], self.ohio, Geography)

        for county in [boone, jasper, platte]:
            county.refresh_from_db()
            self.assertEqual(county.parent_id, self.ohio.id)

        validate_tree_numbering('geography')

    def test_batch_reparent_county_with_cities(self):
        """A county with its own cities (subtree) is correctly reparented."""
        # Greene County (MO) has Springfield as a city child
        # Reparent Greene County from Missouri to Ohio
        _batch_reparent_children([self.greene], self.ohio, Geography)

        self.greene.refresh_from_db()
        self.assertEqual(self.greene.parent_id, self.ohio.id)

        # Verify Springfield is still a child of Greene County
        self.springmo.refresh_from_db()
        self.assertEqual(self.springmo.parent_id, self.greene.id)

        validate_tree_numbering('geography')

    def test_batch_reparent_updates_fullnames(self):
        """Full names reflect the new parent path after batch reparenting."""
        # Create a taxonomy tree with ranks that include ancestry in fullname.
        # In the real taxon tree, Genus and Species are the ranks with
        # isinfullname=True, so Species includes Genus in its fullname.
        root = Taxon.objects.create(
            definition=self.taxontreedef,
            definitionitem=self.taxon_root,
            name="Life",
            fullname="Life"
        )

        # Create two Kingdom-level nodes
        animalia = self.make_taxontree("Animalia", "Kingdom", parent=root)
        plantae = self.make_taxontree("Plantae", "Kingdom", parent=root)

        # Enable fullname ancestry for Genus and Species ranks
        genus_rank = Taxontreedefitem.objects.get(name="Genus")
        species_rank = Taxontreedefitem.objects.get(name="Species")
        self._update(genus_rank, dict(isinfullname=True))
        self._update(species_rank, dict(isinfullname=True))

        # Create a Genus (Canis) under Animalia with two Species
        canis = self.make_taxontree("Canis", "Genus", parent=animalia)
        canis_lupus = self.make_taxontree("lupus", "Species", parent=canis)
        canis_latrans = self.make_taxontree("latrans", "Species", parent=canis)

        # Refresh species to get computed fullnames
        canis_lupus.refresh_from_db()
        canis_latrans.refresh_from_db()

        # Before reparenting, Species fullnames should include Canis
        self.assertEqual("Canislupus", canis_lupus.fullname)
        self.assertEqual("Canislatrans", canis_latrans.fullname)

        # Reparent the Genus Canis from Animalia to Plantae
        _batch_reparent_children([canis], plantae, Taxon)

        # Refresh and check Species fullnames still include Canis
        canis_lupus.refresh_from_db()
        canis_latrans.refresh_from_db()
        self.assertEqual("Canislupus", canis_lupus.fullname)
        self.assertEqual("Canislatrans", canis_latrans.fullname)

    def test_batch_reparent_preserves_node_numbers(self):
        """After batch reparenting, all node numbers are valid and unique."""
        # Create additional counties under Missouri with cities
        boone = self.make_geotree("Boone", "County", parent=self.mo)
        jasper = self.make_geotree("Jasper", "County", parent=self.mo)
        columbia = self.make_geotree("Columbia", "City", parent=boone)
        joplin = self.make_geotree("Joplin", "City", parent=jasper)

        _batch_reparent_children([boone, jasper], self.ohio, Geography)

        # Verify node numbers are valid
        validate_tree_numbering('geography')

        # Verify all nodes have unique nodenumbers
        nodenumbers = Geography.objects.values_list('nodenumber', flat=True)
        self.assertEqual(len(nodenumbers), len(set(nodenumbers)))

    def test_batch_reparent_empty_list(self):
        """Reparenting an empty list should not raise an error."""
        # This should be a no-op
        _batch_reparent_children([], self.ohio, Geography)

        # Tree should still be valid
        validate_tree_numbering('geography')

    def test_batch_reparent_county_and_city_together(self):
        """A county and a city from different parents can be reparented together."""
        # Reparent Greene County (MO) and Sangamon County (IL) both to Ohio
        _batch_reparent_children([self.greene, self.sangomon], self.ohio, Geography)

        self.greene.refresh_from_db()
        self.sangomon.refresh_from_db()

        self.assertEqual(self.greene.parent_id, self.ohio.id)
        self.assertEqual(self.sangomon.parent_id, self.ohio.id)

        validate_tree_numbering('geography')

    def test_batch_reparent_within_merge(self):
        """A merge that triggers batch reparenting works correctly."""
        # Create additional counties under Missouri
        boone = self.make_geotree("Boone", "County", parent=self.mo)
        jasper = self.make_geotree("Jasper", "County", parent=self.mo)

        # Create a matching county under Ohio (same name) - this will be recursively merged
        greene_oh = self.make_geotree("Greene", "County", parent=self.ohio)

        # Create localities attached to the batch-reparented counties
        loc_boone = self._make_locality(boone)
        loc_jasper = self._make_locality(jasper)

        # Merge Missouri into Ohio
        merge(self.mo, self.ohio, self.agent)

        # Verify Missouri is gone
        self.assertFalse(Geography.objects.filter(id=self.mo.id).exists())

        # Verify Ohio still exists
        self.assertTrue(Geography.objects.filter(id=self.ohio.id).exists())

        # Verify the matching Greene County was recursively merged (MO -> OH)
        self.assertFalse(Geography.objects.filter(id=self.greene.id).exists())
        greene_oh.refresh_from_db()
        self.assertEqual(greene_oh.parent_id, self.ohio.id)

        # Verify non-matching counties were batch reparented
        boone.refresh_from_db()
        self.assertEqual(boone.parent_id, self.ohio.id)
        jasper.refresh_from_db()
        self.assertEqual(jasper.parent_id, self.ohio.id)

        # Verify localities for batch-reparented counties were moved
        loc_boone.refresh_from_db()
        self.assertEqual(loc_boone.geography_id, boone.id)
        loc_jasper.refresh_from_db()
        self.assertEqual(loc_jasper.geography_id, jasper.id)

        # Verify tree numbering is valid
        validate_tree_numbering('geography')

    def test_batch_reparent_preserves_ordering(self):
        """Children maintain their relative ordering after batch reparenting."""
        # Create a taxonomy tree.
        root = Taxon.objects.create(
            definition=self.taxontreedef,
            definitionitem=self.taxon_root,
            name="Life",
            fullname="Life"
        )

        # Create two Kingdom-level nodes
        animalia = self.make_taxontree("Animalia", "Kingdom", parent=root)
        plantae = self.make_taxontree("Plantae", "Kingdom", parent=root)

        # Create three real-world Genus-level children under Animalia
        canis = self.make_taxontree("Canis", "Genus", parent=animalia)
        felis = self.make_taxontree("Felis", "Genus", parent=animalia)
        ursus = self.make_taxontree("Ursus", "Genus", parent=animalia)

        # Reparent the three genera from Animalia to Plantae
        _batch_reparent_children([canis, felis, ursus], plantae, Taxon)

        # Refresh all
        for c in [canis, felis, ursus]:
            c.refresh_from_db()

        # All should be children of Plantae
        for c in [canis, felis, ursus]:
            self.assertEqual(c.parent_id, plantae.id)

        # Verify node numbers are nested under Plantae
        plantae.refresh_from_db()
        for c in [canis, felis, ursus]:
            self.assertGreaterEqual(c.nodenumber, plantae.nodenumber)
            self.assertLessEqual(c.nodenumber, plantae.highestchildnodenumber)

        # Fetch Plantae's children ordered by nodenumber and verify that
        # canis, felis, ursus appear in that exact relative order.
        plantae_children = Taxon.objects.filter(
            parent=plantae
        ).order_by('nodenumber').values_list('id', flat=True)

        # Build a list of the child ids in the order they appear
        child_ids = list(plantae_children)

        # Find the positions of canis, felis, ursus in the ordered list
        canis_idx = child_ids.index(canis.id)
        felis_idx = child_ids.index(felis.id)
        ursus_idx = child_ids.index(ursus.id)

        # Assert that canis, felis, ursus appear in that exact order
        self.assertLess(canis_idx, felis_idx,
                        "canis should appear before felis among Plantae's children")
        self.assertLess(felis_idx, ursus_idx,
                        "felis should appear before ursus among Plantae's children")

        # Optionally assert they are contiguous (no other children interleaved)
        self.assertEqual(felis_idx, canis_idx + 1,
                         "canis and felis should be adjacent among Plantae's children")
        self.assertEqual(ursus_idx, felis_idx + 1,
                         "felis and ursus should be adjacent among Plantae's children")

        validate_tree_numbering('taxon')

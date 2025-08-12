from specifyweb.specify.models import (
    Accession,
    Agent,
    Conservdescription,
    Division,
    Exchangein,
    Exchangeout,
    Geographytreedef,
    Geographytreedefitem,
    Geologictimeperiodtreedef,
    Inforequest,
    Lithostrattreedef,
    Locality,
    Picklist,
    Repositoryagreement,
    Storagetreedef,
    Taxon,
    Taxontreedefitem,
    Collection,
    Discipline,
    Tectonicunittreedef,
    Treatmentevent,
)
from specifyweb.backend.trees.tests.test_tree_utils import TestMultipleTaxonTreeContext
from specifyweb.backend.trees.test_trees import SqlTreeSetup
from specifyweb.backend.stored_queries.tests.utils import make_query_fields_test


def taxon_rank_getter(rank_name, treedef):
    return Taxontreedefitem.objects.get(name=rank_name, treedef=treedef)


def geo_rank_getter(rank_name, treedef):
    return Geographytreedefitem.objects.get(name=rank_name, treedef=treedef)


class TestFilterByCollection(TestMultipleTaxonTreeContext, SqlTreeSetup):

    def setUp(self):
        super().setUp()

        self.tree_paths = [
            ["name"],
            ["rankid"],
            ["definitionitem", "rankid"],
            ["definitionitem", "name"],
            ["definition", "name"],
        ]

        self.tree_item_paths = [
            ["name"],
            ["rankid"],
            ["treeDef", "name"],
        ]

    def _populate_taxon_tree(self, taxondef_1, taxondef_2):

        self.make_taxon_ranks(taxondef_1)
        self.make_taxon_ranks(taxondef_2)

        self.root_1 = self.make_taxontree("Life", "Taxonomy Root", treedef=taxondef_1)
        self.animalia_1 = self.make_taxontree(
            "Animalia", "Kingdom", parent=self.root_1, treedef=taxondef_1
        )
        self.phylum_1 = self.make_taxontree(
            "TestPhylum", "Phylum", parent=self.animalia_1, treedef=taxondef_1
        )

        self.root_2 = self.make_taxontree("Life", "Taxonomy Root", treedef=taxondef_2)
        self.plantae_2 = self.make_taxontree(
            "Plantae", "Kingdom", parent=self.root_2, treedef=taxondef_2
        )
        self.phylum_2 = self.make_taxontree(
            "TestPhylumPlantae", "Phylum", parent=self.plantae_2, treedef=taxondef_2
        )

        self.assertEqual(Taxon.objects.count(), 6)

    def _create_collection_pair(self, discipline_1, discipline_2):
        collection_1 = Collection.objects.create(
            catalognumformatname="test",
            collectionname="TestCollection1",
            isembeddedcollectingevent=False,
            discipline=discipline_1,
        )

        collection_2 = Collection.objects.create(
            catalognumformatname="test",
            collectionname="TestCollection2",
            isembeddedcollectingevent=False,
            discipline=discipline_2,
        )

        return (collection_1, collection_2)

    def _create_mock_geotree(self):
        geographytreedef_1 = Geographytreedef.objects.create(name="Test gtd1")
        geographytreedef_2 = Geographytreedef.objects.create(name="Test gtd2")

        discipline_1 = Discipline.objects.create(
            geologictimeperiodtreedef=self.geologictimeperiodtreedef,
            geographytreedef=geographytreedef_1,
            division=self.division,
            datatype=self.datatype,
            type="paleobotany",
        )

        discipline_2 = Discipline.objects.create(
            geologictimeperiodtreedef=self.geologictimeperiodtreedef,
            geographytreedef=geographytreedef_2,
            division=self.division,
            datatype=self.datatype,
            type="paleobotany",
        )

        collection_1, collection_2 = self._create_collection_pair(
            discipline_1, discipline_2
        )

        self.make_geography_ranks(geographytreedef_1)
        self.make_geography_ranks(geographytreedef_2)

        self.root_1 = self.make_geotree("Earth", "Planet", treedef=geographytreedef_1)
        self.continent_1 = self.make_geotree(
            "North America", "Continent", treedef=geographytreedef_1, parent=self.root_1
        )
        self.country_1 = self.make_geotree(
            "USA", "Country", treedef=geographytreedef_1, parent=self.continent_1
        )

        self.root_2 = self.make_geotree("Earth", "Planet", treedef=geographytreedef_2)
        self.continent_2 = self.make_geotree(
            "South America", "Continent", treedef=geographytreedef_2, parent=self.root_2
        )
        self.country_2 = self.make_geotree(
            "Brazil", "Country", treedef=geographytreedef_2, parent=self.continent_2
        )

        return (collection_1, collection_2, geographytreedef_1, geographytreedef_2)

    def _create_mock_lithostrat(self):
        lithostrat_1 = Lithostrattreedef.objects.create(name="Test Lth1")
        lithostrat_2 = Lithostrattreedef.objects.create(name="Test Lth2")

        discipline_1 = Discipline.objects.create(
            geologictimeperiodtreedef=self.geologictimeperiodtreedef,
            geographytreedef=self.geographytreedef,
            lithostrattreedef=lithostrat_1,
            division=self.division,
            datatype=self.datatype,
            type="paleobotany",
        )

        discipline_2 = Discipline.objects.create(
            geologictimeperiodtreedef=self.geologictimeperiodtreedef,
            geographytreedef=self.geographytreedef,
            lithostrattreedef=lithostrat_2,
            division=self.division,
            datatype=self.datatype,
            type="paleobotany",
        )

        collection_1, collection_2 = self._create_collection_pair(
            discipline_1, discipline_2
        )

        self.make_lithostrat_ranks(lithostrat_1)
        self.make_lithostrat_ranks(lithostrat_2)

        self._set_attr(
            "_tree_lithostrat_entry_ranks",
            self._tree_lithostrat_root_1.treeentries.create(
                name="Ranks",
                definition=lithostrat_1,
                rankid=self._tree_lithostrat_root_1.rankid,
            ),
        )

        self._set_attr(
            "_tree_lithostrat_entry_layer",
            self._tree_lithostrat_layer_1.treeentries.create(
                name="First Layer (tree 1)",
            ),
        )

        self._set_attr(
            "_tree_lithostrat_entry_ranks",
            self._tree_lithostrat_root_2.treeentries.create(
                name="Ranks (tree 2)",
                definition=lithostrat_2,
                rankid=self._tree_lithostrat_root_2.rankid,
            ),
        )

        self._set_attr(
            "_tree_lithostrat_entry_layer",
            self._tree_lithostrat_layer_2.treeentries.create(
                name="First Layer (tree 2)",
            ),
        )

        return (collection_1, collection_2, lithostrat_1, lithostrat_2)

    def _create_mock_geologictimeperiod(self):
        treedef_1 = Geologictimeperiodtreedef.objects.create(name="Test gtptd1")
        treedef_2 = Geologictimeperiodtreedef.objects.create(name="Test gtptd2")
        self.make_geologictimeperiod_ranks(treedef_1)
        self.make_geologictimeperiod_ranks(treedef_2)

        discipline_1 = Discipline.objects.create(
            geologictimeperiodtreedef=treedef_1,
            geographytreedef=self.geographytreedef,
            division=self.division,
            datatype=self.datatype,
            type="paleobotany",
        )

        discipline_2 = Discipline.objects.create(
            geologictimeperiodtreedef=treedef_2,
            geographytreedef=self.geographytreedef,
            division=self.division,
            datatype=self.datatype,
            type="paleobotany",
        )

        collection_1, collection_2 = self._create_collection_pair(
            discipline_1, discipline_2
        )

        self._set_attr(
            "_tree_geologictimeperiod_entry_root",
            self._tree_geologictimeperiod_root_1.treeentries.create(
                name="Root (tree 1)",
                definition=treedef_1,
                rankid=self._tree_geologictimeperiod_root_1.rankid,
            ),
        )

        self._set_attr(
            "_tree_geologictimeperiod_entry_cenozoic",
            self._tree_geologictimeperiod_erathem_1.treeentries.create(
                name="Cenozoic (tree 1)",
            ),
        )

        self._set_attr(
            "_tree_geologictimeperiod_entry_paleogene",
            self._tree_geologictimeperiod_period_1.treeentries.create(
                name="Paleogene (tree 1)",
            ),
        )

        self._set_attr(
            "_tree_geologictimeperiod_entry_root",
            self._tree_geologictimeperiod_root_2.treeentries.create(
                name="Root (tree 2)",
                definition=treedef_2,
                rankid=self._tree_geologictimeperiod_root_2.rankid,
            ),
        )

        self._set_attr(
            "_tree_geologictimeperiod_entry_cenozoic",
            self._tree_geologictimeperiod_erathem_2.treeentries.create(
                name="Cenozoic (tree 2)",
                parent=self._tree_geologictimeperiod_entry_root_2,
            ),
        )

        self._set_attr(
            "_tree_geologictimeperiod_entry_paleogene",
            self._tree_geologictimeperiod_period_2.treeentries.create(
                name="Paleogene (tree 2)",
                parent=self._tree_geologictimeperiod_entry_cenozoic_2,
            ),
        )

        return (collection_1, collection_2, treedef_1, treedef_2)

    def _create_mock_tectonic_unit(self):
        treedef_1 = Tectonicunittreedef.objects.create(name="Test Tectonic 1")
        treedef_2 = Tectonicunittreedef.objects.create(name="Test Tectonic 2")

        self.make_tectonicunit_ranks(treedef_1)
        self.make_tectonicunit_ranks(treedef_2)

        discipline_1 = Discipline.objects.create(
            geologictimeperiodtreedef=self.geologictimeperiodtreedef,
            geographytreedef=self.geographytreedef,
            division=self.division,
            datatype=self.datatype,
            type="paleobotany",
            tectonicunittreedef=treedef_1,
        )

        discipline_2 = Discipline.objects.create(
            geologictimeperiodtreedef=self.geologictimeperiodtreedef,
            geographytreedef=self.geographytreedef,
            division=self.division,
            datatype=self.datatype,
            type="paleobotany",
            tectonicunittreedef=treedef_2,
        )

        collection_1, collection_2 = self._create_collection_pair(
            discipline_1, discipline_2
        )

        self._set_attr(
            "_tree_tectonicunit_entry_root",
            self._tree_tectonicunit_root_1.treeentries.create(
                name="Root (tree 1)",
                definition=treedef_1,
                rankid=self._tree_tectonicunit_root_1.rankid,
            ),
        )

        self._set_attr(
            "_tree_tectonicunit_entry_first_child",
            self._tree_tectonicunit_first_rank_1.treeentries.create(
                name="Some First Child (tree 1)",
                definition=treedef_1,
            ),
        )

        self._set_attr(
            "_tree_tectonicunit_entry_root",
            self._tree_tectonicunit_root_2.treeentries.create(
                name="Root (tree 2)",
                definition=treedef_2,
                rankid=self._tree_tectonicunit_root_2.rankid,
            ),
        )

        self._set_attr(
            "_tree_tectonicunit_entry_first_child",
            self._tree_tectonicunit_first_rank_2.treeentries.create(
                name="Some First Child (tree 2)",
                definition=treedef_2,
            ),
        )

        return (collection_1, collection_2, treedef_1, treedef_2)

    def _create_mock_storage(self):
        self.storage_tree_def = Storagetreedef.objects.create(name="Test storage tree")
        self._update(self.institution, dict(storagetreedef=self.storage_tree_def))
        self._tree_root = self.storage_tree_def.treedefitems.create(
            name="Root", rankid=0
        )
        self._tree_building = self.storage_tree_def.treedefitems.create(
            name="Building", rankid=50
        )
        self._tree_room = self.storage_tree_def.treedefitems.create(
            name="Room", rankid=100
        )

        self.root = self.make_storagetree("Root", "Root")
        self.building_1 = self.make_storagetree(
            "Building 1", "Building", parent=self.root
        )
        self.room_1 = self.make_storagetree("Room 1", "Room", parent=self.building_1)

        self.building_2 = self.make_storagetree(
            "Building 2", "Building", parent=self.root
        )
        self.room_2 = self.make_storagetree("Room 2", "Room", parent=self.building_2)
        self.room_3 = self.make_storagetree("Room 3", "Room", parent=self.building_2)

    def test_accession_global_scope(self):

        self._update(self.institution, dict(isaccessionsglobal=True))

        division_2 = Division.objects.create(
            institution=self.institution, name="Test Division2"
        )

        acc_1 = Accession.objects.create(
            accessionnumber="10", division_id=self.division.id
        )
        acc_2 = Accession.objects.create(
            accessionnumber="13", division_id=division_2.id
        )

        paths = [["accessionNumber"], ["division", "name"]]

        base_table, query_fields = make_query_fields_test("accession", paths)

        self.assertCountEqual(
            self._get_results(base_table, query_fields),
            [(acc_1.id, "10", "Test Division"), (acc_2.id, "13", "Test Division2")],
        )

    def test_accession_division_scope(self):

        self._update(self.institution, dict(isaccessionsglobal=False))

        division_2 = Division.objects.create(
            institution=self.institution, name="Test Division2"
        )

        acc_1 = Accession.objects.create(
            accessionnumber="10", division_id=self.division.id
        )
        acc_2 = Accession.objects.create(
            accessionnumber="13", division_id=division_2.id
        )

        paths = [["accessionNumber"], ["division", "name"]]

        base_table, query_fields = make_query_fields_test("accession", paths)

        self.assertCountEqual(
            self._get_results(base_table, query_fields),
            [
                (acc_1.id, "10", "Test Division"),
            ],
        )

    def test_single_taxon(self):
        collection_2, taxondef_1, taxondef_2 = self._create_simple_taxon()
        self._populate_taxon_tree(taxondef_1, taxondef_2)

        base_table, query_fields = make_query_fields_test("taxon", self.tree_paths)

        self.assertCountEqual(
            self._get_results(base_table, query_fields),
            [
                (self.root_1.id, "Life", 0, 0, "Taxonomy Root", "Test taxon1"),
                (self.animalia_1.id, "Animalia", 10, 10, "Kingdom", "Test taxon1"),
                (self.phylum_1.id, "TestPhylum", 30, 30, "Phylum", "Test taxon1"),
            ],
        )

        self.assertCountEqual(
            self._get_results(base_table, query_fields, collection_2),
            [
                (self.root_2.id, "Life", 0, 0, "Taxonomy Root", "Test taxon2"),
                (self.plantae_2.id, "Plantae", 10, 10, "Kingdom", "Test taxon2"),
                (
                    self.phylum_2.id,
                    "TestPhylumPlantae",
                    30,
                    30,
                    "Phylum",
                    "Test taxon2",
                ),
            ],
        )

    def test_multiple_taxon(self):
        collection_2, taxondef_1, taxondef_2 = self._create_multiple_taxon()
        self._populate_taxon_tree(taxondef_1, taxondef_2)

        base_table, query_fields = make_query_fields_test("taxon", self.tree_paths)

        self.assertCountEqual(
            self._get_results(base_table, query_fields),
            [
                (self.root_1.id, "Life", 0, 0, "Taxonomy Root", "Test taxon1"),
                (self.animalia_1.id, "Animalia", 10, 10, "Kingdom", "Test taxon1"),
                (self.phylum_1.id, "TestPhylum", 30, 30, "Phylum", "Test taxon1"),
            ],
        )

        self.assertCountEqual(
            self._get_results(base_table, query_fields, collection_2),
            [
                (self.root_2.id, "Life", 0, 0, "Taxonomy Root", "Test taxon2"),
                (self.plantae_2.id, "Plantae", 10, 10, "Kingdom", "Test taxon2"),
                (
                    self.phylum_2.id,
                    "TestPhylumPlantae",
                    30,
                    30,
                    "Phylum",
                    "Test taxon2",
                ),
                (self.root_1.id, "Life", 0, 0, "Taxonomy Root", "Test taxon1"),
                (self.animalia_1.id, "Animalia", 10, 10, "Kingdom", "Test taxon1"),
                (self.phylum_1.id, "TestPhylum", 30, 30, "Phylum", "Test taxon1"),
            ],
        )

    def test_simple_taxontreedefitem(self):
        collection_2, taxondef_1, taxondef_2 = self._create_simple_taxon()
        self.make_taxon_ranks(taxondef_1)
        self.make_taxon_ranks(taxondef_2)

        base_table, query_fields = make_query_fields_test(
            "taxontreedefitem", self.tree_item_paths
        )
        raw_results = self._get_results(base_table, query_fields)

        results = [
            (None, "Taxonomy Root", 0, "Test taxon1"),
            (None, "Kingdom", 10, "Test taxon1"),
            (None, "Phylum", 30, "Test taxon1"),
            (None, "Class", 60, "Test taxon1"),
            (None, "Order", 100, "Test taxon1"),
            (None, "Superfamily", 130, "Test taxon1"),
            (None, "Family", 140, "Test taxon1"),
            (None, "Genus", 180, "Test taxon1"),
            (None, "Subgenus", 190, "Test taxon1"),
            (None, "Species", 220, "Test taxon1"),
            (None, "Subspecies", 230, "Test taxon1"),
        ]

        mapped_results = [
            tuple([taxon_rank_getter(result[1], taxondef_1).id, *list(result[1:])])
            for result in results
        ]

        self.assertCountEqual(mapped_results, raw_results)

        treedef_2_results = [
            (None, "Taxonomy Root", 0, "Test taxon2"),
            (None, "Kingdom", 10, "Test taxon2"),
            (None, "Phylum", 30, "Test taxon2"),
            (None, "Class", 60, "Test taxon2"),
            (None, "Order", 100, "Test taxon2"),
            (None, "Superfamily", 130, "Test taxon2"),
            (None, "Family", 140, "Test taxon2"),
            (None, "Genus", 180, "Test taxon2"),
            (None, "Subgenus", 190, "Test taxon2"),
            (None, "Species", 220, "Test taxon2"),
            (None, "Subspecies", 230, "Test taxon2"),
        ]

        mapped_results_treedef_2 = [
            tuple([taxon_rank_getter(result[1], taxondef_2).id, *list(result[1:])])
            for result in treedef_2_results
        ]

        self.assertCountEqual(
            self._get_results(base_table, query_fields, collection_2),
            mapped_results_treedef_2,
        )

    def test_multiple_taxontreedefitem(self):
        collection_2, taxondef_1, taxondef_2 = self._create_multiple_taxon()
        self.make_taxon_ranks(taxondef_1)
        self.make_taxon_ranks(taxondef_2)

        base_table, query_fields = make_query_fields_test(
            "taxontreedefitem", self.tree_item_paths
        )
        raw_results = self._get_results(base_table, query_fields)

        results = [
            (None, "Taxonomy Root", 0, "Test taxon1"),
            (None, "Kingdom", 10, "Test taxon1"),
            (None, "Phylum", 30, "Test taxon1"),
            (None, "Class", 60, "Test taxon1"),
            (None, "Order", 100, "Test taxon1"),
            (None, "Superfamily", 130, "Test taxon1"),
            (None, "Family", 140, "Test taxon1"),
            (None, "Genus", 180, "Test taxon1"),
            (None, "Subgenus", 190, "Test taxon1"),
            (None, "Species", 220, "Test taxon1"),
            (None, "Subspecies", 230, "Test taxon1"),
        ]

        mapped_results = [
            tuple([taxon_rank_getter(result[1], taxondef_1).id, *list(result[1:])])
            for result in results
        ]

        self.assertCountEqual(mapped_results, raw_results)

        treedef_2_results = [
            (None, "Taxonomy Root", 0, "Test taxon2"),
            (None, "Kingdom", 10, "Test taxon2"),
            (None, "Phylum", 30, "Test taxon2"),
            (None, "Class", 60, "Test taxon2"),
            (None, "Order", 100, "Test taxon2"),
            (None, "Superfamily", 130, "Test taxon2"),
            (None, "Family", 140, "Test taxon2"),
            (None, "Genus", 180, "Test taxon2"),
            (None, "Subgenus", 190, "Test taxon2"),
            (None, "Species", 220, "Test taxon2"),
            (None, "Subspecies", 230, "Test taxon2"),
        ]

        mapped_results_treedef_2 = [
            tuple([taxon_rank_getter(result[1], taxondef_2).id, *list(result[1:])])
            for result in treedef_2_results
        ]

        self.assertCountEqual(
            self._get_results(base_table, query_fields, collection_2),
            [*mapped_results_treedef_2, *mapped_results],
        )

    def test_geography(self):

        (collection_1, collection_2, geographytreedef_1, geographytreedef_2) = (
            self._create_mock_geotree()
        )

        base_table, query_fields = make_query_fields_test("geography", self.tree_paths)

        self.assertCountEqual(
            self._get_results(base_table, query_fields, collection_1),
            [
                (self.root_1.id, "Earth", 0, 0, "Planet", "Test gtd1"),
                (
                    self.continent_1.id,
                    "North America",
                    100,
                    100,
                    "Continent",
                    "Test gtd1",
                ),
                (self.country_1.id, "USA", 200, 200, "Country", "Test gtd1"),
            ],
        )

        self.assertCountEqual(
            self._get_results(base_table, query_fields, collection_2),
            [
                (self.root_2.id, "Earth", 0, 0, "Planet", "Test gtd2"),
                (
                    self.continent_2.id,
                    "South America",
                    100,
                    100,
                    "Continent",
                    "Test gtd2",
                ),
                (self.country_2.id, "Brazil", 200, 200, "Country", "Test gtd2"),
            ],
        )

    def test_geographydefitem(self):
        (collection_1, collection_2, geographytreedef_1, geographytreedef_2) = (
            self._create_mock_geotree()
        )

        base_table, query_fields = make_query_fields_test(
            "geographytreedefitem", self.tree_item_paths
        )
        treedef_1_raw_results = self._get_results(
            base_table, query_fields, collection_1
        )

        treedef_1_expected_results = [
            (
                geo_rank_getter("Planet", geographytreedef_1).id,
                "Planet",
                0,
                "Test gtd1",
            ),
            (
                geo_rank_getter("Continent", geographytreedef_1).id,
                "Continent",
                100,
                "Test gtd1",
            ),
            (
                geo_rank_getter("Country", geographytreedef_1).id,
                "Country",
                200,
                "Test gtd1",
            ),
            (
                geo_rank_getter("State", geographytreedef_1).id,
                "State",
                300,
                "Test gtd1",
            ),
            (
                geo_rank_getter("County", geographytreedef_1).id,
                "County",
                400,
                "Test gtd1",
            ),
            (geo_rank_getter("City", geographytreedef_1).id, "City", 500, "Test gtd1"),
        ]

        self.assertCountEqual(treedef_1_expected_results, treedef_1_raw_results)

        treedef_2_raw_results = self._get_results(
            base_table, query_fields, collection_2
        )

        treedef_2_expected_results = [
            (
                geo_rank_getter("Planet", geographytreedef_2).id,
                "Planet",
                0,
                "Test gtd2",
            ),
            (
                geo_rank_getter("Continent", geographytreedef_2).id,
                "Continent",
                100,
                "Test gtd2",
            ),
            (
                geo_rank_getter("Country", geographytreedef_2).id,
                "Country",
                200,
                "Test gtd2",
            ),
            (
                geo_rank_getter("State", geographytreedef_2).id,
                "State",
                300,
                "Test gtd2",
            ),
            (
                geo_rank_getter("County", geographytreedef_2).id,
                "County",
                400,
                "Test gtd2",
            ),
            (geo_rank_getter("City", geographytreedef_2).id, "City", 500, "Test gtd2"),
        ]

        self.assertCountEqual(treedef_2_expected_results, treedef_2_raw_results)

    def test_lithostrat(self):
        (collection_1, collection_2, lithostrat_1, lithostrat_2) = (
            self._create_mock_lithostrat()
        )

        base_table, query_fields = make_query_fields_test("lithostrat", self.tree_paths)

        self.assertCountEqual(
            self._get_results(base_table, query_fields, collection_1),
            [
                (
                    self._tree_lithostrat_entry_ranks_1.id,
                    "Ranks",
                    0,
                    0,
                    "Root",
                    "Test Lth1",
                ),
                (
                    self._tree_lithostrat_entry_layer_1.id,
                    "First Layer (tree 1)",
                    100,
                    100,
                    "Layer",
                    "Test Lth1",
                ),
            ],
        )

        self.assertCountEqual(
            self._get_results(base_table, query_fields, collection_2),
            [
                (
                    self._tree_lithostrat_entry_ranks_2.id,
                    "Ranks (tree 2)",
                    0,
                    0,
                    "Root",
                    "Test Lth2",
                ),
                (
                    self._tree_lithostrat_entry_layer_2.id,
                    "First Layer (tree 2)",
                    100,
                    100,
                    "Layer",
                    "Test Lth2",
                ),
            ],
        )

    def test_lithostratdefitem(self):
        (collection_1, collection_2, lithostrattreedef_1, lithostrattreedef_2) = (
            self._create_mock_lithostrat()
        )

        base_table, query_fields = make_query_fields_test(
            "lithostrattreedefitem", self.tree_item_paths
        )

        self.assertCountEqual(
            self._get_results(base_table, query_fields, collection_1),
            [
                (self._tree_lithostrat_root_1.id, "Root", 0, "Test Lth1"),
                (self._tree_lithostrat_layer_1.id, "Layer", 100, "Test Lth1"),
            ],
        )

        self.assertCountEqual(
            self._get_results(base_table, query_fields, collection_2),
            [
                (self._tree_lithostrat_root_2.id, "Root", 0, "Test Lth2"),
                (self._tree_lithostrat_layer_2.id, "Layer", 100, "Test Lth2"),
            ],
        )

    def test_geologictimeperiod(self):
        collection_1, collection_2, *_ = self._create_mock_geologictimeperiod()

        base_table, query_fields = make_query_fields_test(
            "geologictimeperiod", self.tree_paths
        )

        self.assertCountEqual(
            self._get_results(base_table, query_fields, collection_1),
            [
                (
                    self._tree_geologictimeperiod_entry_root_1.id,
                    "Root (tree 1)",
                    0,
                    0,
                    "Root",
                    "Test gtptd1",
                ),
                (
                    self._tree_geologictimeperiod_entry_cenozoic_1.id,
                    "Cenozoic (tree 1)",
                    100,
                    100,
                    "Erathem",
                    "Test gtptd1",
                ),
                (
                    self._tree_geologictimeperiod_entry_paleogene_1.id,
                    "Paleogene (tree 1)",
                    200,
                    200,
                    "Period",
                    "Test gtptd1",
                ),
            ],
        )

        self.assertCountEqual(
            self._get_results(base_table, query_fields, collection_2),
            [
                (
                    self._tree_geologictimeperiod_entry_root_2.id,
                    "Root (tree 2)",
                    0,
                    0,
                    "Root",
                    "Test gtptd2",
                ),
                (
                    self._tree_geologictimeperiod_entry_cenozoic_2.id,
                    "Cenozoic (tree 2)",
                    100,
                    100,
                    "Erathem",
                    "Test gtptd2",
                ),
                (
                    self._tree_geologictimeperiod_entry_paleogene_2.id,
                    "Paleogene (tree 2)",
                    200,
                    200,
                    "Period",
                    "Test gtptd2",
                ),
            ],
        )

    def test_geologictimeperioddefitem(self):
        collection_1, collection_2, *_ = self._create_mock_geologictimeperiod()

        base_table, query_fields = make_query_fields_test(
            "geologictimeperiodtreedefitem", self.tree_item_paths
        )

        self.assertCountEqual(
            self._get_results(base_table, query_fields, collection_1),
            [
                (self._tree_geologictimeperiod_root_1.id, "Root", 0, "Test gtptd1"),
                (
                    self._tree_geologictimeperiod_erathem_1.id,
                    "Erathem",
                    100,
                    "Test gtptd1",
                ),
                (
                    self._tree_geologictimeperiod_period_1.id,
                    "Period",
                    200,
                    "Test gtptd1",
                ),
            ],
        )

        self.assertCountEqual(
            self._get_results(base_table, query_fields, collection_2),
            [
                (self._tree_geologictimeperiod_root_2.id, "Root", 0, "Test gtptd2"),
                (
                    self._tree_geologictimeperiod_erathem_2.id,
                    "Erathem",
                    100,
                    "Test gtptd2",
                ),
                (
                    self._tree_geologictimeperiod_period_2.id,
                    "Period",
                    200,
                    "Test gtptd2",
                ),
            ],
        )

    def test_tectonicunit(self):
        collection_1, collection_2, *_ = self._create_mock_tectonic_unit()

        base_table, query_fields = make_query_fields_test(
            "tectonicunit", self.tree_paths
        )

        self.assertCountEqual(
            self._get_results(base_table, query_fields, collection_1),
            [
                (
                    self._tree_tectonicunit_entry_root_1.id,
                    "Root (tree 1)",
                    0,
                    0,
                    "Root  Test Tectonic 1",
                    "Test Tectonic 1",
                ),
                (
                    self._tree_tectonicunit_entry_first_child_1.id,
                    "Some First Child (tree 1)",
                    50,
                    50,
                    "Rank 1 Test Tectonic 1",
                    "Test Tectonic 1",
                ),
            ],
        )

        self.assertCountEqual(
            self._get_results(base_table, query_fields, collection_2),
            [
                (
                    self._tree_tectonicunit_entry_root_2.id,
                    "Root (tree 2)",
                    0,
                    0,
                    "Root  Test Tectonic 2",
                    "Test Tectonic 2",
                ),
                (
                    self._tree_tectonicunit_entry_first_child_2.id,
                    "Some First Child (tree 2)",
                    50,
                    50,
                    "Rank 1 Test Tectonic 2",
                    "Test Tectonic 2",
                ),
            ],
        )

    def test_storage(self):

        self._create_mock_storage()

        base_table, query_fields = make_query_fields_test("storage", self.tree_paths)

        expected_results = [
            (self.root.id, "Root", 0, 0, "Root", "Test storage tree"),
            (self.building_1.id, "Building 1", 50, 50, "Building", "Test storage tree"),
            (self.room_1.id, "Room 1", 100, 100, "Room", "Test storage tree"),
            (self.building_2.id, "Building 2", 50, 50, "Building", "Test storage tree"),
            (self.room_2.id, "Room 2", 100, 100, "Room", "Test storage tree"),
            (self.room_3.id, "Room 3", 100, 100, "Room", "Test storage tree"),
        ]

        self.assertCountEqual(
            expected_results, self._get_results(base_table, query_fields)
        )

    def test_storagetreedefitem(self):
        self._create_mock_storage()
        base_table, query_fields = make_query_fields_test(
            "storagetreedefitem", self.tree_item_paths
        )

        self.assertCountEqual(
            self._get_results(base_table, query_fields),
            [
                (self._tree_root.id, "Root", 0, "Test storage tree"),
                (self._tree_building.id, "Building", 50, "Test storage tree"),
                (self._tree_room.id, "Room", 100, "Test storage tree"),
            ],
        )

    def _create_division(self):
        division_1 = Division.objects.create(
            institution=self.institution, name="Division 1"
        )
        division_2 = Division.objects.create(
            institution=self.institution, name="Division 2"
        )
        discipline_1 = Discipline.objects.create(
            geologictimeperiodtreedef=self.geologictimeperiodtreedef,
            geographytreedef=self.geographytreedef,
            division=division_1,
            datatype=self.datatype,
            type="paleobotany",
        )

        discipline_2 = Discipline.objects.create(
            geologictimeperiodtreedef=self.geologictimeperiodtreedef,
            geographytreedef=self.geographytreedef,
            division=division_2,
            datatype=self.datatype,
            type="paleobotany",
        )

        collection_1, collection_2 = self._create_collection_pair(
            discipline_1, discipline_2
        )
        return (collection_1, division_1, collection_2, division_2)

    def test_agent_division(self):

        (collection_1, division_1, collection_2, division_2) = self._create_division()

        division_1_agent_1 = Agent.objects.create(
            agenttype=0,
            firstname="John (Division 1)",
            lastname="Doe",
            division=division_1,
        )

        division_1_agent_2 = Agent.objects.create(
            agenttype=0,
            firstname="Jane (Division 1)",
            lastname="DoT",
            division=division_1,
        )

        division_2_agent_1 = Agent.objects.create(
            agenttype=0,
            firstname="John (Division 2)",
            lastname="Doe",
            division=division_2,
        )

        division_2_agent_2 = Agent.objects.create(
            agenttype=0,
            firstname="Jane (Division 2)",
            lastname="DoT",
            division=division_2,
        )

        agent_fields = [["firstname"], ["lastname"]]

        base_table, query_fields = make_query_fields_test("agent", agent_fields)

        self.assertCountEqual(
            self._get_results(base_table, query_fields, collection_1),
            [
                (division_1_agent_1.id, "John (Division 1)", "Doe"),
                (division_1_agent_2.id, "Jane (Division 1)", "DoT"),
            ],
        )

        self.assertCountEqual(
            self._get_results(base_table, query_fields, collection_2),
            [
                (division_2_agent_1.id, "John (Division 2)", "Doe"),
                (division_2_agent_2.id, "Jane (Division 2)", "DoT"),
            ],
        )

    def test_repository_agreement(self):
        (collection_1, division_1, collection_2, division_2) = self._create_division()

        division_1_rep_1 = Repositoryagreement.objects.create(
            repositoryagreementnumber="Rep1 (Division 1)",
            division=division_1,
            originator=self.agent,
        )

        division_1_rep_2 = Repositoryagreement.objects.create(
            repositoryagreementnumber="Rep2 (Division 1)",
            division=division_1,
            originator=self.agent,
        )

        division_2_rep_1 = Repositoryagreement.objects.create(
            repositoryagreementnumber="Rep1 (Division 2)",
            division=division_2,
            originator=self.agent,
        )

        division_2_rep_2 = Repositoryagreement.objects.create(
            repositoryagreementnumber="Rep2 (Division 2)",
            division=division_2,
            originator=self.agent,
        )

        base_table, query_fields = make_query_fields_test(
            "Repositoryagreement", [["repositoryagreementnumber"], ["division", "name"]]
        )

        self.assertCountEqual(
            self._get_results(base_table, query_fields, collection_1),
            [
                (division_1_rep_1.id, "Rep1 (Division 1)", "Division 1"),
                (division_1_rep_2.id, "Rep2 (Division 1)", "Division 1"),
            ],
        )

        self.assertCountEqual(
            self._get_results(base_table, query_fields, collection_2),
            [
                (division_2_rep_1.id, "Rep1 (Division 2)", "Division 2"),
                (division_2_rep_2.id, "Rep2 (Division 2)", "Division 2"),
            ],
        )

    def test_exchangein(self):
        (collection_1, division_1, collection_2, division_2) = self._create_division()

        division_1_exchangein_1 = Exchangein.objects.create(
            agentcatalogedby=self.agent,
            division=division_1,
            agentreceivedfrom=self.agent,
            exchangeinnumber="Num1 (Division 1)",
        )

        division_1_exchangein_2 = Exchangein.objects.create(
            agentcatalogedby=self.agent,
            division=division_1,
            agentreceivedfrom=self.agent,
            exchangeinnumber="Num2 (Division 1)",
        )

        division_2_exchangein_1 = Exchangein.objects.create(
            agentcatalogedby=self.agent,
            division=division_2,
            agentreceivedfrom=self.agent,
            exchangeinnumber="Num1 (Division 2)",
        )

        division_2_exchangein_2 = Exchangein.objects.create(
            agentcatalogedby=self.agent,
            division=division_2,
            agentreceivedfrom=self.agent,
            exchangeinnumber="Num2 (Division 2)",
        )

        base_table, query_fields = make_query_fields_test(
            "Exchangein", [["exchangeinnumber"], ["division", "name"]]
        )

        self.assertCountEqual(
            self._get_results(base_table, query_fields, collection_1),
            [
                (division_1_exchangein_1.id, "Num1 (Division 1)", "Division 1"),
                (division_1_exchangein_2.id, "Num2 (Division 1)", "Division 1"),
            ],
        )

        self.assertCountEqual(
            self._get_results(base_table, query_fields, collection_2),
            [
                (division_2_exchangein_1.id, "Num1 (Division 2)", "Division 2"),
                (division_2_exchangein_2.id, "Num2 (Division 2)", "Division 2"),
            ],
        )

    def test_exchangeout(self):

        (collection_1, division_1, collection_2, division_2) = self._create_division()

        division_1_exchangeout_1 = Exchangeout.objects.create(
            agentcatalogedby=self.agent,
            agentsentto=self.agent,
            division=division_1,
            exchangeoutnumber="Num1 (Division 1)",
        )

        division_1_exchangeout_2 = Exchangeout.objects.create(
            agentcatalogedby=self.agent,
            agentsentto=self.agent,
            division=division_1,
            exchangeoutnumber="Num2 (Division 1)",
        )

        division_2_exchangeout_1 = Exchangeout.objects.create(
            agentcatalogedby=self.agent,
            agentsentto=self.agent,
            division=division_2,
            exchangeoutnumber="Num1 (Division 2)",
        )

        division_2_exchangeout_2 = Exchangeout.objects.create(
            agentcatalogedby=self.agent,
            agentsentto=self.agent,
            division=division_2,
            exchangeoutnumber="Num2 (Division 2)",
        )

        base_table, query_fields = make_query_fields_test(
            "Exchangeout", [["exchangeoutnumber"], ["division", "name"]]
        )

        self.assertCountEqual(
            self._get_results(base_table, query_fields, collection_1),
            [
                (division_1_exchangeout_1.id, "Num1 (Division 1)", "Division 1"),
                (division_1_exchangeout_2.id, "Num2 (Division 1)", "Division 1"),
            ],
        )

        self.assertCountEqual(
            self._get_results(base_table, query_fields, collection_2),
            [
                (division_2_exchangeout_1.id, "Num1 (Division 2)", "Division 2"),
                (division_2_exchangeout_2.id, "Num2 (Division 2)", "Division 2"),
            ],
        )

    def test_conserv_description(self):
        (collection_1, division_1, collection_2, division_2) = self._create_division()

        division_1_conv_1 = Conservdescription.objects.create(
            division=division_1, backgroundinfo="Conv1 (Division 1)"
        )

        division_1_conv_2 = Conservdescription.objects.create(
            division=division_1, backgroundinfo="Conv2 (Division 1)"
        )

        division_2_conv_1 = Conservdescription.objects.create(
            division=division_2, backgroundinfo="Conv1 (Division 2)"
        )

        division_2_conv_2 = Conservdescription.objects.create(
            division=division_2, backgroundinfo="Conv2 (Division 2)"
        )

        base_table, query_fields = make_query_fields_test(
            "Conservdescription", [["backgroundinfo"], ["division", "name"]]
        )

        self.assertCountEqual(
            [
                (division_1_conv_1.id, "Conv1 (Division 1)", "Division 1"),
                (division_1_conv_2.id, "Conv2 (Division 1)", "Division 1"),
            ],
            self._get_results(base_table, query_fields, collection_1),
        )

        self.assertCountEqual(
            [
                (division_2_conv_1.id, "Conv1 (Division 2)", "Division 2"),
                (division_2_conv_2.id, "Conv2 (Division 2)", "Division 2"),
            ],
            self._get_results(base_table, query_fields, collection_2),
        )

    def test_collection_scope(self):
        (collection_1, division_1, collection_2, division_2) = self._create_division()

        collection_1_picklist_1 = Picklist.objects.create(
            collection=collection_1, name="Picklist 1 (Collection 1)", type=0
        )

        collection_1_picklist_2 = Picklist.objects.create(
            collection=collection_1, name="Picklist 2 (Collection 1)", type=0
        )

        collection_2_picklist_1 = Picklist.objects.create(
            collection=collection_2, name="Picklist 1 (Collection 2)", type=0
        )

        collection_2_picklist_2 = Picklist.objects.create(
            collection=collection_2, name="Picklist 2 (Collection 2)", type=0
        )

        base_table, query_fields = make_query_fields_test("Picklist", [["name"]])

        self.assertCountEqual(
            self._get_results(base_table, query_fields, collection_1),
            [
                (collection_1_picklist_1.id, "Picklist 1 (Collection 1)"),
                (collection_1_picklist_2.id, "Picklist 2 (Collection 1)"),
            ],
        )

        self.assertCountEqual(
            self._get_results(base_table, query_fields, collection_2),
            [
                (collection_2_picklist_1.id, "Picklist 1 (Collection 2)"),
                (collection_2_picklist_2.id, "Picklist 2 (Collection 2)"),
            ],
        )

    def test_collection_member_scope(self):
        (collection_1, division_1, collection_2, division_2) = self._create_division()

        collection_1_inforeq_1 = Inforequest.objects.create(
            collectionmemberid=collection_1.id, firstname="Info 1 (Collection 1)"
        )

        collection_1_inforeq_2 = Inforequest.objects.create(
            collectionmemberid=collection_1.id, firstname="Info 2 (Collection 1)"
        )

        collection_2_inforeq_1 = Inforequest.objects.create(
            collectionmemberid=collection_2.id, firstname="Info 1 (Collection 2)"
        )

        collection_2_inforeq_2 = Inforequest.objects.create(
            collectionmemberid=collection_2.id, firstname="Info 2 (Collection 2)"
        )

        base_table, query_fields = make_query_fields_test(
            "Inforequest", [["firstname"]]
        )

        self.assertCountEqual(
            self._get_results(base_table, query_fields, collection_1),
            [
                (collection_1_inforeq_1.id, "Info 1 (Collection 1)"),
                (collection_1_inforeq_2.id, "Info 2 (Collection 1)"),
            ],
        )

        self.assertCountEqual(
            self._get_results(base_table, query_fields, collection_2),
            [
                (collection_2_inforeq_1.id, "Info 1 (Collection 2)"),
                (collection_2_inforeq_2.id, "Info 2 (Collection 2)"),
            ],
        )

    def test_discipline_scope(self):
        (collection_1, division_1, collection_2, division_2) = self._create_division()

        discipline_1_locality_1 = Locality.objects.create(
            localityname="Locality 1 (Discipline 1)", discipline=collection_1.discipline
        )

        discipline_1_locality_2 = Locality.objects.create(
            localityname="Locality 2 (Discipline 1)", discipline=collection_1.discipline
        )

        discipline_2_locality_1 = Locality.objects.create(
            localityname="Locality 1 (Discipline 2)", discipline=collection_2.discipline
        )

        discipline_2_locality_2 = Locality.objects.create(
            localityname="Locality 2 (Discipline 2)", discipline=collection_2.discipline
        )

        base_table, query_fields = make_query_fields_test(
            "Locality", [["localityname"]]
        )

        self.assertCountEqual(
            self._get_results(base_table, query_fields, collection_1),
            [
                (discipline_1_locality_1.id, "Locality 1 (Discipline 1)"),
                (discipline_1_locality_2.id, "Locality 2 (Discipline 1)"),
            ],
        )

        self.assertCountEqual(
            self._get_results(base_table, query_fields, collection_2),
            [
                (discipline_2_locality_1.id, "Locality 1 (Discipline 2)"),
                (discipline_2_locality_2.id, "Locality 2 (Discipline 2)"),
            ],
        )

    def test_division_scope_skipped(self):
        (collection_1, division_1, collection_2, division_2) = self._create_division()

        division_1_treatmentevent_1 = Treatmentevent.objects.create(
            fieldnumber="TE1 (Division 1)", division=division_1
        )

        division_1_treatmentevent_2 = Treatmentevent.objects.create(
            fieldnumber="TE2 (Division 1)", division=division_1
        )

        division_2_treatmentevent_1 = Treatmentevent.objects.create(
            fieldnumber="TE1 (Division 2)", division=division_2
        )

        division_2_treatmentevent_2 = Treatmentevent.objects.create(
            fieldnumber="TE2 (Division 2)", division=division_2
        )

        base_table, query_fields = make_query_fields_test(
            "Treatmentevent", [["fieldnumber"]]
        )

        expected_result = [
            (division_1_treatmentevent_1.id, "TE1 (Division 1)"),
            (division_1_treatmentevent_2.id, "TE2 (Division 1)"),
            (division_2_treatmentevent_1.id, "TE1 (Division 2)"),
            (division_2_treatmentevent_2.id, "TE2 (Division 2)"),
        ]

        self.assertCountEqual(
            self._get_results(base_table, query_fields, collection_1), expected_result
        )

        self.assertCountEqual(
            self._get_results(base_table, query_fields, collection_2), expected_result
        )

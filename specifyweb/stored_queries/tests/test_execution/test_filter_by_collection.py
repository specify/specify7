from contextlib import contextmanager
from specifyweb.specify.models import (
    Accession,
    Division,
    Geographytreedef,
    Geographytreedefitem,
    Geologictimeperiodtreedef,
    Lithostrattreedef,
    Storagetreedef,
    Taxon,
    Taxontreedefitem,
    Collection,
    Discipline,
    Tectonicunittreedef,
)
from specifyweb.specify.tests.test_tree_utils import TestMultipleTaxonTreeContext
from specifyweb.specify.tests.test_trees import SqlTreeSetup
from specifyweb.stored_queries.execution import build_query
from specifyweb.stored_queries.queryfield import QueryField
from specifyweb.stored_queries.queryfieldspec import QueryFieldSpec
from specifyweb.specify.models import datamodel


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

    # Below is taken from batch edit datasets.
    # TODO: Refactor those tests and make these part of SqlTreeSetup
    def make_query(self, field_spec, sort_type=0):
        return QueryField(
            fieldspec=field_spec,
            op_num=8,
            value=None,
            negate=False,
            display=True,
            format_name=None,
            sort_type=sort_type,
        )

    def make_query_fields(self, base_table, query_paths):
        added = [(base_table, *path) for path in query_paths]

        query_fields = [
            self.make_query(QueryFieldSpec.from_path(path), 0) for path in added
        ]

        return datamodel.get_table_strict(base_table), query_fields

    def _get_results(self, base_table, fields, collection=None):
        with TestFilterByCollection.test_session_context() as session:
            query, _ = build_query(
                session,
                collection or self.collection,
                self.specifyuser,
                base_table.tableId,
                fields,
            )

            return list(query)

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

        base_table, query_fields = self.make_query_fields("accession", paths)

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

        base_table, query_fields = self.make_query_fields("accession", paths)

        self.assertCountEqual(
            self._get_results(base_table, query_fields),
            [
                (acc_1.id, "10", "Test Division"),
            ],
        )

    def test_single_taxon(self):
        collection_2, taxondef_1, taxondef_2 = self._create_simple_taxon()
        self._populate_taxon_tree(taxondef_1, taxondef_2)

        base_table, query_fields = self.make_query_fields("taxon", self.tree_paths)

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

        base_table, query_fields = self.make_query_fields("taxon", self.tree_paths)

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

        base_table, query_fields = self.make_query_fields(
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

        base_table, query_fields = self.make_query_fields(
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

        base_table, query_fields = self.make_query_fields("geography", self.tree_paths)

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

        base_table, query_fields = self.make_query_fields(
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

        base_table, query_fields = self.make_query_fields("lithostrat", self.tree_paths)

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

        base_table, query_fields = self.make_query_fields(
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

        base_table, query_fields = self.make_query_fields(
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

        base_table, query_fields = self.make_query_fields(
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

        base_table, query_fields = self.make_query_fields(
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

        base_table, query_fields = self.make_query_fields("storage", self.tree_paths)

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
        base_table, query_fields = self.make_query_fields(
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

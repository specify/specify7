from contextlib import contextmanager
from specifyweb.specify.models import (
    Accession,
    Division,
    Geographytreedef,
    Taxon,
    Taxontreedefitem,
    Collection,
    Discipline,
)
from specifyweb.specify.tests.test_tree_utils import TestMultipleTaxonTreeContext
from specifyweb.specify.tests.test_trees import SqlTreeSetup
from specifyweb.stored_queries.execution import build_query
from specifyweb.stored_queries.queryfield import QueryField
from specifyweb.stored_queries.queryfieldspec import QueryFieldSpec
from specifyweb.specify.models import datamodel


def taxon_rank_getter(rank_name, treedef):
    return Taxontreedefitem.objects.get(name=rank_name, treedef=treedef)


class TestFilterByCollection(TestMultipleTaxonTreeContext, SqlTreeSetup):

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
        paths = [
            ["name"],
            ["rankid"],
            ["definitionitem", "rankid"],
            ["definitionitem", "name"],
            ["definition", "name"],
        ]

        base_table, query_fields = self.make_query_fields("taxon", paths)

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
        paths = [
            ["name"],
            ["rankid"],
            ["definitionitem", "rankid"],
            ["definitionitem", "name"],
            ["definition", "name"],
        ]

        base_table, query_fields = self.make_query_fields("taxon", paths)

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
        paths = [
            ["name"],
            ["rankid"],
            ["treeDef", "name"],
        ]

        base_table, query_fields = self.make_query_fields("taxontreedefitem", paths)
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
        paths = [
            ["name"],
            ["rankid"],
            ["treeDef", "name"],
        ]

        base_table, query_fields = self.make_query_fields("taxontreedefitem", paths)
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

        collection_1 = Collection.objects.create(
            catalognumformatname="test",
            collectionname="TestCollection1",
            isembeddedcollectingevent=False,
            discipline=self.discipline,
        )

        collection_2 = Collection.objects.create(
            catalognumformatname="test",
            collectionname="TestCollection2",
            isembeddedcollectingevent=False,
            discipline=self.discipline,
        )

        self.make_geography_ranks(geographytreedef_1)
        self.make_geography_ranks(geographytreedef_2)

from specifyweb.specify.models import (
    Collectingeventattribute,
    Determination,
    Taxon,
    Taxontreedefitem,
    datamodel,
)
from specifyweb.backend.stored_queries import models as models
from specifyweb.backend.stored_queries.queryfield import fields_from_json
from specifyweb.backend.stored_queries.execution import QuerySort, BuildQueryProps, build_query_construct_base, add_fields_to_query
from specifyweb.backend.stored_queries.tests.tests import SQLAlchemySetup

class TestBuildQuery(SQLAlchemySetup):
    def setUp(self):
        super().setUp()
        root_rank = Taxontreedefitem.objects.create(
            rankid=0,
            parent=None,
            treedef=self.taxontreedef,
            name="Root",
            title="Root"
        )
        kingdom_rank = Taxontreedefitem.objects.create(
            rankid=10,
            parent=root_rank,
            treedef=self.taxontreedef,
            name="Kingdom",
            title="Kingdom"
        )
        phylum_rank = Taxontreedefitem.objects.create(
            rankid=30,
            parent=kingdom_rank,
            treedef=self.taxontreedef,
            name="Phylum",
            title="Phylum"
        )
        family_rank = Taxontreedefitem.objects.create(
            rankid=140,
            parent=phylum_rank,
            treedef=self.taxontreedef,
            name="Family",
            title="Family"
        )
        genus_rank = Taxontreedefitem.objects.create(
            rankid=180,
            parent=family_rank,
            treedef=self.taxontreedef,
            name="Genus",
            title="Genus"
        )
        Taxontreedefitem.objects.create(
            rankid=220,
            parent=genus_rank,
            treedef=self.taxontreedef,
            name="Species",
            title="Species"
        )

    # This test helps guard against Issues like #8529 and #3369
    def test_no_extra_tree_joins(self):
        base_field_attrs = {
            "formatname": None,
            "isdisplay": True,
            "isnot": False,
            "isrelfld": False,
            # operstart 8 = Don't Care / Any
            # REFACTOR: Make an OpNum Enum with possible values
            # There's QUERYFIELD_OPERATION_NUMBER type, but no easy-to-read
            # value we can use
            "operstart": 8,
            "sorttype": QuerySort.NONE,
            "startvalue": "",
            "isstrict": False
        }
        base_query_fields = [
            {
                **base_field_attrs,
                "position": 0,
                "stringid": "1,9-determinations,4.taxon.Genus",
            },
            {
                **base_field_attrs,
                "position": 1,
                "stringid": "1,9-determinations,4-preferredTaxon.taxon.Species",
            }
        ]
        query_fields = fields_from_json(base_query_fields)
        collection = self.collection
        user = self.specifyuser
        tableid = datamodel.get_table_strict("collectionobject").tableId
        with TestBuildQuery.test_session_context() as session:
            props = BuildQueryProps()
            model = models.models_by_tableid[tableid]
            query_base = build_query_construct_base(
                session=session,
                collection=collection,
                user=user,
                model=model,
                props=props
            )
            query, _selected_fields, _order_by_expressions = add_fields_to_query(
                collection=collection,
                user=user,
                query=query_base,
                query_fields=query_fields,
                series=props.series,
                formatauditobjs=props.formatauditobjs
            )
            # There should be 5 objects in the join cache
            # CollectionObject -> Determinations
            # Determination -> taxon
            # Taxon Ranks for Determination -> taxon and preferredTaxon
            # Determination -> preferredTaxon
            self.assertEqual(
                len(query.join_cache),
                5
            )
            taxon_table = datamodel.get_table_strict("taxon")
            tree_rank_cache_keys = [
                cache_key
                for cache_key in query.join_cache
                if cache_key[-1] == "TreeRanks"
            ]
            self.assertEqual(
                len(tree_rank_cache_keys),
                2,
            )
            for cache_key in tree_rank_cache_keys:
                self.assertEqual(cache_key[1], taxon_table)
                ancestors, _treedefs = query.join_cache[cache_key]
                self.assertEqual(
                    len(ancestors),
                    len(self.taxontreedef.treedefitems.all()),
                )

    def _make_distinct_taxon_relationships(self):
        phylum_rank = self.taxontreedef.treedefitems.get(name="Phylum")
        order_rank = Taxontreedefitem.objects.create(
            rankid=100,
            parent=phylum_rank,
            treedef=self.taxontreedef,
            name="Order",
            title="Order",
        )
        family_rank = self.taxontreedef.treedefitems.get(name="Family")
        self._update(family_rank, {"parent": order_rank})
        ranks = list(self.taxontreedef.treedefitems.order_by("rankid"))

        species = []
        for relationship in ("Taxon", "Preferred", "Host"):
            parent = None
            for rank in ranks:
                parent = Taxon.objects.create(
                    name=f"{relationship} {rank.name}",
                    fullname=f"{relationship} {rank.name}",
                    parent=parent,
                    definition=self.taxontreedef,
                    definitionitem=rank,
                    rankid=rank.rankid,
                )
            species.append(parent)

        self._update(species[0], {"acceptedtaxon": species[1]})
        determination = Determination.objects.create(
            collectionobject=self.collectionobjects[0],
            taxon=species[0],
            preferredtaxon=species[1],
            iscurrent=True,
        )
        determination.refresh_from_db()
        self.assertEqual(determination.taxon.name, "Taxon Species")
        self.assertEqual(determination.preferredtaxon.name, "Preferred Species")
        attribute = Collectingeventattribute.objects.create(
            discipline=self.discipline,
            hosttaxon=species[2],
        )
        self._update(
            self.collectingevent, {"collectingeventattribute": attribute}
        )
        self._update(
            self.collectionobjects[0], {"collectingevent": self.collectingevent}
        )

    def _assert_taxon_relationship_values(self, fields):
        query_fields = fields_from_json([
            {
                "position": position,
                "stringid": stringid,
                "formatname": None,
                "isdisplay": True,
                "isnot": False,
                "isrelfld": False,
                "operstart": 1 if position == 0 else 8,
                "sorttype": QuerySort.NONE,
                "startvalue": "num-0" if position == 0 else "",
                "isstrict": False,
            }
            for position, (stringid, _) in enumerate([
                ("1.collectionobject.catalogNumber", "num-0"),
                *fields,
            ])
        ])
        results = self._get_results(
            datamodel.get_table_strict("CollectionObject"), query_fields
        )
        self.assertEqual(
            [tuple(row) for row in results],
            [(
                self.collectionobjects[0].id,
                "num-0",
                *(expected for _, expected in fields),
            )],
        )

    def test_explicit_ranks_share_the_same_relationship(self):
        self._make_distinct_taxon_relationships()
        self._assert_taxon_relationship_values([
            ("1,9-determinations,4.taxon.Order", "Taxon Order"),
            ("1,9-determinations,4.taxon.Species", "Taxon Species"),
        ])

    def test_any_rank_values_use_distinct_relationships(self):
        self._make_distinct_taxon_relationships()
        self._assert_taxon_relationship_values([
            ("1,9-determinations,4.taxon.name", "Taxon Species"),
            (
                "1,9-determinations,4-preferredTaxon.taxon.name",
                "Preferred Species",
            ),
            ("1,10,92,4-hostTaxon.taxon.name", "Host Species"),
        ])

    def test_explicit_ranks_use_distinct_relationships_in_either_field_order(self):
        self._make_distinct_taxon_relationships()
        taxon_fields = [
            ("1,9-determinations,4.taxon.Order", "Taxon Order"),
            ("1,9-determinations,4.taxon.Species", "Taxon Species"),
        ]
        preferred_fields = [
            (
                "1,9-determinations,4-preferredTaxon.taxon.Species",
                "Preferred Species",
            ),
            (
                "1,9-determinations,4-preferredTaxon.taxon.Order",
                "Preferred Order",
            ),
        ]
        for first, second in (
            (taxon_fields, preferred_fields),
            (preferred_fields, taxon_fields),
        ):
            with self.subTest(first_relationship=first[0][0]):
                self._assert_taxon_relationship_values([*first, *second])

    def test_explicit_ranks_use_three_distinct_relationships(self):
        self._make_distinct_taxon_relationships()
        fields = [
            ("1,9-determinations,4.taxon.Order", "Taxon Order"),
            (
                "1,9-determinations,4-preferredTaxon.taxon.Species",
                "Preferred Species",
            ),
            ("1,10,92,4-hostTaxon.taxon.Species", "Host Species"),
        ]
        for ordered_fields in (fields, list(reversed(fields))):
            with self.subTest(first_relationship=ordered_fields[0][0]):
                self._assert_taxon_relationship_values(ordered_fields)

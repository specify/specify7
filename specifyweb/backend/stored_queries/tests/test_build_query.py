import re

from sqlalchemy.dialects import mysql

from specifyweb.specify.models import (
    Collectingeventattribute,
    Determination,
    Taxon,
    Taxontreedefitem,
    datamodel,
)
from specifyweb.backend.stored_queries import models as models
from specifyweb.backend.stored_queries.queryfield import fields_from_json
from specifyweb.backend.stored_queries.execution import (
    QuerySort,
    BuildQueryProps,
    build_query,
    build_query_construct_base,
    add_fields_to_query,
)
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
            # Three relationship joins and at most one join per requested rank.
            self._assert_join_budget(query.query, 5)

    def _assert_join_budget(self, query, max_joins):
        statement = str(query.statement.compile(dialect=mysql.dialect()))
        join_count = len(re.findall(r"\bJOIN\b", statement, flags=re.IGNORECASE))
        self.assertLessEqual(
            join_count,
            max_joins,
            f"Generated {join_count} JOINs; expected at most {max_joins}:\n{statement}",
        )

    def _make_distinct_taxon_relationships(self, depth=7):
        phylum_rank = self.taxontreedef.treedefitems.get(name="Phylum")
        order_rank = Taxontreedefitem.objects.create(
            rankid=100,
            parent=phylum_rank,
            treedef=self.taxontreedef,
            name="Order",
            title="Order",
        )
        # Build deep fixtures without invoking the unrelated full-name join generator.
        intermediate_ranks = Taxontreedefitem.objects.bulk_create([
            Taxontreedefitem(
                rankid=101 + index,
                treedef=self.taxontreedef,
                name=f"Intermediate {index}",
                title=f"Intermediate {index}",
            )
            for index in range(depth - 7)
        ])
        parent_rank = order_rank
        for rank in intermediate_ranks:
            rank.parent = parent_rank
            parent_rank = rank
        family_rank = self.taxontreedef.treedefitems.get(name="Family")
        family_rank.parent = parent_rank
        Taxontreedefitem.objects.bulk_update([*intermediate_ranks, family_rank], ["parent"])
        ranks = list(self.taxontreedef.treedefitems.order_by("rankid"))
        self.assertEqual(len(ranks), depth)

        species = []
        for relationship_index, relationship in enumerate(("Taxon", "Preferred", "Host")):
            parent = None
            for rank_index, rank in enumerate(ranks):
                parent = Taxon(
                    name=f"{relationship} {rank.name}",
                    fullname=f"{relationship} {rank.name}",
                    parent=parent,
                    definition=self.taxontreedef,
                    definitionitem=rank,
                    rankid=rank.rankid,
                    nodenumber=relationship_index * depth + rank_index + 1,
                    highestchildnodenumber=(relationship_index + 1) * depth,
                )
                parent.save(skip_tree_extras=True)
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

    def _assert_taxon_relationship_values(self, fields, max_joins=None):
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
        with self.__class__.test_session_context() as session:
            query, _ = build_query(
                session,
                self.collection,
                self.specifyuser,
                datamodel.get_table_strict("CollectionObject").tableId,
                query_fields,
            )
            # Check before execution so deep-tree regressions cannot hit MySQL's table limit.
            if max_joins is not None:
                self._assert_join_budget(query, max_joins)
            results = list(query)
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

    def test_rank_fields_share_one_join(self):
        self._make_distinct_taxon_relationships()
        genus = Taxon.objects.get(name="Taxon Genus")
        Taxon.objects.filter(id=genus.id).update(author="Genus author")
        self._assert_taxon_relationship_values([
            ("1,9-determinations,4.taxon.Genus", "Taxon Genus"),
            ("1,9-determinations,4.taxon.Genus Author", "Genus author"),
            ("1,9-determinations,4.taxon.Genus ID", genus.id),
        ], max_joins=3)

    def test_standalone_root_rank_without_node_numbers(self):
        root_rank = self.taxontreedef.treedefitems.get(name="Root")
        root = Taxon.objects.create(
            name="Standalone root",
            fullname="Standalone root",
            definition=self.taxontreedef,
            definitionitem=root_rank,
            rankid=root_rank.rankid,
        )
        self.assertIsNone(root.nodenumber)
        self.assertIsNone(root.highestchildnodenumber)
        Determination.objects.create(
            collectionobject=self.collectionobjects[0],
            taxon=root,
            preferredtaxon=root,
            iscurrent=True,
        )
        self._assert_taxon_relationship_values([
            ("1,9-determinations,4.taxon.Root", root.name),
            ("1,9-determinations,4.taxon.Root ID", root.id),
            ("1,9-determinations,4.taxon.Genus", None),
        ], max_joins=4)

    def test_missing_taxon_relationship_keeps_null_rank_values(self):
        self._make_distinct_taxon_relationships()
        Determination.objects.filter(
            collectionobject=self.collectionobjects[0]
        ).update(preferredtaxon=None)
        self._assert_taxon_relationship_values([
            ("1,9-determinations,4.taxon.Genus", "Taxon Genus"),
            ("1,9-determinations,4-preferredTaxon.taxon.Genus", None),
            ("1,9-determinations,4-preferredTaxon.taxon.Species", None),
        ], max_joins=6)

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

    def _assert_genus_species_relationships(
        self, depth, include_host=False, max_joins=None
    ):
        self._make_distinct_taxon_relationships(depth=depth)
        relationships = [
            ("1,9-determinations,4", "Taxon"),
            ("1,9-determinations,4-preferredTaxon", "Preferred"),
        ]
        if include_host:
            relationships.append(("1,10,92,4-hostTaxon", "Host"))
        fields = [
            (f"{path}.taxon.{rank}", f"{relationship} {rank}")
            for path, relationship in relationships
            for rank in ("Genus", "Species")
        ]
        for ordering, ordered_fields in (
            ("taxon-first", fields),
            ("reversed", list(reversed(fields))),
            ("repeated-ranks", [*fields, fields[0], fields[-1]]),
        ):
            with self.subTest(
                depth=depth, ordering=ordering, relationships=len(relationships)
            ):
                self._assert_taxon_relationship_values(
                    ordered_fields, max_joins=max_joins
                )

    def test_genus_species_values_use_distinct_relationships(self):
        self._assert_genus_species_relationships(depth=11)

    def test_genus_species_join_budget(self):
        # Three relationship joins plus two requested ranks for each relationship.
        self._assert_genus_species_relationships(depth=11, max_joins=7)

    def test_genus_species_join_budget_with_sixteen_ranks(self):
        self._assert_genus_species_relationships(depth=16, max_joins=7)

    def test_three_relationship_join_budget_with_sixteen_ranks(self):
        # Six relationship joins plus two requested ranks for each relationship.
        self._assert_genus_species_relationships(
            depth=16, include_host=True, max_joins=12
        )

    def test_three_relationship_join_budget_with_thirty_two_ranks(self):
        self._assert_genus_species_relationships(
            depth=32, include_host=True, max_joins=12
        )

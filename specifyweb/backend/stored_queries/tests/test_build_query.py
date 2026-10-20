import re
import warnings
from types import SimpleNamespace

from django.db import connection
from django.test.utils import CaptureQueriesContext
from sqlalchemy.dialects import mysql
from sqlalchemy.exc import SAWarning
from sqlalchemy.sql.selectable import Join

from specifyweb.specify.models import (
    Collectingeventattribute,
    Collectionobjecttype,
    Determination,
    Geography,
    Geographytreedefitem,
    Locality,
    Taxon,
    Taxontreedef,
    Taxontreedefitem,
    datamodel,
)
from specifyweb.backend.stored_queries import models as models
from specifyweb.backend.stored_queries.queryfield import fields_from_json
from specifyweb.backend.stored_queries.queryfieldspec import TreeRankQuery
from specifyweb.backend.stored_queries.tree_rank import resolve_page
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
        def joins(source):
            return 1 + joins(source.left) + joins(source.right) if isinstance(source, Join) else 0
        final_joins = sum(joins(source) for source in query.statement.get_final_froms())
        self.assertLessEqual(final_joins, max_joins, statement)
        # At most six relationship joins, one unpivot and two indexed traversal
        # joins in the shared seed CTE. This allowance never grows with depth.
        self.assertLessEqual(
            join_count,
            max_joins + 9,
            f"Generated {join_count} JOINs including seed traversal:\n{statement}",
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

    def _taxon_relationship_query_fields(self, fields):
        return fields_from_json([
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

    def _assert_taxon_relationship_values(self, fields, max_joins=None):
        query_fields = self._taxon_relationship_query_fields(fields)
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

    def _make_second_taxon_tree(self):
        treedef = Taxontreedef.objects.create(name="Second taxonomy")
        Collectionobjecttype.objects.create(
            name="Second type", collection=self.collection, taxontreedef=treedef
        )
        parent = None
        # Deliberately reuse the first tree's node numbers and rank names.
        for rank_index, (name, rankid) in enumerate(
            (("Root", 0), ("Genus", 180), ("Species", 220))
        ):
            rank = Taxontreedefitem.objects.create(
                name=name,
                title=name,
                rankid=rankid,
                treedef=treedef,
                parent=parent.definitionitem if parent else None,
            )
            parent = Taxon(
                name=f"Second {name}",
                fullname=f"Second {name}",
                parent=parent,
                definition=treedef,
                definitionitem=rank,
                rankid=rankid,
                nodenumber=rank_index + 1,
                highestchildnodenumber=7,
            )
            parent.save(skip_tree_extras=True)
        return treedef, parent

    def test_rank_joins_isolate_tree_definitions_with_overlapping_numbers(self):
        self._make_distinct_taxon_relationships()
        _treedef, second_species = self._make_second_taxon_tree()
        Determination.objects.filter(
            collectionobject=self.collectionobjects[0]
        ).update(preferredtaxon=second_species)
        fields = [
            ("1,9-determinations,4.taxon.Genus", "Taxon Genus"),
            ("1,9-determinations,4-preferredTaxon.taxon.Genus", "Second Genus"),
            ("1,9-determinations,4-preferredTaxon.taxon.Species", "Second Species"),
        ]
        for ordered_fields in (fields, list(reversed(fields))):
            with self.subTest(first_field=ordered_fields[0][0]):
                self._assert_taxon_relationship_values(ordered_fields, max_joins=6)

    def test_explicit_tree_definition_ranks_do_not_share_aliases(self):
        self._make_distinct_taxon_relationships()
        second_treedef, _second_species = self._make_second_taxon_tree()
        fields = [("1,9-determinations,4.taxon.Genus", "Taxon Genus")]
        query_fields = self._taxon_relationship_query_fields(fields)
        genus_field = query_fields[-1]
        for definitions in (
            (self.taxontreedef, second_treedef),
            (second_treedef, self.taxontreedef),
        ):
            with self.subTest(first_definition=definitions[0].name):
                restricted_fields = []
                for treedef in definitions:
                    spec = genus_field.fieldspec
                    restricted_rank = TreeRankQuery.create(
                        "Genus", "Taxon", treedef.id, treedef.name
                    )
                    restricted_fields.append(genus_field._replace(
                        fieldspec=spec._replace(join_path=tuple(
                            restricted_rank if isinstance(part, TreeRankQuery) else part
                            for part in spec.join_path
                        ))
                    ))
                with self.__class__.test_session_context() as session:
                    query, _ = build_query(
                        session, self.collection, self.specifyuser,
                        datamodel.get_table_strict("CollectionObject").tableId,
                        [query_fields[0], *restricted_fields],
                    )
                    self._assert_join_budget(query, 4)
                    self.assertEqual(
                        [tuple(row) for row in query],
                        [(
                            self.collectionobjects[0].id, "num-0",
                            *("Taxon Genus" if treedef == self.taxontreedef else None
                              for treedef in definitions),
                        )],
                    )

    def test_skipped_rank_keeps_null_without_matching_another_branch(self):
        self._make_distinct_taxon_relationships()
        species = Taxon.objects.get(name="Taxon Species")
        Taxon.objects.filter(id=species.id).update(parent=species.parent.parent)
        # The skipped genus is a sibling of this species, not its ancestor.
        Taxon.objects.filter(id=species.parent_id).update(
            highestchildnodenumber=species.parent.nodenumber
        )
        self._assert_taxon_relationship_values([
            ("1,9-determinations,4.taxon.Family", "Taxon Family"),
            ("1,9-determinations,4.taxon.Genus", None),
            ("1,9-determinations,4.taxon.Species", "Taxon Species"),
            ("1,9-determinations,4-preferredTaxon.taxon.Genus", "Preferred Genus"),
        ], max_joins=7)

    def test_geography_rank_fields_preserve_values(self):
        root_rank = self.geographytreedef.treedefitems.get(rankid=0)
        country_rank = Geographytreedefitem.objects.create(
            name="Country", rankid=200, treedef=self.geographytreedef, parent=root_rank
        )
        state_rank = Geographytreedefitem.objects.create(
            name="State", rankid=300, treedef=self.geographytreedef, parent=country_rank
        )
        parent = None
        for rank, name in (
            (root_rank, "Earth"), (country_rank, "Country A"), (state_rank, "State A")
        ):
            parent = Geography.objects.create(
                name=name, fullname=name, definition=self.geographytreedef,
                definitionitem=rank, rankid=rank.rankid, parent=parent,
            )
        locality = Locality.objects.create(
            localityname="Locality A", discipline=self.discipline, geography=parent
        )
        self._update(self.collectingevent, {"locality": locality})
        self._update(self.collectionobjects[0], {"collectingevent": self.collectingevent})
        self._assert_taxon_relationship_values([
            ("1,10,2,3.geography.Country", "Country A"),
            ("1,10,2,3.geography.State", "State A"),
        ], max_joins=5)

    def test_missing_rank_omits_filter_and_sort_but_preserves_column(self):
        self._make_distinct_taxon_relationships()
        fields = [
            ("1,9-determinations,4.taxon.Unmapped rank", None),
            ("1,9-determinations,4-preferredTaxon.taxon.Species", "Preferred Species"),
        ]
        query_fields = self._taxon_relationship_query_fields(fields)
        query_fields[1] = query_fields[1]._replace(
            op_num=1, value="No match", sort_type=QuerySort.ASC
        )
        with self.assertLogs(
            "specifyweb.backend.stored_queries.query_construct", level="WARNING"
        ):
            with self.__class__.test_session_context() as session:
                query, order_by = build_query(
                    session, self.collection, self.specifyuser,
                    datamodel.get_table_strict("CollectionObject").tableId,
                    query_fields,
                )
                self._assert_join_budget(query, 4)
                self.assertEqual(order_by, [])
                self.assertEqual(
                    [tuple(row) for row in query],
                    [(self.collectionobjects[0].id, "num-0", None, "Preferred Species")],
                )

    def test_rank_filters_and_sorting_use_the_selected_relationship(self):
        self._make_distinct_taxon_relationships()
        taxon_species = Taxon.objects.get(name="Taxon Species")
        host_species = Taxon.objects.get(name="Host Species")
        Determination.objects.create(
            collectionobject=self.collectionobjects[1],
            taxon=taxon_species,
            preferredtaxon=host_species,
            iscurrent=True,
        )
        Determination.objects.filter(
            collectionobject=self.collectionobjects[1]
        ).update(preferredtaxon=host_species)
        fields = [
            ("1,9-determinations,4.taxon.Genus", "Taxon Genus"),
            ("1,9-determinations,4-preferredTaxon.taxon.Genus", "Preferred Genus"),
        ]
        base_fields = self._taxon_relationship_query_fields(fields)
        base_fields[0] = base_fields[0]._replace(op_num=10, value="num-0,num-1")
        cases = (
            ("equals", 1, "Preferred Genus", False, QuerySort.ASC, [0]),
            ("not-equals", 1, "Preferred Genus", True, QuerySort.ASC, [1]),
            ("contains", 11, "Genus", False, QuerySort.ASC, [1, 0]),
            ("descending", 8, "", False, QuerySort.DESC, [0, 1]),
        )
        for name, op_num, value, negate, sort_type, indexes in cases:
            with self.subTest(operation=name):
                query_fields = [
                    *base_fields[:2],
                    base_fields[2]._replace(
                        op_num=op_num, value=value, negate=negate, sort_type=sort_type
                    ),
                ]
                with self.__class__.test_session_context() as session:
                    query, order_by = build_query(
                        session, self.collection, self.specifyuser,
                        datamodel.get_table_strict("CollectionObject").tableId,
                        query_fields,
                    )
                    self._assert_join_budget(query, 5)
                    self.assertEqual(len(order_by), 1)
                    self.assertEqual(
                        [tuple(row) for row in query.order_by(*order_by)],
                        [(
                            self.collectionobjects[index].id, f"num-{index}",
                            "Taxon Genus", "Preferred Genus" if index == 0 else "Host Genus",
                        ) for index in indexes],
                    )

    def test_negated_rank_filter_includes_missing_relationships(self):
        self._make_distinct_taxon_relationships()
        taxon_species = Taxon.objects.get(name="Taxon Species")
        Determination.objects.create(
            collectionobject=self.collectionobjects[1],
            taxon=taxon_species,
            iscurrent=True,
        )
        Determination.objects.filter(
            collectionobject=self.collectionobjects[1]
        ).update(preferredtaxon=None)
        query_fields = self._taxon_relationship_query_fields([
            ("1,9-determinations,4-preferredTaxon.taxon.Genus", None),
        ])
        query_fields[0] = query_fields[0]._replace(op_num=10, value="num-0,num-1")
        for op_num, value, negate in (
            (1, "Preferred Genus", True),
            (12, "", False),
        ):
            with self.subTest(op_num=op_num, negate=negate):
                fields = [
                    query_fields[0],
                    query_fields[1]._replace(op_num=op_num, value=value, negate=negate),
                ]
                with self.__class__.test_session_context() as session:
                    query, _ = build_query(
                        session, self.collection, self.specifyuser,
                        datamodel.get_table_strict("CollectionObject").tableId,
                        fields,
                    )
                    self._assert_join_budget(query, 3)
                    self.assertEqual(
                        [tuple(row) for row in query],
                        [(self.collectionobjects[1].id, "num-1", None)],
                    )

    def test_rank_query_construction_does_not_read_tree_nodes(self):
        self._make_distinct_taxon_relationships()
        query_fields = self._taxon_relationship_query_fields([
            ("1,9-determinations,4.taxon.Genus", "Taxon Genus"),
            ("1,9-determinations,4.taxon.Species", "Taxon Species"),
            ("1,9-determinations,4-preferredTaxon.taxon.Genus", "Preferred Genus"),
        ])
        with self.__class__.test_session_context() as session:
            with CaptureQueriesContext(connection) as captured:
                query, _ = build_query(
                    session, self.collection, self.specifyuser,
                    datamodel.get_table_strict("CollectionObject").tableId,
                    query_fields,
                )
                self._assert_join_budget(query, 6)
            for statement in captured.captured_queries:
                self.assertNotRegex(
                    statement["sql"],
                    r"(?i)\b(?:FROM|JOIN)\s+`?taxon`?(?=\s|$)",
                )
            self.assertEqual(
                [tuple(row) for row in query],
                [(self.collectionobjects[0].id, "num-0",
                  "Taxon Genus", "Taxon Species", "Preferred Genus")],
            )

    def test_explicit_tree_definition_ignores_other_trees(self):
        self._make_distinct_taxon_relationships()
        second_treedef, second_species = self._make_second_taxon_tree()
        Taxon.objects.filter(id=second_species.id).update(nodenumber=None)
        query_fields = self._taxon_relationship_query_fields([
            ("1,9-determinations,4.taxon.Genus", "Taxon Genus"),
        ])
        spec = query_fields[-1].fieldspec
        restricted_rank = TreeRankQuery.create(
            "Genus", "Taxon", self.taxontreedef.id, self.taxontreedef.name
        )
        query_fields[-1] = query_fields[-1]._replace(fieldspec=spec._replace(
            join_path=tuple(
                restricted_rank if isinstance(part, TreeRankQuery) else part
                for part in spec.join_path
            )
        ))
        with self.__class__.test_session_context() as session:
            query, _ = build_query(
                session, self.collection, self.specifyuser,
                datamodel.get_table_strict("CollectionObject").tableId,
                query_fields,
            )
            self.assertEqual(
                [tuple(row) for row in query],
                [(self.collectionobjects[0].id, "num-0", "Taxon Genus")],
            )
        self.assertTrue(Taxon.objects.filter(
            id=second_species.id, definition=second_treedef, nodenumber__isnull=True
        ).exists())

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

    def test_three_relationship_join_budget_with_sixty_four_ranks(self):
        self._assert_genus_species_relationships(
            depth=64, include_host=True, max_joins=12
        )

    def test_page_rank_resolution_preserves_relationships_and_duplicates(self):
        self._make_distinct_taxon_relationships(depth=32)
        determination = Determination.objects.get(collectionobject=self.collectionobjects[0])
        Determination.objects.bulk_create([Determination(
            collectionobject=self.collectionobjects[0],
            collectionmemberid=determination.collectionmemberid,
            taxon=determination.taxon,
            preferredtaxon=determination.preferredtaxon,
            iscurrent=False,
        )])
        fields = self._taxon_relationship_query_fields([
            ("1,9-determinations,4.taxon.Genus", "Taxon Genus"),
            ("1,9-determinations,4-preferredTaxon.taxon.Genus", "Preferred Genus"),
            ("1,9-determinations,4-preferredTaxon.taxon.Species", "Preferred Species"),
        ])
        for offset in (0, 1, 2):
            with self.subTest(offset=offset), self.__class__.test_session_context() as session:
                query, order = build_query(
                    session, self.collection, self.specifyuser, 1, fields,
                    BuildQueryProps(defer_tree_display=True))
                ranks = query.get_execution_options()["specify_tree_ranks"]
                with warnings.catch_warnings():
                    warnings.simplefilter("error", SAWarning)
                    page = resolve_page(
                        query, [*order, models.CollectionObject._id], ranks, 1, offset)
                    if offset == 2:
                        # The SQLAlchemy test adapter cannot wrap an empty result.
                        self.assertEqual(page.count(), 0)
                        continue
                    rows = list(page)
                expected = [(self.collectionobjects[0].id, "num-0", "Taxon Genus",
                             "Preferred Genus", "Preferred Species")] if offset < 2 else []
                self.assertEqual([tuple(row) for row in rows], expected)

    def test_sorted_page_resolves_only_required_relationship_before_pagination(self):
        self._make_distinct_taxon_relationships()
        fields = self._taxon_relationship_query_fields([
            ("1,9-determinations,4.taxon.Genus", "Taxon Genus"),
            ("1,9-determinations,4-preferredTaxon.taxon.Genus", "Preferred Genus"),
            ("1,9-determinations,4-preferredTaxon.taxon.Species", "Preferred Species"),
        ])
        fields[2] = fields[2]._replace(sort_type=QuerySort.ASC)
        with self.__class__.test_session_context() as session:
            query, order = build_query(
                session, self.collection, self.specifyuser, 1, fields,
                BuildQueryProps(defer_tree_display=True))
            ranks = query.get_execution_options()["specify_tree_ranks"]
            self.assertEqual(set(ranks.displays), {2, 4})
            with warnings.catch_warnings():
                warnings.simplefilter("error", SAWarning)
                rows = list(resolve_page(query, order, ranks, 20, 0))
            self.assertEqual([tuple(row) for row in rows], [(
                self.collectionobjects[0].id, "num-0", "Taxon Genus",
                "Preferred Genus", "Preferred Species")])

    def test_display_ranks_do_not_require_ancestor_mapping_for_counts(self):
        self._make_distinct_taxon_relationships()
        fields = self._taxon_relationship_query_fields([
            ("1,9-determinations,4.taxon.Genus", "Taxon Genus"),
            ("1,9-determinations,4-preferredTaxon.taxon.Species", "Preferred Species"),
        ])
        with self.__class__.test_session_context() as session:
            query, _ = build_query(
                session, self.collection, self.specifyuser, 1, fields,
                BuildQueryProps(defer_tree_display=True))
            self.assertNotIn("WITH RECURSIVE", str(query.statement))
            self.assertEqual(query.count(), 1)

    def test_grouped_rank_queries_use_eager_resolution(self):
        self._make_distinct_taxon_relationships()
        fields = self._taxon_relationship_query_fields([
            ("1,9-determinations,4.taxon.Genus", "Taxon Genus"),
            ("1,9-determinations,4-preferredTaxon.taxon.Species", "Preferred Species"),
        ])
        with self.__class__.test_session_context() as session:
            query, _ = build_query(
                session, self.collection, self.specifyuser, 1, fields,
                BuildQueryProps(distinct=True, defer_tree_display=True))
            self.assertFalse(query.get_execution_options()["specify_tree_ranks"].displays)
            rows = list(query)
            self.assertEqual(tuple(rows[0])[1:], ("num-0", "Taxon Genus", "Preferred Species"))

    def test_count_does_not_resolve_display_only_sort_ranks(self):
        self._make_distinct_taxon_relationships()
        fields = self._taxon_relationship_query_fields([
            ("1,9-determinations,4.taxon.Genus", "Taxon Genus"),
        ])
        fields[1] = fields[1]._replace(sort_type=QuerySort.ASC)
        with self.__class__.test_session_context() as session:
            query, _ = build_query(
                session, self.collection, self.specifyuser, 1, fields,
                BuildQueryProps(defer_tree_display=True, count_only=True))
            self.assertNotIn("WITH RECURSIVE", str(query.statement))
            self.assertEqual(query.count(), 1)

    def test_page_resolution_preserves_null_preferred_taxon(self):
        self._make_distinct_taxon_relationships()
        Determination.objects.filter(
            collectionobject=self.collectionobjects[0]).update(preferredtaxon=None)
        fields = self._taxon_relationship_query_fields([
            ("1,9-determinations,4.taxon.Genus", "Taxon Genus"),
            ("1,9-determinations,4-preferredTaxon.taxon.Species", None),
        ])
        with self.__class__.test_session_context() as session:
            query, order = build_query(
                session, self.collection, self.specifyuser, 1, fields,
                BuildQueryProps(defer_tree_display=True))
            page = resolve_page(query, order, query.get_execution_options()["specify_tree_ranks"], 20, 0)
            self.assertEqual([tuple(row) for row in page], [(
                self.collectionobjects[0].id, "num-0", "Taxon Genus", None)])

    def test_mixed_tree_tables_use_eager_resolution(self):
        self._make_distinct_taxon_relationships()
        rank = self.geographytreedef.treedefitems.get(rankid=0)
        geography = Geography.objects.create(
            name="World", fullname="World", definition=self.geographytreedef,
            definitionitem=rank, rankid=rank.rankid)
        locality = Locality.objects.create(
            localityname="Here", discipline=self.discipline, geography=geography)
        self._update(self.collectingevent, {"locality": locality})
        self._update(self.collectionobjects[0], {"collectingevent": self.collectingevent})
        fields = self._taxon_relationship_query_fields([
            ("1,9-determinations,4.taxon.Genus", "Taxon Genus"),
            (f"1,10,2,3.geography.{rank.name}", "World"),
        ])
        with self.__class__.test_session_context() as session:
            query, _ = build_query(
                session, self.collection, self.specifyuser, 1, fields,
                BuildQueryProps(defer_tree_display=True))
            self.assertFalse(query.get_execution_options()["specify_tree_ranks"].displays)
            self.assertEqual([tuple(row) for row in query], [(
                self.collectionobjects[0].id, "num-0", "Taxon Genus", "World")])

    def test_recursion_override_is_statement_scoped(self):
        statement = "WITH RECURSIVE ancestors AS (...) SELECT * FROM ancestors"
        parameters = (1,)
        context = SimpleNamespace(execution_options={"specify_tree_ranks": object()})
        mariadb = SimpleNamespace(dialect=SimpleNamespace(is_mariadb=True))
        mysql_conn = SimpleNamespace(dialect=SimpleNamespace(is_mariadb=False))
        changed, unchanged = models.tree_query_recursion_limit(
            mariadb, None, statement, parameters, context, False)
        self.assertEqual(
            changed, "SET STATEMENT max_recursive_iterations=4294967295 FOR " + statement)
        self.assertIs(unchanged, parameters)
        self.assertEqual(models.tree_query_recursion_limit(
            mysql_conn, None, statement, parameters, context, False), (statement, parameters))
        context.execution_options = {}
        self.assertEqual(models.tree_query_recursion_limit(
            mariadb, None, statement, parameters, context, False), (statement, parameters))

    def test_tree_seed_preserves_implicit_or_between_ordinary_filters(self):
        self._make_distinct_taxon_relationships()
        determination = Determination.objects.get(collectionobject=self.collectionobjects[0])
        Determination.objects.create(
            collectionobject=self.collectionobjects[1], taxon=determination.taxon,
            preferredtaxon=determination.preferredtaxon, iscurrent=True)
        fields = self._taxon_relationship_query_fields([
            ("1,9-determinations,4.taxon.Genus", "Taxon Genus"),
        ])
        fields.insert(1, fields[0]._replace(value="num-1", display=False))
        for deferred in (False, True):
            with self.subTest(deferred=deferred), self.__class__.test_session_context() as session:
                query, order = build_query(
                    session, self.collection, self.specifyuser, 1, fields,
                    BuildQueryProps(defer_tree_display=deferred))
                ranks = query.get_execution_options()["specify_tree_ranks"]
                result = resolve_page(query, order, ranks, 20, 0) if deferred else query
                self.assertCountEqual([tuple(row) for row in result], [
                    (self.collectionobjects[index].id, f"num-{index}", "Taxon Genus")
                    for index in (0, 1)])

    def test_temporal_rank_field_keeps_its_shared_rank_eager(self):
        self._make_distinct_taxon_relationships()
        fields = self._taxon_relationship_query_fields([
            ("1,9-determinations,4.taxon.Genus", "Taxon Genus"),
            ("1,9-determinations,4.taxon.Genus timestampCreatedNumericYear", None),
        ])
        results = []
        for deferred in (False, True):
            with self.__class__.test_session_context() as session:
                query, _ = build_query(
                    session, self.collection, self.specifyuser, 1, fields,
                    BuildQueryProps(defer_tree_display=deferred))
                self.assertFalse(query.get_execution_options()["specify_tree_ranks"].displays)
                results.append([tuple(row) for row in query])
        self.assertEqual(results[0], results[1])

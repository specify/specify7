from specifyweb.specify.models import Taxontreedefitem, datamodel
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
    def test_tree_joins_are_isolated_by_relationship(self):
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
            # Relationship joins may be shared only while their paths are the
            # same. Each relationship into Taxon needs its own rank aliases.
            # CollectionObject -> Determinations
            # Determination -> taxon
            # Determination -> preferredTaxon
            # Taxon ranks for each of those two relationships
            # Shared tree-definition metadata and one rank-item entry per rank
            self.assertEqual(
                len(query.join_cache),
                8
            )
            tree_rank_keys = [
                key for key in query.join_cache
                if len(key) > 1 and key[1] == 'TreeRanks'
            ]
            self.assertEqual(len(tree_rank_keys), 2)
            self.assertNotEqual(tree_rank_keys[0][0], tree_rank_keys[1][0])
            for cache_key in tree_rank_keys:
                tree_ranks, _ = query.join_cache[cache_key]
                self.assertEqual(
                    len(tree_ranks),
                    len(self.taxontreedef.treedefitems.all())
                )

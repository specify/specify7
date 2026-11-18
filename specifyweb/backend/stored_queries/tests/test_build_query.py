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
            # There should be 4 objects in the join cache
            # CollectionObject -> Determinations
            # Determination -> taxon
            # Taxon Ranks for Determination -> taxon
            # Determination -> preferredTaxon
            self.assertEqual(
                len(query.join_cache),
                4
            )
            # BUG: This is technically undesirable, as it causes #8650
            # In the underlying query, the Preferred Taxon currently uses the
            # JOIN for Determination -> taxon. Specifically, it uses the cached
            # JOINs for the tree ranks.
            taxon_table = datamodel.get_table_strict("taxon")
            cache_key = (taxon_table, 'TreeRanks')
            tree_ranks_in_cache = list(filter(lambda cache_key: 'TreeRanks' in cache_key, query.join_cache.keys()))
            self.assertEqual(
                tree_ranks_in_cache,
                [cache_key]
            )
            tree_join_information = query.join_cache[cache_key]
            tree_ranks = tree_join_information[0]

            self.assertEqual(
                len(tree_ranks),
                len(self.taxontreedef.treedefitems.all())
            )

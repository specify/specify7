from unittest.mock import patch

from sqlalchemy import orm

from specifyweb.backend.stored_queries import models
from specifyweb.backend.stored_queries.query_construct import QueryConstruct
from specifyweb.backend.stored_queries.queryfieldspec import TreeRankQuery
from specifyweb.backend.trees.tests.test_trees import SqlTreeSetup
from specifyweb.specify.models import datamodel


class TreeRankMetadataTests(SqlTreeSetup):
    def construct(self):
        return QueryConstruct(
            collection=self.collection,
            objectformatter=None,
            query=orm.Query(models.Taxon._id),
        )

    def test_rank_metadata_is_reused_within_query(self):
        table = datamodel.get_table_strict('Taxon')
        rank = TreeRankQuery.create('Kingdom', 'Taxon')
        with patch(
            'specifyweb.backend.stored_queries.query_construct.get_treedefs',
            return_value=[(self.taxontreedef.id, 11)],
        ) as definitions:
            with self.assertNumQueries(1):
                query, _, ranks = self.construct().tree_rank_metadata(table, rank)
            self.assertEqual(ranks, [(self.taxontreedef.id, self.taxon_kingdom.id)])
            with self.assertNumQueries(0):
                query, _, repeated = query.tree_rank_metadata(table, rank)
            self.assertEqual(repeated, ranks)
            with self.assertNumQueries(1):
                query.tree_rank_metadata(table, TreeRankQuery.create('Genus', 'Taxon'))
            definitions.assert_called_once()
            with self.assertNumQueries(1):
                self.construct().tree_rank_metadata(table, rank)
            self.assertEqual(definitions.call_count, 2)

    def test_explicit_tree_definition_has_separate_cache_entry(self):
        table = datamodel.get_table_strict('Taxon')
        rank = TreeRankQuery.create('Kingdom', 'Taxon')
        query, _, _ = self.construct().tree_rank_metadata(table, rank)
        scoped_rank = TreeRankQuery.create('Kingdom', 'Taxon')
        scoped_rank.treedef_id = -1
        _, _, ranks = query.tree_rank_metadata(table, scoped_rank)
        self.assertEqual(ranks, [])

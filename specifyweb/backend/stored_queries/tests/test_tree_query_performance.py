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


class TreeRangeFilterTests(SqlTreeSetup):
    def setUp(self):
        super().setUp()
        self.root = self.make_taxontree('Life', 'Taxonomy Root')
        self.kingdom = self.make_taxontree('Animalia', 'Kingdom', parent=self.root)
        self.genus = self.make_taxontree('Alpha', 'Genus', parent=self.kingdom)
        self.first = self.make_taxontree('one', 'Species', parent=self.genus)
        self.second = self.make_taxontree('two', 'Species', parent=self.genus)
        self.other = self.make_taxontree('Beta', 'Genus', parent=self.kingdom)
        self.outside = self.make_taxontree('three', 'Species', parent=self.other)
        self.skipped = self.make_taxontree('skipped', 'Species', parent=self.root)

    def field(self, stringid, op=8, value='', negate=False, display=True):
        from specifyweb.backend.stored_queries.queryfield import QueryField
        from specifyweb.backend.stored_queries.queryfieldspec import QueryFieldSpec
        return QueryField(
            QueryFieldSpec.from_stringid(stringid, False),
            op, value, negate, display, None, 0,
        )

    def run_query(self, fields, legacy=False, **props):
        from django.db import connection
        from sqlalchemy.dialects import mysql
        from specifyweb.backend.stored_queries.execution import build_query, BuildQueryProps
        handle = QueryConstruct.handle_tree_field

        def parent_walk(query, *args, **kwargs):
            kwargs['use_range'] = False
            return handle(query, *args, **kwargs)

        with self.__class__.test_session_context() as session, patch.object(
            QueryConstruct, 'handle_tree_field', parent_walk if legacy else handle
        ):
            query, _ = build_query(
                session, self.collection, self.specifyuser,
                fields[0].fieldspec.root_table.tableId, fields, BuildQueryProps(**props),
            )
        compiled = query.statement.compile(dialect=mysql.dialect(), compile_kwargs={'literal_binds': True})
        with connection.cursor() as cursor:
            cursor.execute(str(compiled))
            return cursor.fetchall(), str(compiled)

    def assert_equivalent(self, fields, **props):
        actual, statement = self.run_query(fields, **props)
        expected, _ = self.run_query(fields, legacy=True, **props)
        self.assertCountEqual(actual, expected)
        return actual, statement

    def test_id_filter_includes_self_and_descendants_only(self):
        rows, statement = self.assert_equivalent([
            self.field('4.taxon.name'),
            self.field('4.taxon.Genus ID', 1, str(self.genus.id), display=False),
        ])
        self.assertEqual({row[0] for row in rows}, {self.genus.id, self.first.id, self.second.id})
        self.assertIn('BETWEEN', statement)
        self.assertNotIn('ParentID', statement)

    def test_explicit_record_ids_keep_parent_walk(self):
        rows, statement = self.assert_equivalent([
            self.field('4.taxon.name'),
            self.field('4.taxon.taxonId', 10, str(self.first.id), display=False),
            self.field('4.taxon.Genus', 11, 'Al', display=False),
        ])
        self.assertEqual({row[0] for row in rows}, {self.first.id})
        self.assertNotIn('WITH RECURSIVE', statement)
        self.assertIn('ParentID', statement)

    def test_recordset_keeps_parent_walk(self):
        from specifyweb.specify.models import Recordset, Recordsetitem
        recordset = Recordset.objects.create(
            collectionmemberid=self.collection.id, dbtableid=4,
            name='Small taxonomy selection', specifyuser=self.specifyuser, type=0,
        )
        Recordsetitem.objects.create(recordset=recordset, recordid=self.first.id)
        rows, statement = self.assert_equivalent([
            self.field('4.taxon.name'), self.field('4.taxon.Genus', 11, 'Al'),
        ], recordsetid=recordset.id)
        self.assertEqual({row[0] for row in rows}, {self.first.id})
        self.assertNotIn('WITH RECURSIVE', statement)
        self.assertIn('ParentID', statement)

    def test_positive_scalar_operators(self):
        cases = [(0, 'A%'), (1, 'Alpha'), (2, 'A'), (3, 'Z'), (4, 'Alpha'),
                 (5, 'Beta'), (9, 'Alpha,Beta'), (10, 'Alpha,Beta'),
                 (11, 'lph'), (15, 'Al'), (18, 'pha')]
        for op, value in cases:
            with self.subTest(op=op):
                rows, statement = self.assert_equivalent([
                    self.field('4.taxon.name'), self.field('4.taxon.Genus', op, value),
                ])
                self.assertTrue(rows)
                self.assertIn('WITH RECURSIVE', statement)
                self.assertEqual(statement.count('LEFT OUTER JOIN taxon '), 1)

    def test_missing_rank_and_negation_keep_existing_null_semantics(self):
        for op, value, negate in [(12, '', False), (1, None, False),
                                  (1, 'Alpha', True), (10, 'Alpha,Beta', True)]:
            with self.subTest(op=op):
                rows, statement = self.assert_equivalent([
                    self.field('4.taxon.name'), self.field('4.taxon.Genus', op, value, negate),
                ])
                self.assertIn(self.skipped.id, {row[0] for row in rows})
                self.assertIn('ParentID', statement)

    def test_repeated_filters_and_multiple_ranks(self):
        for implicit_or in [True, False]:
            self.assert_equivalent([
                self.field('4.taxon.name'),
                self.field('4.taxon.Genus', 1, 'Alpha'),
                self.field('4.taxon.Genus', 1, 'Beta'),
                self.field('4.taxon.Kingdom', 1, 'Animalia'),
            ], implicit_or=implicit_or)

    def test_geography_filter(self):
        rows, statement = self.assert_equivalent([
            self.field('3.geography.name'),
            self.field('3.geography.Country', 1, 'USA'),
        ])
        self.assertTrue(rows)
        self.assertIn('WITH RECURSIVE', statement)
        self.assertEqual(statement.count('LEFT OUTER JOIN geography '), 1)

    def test_shallow_pages_keep_parent_lookups_but_deep_pages_use_rank_lookup(self):
        _, shallow_sql = self.assert_equivalent([
            self.field('3.geography.name'), self.field('3.geography.Country', 1, 'USA'),
        ], optimize_for_page=True)
        self.assertNotIn('WITH RECURSIVE', shallow_sql)
        self.assertIn('ParentID', shallow_sql)
        _, deep_sql = self.assert_equivalent([
            self.field('4.taxon.name'), self.field('4.taxon.Genus', 1, 'Alpha'),
        ], optimize_for_page=True)
        self.assertIn('WITH RECURSIVE', deep_sql)
        for depth, uses_lookup in [(8, False), (9, True)]:
            with self.subTest(depth=depth), patch(
                'specifyweb.backend.stored_queries.query_construct.get_treedefs',
                return_value=[(self.taxontreedef.id, depth)],
            ):
                _, statement = self.assert_equivalent([
                    self.field('4.taxon.name'), self.field('4.taxon.Genus', 1, 'Alpha'),
                ], optimize_for_page=True)
                self.assertEqual('WITH RECURSIVE' in statement, uses_lookup)

    def test_execute_only_prefers_parent_lookup_for_ungrouped_pages(self):
        from unittest.mock import Mock
        from specifyweb.backend.stored_queries.execution import execute
        for count_only, limit, distinct, series, expected in [
            (False, 40, False, False, True),
            (True, 40, False, False, False),
            (False, 0, False, False, False),
            (False, None, False, False, False),
            (False, 40, True, False, False),
            (False, 40, False, True, False),
        ]:
            with self.subTest(count_only=count_only, limit=limit, distinct=distinct, series=series):
                with patch('specifyweb.backend.stored_queries.execution.set_group_concat_max_len'), patch(
                    'specifyweb.backend.stored_queries.execution.build_query',
                    side_effect=RuntimeError('query built'),
                ) as build:
                    with self.assertRaisesMessage(RuntimeError, 'query built'):
                        execute(Mock(info={'connection': Mock()}), self.collection, self.specifyuser,
                                3, distinct, series, False, count_only, [], limit, 0)
                    self.assertEqual(build.call_args.args[5].optimize_for_page, expected)

    def test_missing_or_reversed_numbering_falls_back_without_writes(self):
        from specifyweb.specify.models import Taxon
        for values in [dict(nodenumber=None), dict(highestchildnodenumber=None),
                       dict(nodenumber=50, highestchildnodenumber=1)]:
            with self.subTest(values=values):
                Taxon.objects.filter(pk=self.first.id).update(**values)
                rows, statement = self.assert_equivalent([
                    self.field('4.taxon.name'),
                    self.field('4.taxon.Genus ID', 1, str(self.genus.id), display=False),
                ])
                self.assertIn(self.first.id, {row[0] for row in rows})
                self.assertIn('ParentID', statement)
                self.first.refresh_from_db()
                for key, value in values.items():
                    self.assertEqual(getattr(self.first, key), value)

    def test_rank_id_from_wrong_rank_does_not_match(self):
        rows, _ = self.assert_equivalent([
            self.field('4.taxon.name'),
            self.field('4.taxon.Genus ID', 1, str(self.kingdom.id), display=False),
        ])
        self.assertEqual(rows, ())

    def test_numbering_is_resolved_again_after_tree_move(self):
        fields = [self.field('4.taxon.name'),
                  self.field('4.taxon.Genus ID', 1, str(self.genus.id), display=False)]
        before, _ = self.assert_equivalent(fields)
        self.assertIn(self.first.id, {row[0] for row in before})
        self.first.parent = self.other
        self.first.save()
        after, _ = self.assert_equivalent(fields)
        self.assertNotIn(self.first.id, {row[0] for row in after})

    def test_preferred_taxon_path_and_distinct(self):
        from specifyweb.specify.models import Determination
        co = self.collectionobjects[0]
        determination = Determination.objects.create(
            collectionobject=co, taxon=self.outside, iscurrent=True,
        )
        Determination.objects.filter(pk=determination.id).update(preferredtaxon=self.first)
        fields = [self.field('1.collectionobject.catalogNumber'),
                  self.field('1,9-determinations,4-preferredTaxon.taxon.Genus ID',
                             1, str(self.genus.id), display=False)]
        rows, statement = self.assert_equivalent(fields)
        self.assertEqual({row[0] for row in rows}, {co.id})
        self.assertIn('PreferredTaxonID', statement)
        self.assert_equivalent(fields, distinct=True)

    def test_multiple_tree_definitions_and_explicit_scope(self):
        from specifyweb.specify.models import Taxontreedef
        second_def = Taxontreedef.objects.create(name='Second taxonomy', discipline=self.discipline)
        self.make_taxon_ranks(second_def)
        root = self.make_taxontree('Other life', 'Taxonomy Root', treedef=second_def)
        genus = self.make_taxontree('Alpha', 'Genus', parent=root, treedef=second_def)
        leaf = self.make_taxontree('other species', 'Species', parent=genus, treedef=second_def)
        fields = [self.field('4.taxon.name'), self.field('4.taxon.Genus', 1, 'Alpha')]
        rows, _ = self.assert_equivalent(fields)
        self.assertEqual({row[0] for row in rows},
                         {self.genus.id, self.first.id, self.second.id, genus.id, leaf.id})

        scoped_rank = TreeRankQuery.create('Genus', 'Taxon', treedef_id=self.taxontreedef.id)
        scoped_spec = fields[1].fieldspec._replace(
            join_path=(scoped_rank, fields[1].fieldspec.join_path[-1]),
        )
        rows, _ = self.assert_equivalent([fields[0], fields[1]._replace(fieldspec=scoped_spec)])
        self.assertEqual({row[0] for row in rows}, {self.genus.id, self.first.id, self.second.id})

        second_def.discipline = None
        second_def.save()
        rows, _ = self.assert_equivalent(fields)
        self.assertEqual({row[0] for row in rows}, {self.genus.id, self.first.id, self.second.id})

    def test_boolean_and_synonymy_filters(self):
        from specifyweb.specify.models import Taxon
        Taxon.objects.filter(pk=self.genus.id).update(isaccepted=True)
        Taxon.objects.filter(pk=self.other.id).update(isaccepted=False)
        for op in (6, 7):
            with self.subTest(op=op):
                rows, statement = self.assert_equivalent([
                    self.field('4.taxon.name'), self.field('4.taxon.Genus isAccepted', op),
                ])
                self.assertTrue(rows)
                self.assertIn('WITH RECURSIVE', statement)
        self.assert_equivalent([
            self.field('4.taxon.name'), self.field('4.taxon.Genus', 1, 'Alpha'),
        ], search_synonymy=True)

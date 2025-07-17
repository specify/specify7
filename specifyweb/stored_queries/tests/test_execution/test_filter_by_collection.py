from contextlib import contextmanager
from specifyweb.specify.models import Accession, Division
from specifyweb.specify.tests.test_tree_utils import TestMultipleTaxonTreeContext
from specifyweb.specify.tests.test_trees import SqlTreeSetup
from specifyweb.stored_queries.execution import build_query
from specifyweb.stored_queries.queryfield import QueryField
from specifyweb.stored_queries.queryfieldspec import QueryFieldSpec
from specifyweb.specify.models import datamodel


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

    def _get_results(self, base_table, fields):
        with TestFilterByCollection.test_session_context() as session:
            query, _ = build_query(
                session,
                self.collection,
                self.specifyuser,
                base_table.tableId,
                fields,
            )

            return list(query)

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

    def test_single_taxon(self): ...

from specifyweb.specify.models import Accession
from specifyweb.backend.stored_queries.tests.tests import SQLAlchemySetup
from specifyweb.backend.stored_queries.tests.utils import make_query_fields_test
from unittest.mock import patch, Mock

simple_def_accession = """
    <formatters>
        <format
        name="Accession"
        title="Accession"
        class="edu.ku.brc.specify.datamodel.Accession"
        default="true"
        >
        <switch single="true">
            <fields>
            <field format="(%s)">remarks</field>
            <field format="[%d]" sep=", ">integer1</field>
            </fields>
        </switch>
        </format>
    </formatters>
"""

class TestFormatSprintf(SQLAlchemySetup):

    @patch('specifyweb.backend.stored_queries.format.app_resource.get_app_resource')
    def test_zero_counts_as_prior_value_for_separator(self, get_app_resource: Mock):
        get_app_resource.return_value = ("""
            <formatters>
                <format name="Accession" class="edu.ku.brc.specify.datamodel.Accession"
                    default="true">
                    <switch single="true"><fields>
                        <field>integer1</field>
                        <field sep=", ">remarks</field>
                    </fields></switch>
                </format>
            </formatters>
        """, None, None)
        accession = Accession.objects.create(
            division=self.division, accessionnumber="zero-first", integer1=0,
            remarks="notes"
        )
        table, query_fields = make_query_fields_test("Accession", [[]])
        self.assertIn((accession.id, "0, notes"), self._get_results(table, query_fields))

    @patch('specifyweb.backend.stored_queries.format.app_resource.get_app_resource')
    def test_separator_requires_a_nonempty_field_value(self, get_app_resource: Mock):
        get_app_resource.return_value = ("""
            <formatters>
                <format name="Accession" title="Accession"
                    class="edu.ku.brc.specify.datamodel.Accession" default="true">
                    <switch single="true">
                        <fields>
                            <field>accessionNumber</field>
                            <field sep=", ">integer1</field>
                            <field format="[%s]" sep=", ">remarks</field>
                        </fields>
                    </switch>
                </format>
            </formatters>
        """, None, None)
        Accession.objects.all().delete()
        missing = Accession.objects.create(
            division=self.division, accessionnumber="1", remarks=None
        )
        empty = Accession.objects.create(
            division=self.division, accessionnumber="2", remarks=""
        )
        populated = Accession.objects.create(
            division=self.division, accessionnumber="3", integer1=0,
            remarks="notes"
        )
        zero = Accession.objects.create(
            division=self.division, accessionnumber="4", integer1=0
        )

        table, query_fields = make_query_fields_test("Accession", [[]])
        self.assertCountEqual([
            (missing.id, "1"),
            (empty.id, "2"),
            (populated.id, "3, 0, [notes]"),
            (zero.id, "4, 0"),
        ], self._get_results(table, query_fields))
    
    @patch('specifyweb.backend.stored_queries.format.app_resource.get_app_resource')
    def test_accession(self, get_app_resource: Mock):
        get_app_resource.return_value = (simple_def_accession, None, None)
        Accession.objects.all().delete()
        acc1 = Accession.objects.create(
            division=self.division,
            remarks="Remarks1",
            integer1=65,
            accessionnumber="1"
        )
        acc2 = Accession.objects.create(
            division=self.division,
            remarks="Remarks2",
            accessionnumber="2"
        )
        acc3 = Accession.objects.create(
            division=self.division,
            integer1=89,
            accessionnumber="3"
        )
        acc4 = Accession.objects.create(
            division=self.division,
            accessionnumber="4"
        )
        table, query_fields = make_query_fields_test("Accession", [[]])
        
        results = self._get_results(table, query_fields)
        self.assertCountEqual([
            (acc1.id, '(Remarks1), [65]'), 
            (acc2.id, '(Remarks2)'), 
            (acc3.id, '[89]'),
            (acc4.id, '')],
            results
        )

    @patch('specifyweb.backend.stored_queries.format.app_resource.get_app_resource')
    def test_static_fields_and_postfix(self, get_app_resource: Mock):
        get_app_resource.return_value = ("""
            <formatters>
                <format name="Accession" title="Accession"
                    class="edu.ku.brc.specify.datamodel.Accession" default="true">
                    <switch single="true">
                        <fields>
                            <field sep="[" />
                            <field format="%s]">remarks</field>
                            <field sep="!" />
                        </fields>
                    </switch>
                </format>
            </formatters>
        """, None, None)
        Accession.objects.all().delete()
        accession = Accession.objects.create(
            division=self.division,
            remarks="Remarks",
            accessionnumber="1",
        )
        empty = Accession.objects.create(
            division=self.division,
            accessionnumber="2",
        )
        table, query_fields = make_query_fields_test("Accession", [[]])

        results = self._get_results(table, query_fields)
        self.assertCountEqual([
            (accession.id, "[Remarks]!"),
            (empty.id, "[!"),
        ], results)

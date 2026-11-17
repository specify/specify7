from specifyweb.specify.models import Accession
from specifyweb.backend.stored_queries.queryfield import QueryField
from specifyweb.backend.stored_queries.queryfieldspec import QueryFieldSpec
from specifyweb.backend.stored_queries.tests.tests import SQLAlchemySetup
from specifyweb.backend.stored_queries.tests.utils import make_query_fields_test
from specifyweb.specify.models import datamodel
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
            (acc3.id, ', [89]'), 
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

    @patch('specifyweb.backend.stored_queries.format.app_resource.get_app_resource')
    def test_changing_format_changes_result(self, get_app_resource: Mock):
        get_app_resource.return_value = ("""
            <formatters>
                <format name="Accession" title="Accession"
                    class="edu.ku.brc.specify.datamodel.Accession" default="true">
                    <switch single="true">
                        <fields>
                            <field>remarks</field>
                        </fields>
                    </switch>
                </format>
                <format name="AccessionCustom" title="AccessionCustom"
                    class="edu.ku.brc.specify.datamodel.Accession">
                    <switch single="true">
                        <fields>
                            <field>accessionNumber</field>
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
        table = datamodel.get_table_strict("Accession")
        field_spec = QueryFieldSpec.from_path(("Accession",))
        default_field = QueryField(
            fieldspec=field_spec,
            op_num=8,
            value=None,
            negate=False,
            display=True,
            format_name=None,
            sort_type=0,
        )
        custom_field = default_field._replace(format_name="AccessionCustom")

        default_results = self._get_results(table, [default_field])
        custom_results = self._get_results(table, [custom_field])

        self.assertCountEqual([(accession.id, "Remarks")], default_results)
        self.assertCountEqual([(accession.id, "1")], custom_results)

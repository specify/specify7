from specifyweb.backend.datamodel.models import Accession
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
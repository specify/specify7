from specifyweb.specify.tests.test_api import ApiTests
from specifyweb.backend.stored_queries.format import ObjectFormatter
from specifyweb.specify.models import Splocalecontainer, datamodel
from specifyweb.backend.stored_queries.tests.base_format import SIMPLE_DEF
from unittest.mock import patch, Mock
from xml.etree.ElementTree import tostring

simple_def_accession = """
    <formatters>
    <format
        name="AccessionCustom"
        title="AccessionCustom"
        class="edu.ku.brc.specify.datamodel.Accession"
    >
        <switch single="true">
        <fields>
            <field>accessionNumber</field>
        </fields>
        </switch>
    </format>
        <format
        name="Accession"
        title="Accession"
        class="edu.ku.brc.specify.datamodel.Accession"
        default="true"
        >
        <switch single="true">
            <fields>
            <field>remarks</field>
            </fields>
        </switch>
        </format>
    </formatters>
"""

simple_def_taxon = """
    <formatters>
    <format
        name="TaxonFromSchema"
        title="TaxonFromSchema"
        class="edu.ku.brc.specify.datamodel.Taxon"
    >
        <switch single="true">
        <fields>
            <field>fullName</field>
        </fields>
        </switch>
    </format>
    </formatters>
"""

class TestGetFormatterDef(ApiTests):

    @patch('specifyweb.backend.stored_queries.format.app_resource.get_app_resource')
    def test_lookup_name(self, get_app_resource: Mock):
        get_app_resource.return_value = (simple_def_accession, None, None)
        obj_format = ObjectFormatter(self.collection, self.specifyuser, False)
        result = obj_format.getFormatterDef(datamodel.get_table('Accession'), "AccessionCustom")
        stred = tostring(result, encoding='unicode')
        self.assertIn("accessionNumber", stred)
        self.assertIn("AccessionCustom", stred)

    @patch('specifyweb.backend.stored_queries.format.app_resource.get_app_resource')
    def test_lookup_default(self, get_app_resource: Mock):
        get_app_resource.return_value = (simple_def_accession, None, None)
        obj_format = ObjectFormatter(self.collection, self.specifyuser, False)
        result = obj_format.getFormatterDef(datamodel.get_table('Accession'), None)
        stred = tostring(result, encoding='unicode')
        self.assertIn("remarks", stred)
        self.assertIn('name="Accession"', stred)

    @patch('specifyweb.backend.stored_queries.format.app_resource.get_app_resource')
    def test_no_splocale(self, get_app_resource: Mock):
        get_app_resource.return_value = (simple_def_accession, None, None)
        obj_format = ObjectFormatter(self.collection, self.specifyuser, False)
        result = obj_format.getFormatterDef(datamodel.get_table('Taxon'), None)
        self.assertIsNone(result)

    @patch('specifyweb.backend.stored_queries.format.app_resource.get_app_resource')
    def test_splocale_no_formatter_name(self, get_app_resource: Mock):
        Splocalecontainer.objects.create(
            name="taxon",
            schematype=0,
            discipline_id=self.discipline.id
        )
        get_app_resource.return_value = (simple_def_accession, None, None)
        obj_format = ObjectFormatter(self.collection, self.specifyuser, False)
        result = obj_format.getFormatterDef(datamodel.get_table('Taxon'), None)
        self.assertIsNone(result)

    @patch('specifyweb.backend.stored_queries.format.app_resource.get_app_resource')
    def test_splocale_formatter_name(self, get_app_resource: Mock):
        Splocalecontainer.objects.create(
            name="taxon",
            schematype=0,
            discipline_id=self.discipline.id,
            format="TaxonFromSchema"
        )
        get_app_resource.return_value = (simple_def_taxon, None, None)
        obj_format = ObjectFormatter(self.collection, self.specifyuser, False)
        result = obj_format.getFormatterDef(datamodel.get_table('Taxon'), None)
        stred = tostring(result, encoding='unicode')
        self.assertIn("edu.ku.brc.specify.datamodel.Taxon", stred)
        self.assertIn("<field>fullName</field>", stred)

    @patch('specifyweb.backend.stored_queries.format.app_resource.get_app_resource')
    def test_splocale_formatter_name_mismatch(self, get_app_resource: Mock):
        Splocalecontainer.objects.create(
            name="taxon",
            schematype=0,
            discipline_id=self.discipline.id,
            format="TaxonSchemaMismatch"
        )
        get_app_resource.return_value = (simple_def_taxon, None, None)
        obj_format = ObjectFormatter(self.collection, self.specifyuser, False)
        result = obj_format.getFormatterDef(datamodel.get_table('Taxon'), None)
        stred = tostring(result, encoding='unicode')
        self.assertIn("edu.ku.brc.specify.datamodel.Taxon", stred)
        self.assertIn("<field>fullName</field>", stred)
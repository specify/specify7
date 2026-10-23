from pathlib import Path
from unittest.mock import Mock, patch
from xml.etree import ElementTree

from django.conf import settings
from django.test import Client, SimpleTestCase

from specifyweb.backend.context.app_resource import (
    get_data_view_queries_resource,
    merge_formatters,
)
from specifyweb.specify.tests.test_api import ApiTests


FOUND_RESOURCE = ('<resource><text>"Value"</text></resource>', "text/xml", 4)


class TestMergeFormatters(SimpleTestCase):
    def test_inherits_named_formats_and_aggregators_without_replacing_custom_ones(self):
        custom = '''<formatters>
          <format class="Collector" name="Collector" default="true" title="Custom"/>
          <aggregators>
            <aggregator class="Collector" name="Collector" default="true" title="Custom"/>
          </aggregators>
        </formatters>'''
        defaults = '''<formatters>
          <format class="Collector" name="Collector" default="true" title="Default"/>
          <format class="Collector" name="CollectorID" default="false"/>
          <format class="Collector" name="Other" default="false"/>
          <aggregators>
            <aggregator class="Collector" name="Collector" default="true" title="Default"/>
            <aggregator class="Collector" name="Collector Identifiers" default="false" format="CollectorID"/>
            <aggregator class="Collector" name="Other" default="false"/>
          </aggregators>
        </formatters>'''

        merged = ElementTree.fromstring(merge_formatters(custom, defaults))
        self.assertEqual(
            [(node.get('name'), node.get('title')) for node in merged.findall('format')],
            [('Collector', 'Custom'), ('CollectorID', None)],
        )
        self.assertEqual(
            [
                (node.get('name'), node.get('title'))
                for node in merged.findall('aggregators/aggregator')
            ],
            [('Collector', 'Custom'), ('Collector Identifiers', None)],
        )
        self.assertEqual(
            [node.get('name') for node in merged.findall('format[@default="true"]')],
            ['Collector'],
        )
        without_aggregators = '''<formatters>
          <format class="Collector" name="Collector" default="true"/>
        </formatters>'''
        inherited = ElementTree.fromstring(
            merge_formatters(without_aggregators, defaults)
        )
        self.assertIsNotNone(
            inherited.find('aggregators/aggregator[@name="Collector Identifiers"]')
        )

    def test_backstop_id_formats_survive_custom_formatters(self):
        custom = '''<formatters>
          <format class="edu.ku.brc.specify.datamodel.Collector" name="Collector" default="true"/>
          <format class="edu.ku.brc.specify.datamodel.Determiner" name="Determiner" default="true"/>
          <format class="edu.ku.brc.specify.datamodel.AgentIdentifier" name="CustomIdentifier" default="true"/>
          <aggregators>
            <aggregator class="edu.ku.brc.specify.datamodel.Collector" name="Collector" default="true"/>
            <aggregator class="edu.ku.brc.specify.datamodel.Determiner" name="Determiner" default="true"/>
          </aggregators>
        </formatters>'''
        backstop = (
            Path(settings.SPECIFY_CONFIG_DIR) / 'backstop' / 'dataobj_formatters.xml'
        ).read_text()
        merged = ElementTree.fromstring(merge_formatters(custom, backstop))

        for name in ('AgentIdentifier', 'CollectorID', 'DeterminerID'):
            self.assertIsNotNone(merged.find(f'format[@name="{name}"]'))
        for name in ('AgentIdentifier', 'Collector Identifiers', 'Determiner Identifiers'):
            self.assertIsNotNone(merged.find(f'aggregators/aggregator[@name="{name}"]'))


class TestAppResource(ApiTests):

    @patch("specifyweb.backend.context.app_resource.load_resource_at_level")
    @patch("specifyweb.backend.context.app_resource.get_app_resource_from_db")
    def test_data_view_queries_inherit_by_table(
        self, get_from_db: Mock, load_from_filesystem: Mock
    ):
        discipline = ('{"version": 1, "queries": {"Agent": {"fields": [{"marker": 1, "stringId": "Agent", "fieldName": "Name", "tableList": "Agent", "isDisplay": true, "isNot": false, "sortType": 0, "operStart": 1, "startValue": "", "isRelFld": null}]}, "Loan": {"fields": [{"marker": 2, "stringId": "Loan", "fieldName": "LoanNumber", "tableList": "Loan", "isDisplay": true, "isNot": false, "sortType": 0, "operStart": 1, "startValue": "", "isRelFld": null}]}}}', 'application/json', 1)
        personal = ('{"version": 1, "queries": {"Agent": {"fields": [{"marker": 3, "stringId": "Agent", "fieldName": "Name", "tableList": "Agent", "isDisplay": true, "isNot": false, "sortType": 0, "operStart": 1, "startValue": "", "isRelFld": null}]}}}', 'application/json', 2)
        get_from_db.side_effect = lambda _collection, _user, level, _name: {
            'Discipline': discipline,
            'Personal': personal,
        }.get(level)
        load_from_filesystem.return_value = None

        result = get_data_view_queries_resource(self.collection, self.specifyuser)

        self.assertIsNotNone(result)
        self.assertEqual(
            result[0],
            '{"version": 1, "queries": {"Agent": {"fields": [{"marker": 3, "stringId": "Agent", "fieldName": "Name", "tableList": "Agent", "isDisplay": true, "isNot": false, "sortType": 0, "operStart": 1, "startValue": "", "isRelFld": null}]}, "Loan": {"fields": [{"marker": 2, "stringId": "Loan", "fieldName": "LoanNumber", "tableList": "Loan", "isDisplay": true, "isNot": false, "sortType": 0, "operStart": 1, "startValue": "", "isRelFld": null}]}}}',
        )
        self.assertEqual(result[1:], ('application/json', 2))

    @patch("specifyweb.backend.context.app_resource.load_resource_at_level")
    @patch("specifyweb.backend.context.app_resource.get_app_resource_from_db")
    def test_data_view_queries_skip_malformed_override_entry(
        self, get_from_db: Mock, load_from_filesystem: Mock
    ):
        discipline = ('{"version": 1, "queries": {"Agent": {"fields": [{"marker": 1, "stringId": "Agent", "fieldName": "Name", "tableList": "Agent", "isDisplay": true, "isNot": false, "sortType": 0, "operStart": 1, "startValue": "", "isRelFld": null}]}, "Loan": {"fields": [{"marker": 2, "stringId": "Loan", "fieldName": "LoanNumber", "tableList": "Loan", "isDisplay": true, "isNot": false, "sortType": 0, "operStart": 1, "startValue": "", "isRelFld": null}]}}}', 'application/json', 1)
        personal = ('{"version": 1, "queries": {"Agent": {}, "Loan": {"fields": [{"marker": 3, "stringId": "Loan", "fieldName": "LoanNumber", "tableList": "Loan", "isDisplay": true, "isNot": false, "sortType": 0, "operStart": 1, "startValue": "", "isRelFld": null}]}}}', 'application/json', 2)
        get_from_db.side_effect = lambda _collection, _user, level, _name: {
            'Discipline': discipline,
            'Personal': personal,
        }.get(level)
        load_from_filesystem.return_value = None

        result = get_data_view_queries_resource(self.collection, self.specifyuser)

        self.assertIsNotNone(result)
        self.assertEqual(
            result[0],
            '{"version": 1, "queries": {"Agent": {"fields": [{"marker": 1, "stringId": "Agent", "fieldName": "Name", "tableList": "Agent", "isDisplay": true, "isNot": false, "sortType": 0, "operStart": 1, "startValue": "", "isRelFld": null}]}, "Loan": {"fields": [{"marker": 3, "stringId": "Loan", "fieldName": "LoanNumber", "tableList": "Loan", "isDisplay": true, "isNot": false, "sortType": 0, "operStart": 1, "startValue": "", "isRelFld": null}]}}}',
        )
        self.assertEqual(result[1:], ('application/json', 2))

    def test_no_name(self):
        c = Client()
        c.force_login(self.specifyuser)
        response = c.get("/context/app.resource")
        self._assertStatusCodeEqual(response, 404)

    @patch("specifyweb.backend.context.views.get_app_resource")
    def test_found(self, get_app_resource: Mock):
        c = Client()
        c.force_login(self.specifyuser)
        get_app_resource.return_value = FOUND_RESOURCE

        response = c.get("/context/app.resource?name='simple'")
        self._assertStatusCodeEqual(response, 200)
        self._assertContentEqual(response, FOUND_RESOURCE[0])
        self.assertEqual(response["content-type"], FOUND_RESOURCE[1])
        self.assertEqual(response["X-Record-ID"], str(FOUND_RESOURCE[2]))

    @patch("specifyweb.backend.context.views.get_app_resource")
    def test_not_found_not_quiet(self, get_app_resource: Mock):
        c = Client()
        c.force_login(self.specifyuser)
        get_app_resource.return_value = None

        response = c.get("/context/app.resource?name='simple'")
        self._assertStatusCodeEqual(response, 404)

    @patch("specifyweb.backend.context.views.get_app_resource")
    def test_not_found_quiet(self, get_app_resource: Mock):
        c = Client()
        c.force_login(self.specifyuser)
        get_app_resource.return_value = None

        response = c.get("/context/app.resource?name='simple'&quiet='true'")
        self._assertStatusCodeEqual(response, 204)

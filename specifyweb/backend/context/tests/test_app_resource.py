from xml.etree import ElementTree

from django.test import Client

from specifyweb.specify.tests.test_api import ApiTests
from unittest.mock import Mock, patch

from specifyweb.backend.context.app_resource import (
    _catalog_number_uiformatters_only,
    get_catalog_number_format_names_for_discipline,
    get_data_view_queries_resource,
    merge_ui_formatters_by_name,
)


FOUND_RESOURCE = ('<resource><text>"Value"</text></resource>', "text/xml", 4)

DISCIPLINE_UI_FORMATTERS = """<?xml version="1.0" encoding="UTF-8"?>
<formats>
  <format name="BirdsCatalog" class="edu.ku.brc.specify.datamodel.CollectionObject" fieldname="catalogNumber"/>
  <format name="GridRefMGRS" class="edu.ku.brc.specify.datamodel.Locality" fieldname="text3"/>
</formats>
"""

BACKSTOP_UI_FORMATTERS = """<?xml version="1.0" encoding="UTF-8"?>
<formats>
  <format name="CatalogNumber" class="edu.ku.brc.specify.datamodel.CollectionObject" fieldname="catalogNumber"/>
  <format name="CatalogNumberNumeric" class="edu.ku.brc.specify.datamodel.CollectionObject" fieldname="catalogNumber"/>
</formats>
"""


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

    def test_merge_ui_formatters_by_name_first_wins(self):
        merged = merge_ui_formatters_by_name(
            DISCIPLINE_UI_FORMATTERS, BACKSTOP_UI_FORMATTERS
        )
        root = ElementTree.fromstring(merged)
        names = [fmt.get('name') for fmt in root.findall('format')]
        self.assertEqual(
            names, ['BirdsCatalog', 'GridRefMGRS', 'CatalogNumber', 'CatalogNumberNumeric']
        )

    def test_catalog_number_filter_before_name_dedupe(self):
        """A non-catalog format must not block a same-named catalogNumber format."""
        non_catalog_first = """<?xml version="1.0" encoding="UTF-8"?>
<formats>
  <format name="SharedName" class="edu.ku.brc.specify.datamodel.Locality" fieldname="text3"/>
</formats>
"""
        catalog_later = """<?xml version="1.0" encoding="UTF-8"?>
<formats>
  <format name="SharedName" class="edu.ku.brc.specify.datamodel.CollectionObject" fieldname="catalogNumber"/>
</formats>
"""
        # Unfiltered merge would keep only the Locality format.
        unfiltered = merge_ui_formatters_by_name(non_catalog_first, catalog_later)
        self.assertEqual(
            [
                (f.get('name'), f.get('fieldname'))
                for f in ElementTree.fromstring(unfiltered).findall('format')
            ],
            [('SharedName', 'text3')],
        )

        filtered = merge_ui_formatters_by_name(
            _catalog_number_uiformatters_only(non_catalog_first),
            _catalog_number_uiformatters_only(catalog_later),
        )
        self.assertEqual(
            [
                (f.get('name'), f.get('fieldname'))
                for f in ElementTree.fromstring(filtered).findall('format')
            ],
            [('SharedName', 'catalogNumber')],
        )

    @patch("specifyweb.backend.context.app_resource.load_resource_at_level")
    @patch("specifyweb.backend.context.app_resource._uiformatters_xml_from_dirs")
    def test_catalog_number_format_names_for_discipline(
        self, xml_from_dirs: Mock, load_from_filesystem: Mock
    ):
        xml_from_dirs.return_value = [DISCIPLINE_UI_FORMATTERS]
        load_from_filesystem.side_effect = lambda _collection, _user, level, _name: (
            (BACKSTOP_UI_FORMATTERS, 'text/xml', None)
            if level == 'Backstop'
            else None
        )

        names = get_catalog_number_format_names_for_discipline(self.discipline)
        self.assertEqual(
            names,
            ['BirdsCatalog', 'CatalogNumber', 'CatalogNumberNumeric'],
        )
        self.assertNotIn('GridRefMGRS', names)
        # Discipline + Common + Backstop filesystem levels are consulted.
        self.assertEqual(
            [call.args[2] for call in load_from_filesystem.call_args_list],
            ['Discipline', 'Common', 'Backstop'],
        )

    def test_catalog_number_format_names_endpoint(self):
        c = Client()
        c.force_login(self.specifyuser)

        with patch(
            'specifyweb.backend.context.views.get_catalog_number_format_names_for_discipline',
            return_value=['CatalogNumber', 'BirdsCatalog'],
        ):
            response = c.get(
                f'/context/catalog_number_format_names.json?discipline={self.discipline.id}'
            )

        self._assertStatusCodeEqual(response, 200)
        self.assertEqual(
            response.json(),
            {'names': ['CatalogNumber', 'BirdsCatalog']},
        )

    def test_catalog_number_format_names_endpoint_requires_discipline(self):
        c = Client()
        c.force_login(self.specifyuser)
        response = c.get('/context/catalog_number_format_names.json')
        self._assertStatusCodeEqual(response, 400)

from xml.etree import ElementTree

from django.test import Client

from specifyweb.specify.tests.test_api import ApiTests
from unittest.mock import Mock, patch

from specifyweb.backend.context.app_resource import (
    get_app_resource,
    get_data_view_queries_resource,
    merge_ui_formatters,
)


FOUND_RESOURCE = ('<resource><text>"Value"</text></resource>', "text/xml", 4)

CUSTOM_UI_FORMATTERS = """<?xml version="1.0" encoding="UTF-8"?>
<formats>
  <format system="false" name="GridRefMGRS" class="edu.ku.brc.specify.datamodel.Locality" fieldname="text3" default="false">
    <field type="regex" value="[A-Z]+" pattern="AA" />
  </format>
  <format system="false" name="CatalogNumber" class="edu.ku.brc.specify.datamodel.CollectionObject" fieldname="catalogNumber" default="true">
    <field type="numeric" size="6" inc="true"/>
  </format>
</formats>
"""

COMMON_UI_FORMATTERS = """<?xml version="1.0" encoding="UTF-8"?>
<formats>
  <format system="false" name="AccessionNumber" class="edu.ku.brc.specify.datamodel.Accession" fieldname="accessionNumber" default="true">
    <field type="year" size="4" value="YEAR"/>
    <field type="separator" value="-"/>
    <field type="alphanumeric" size="2" value="AA"/>
    <field type="separator" value="-"/>
    <field type="numeric" size="3" inc="true"/>
  </format>
  <format system="false" name="CatalogNumber" class="edu.ku.brc.specify.datamodel.CollectionObject" fieldname="catalogNumber" default="true">
    <field type="regex" value="COMMON" pattern="COMMON" />
  </format>
</formats>
"""

BACKSTOP_UI_FORMATTERS = """<?xml version="1.0" encoding="UTF-8"?>
<formats>
  <format system="false" name="CatalogNumber" class="edu.ku.brc.specify.datamodel.CollectionObject" fieldname="catalogNumber" default="true">
    <field type="year" size="4" value="YEAR"/>
  </format>
  <format system="true" name="CatalogNumberNumeric" class="edu.ku.brc.specify.datamodel.CollectionObject" fieldname="catalogNumber" default="false">
    <external>edu.ku.brc.specify.ui.CatalogNumberUIFieldFormatter</external>
  </format>
  <format system="true" name="CatalogNumberString" class="edu.ku.brc.specify.datamodel.CollectionObject" fieldname="catalogNumber" default="false">
    <external>edu.ku.brc.specify.ui.CatalogNumberStringUIFieldFormatter</external>
  </format>
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

    def test_merge_ui_formatters_by_name(self):
        merged = merge_ui_formatters(CUSTOM_UI_FORMATTERS, BACKSTOP_UI_FORMATTERS)
        root = ElementTree.fromstring(merged)
        names = [fmt.get('name') for fmt in root.findall('format')]

        self.assertEqual(
            names,
            ['GridRefMGRS', 'CatalogNumber', 'CatalogNumberNumeric', 'CatalogNumberString'],
        )
        # Custom CatalogNumber wins over backstop (keeps numeric part, not year).
        catalog_number = root.find("./format[@name='CatalogNumber']")
        self.assertIsNotNone(catalog_number)
        self.assertIsNotNone(catalog_number.find("./field[@type='numeric']"))
        self.assertIsNone(catalog_number.find("./field[@type='year']"))

    @patch("specifyweb.backend.context.app_resource.load_resource_at_level")
    @patch("specifyweb.backend.context.app_resource.get_app_resource_from_db")
    def test_uiformatters_merge_custom_with_backstop(
        self, get_from_db: Mock, load_from_filesystem: Mock
    ):
        get_from_db.side_effect = lambda _collection, _user, level, _name: (
            (CUSTOM_UI_FORMATTERS, 'text/xml', 23) if level == 'Collection' else None
        )
        load_from_filesystem.side_effect = lambda _collection, _user, level, _name: (
            (BACKSTOP_UI_FORMATTERS, 'text/xml', None) if level == 'Backstop' else None
        )

        result = get_app_resource(self.collection, self.specifyuser, 'UIFormatters')

        self.assertIsNotNone(result)
        data, mimetype, resource_id = result
        self.assertEqual(mimetype, 'text/xml')
        self.assertEqual(resource_id, 23)

        names = {
            fmt.get('name')
            for fmt in ElementTree.fromstring(data).findall('format')
        }
        self.assertEqual(
            names,
            {
                'GridRefMGRS',
                'CatalogNumber',
                'CatalogNumberNumeric',
                'CatalogNumberString',
            },
        )

    @patch("specifyweb.backend.context.app_resource.load_resource_at_level")
    @patch("specifyweb.backend.context.app_resource.get_app_resource_from_db")
    def test_uiformatters_merge_common_before_backstop(
        self, get_from_db: Mock, load_from_filesystem: Mock
    ):
        get_from_db.side_effect = lambda _collection, _user, level, _name: {
            'Collection': (CUSTOM_UI_FORMATTERS, 'text/xml', 23),
            'Common': (COMMON_UI_FORMATTERS, 'text/xml', 11),
        }.get(level)
        load_from_filesystem.side_effect = lambda _collection, _user, level, _name: (
            (BACKSTOP_UI_FORMATTERS, 'text/xml', None) if level == 'Backstop' else None
        )

        result = get_app_resource(self.collection, self.specifyuser, 'UIFormatters')

        self.assertIsNotNone(result)
        data, mimetype, resource_id = result
        self.assertEqual(mimetype, 'text/xml')
        self.assertEqual(resource_id, 23)

        root = ElementTree.fromstring(data)
        names = [fmt.get('name') for fmt in root.findall('format')]
        self.assertEqual(
            names,
            [
                'GridRefMGRS',
                'CatalogNumber',
                'AccessionNumber',
                'CatalogNumberNumeric',
                'CatalogNumberString',
            ],
        )
        # Collection CatalogNumber wins over Common and Backstop.
        catalog_number = root.find("./format[@name='CatalogNumber']")
        self.assertIsNotNone(catalog_number.find("./field[@type='numeric']"))
        self.assertIsNone(catalog_number.find("./field[@type='regex']"))
        self.assertIsNone(catalog_number.find("./field[@type='year']"))

    @patch("specifyweb.backend.context.app_resource.load_resource_at_level")
    @patch("specifyweb.backend.context.app_resource.get_app_resource_from_db")
    def test_uiformatters_additional_default_skips_custom(
        self, get_from_db: Mock, load_from_filesystem: Mock
    ):
        get_from_db.return_value = (CUSTOM_UI_FORMATTERS, 'text/xml', 23)
        load_from_filesystem.return_value = (
            BACKSTOP_UI_FORMATTERS,
            'text/xml',
            None,
        )

        result = get_app_resource(
            self.collection,
            self.specifyuser,
            'UIFormatters',
            additional_default=True,
        )

        self.assertIsNotNone(result)
        data, mimetype, resource_id = result
        self.assertEqual(mimetype, 'text/xml')
        self.assertIsNone(resource_id)
        names = {
            fmt.get('name')
            for fmt in ElementTree.fromstring(data).findall('format')
        }
        self.assertEqual(
            names,
            {
                'CatalogNumber',
                'CatalogNumberNumeric',
                'CatalogNumberString',
            },
        )
        self.assertNotIn('GridRefMGRS', names)
        get_from_db.assert_not_called()
        load_from_filesystem.assert_called_once_with(
            self.collection, self.specifyuser, 'Backstop', 'UIFormatters'
        )

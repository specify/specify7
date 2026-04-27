"""Tests for DwCA generation from cache tables."""

from unittest.mock import MagicMock, patch
from xml.etree import ElementTree as ET

from django.test import TestCase

from ..dwca_from_cache import (
    _build_eml_xml,
    _build_meta_xml,
    _sanitize_column_name_for_csv,
    _table_to_csv,
)


class TestSanitizeColumnNameForCsv(TestCase):
    """Test IRI -> term name extraction."""

    def test_simple_name(self):
        self.assertEqual(_sanitize_column_name_for_csv('catalogNumber'), 'catalogNumber')

    def test_full_iri(self):
        self.assertEqual(
            _sanitize_column_name_for_csv('http://rs.tdwg.org/dwc/terms/catalogNumber'),
            'catalogNumber',
        )

    def test_hash_iri(self):
        self.assertEqual(
            _sanitize_column_name_for_csv('http://purl.org/dc/terms#modified'),
            'modified',
        )

    def test_trailing_slash(self):
        self.assertEqual(
            _sanitize_column_name_for_csv('http://example.org/terms/locality'),
            'locality',
        )


class TestBuildMetaXml(TestCase):
    """Test meta.xml generation."""

    NS = '{http://rs.tdwg.org/dwc/text/}'

    def test_core_structure(self):
        core_fields = [
            {'term': 'http://rs.tdwg.org/dwc/terms/occurrenceID', 'column_name': 'occurrenceID', 'field_name': 'occurrenceID'},
            {'term': 'http://rs.tdwg.org/dwc/terms/catalogNumber', 'column_name': 'catalogNumber', 'field_name': 'catalogNumber'},
            {'term': '', 'column_name': 'internalField', 'field_name': 'internalField'},
        ]
        xml_str = _build_meta_xml(core_fields, [])
        root = ET.fromstring(xml_str)

        self.assertTrue(root.tag.endswith('archive'))
        self.assertEqual(root.get('metadata'), 'eml.xml')

        core = root.find(f'{self.NS}core')
        self.assertIsNotNone(core)
        self.assertEqual(core.get('rowType'), 'http://rs.tdwg.org/dwc/terms/Occurrence')
        self.assertEqual(core.get('ignoreHeaderLines'), '1')

        location = core.find(f'{self.NS}files/{self.NS}location')
        self.assertEqual(location.text, 'occurrence.csv')

        id_elem = core.find(f'{self.NS}id')
        self.assertIsNotNone(id_elem)
        self.assertEqual(id_elem.get('index'), '0')

        field_elems = core.findall(f'{self.NS}field')
        self.assertEqual(len(field_elems), 2)
        self.assertEqual(field_elems[0].get('term'), 'http://rs.tdwg.org/dwc/terms/occurrenceID')
        self.assertEqual(field_elems[1].get('term'), 'http://rs.tdwg.org/dwc/terms/catalogNumber')

    def test_with_extension(self):
        core_fields = [
            {'term': 'http://rs.tdwg.org/dwc/terms/occurrenceID', 'column_name': 'occurrenceID', 'field_name': 'occurrenceID'},
        ]
        ext_filenames = [{
            'filename': 'extension_0.csv',
            'fields': [
                {'term': 'http://rs.tdwg.org/dwc/terms/measurementType', 'column_name': 'measurementType', 'field_name': 'measurementType'},
            ],
            'mapping': MagicMock(),
        }]
        xml_str = _build_meta_xml(core_fields, ext_filenames)
        root = ET.fromstring(xml_str)

        extensions = root.findall(f'{self.NS}extension')
        self.assertEqual(len(extensions), 1)
        self.assertEqual(extensions[0].get('rowType'), 'http://rs.tdwg.org/dwc/terms/MeasurementOrFact')

        coreid = extensions[0].find(f'{self.NS}coreid')
        self.assertIsNotNone(coreid)
        self.assertEqual(coreid.get('index'), '0')


class TestBuildEmlXml(TestCase):
    """Test EML metadata generation."""

    def test_minimal_eml(self):
        dataset = MagicMock()
        dataset.metadata = None
        dataset.exportname = 'Test Export'
        dataset.filename = 'test_export.zip'

        xml_str = _build_eml_xml(dataset)
        root = ET.fromstring(xml_str)

        self.assertIn('eml', root.tag)
        self.assertEqual(root.get('packageId'), 'test_export.zip')

        title = root.find('dataset/title')
        self.assertIsNotNone(title)
        self.assertEqual(title.text, 'Test Export')

        pubdate = root.find('dataset/pubDate')
        self.assertIsNotNone(pubdate)
        # Should be a date string like YYYY-MM-DD
        self.assertRegex(pubdate.text, r'^\d{4}-\d{2}-\d{2}$')

        abstract = root.find('dataset/abstract/para')
        self.assertIsNotNone(abstract)
        self.assertIn('Test Export', abstract.text)


class TestTableToCsv(TestCase):
    """Test CSV generation from cache tables."""

    def test_empty_table(self):
        """When cache table doesn't exist, should return headers only."""
        fields = [
            {'column_name': 'occurrenceID', 'term': 'http://rs.tdwg.org/dwc/terms/occurrenceID', 'field_name': 'occurrenceID'},
            {'column_name': 'catalogNumber', 'term': 'http://rs.tdwg.org/dwc/terms/catalogNumber', 'field_name': 'catalogNumber'},
        ]
        csv_output = _table_to_csv('nonexistent_cache_table_xyz', fields)

        lines = csv_output.strip().split('\n')
        self.assertEqual(len(lines), 1)  # headers only
        self.assertIn('occurrenceID', lines[0])
        self.assertIn('catalogNumber', lines[0])

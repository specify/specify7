"""
This file demonstrates writing tests using the unittest module. These will pass
when you run "manage.py test".

Replace this with more appropriate tests for your application.
"""

from collections import namedtuple
from django.test import TestCase

from .dwca import DwCAException, ExportField, validate_stanzas

class SimpleTest(TestCase):
    def test_basic_addition(self):
        """
        Tests that 1 + 1 always equals 2.
        """
        self.assertEqual(1 + 1, 2)

class DwcaValidationTest(TestCase):
    @staticmethod
    def stanza(is_core, fields, index=0):
        return namedtuple('TestStanza', 'is_core export_fields id_field_idx')(
            is_core, fields, index
        )

    def test_requires_matching_extension_identifier(self):
        core = self.stanza(True, [ExportField(0, 'occurrenceID', True)])
        extension = self.stanza(False, [ExportField(0, 'eventID', True)])
        with self.assertRaises(DwCAException):
            validate_stanzas(core, [extension])

    def test_allows_multiple_extensions(self):
        core = self.stanza(True, [ExportField(0, 'occurrenceID', True)])
        extension = self.stanza(False, [ExportField(0, 'occurrenceID', True)])
        validate_stanzas(core, [extension, extension])

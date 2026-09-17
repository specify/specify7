"""
This file demonstrates writing tests using the unittest module. These will pass
when you run "manage.py test".

Replace this with more appropriate tests for your application.
"""

from collections import namedtuple
from django.test import TestCase

from specifyweb.specify.datamodel import datamodel

from .dwca import DwCAException, ExportField, validate_definition, validate_stanzas

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
        core = self.stanza(
            True,
            [ExportField(0, 'http://rs.tdwg.org/dwc/terms/occurrenceID', True)],
        )
        extension = self.stanza(False, [ExportField(0, 'eventID', True)])
        with self.assertRaises(DwCAException):
            validate_stanzas(core, [extension])

    def test_allows_multiple_extensions(self):
        occurrence_id = 'http://rs.tdwg.org/dwc/terms/occurrenceID'
        core = self.stanza(True, [ExportField(0, occurrence_id, True)])
        extension = self.stanza(False, [ExportField(0, occurrence_id, True)])
        validate_stanzas(core, [extension, extension])

    def test_uses_core_row_type_base_table(self):
        collecting_event_id = datamodel.get_table_strict('collectingevent').tableId
        collection_object_id = datamodel.get_table_strict('collectionobject').tableId
        definition = f'''
            <archive>
              <core rowType="http://rs.tdwg.org/dwc/terms/Event">
                <queries>
                  <query contextTableId="{collecting_event_id}" name="event.csv">
                    <id stringId="1.collectingevent.guid" isRelFld="false"
                        oper="11" value="" isNot="false"
                        term="http://rs.tdwg.org/dwc/terms/eventID" />
                  </query>
                </queries>
              </core>
            </archive>
        '''
        validate_definition(definition)

        invalid_definition = definition.replace(
            f'contextTableId="{collecting_event_id}"',
            f'contextTableId="{collection_object_id}"',
        )
        with self.assertRaises(DwCAException):
            validate_definition(invalid_definition)

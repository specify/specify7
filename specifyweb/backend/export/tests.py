"""
This file demonstrates writing tests using the unittest module. These will pass
when you run "manage.py test".

Replace this with more appropriate tests for your application.
"""

import os
import tempfile
from collections import namedtuple
from unittest.mock import Mock, patch
from zipfile import ZipFile

from django.test import Client, TestCase

from specifyweb.backend.export.feed import update_feed
from specifyweb.backend.notifications.models import Message
from specifyweb.backend.stored_queries.tests.tests import SQLAlchemySetup
from specifyweb.specify.datamodel import datamodel
from specifyweb.specify.models import (
    Spappresource,
    Spappresourcedata,
    Spappresourcedir,
)

from .dwca import DwCAException, ExportField, Stanza, validate_definition, validate_stanzas

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

    def test_conflicting_fields_do_not_echo_query_values(self):
        queries = [
            Mock(get_export_fields=Mock(return_value=('private first field',))),
            Mock(get_export_fields=Mock(return_value=('private second field',))),
        ]
        with self.assertRaisesMessage(
            DwCAException, 'Query definitions have conflicting fields.'
        ) as caught:
            Stanza.get_export_fields(queries)
        self.assertNotIn('private', str(caught.exception))

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

    def test_translates_missing_query_field_attributes(self):
        definition = '''
            <archive>
              <core rowType="http://rs.tdwg.org/dwc/terms/Occurrence">
                <queries>
                  <query contextTableId="1" name="occurrence.csv">
                    <id isRelFld="false" oper="11" value="" isNot="false"
                        term="http://rs.tdwg.org/dwc/terms/occurrenceID" />
                  </query>
                </queries>
              </core>
            </archive>
        '''
        with self.assertRaises(DwCAException):
            validate_definition(definition)

    def test_translates_missing_constant_field_attributes(self):
        definition = '''
            <archive>
              <core rowType="http://rs.tdwg.org/dwc/terms/Occurrence">
                <queries>
                  <query contextTableId="1" name="occurrence.csv">
                    <id stringId="1.collectionobject.guid" isRelFld="false"
                        oper="11" value="" isNot="false"
                        term="http://rs.tdwg.org/dwc/terms/occurrenceID" />
                  </query>
                </queries>
                <field value="PreservedSpecimen" />
              </core>
            </archive>
        '''
        with self.assertRaises(DwCAException):
            validate_definition(definition)


FEED_XML = """<feed>
  <title>Test Feed</title>
  <description>Test feed description</description>
  <language>en</language>
  <item filename="test_export.zip" days="1" collectionid="{collection_id}" userid="{user_id}" definition="DwCATestDefinition" metadata="DwCATestEML" publish="true">
    <title>Test Item</title>
    <id>test-item-id</id>
    <guid>test-item-guid</guid>
    <description>test item description</description>
  </item>
  <item filename="unpublished_export.zip" days="1" collectionid="{collection_id}" userid="{user_id}" definition="DwCATestDefinition" metadata="DwCATestEML" publish="false">
    <title>Unpublished Item</title>
    <id>unpublished-item-id</id>
    <guid>unpublished-item-guid</guid>
    <description>unpublished item description</description>
  </item>
  <item filename="missing_archive_export.zip" days="1" collectionid="{collection_id}" userid="{user_id}" definition="DwCATestDefinition" metadata="DwCATestEML" publish="true">
    <title>Missing Archive Item</title>
    <id>missing-archive-item-id</id>
    <guid>missing-archive-item-guid</guid>
    <description>missing archive item description</description>
  </item>
</feed>"""

DWCA_DEFINITION = """<definition>
  <core rowType="http://rs.tdwg.org/dwc/terms/Occurrence">
    <queries>
      <query contextTableId="1" name="collection_objects.csv">
        <id stringId="1.collectionobject.collectionobjectid" isRelFld="false" oper="1" value="" isNot="false" term="http://rs.tdwg.org/dwc/terms/occurrenceID"/>
        <field stringId="1.collectionobject.catalognumber" isRelFld="false" oper="1" value="" isNot="false" term="dwc:catalogNumber"/>
      </query>
    </queries>
  </core>
</definition>"""

EML = "<eml><dataset/></eml>"


def noop(*args, **kwargs):
    pass


class ExportFeedTests(SQLAlchemySetup):
    def setUp(self):
        super().setUp()
        directory = Spappresourcedir.objects.create(ispersonal=False)

        def create_resource(name, data):
            resource = Spappresource.objects.create(
                spappresourcedir=directory,
                specifyuser=self.specifyuser,
                level=0,
                name=name,
                mimetype='text/xml',
            )
            Spappresourcedata.objects.create(
                spappresource=resource,
                data=data.encode(),
            )

        create_resource('DwCATestDefinition', DWCA_DEFINITION)
        create_resource('DwCATestEML', EML)
        create_resource(
            'ExportFeed',
            FEED_XML.format(
                collection_id=self.collection.id,
                user_id=self.specifyuser.id,
            ),
        )

    def test_update_feed_generates_archive_and_notification(self):
        with tempfile.TemporaryDirectory() as tmp:
            with patch('specifyweb.backend.export.feed.FEED_DIR', tmp):
                # make_dwca must run queries against the Django test database
                with patch('specifyweb.backend.export.dwca.session_context', ExportFeedTests.test_session_context):
                    with patch('specifyweb.backend.stored_queries.execution.set_group_concat_max_len', noop):
                        update_feed(force=True)

            path = os.path.join(tmp, 'test_export.zip')
            self.assertTrue(os.path.exists(path))

            with ZipFile(path) as archive:
                names = archive.namelist()

            self.assertIn('meta.xml', names)
            self.assertIn('eml.xml', names)
            self.assertIn('collection_objects.csv', names)

            # the user gets a notification that the feed item was updated
            self.assertTrue(
                Message.objects.filter(
                    user=self.specifyuser,
                    content__contains='test_export.zip',
                ).exists()
            )

    def test_rss_feed_lists_published_items(self):
        with tempfile.TemporaryDirectory() as tmp:
            # create the archive file that the feed references
            open(os.path.join(tmp, 'test_export.zip'), 'w').close()

            with patch('specifyweb.backend.export.views.FEED_DIR', tmp):
                response = Client().get('/export/rss/')

            self.assertEqual(response.status_code, 200)
            content = response.content.decode()
            self.assertIn('test_export.zip', content)
            self.assertIn('Test Item', content)

            # unpublished items and items with no archive file are excluded
            self.assertNotIn('unpublished_export.zip', content)
            self.assertNotIn('Unpublished Item', content)
            self.assertNotIn('missing_archive_export.zip', content)
        self.assertNotIn('Missing Archive Item', content)

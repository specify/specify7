"""
This file demonstrates writing tests using the unittest module. These will pass
when you run "manage.py test".

Replace this with more appropriate tests for your application.
"""

import os
import tempfile
from unittest.mock import patch
from zipfile import ZipFile

from django.test import Client, TestCase

from specifyweb.specify.models import (
    Spappresource,
    Spappresourcedata,
    Spappresourcedir,
)
from specifyweb.backend.stored_queries.tests.tests import SQLAlchemySetup
from specifyweb.backend.notifications.models import Message
from specifyweb.backend.export.feed import update_feed


class SimpleTest(TestCase):
    def test_basic_addition(self):
        """
        Tests that 1 + 1 always equals 2.
        """
        self.assertEqual(1 + 1, 2)


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
</feed>"""

DWCA_DEFINITION = """<definition>
  <core rowType="http://rs.tdwg.org/dwc/terms/Occurrence">
    <queries>
      <query contextTableId="1" name="collection_objects.csv">
        <id stringId="1.collectionobject.collectionobjectid" isRelFld="false" oper="1" value="" isNot="false"/>
        <field stringId="1.collectionobject.catalognumber" isRelFld="false" oper="1" value="" isNot="false" term="dwc:catalogNumber"/>
      </query>
    </queries>
  </core>
</definition>"""

EML = "<eml><dataset/></eml>"


def noop(*args, **kwargs): ...


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
            messages = Message.objects.filter(user=self.specifyuser)
            self.assertTrue(messages.exists())
            self.assertIn('test_export.zip', messages[0].content)

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

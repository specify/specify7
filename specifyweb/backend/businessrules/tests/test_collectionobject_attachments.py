from unittest.mock import patch

from django.db.models.deletion import ProtectedError

from specifyweb.backend.workbench.models import Spdataset, Spdatasetattachment
from specifyweb.specify import models
from specifyweb.specify.api.crud import (
    delete_resource, get_collection, get_resource, post_resource,
)
from specifyweb.specify.api.serializers import uri_for_model
from specifyweb.specify.tests.test_api import ApiTests, skip_perms_check


class CollectionObjectAttachmentTests(ApiTests):
    def _add_attachment(self, co, filename, ordinal=0):
        # File transfer is covered by uploadFile.test.ts; persist its metadata
        # through the same API service used to save record attachments.
        return post_resource(
            self.collection, self.agent, 'collectionobjectattachment', {
                'collectionobject': uri_for_model('collectionobject', co.id),
                'ordinal': ordinal,
                'attachment': {
                    'origfilename': filename,
                    'attachmentlocation': f'uploaded-{filename}',
                    'mimetype': 'image/jpeg',
                    'title': filename,
                },
            },
        )

    def _get_attachments(self, co):
        return get_collection(
            self.collection, 'collectionobjectattachment', skip_perms_check,
            params={'collectionobject': str(co.id)},
        )['objects']

    def _assert_attachment(self, row, join, co, filename):
        self.assertEqual(row['id'], join.id)
        self.assertEqual(
            row['collectionobject'], uri_for_model('collectionobject', co.id)
        )
        attachment = get_resource('attachment', join.attachment_id, skip_perms_check)
        self.assertEqual(row['attachment']['id'], attachment['id'])
        self.assertEqual(attachment['origfilename'], filename)
        self.assertEqual(attachment['attachmentlocation'], f'uploaded-{filename}')
        self.assertEqual(attachment['mimetype'], 'image/jpeg')
        self.assertEqual(attachment['tableid'], models.Collectionobject.specify_model.tableId)
        self.assertEqual(attachment['scopeid'], self.collection.id)

    def test_add_single_attachment(self):
        co = self.collectionobjects[0]
        join = self._add_attachment(co, 'single.jpg')

        saved = models.Collectionobjectattachment.objects.get(id=join.id)
        self.assertEqual(saved.collectionobject_id, co.id)
        rows = self._get_attachments(co)
        self.assertEqual(len(rows), 1)
        self._assert_attachment(rows[0], saved, co, 'single.jpg')

    def test_add_multiple_attachments_are_distinct_and_scoped_to_record(self):
        co, other = self.collectionobjects[:2]
        first = self._add_attachment(co, 'first.jpg')
        second = self._add_attachment(co, 'second.jpg', ordinal=1)
        unrelated = self._add_attachment(other, 'unrelated.jpg')

        rows = {row['id']: row for row in self._get_attachments(co)}
        self.assertEqual(set(rows), {first.id, second.id})
        self.assertEqual(len({first.attachment_id, second.attachment_id, unrelated.attachment_id}), 3)
        self._assert_attachment(rows[first.id], first, co, 'first.jpg')
        self._assert_attachment(rows[second.id], second, co, 'second.jpg')
        self.assertEqual(rows[first.id]['ordinal'], 0)
        self.assertEqual(rows[second.id]['ordinal'], 1)
        other_rows = self._get_attachments(other)
        self.assertEqual(len(other_rows), 1)
        self._assert_attachment(other_rows[0], unrelated, other, 'unrelated.jpg')

    @patch('specifyweb.backend.attachment_gw.views.delete_attachment_file')
    def test_delete_selected_attachment_preserves_other_attachments(self, delete_file):
        co, other = self.collectionobjects[:2]
        selected = self._add_attachment(co, 'selected.jpg')
        retained = self._add_attachment(co, 'retained.jpg', ordinal=1)
        unrelated = self._add_attachment(other, 'unrelated.jpg')
        attachment_id = selected.attachment_id

        delete_resource(
            self.collection, self.agent, 'collectionobjectattachment',
            selected.id, selected.version,
        )

        self.assertNotExists(models.Collectionobjectattachment.objects.filter(id=selected.id))
        self.assertNotExists(models.Attachment.objects.filter(id=attachment_id))
        self.assertEqual(self._get_attachments(co)[0]['id'], retained.id)
        self.assertEqual(len(self._get_attachments(co)), 1)
        self.assertEqual([row['id'] for row in self._get_attachments(other)], [unrelated.id])
        remaining = get_collection(
            self.collection, 'attachment', skip_perms_check,
            params={'id__in': f'{attachment_id},{retained.attachment_id},{unrelated.attachment_id}'},
        )['objects']
        self.assertEqual({row['id'] for row in remaining}, {retained.attachment_id, unrelated.attachment_id})
        delete_file.assert_called_once_with('uploaded-selected.jpg')

    @patch('specifyweb.backend.attachment_gw.views.delete_attachment_file')
    def test_api_rejects_deleting_attachment_referenced_by_dataset(self, delete_file):
        co = self.collectionobjects[0]
        selected = self._add_attachment(co, 'shared.jpg')
        dataset = Spdataset.objects.create(
            name='Attachment source', collection=self.collection,
            specifyuser=self.specifyuser, columns=[],
        )
        dataset_join = Spdatasetattachment.objects.create(
            spdataset=dataset, attachment=selected.attachment,
            collectionmemberid=self.collection.id, ordinal=0,
        )
        # A dataset upload assigns the attachment to the CO after creating
        # the dataset reference.
        selected.save()

        # The API explicitly deletes dependent attachments, so the dataset's
        # protected FK rejects this operation. Its transaction must roll back
        # removal of the CO association as well.
        with self.assertRaises(ProtectedError):
            delete_resource(
                self.collection, self.agent, 'collectionobjectattachment',
                selected.id, selected.version,
            )

        self.assertEqual([row['id'] for row in self._get_attachments(co)], [selected.id])
        self.assertExists(Spdatasetattachment.objects.filter(id=dataset_join.id))
        attachment = get_resource('attachment', selected.attachment_id, skip_perms_check)
        self.assertEqual(attachment['tableid'], models.Collectionobject.specify_model.tableId)
        self.assertEqual(attachment['attachmentlocation'], 'uploaded-shared.jpg')
        delete_file.assert_not_called()

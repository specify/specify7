from unittest.mock import patch

from specifyweb.backend.workbench.models import Spdataset, Spdatasetattachment
from specifyweb.specify import models
from specifyweb.specify.tests.test_api import ApiTests
from specifyweb.specify.utils.scoping import ScopeType


class TestAttachmentRules(ApiTests):
    def test_join_save_sets_attachment_table_and_scope(self):
        attachment = models.Attachment.objects.create(
            origfilename="test.jpg",
            attachmentlocation="test.jpg",
        )

        models.Collectionobjectattachment.objects.create(
            collectionmemberid=self.collection.id,
            ordinal=0,
            attachment=attachment,
            collectionobject=self.collectionobjects[0],
        )

        attachment.refresh_from_db()
        self.assertEqual(
            attachment.tableid, models.Collectionobject.specify_model.tableId
        )
        self.assertEqual(attachment.scopetype, ScopeType.COLLECTION.value)
        self.assertEqual(attachment.scopeid, self.collection.id)

    def test_delete_join_keeps_attachment_while_dataset_references_it(self):
        attachment = models.Attachment.objects.create(
            origfilename="test.jpg",
            attachmentlocation="test.jpg",
        )
        collectionobject_attachment = (
            models.Collectionobjectattachment.objects.create(
                collectionmemberid=self.collection.id,
                ordinal=0,
                attachment=attachment,
                collectionobject=self.collectionobjects[0],
            )
        )
        dataset = Spdataset.objects.create(
            collection=self.collection,
            specifyuser=self.specifyuser,
            name="Test dataset",
            columns=[],
            data=[],
        )
        Spdatasetattachment.objects.create(
            collectionmemberid=self.collection.id,
            ordinal=0,
            attachment=attachment,
            spdataset=dataset,
        )

        collectionobject_attachment.delete()

        attachment.refresh_from_db()
        self.assertEqual(attachment.tableid, Spdataset.specify_model.tableId)

    @patch(
        "specifyweb.backend.attachment_gw.views.delete_attachment_file"
    )
    def test_delete_last_dataset_reference_deletes_attachment(
        self, delete_attachment_file
    ):
        attachment = models.Attachment.objects.create(
            origfilename="test.jpg",
            attachmentlocation="test.jpg",
        )
        dataset = Spdataset.objects.create(
            collection=self.collection,
            specifyuser=self.specifyuser,
            name="Test dataset",
            columns=[],
            data=[],
        )
        dataset_attachment = Spdatasetattachment.objects.create(
            collectionmemberid=self.collection.id,
            ordinal=0,
            attachment=attachment,
            spdataset=dataset,
        )

        dataset_attachment.delete()

        delete_attachment_file.assert_called_once_with(
            attachment.attachmentlocation
        )
        self.assertFalse(
            models.Attachment.objects.filter(id=attachment.id).exists()
        )
        delete_attachment_file.assert_called_once_with('test.jpg')

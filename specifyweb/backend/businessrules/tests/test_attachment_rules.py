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

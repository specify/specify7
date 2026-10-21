from specifyweb.specify.models import Attachment
from specifyweb.backend.merge.record_merging import _clear_attachment_location
from specifyweb.specify.tests.test_api import ApiTests


class TestClearAttachmentLocation(ApiTests):
    
    def test_location_gets_cleared(self):
        attachment = Attachment.objects.create(attachmentlocation="SomeLocation")
        attachment.credit = "SomeTextValue"
        _clear_attachment_location(attachment)

        attachment.refresh_from_db()
        self.assertIsNone(attachment.attachmentlocation, None)
        self.assertEqual(attachment.credit, "SomeTextValue")

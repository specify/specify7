from specifyweb.specify import models
from specifyweb.specify.tests.test_api import ApiTests
from specifyweb.specify.api.crud import create_obj, delete_resource, get_collection, get_resource, post_resource, update_obj


class BatchImageTests(ApiTests):
    def setUp(self):
        super().setUp()

        self.attachments = [
            models.Attachment.objects.create(
                origfilename='test.txt',
                tableid=1,
            )
        ]

    def test_add_attachment(self):
            attachment = post_resource(
                self.collection,
                self.agent,
                'attachment',
                {'origfilename': 'new.txt', 'tableid': 1},
            )
    
            self.assertIsNotNone(attachment.id)
            self.assertExists(
                models.Attachment.objects.filter(
                    id=attachment.id,
                    origfilename='new.txt',
                )
            )
    
            attachment.delete()
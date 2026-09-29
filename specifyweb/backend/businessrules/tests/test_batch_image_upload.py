from specifyweb.specify import models
from specifyweb.specify.tests.test_api import ApiTests
from specifyweb.specify.api.crud import post_resource


class BatchImageTests(ApiTests):
    def setUp(self):
        super().setUp()
        
        self.attachments = [  
         models.Attachment.objects.create(
            attachmentlocation='0123.png',
                origfilename='0123.png',
                title='0123.png',
                mimetype='image/png',
                tableid=model.Attachment.specify_model.tableId,
        )
    ]

    def test_match_collectionobject_catnumber(self):
        attachment = self.attachments[0]

        
        self.assertEquals()

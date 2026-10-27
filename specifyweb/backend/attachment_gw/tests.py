import io
import zipfile
from unittest.mock import patch

from django.test import override_settings

from specifyweb.specify import models
from specifyweb.specify.tests.test_api import ApiTests


@override_settings(WEB_ATTACHMENT_KEY="test-key")
class TestDownloadAllWithRecordSet(ApiTests):
    def setUp(self):
        super().setUp()
        self.client.force_login(self.specifyuser)

        self.attachment = models.Attachment.objects.create(
            origfilename="photo.jpg",
            attachmentlocation="stored-photo.jpg",
        )
        models.Collectionobjectattachment.objects.create(
            collectionmemberid=self.collection.id,
            ordinal=0,
            attachment=self.attachment,
            collectionobject=self.collectionobjects[0],
        )

        self.other_attachment = models.Attachment.objects.create(
            origfilename="other.jpg",
            attachmentlocation="stored-other.jpg",
        )
        models.Collectionobjectattachment.objects.create(
            collectionmemberid=self.collection.id,
            ordinal=0,
            attachment=self.other_attachment,
            collectionobject=self.collectionobjects[1],
        )

        self.recordset = models.Recordset.objects.create(
            collectionmemberid=self.collection.id,
            dbtableid=models.Collectionobject.specify_model.tableId,
            name="Record set with attachment",
            type=0,
            specifyuser=self.specifyuser,
        )
        models.Recordsetitem.objects.create(
            recordset=self.recordset,
            recordid=self.collectionobjects[0].id,
        )

    @patch("specifyweb.backend.attachment_gw.views.requests.Session.get")
    def test_download_all_includes_record_set_attachments(self, get):
        get.return_value.status_code = 200
        get.return_value.iter_content.return_value = [b"image-bytes"]

        with patch(
            "specifyweb.backend.attachment_gw.views.server_urls",
            {"read": "http://asset.test/read"},
        ), patch(
            "specifyweb.backend.attachment_gw.views.server_time_delta", 0
        ):
            response = self.client.post(
                "/attachment_gw/download_all/",
                {
                    "attachmentlocations": [],
                    "origfilenames": [],
                    "recordsetid": self.recordset.id,
                },
                content_type="application/json",
            )
            self.assertEqual(response.status_code, 200)
            content = b"".join(response.streaming_content)

        get.assert_called_once()
        self.assertEqual(
            get.call_args.kwargs["params"]["filename"], "stored-photo.jpg"
        )

        with zipfile.ZipFile(io.BytesIO(content)) as archive:
            self.assertEqual(archive.namelist(), ["photo.jpg"])
            self.assertEqual(archive.read("photo.jpg"), b"image-bytes")

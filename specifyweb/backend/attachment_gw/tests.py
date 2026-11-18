import io
import json
import zipfile
from unittest.mock import patch

from django.test import Client, override_settings

from specifyweb.backend.attachment_gw.models import Spattachmentdataset
from specifyweb.specify import models
from specifyweb.specify.tests.test_api import ApiTests


class TestAttachmentDataset(ApiTests):
    def setUp(self):
        super().setUp()
        self.client = Client()
        self.client.force_login(self.specifyuser)

    def test_create_attachment_dataset(self):
        response = self.client.post(
            "/attachment_gw/dataset/",
            {
                "name": "Batch upload test",
                "rows": [],
                "uploadplan": {
                    "staticPathKey": "collectionObjectCatalogNumber"
                },
                "matchingmode": None,
            },
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201, response.content.decode())

        dataset = Spattachmentdataset.objects.get(id=response.json()["id"])
        self.assertEqual(dataset.name, "Batch upload test")
        self.assertEqual(dataset.collection, self.collection)
        self.assertEqual(dataset.specifyuser, self.specifyuser)
        self.assertEqual(dataset.createdbyagent, self.agent)
        self.assertEqual(dataset.uploaderstatus, "main")
        self.assertEqual(dataset.data, [])
        self.assertEqual(
            json.loads(dataset.uploadplan),
            {"staticPathKey": "collectionObjectCatalogNumber"},
        )

    def test_rename_attachment_dataset(self):
        dataset = Spattachmentdataset.objects.create(
            specifyuser=self.specifyuser,
            collection=self.collection,
            name="Original name",
            data=[],
            uploaderstatus="main",
            uploadplan=json.dumps(
                {"staticPathKey": "collectionObjectCatalogNumber"}
            ),
            createdbyagent=self.agent,
            modifiedbyagent=self.agent,
        )

        response = self.client.put(
            f"/attachment_gw/dataset/{dataset.id}/",
            {
                "name": "Renamed dataset",
                "rows": [],
                "uploadplan": {
                    "staticPathKey": "collectionObjectCatalogNumber"
                },
                "uploaderstatus": "main",
                "matchingmode": None,
            },
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 204, response.content.decode())

        dataset.refresh_from_db()
        self.assertEqual(dataset.name, "Renamed dataset")
        self.assertEqual(dataset.collection, self.collection)
        self.assertEqual(dataset.specifyuser, self.specifyuser)
        self.assertEqual(dataset.createdbyagent, self.agent)

    def test_attachment_dataset_metadata(self):
        dataset = Spattachmentdataset.objects.create(
            specifyuser=self.specifyuser,
            collection=self.collection,
            name="Metadata dataset",
            remarks="Dataset remarks",
            importedfilename="files.csv",
            data=[{"name": "row-1"}],
            uploaderstatus="main",
            uploadplan=json.dumps(
                {"staticPathKey": "collectionObjectCatalogNumber"}
            ),
            matchingmode="mappingFile",
            createdbyagent=self.agent,
            modifiedbyagent=self.agent,
        )

        response = self.client.get(f"/attachment_gw/dataset/{dataset.id}/")

        self.assertEqual(response.status_code, 200, response.content.decode())
        data = response.json()
        self.assertEqual(data["name"], "Metadata dataset")
        self.assertEqual(data["remarks"], "Dataset remarks")
        self.assertEqual(data["importedfilename"], "files.csv")
        self.assertEqual(data["matchingmode"], "mappingFile")
        self.assertEqual(data["uploaderstatus"], "main")
        self.assertEqual(
            data["uploadplan"],
            {"staticPathKey": "collectionObjectCatalogNumber"},
        )
        self.assertEqual(data["rows"], [{"name": "row-1"}])
        self.assertEqual(
            data["createdbyagent"], f"/api/specify/agent/{self.agent.id}/"
        )
        self.assertEqual(
            data["modifiedbyagent"], f"/api/specify/agent/{self.agent.id}/"
        )
        self.assertIsNotNone(data["timestampcreated"])
        self.assertIsNotNone(data["timestampmodified"])


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

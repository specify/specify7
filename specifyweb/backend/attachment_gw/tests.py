import json

from django.test import Client

from specifyweb.backend.attachment_gw.models import Spattachmentdataset
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

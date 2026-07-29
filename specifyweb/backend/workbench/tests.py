import json

from django.test import Client

from specifyweb.backend.notifications.models import Message
from specifyweb.backend.permissions.models import UserPolicy
from specifyweb.backend.workbench.models import Spdataset
from specifyweb.specify.models import Agent, Collectionobject, Recordset, Specifyuser
from specifyweb.specify.tests.test_api import ApiTests
from .upload import upload as uploader
from .upload.upload_result import UploadResult


class DataSetTests(ApiTests):

    def test_reset_uploadplan_to_null(self) -> None:
        c = Client()
        c.force_login(self.specifyuser)
        response = c.post(
            "/api/workbench/dataset/",
            data={
                "name": "Test data set",
                "columns": [],
                "rows": [],
                "importedfilename": "foobar",
            },
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.content)
        datasetid = data["id"]
        response = c.put(
            f"/api/workbench/dataset/{datasetid}/",
            data={
                "name": "Test data set modified",
                "uploadplan": {
                    "baseTableName": "preptype",
                    "uploadable": {
                        "uploadTable": {
                            "wbcols": {
                                "name": "Preparation Type",
                                "isloanable": "Is Loanable",
                            },
                            "static": {},
                            "toOne": {},
                            "toMany": {},
                        }
                    },
                },
            },
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 204)
        response = c.put(
            f"/api/workbench/dataset/{datasetid}/",
            data={
                "name": "Test data set modified modified",
                "uploadplan": None,
            },
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 204)
        dataset = Spdataset.objects.get(id=datasetid)
        self.assertEqual(dataset.uploadplan, None)

    def test_validate_dataset_without_uploading(self) -> None:
        client = Client()
        client.force_login(self.specifyuser)

        response = client.post(
            "/api/workbench/dataset/",
            data={
                "name": "Validation-only data set",
                "columns": ["Catalog Number"],
                "rows": [["900000001"]],
                "importedfilename": "validation.csv",
            },
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 201)
        dataset_id = json.loads(response.content)["id"]

        response = client.put(
            f"/api/workbench/dataset/{dataset_id}/",
            data={
                "uploadplan": {
                    "baseTableName": "collectionobject",
                    "uploadable": {
                        "uploadTable": {
                            "wbcols": {
                                "catalognumber": "Catalog Number",
                            },
                            "static": {},
                            "toOne": {},
                            "toMany": {},
                        }
                    },
                },
            },
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 204)

        response = client.post(
            f"/api/workbench/validate/{dataset_id}/",
            data={"background": False},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertIsNone(json.loads(response.content))

        dataset = Spdataset.objects.get(id=dataset_id)
        self.assertIsNone(dataset.uploaderstatus)
        self.assertIsNone(dataset.uploadresult)
        self.assertIsNotNone(dataset.rowresults)

        validation_results = [
            UploadResult.from_json(result)
            for result in json.loads(dataset.rowresults or "[]")
        ]
        self.assertEqual(len(validation_results), 1)
        self.assertFalse(validation_results[0].contains_failure())

        self.assertFalse(
            Collectionobject.objects.filter(
                collection=self.collection,
                catalognumber="900000001",
            ).exists()
        )

    def test_create_record_set(self) -> None:
        c = Client()
        c.force_login(self.specifyuser)
        response = c.post(
            "/api/workbench/dataset/",
            data={
                "name": "Test data set",
                "columns": ["catno"],
                "rows": [["1"], ["2"], ["3"]],
                "importedfilename": "foobar",
            },
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.content)
        datasetid = data["id"]
        response = c.put(
            f"/api/workbench/dataset/{datasetid}/",
            data={
                "name": "Test data set modified",
                "uploadplan": {
                    "baseTableName": "collectionobject",
                    "uploadable": {
                        "uploadTable": {
                            "wbcols": {
                                "catalognumber": "catno",
                            },
                            "static": {},
                            "toOne": {},
                            "toMany": {},
                        }
                    },
                },
            },
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 204)

        dataset = Spdataset.objects.get(id=datasetid)
        results = uploader.do_upload_dataset(
            self.collection,
            self.agent.id,
            dataset,
            no_commit=False,
            allow_partial=False,
        )

        self.assertTrue(dataset.uploadresult["success"])

        response = c.post(
            f"/api/workbench/create_recordset/{datasetid}/",
            data={"name": "Foobar upload", "remarks": ""},
        )
        self.assertEqual(response.status_code, 201)
        recordset_id = json.loads(response.content)

        rs = Recordset.objects.get(id=recordset_id)
        self.assertEqual(rs.recordsetitems.count(), 3)

    # [WorkBench] Preserve imported data and mapping after reopening a dataset
    def test_preserve_imported_data_and_mapping(self) -> None:
        client = Client()
        client.force_login(self.specifyuser)

        columns = ["Catalog Number", "Remarks"]
        rows = [["123", "First row"], ["456", "Second row"]]
        uploadplan = {
            "baseTableName": "collectionobject",
            "uploadable": {
                "uploadTable": {
                    "wbcols": {
                        "catalognumber": "Catalog Number",
                        "remarks": "Remarks",
                    },
                    "static": {},
                    "toOne": {},
                    "toMany": {},
                }
            },
        }

        response = client.post(
            "/api/workbench/dataset/",
            data={
                "name": "Imported dataset",
                "columns": columns,
                "rows": rows,
                "importedfilename": "records.csv",
            },
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 201)
        datasetid = json.loads(response.content)["id"]

        response = client.put(
            f"/api/workbench/dataset/{datasetid}/",
            data={"uploadplan": uploadplan},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 204)

        response = client.get(f"/api/workbench/dataset/{datasetid}/")
        self.assertEqual(response.status_code, 200)
        dataset = json.loads(response.content)

        self.assertEqual(dataset["columns"], columns)
        self.assertEqual(
            dataset["rows"],
            [row + [""] for row in rows],
        )
        self.assertEqual(dataset["uploadplan"], uploadplan)

class ChangeOwnershipTests(ApiTests):
    def setUp(self) -> None:
        super().setUp()
        self.new_owner = Specifyuser.objects.create(
            isloggedin=False,
            isloggedinreport=False,
            name="newowner",
            password="unused",
        )
        Agent.objects.create(
            agenttype=0,
            lastname="New Owner",
            division=self.division,
            specifyuser=self.new_owner,
        )
        self.dataset = Spdataset.objects.create(
            name="Ownership transfer dataset",
            importedfilename="records.csv",
            columns=["Catalog Number", "Remarks"],
            data=[["100", "First row"], ["200", "Second row"]],
            collection=self.collection,
            specifyuser=self.specifyuser,
        )
        self.client = Client()
        self.client.force_login(self.specifyuser)

    def test_transfer_dataset_ownership(self) -> None:
        response = self.client.post(
            f"/api/workbench/transfer/{self.dataset.id}/",
            data={"specifyuserid": self.new_owner.id},
        )

        self.assertEqual(response.status_code, 204)

        self.dataset.refresh_from_db()
        self.assertEqual(self.dataset.specifyuser, self.new_owner)
        self.assertEqual(
            self.dataset.columns,
            ["Catalog Number", "Remarks"],
        )
        self.assertEqual(
            self.dataset.data,
            [["100", "First row"], ["200", "Second row"]],
        )

        message = Message.objects.get(user=self.new_owner)
        self.assertEqual(
            json.loads(message.content),
            {
                "type": "dataset-ownership-transferred",
                "previous-owner-name": self.specifyuser.name,
                "dataset-name": self.dataset.name,
                "dataset-id": str(self.dataset.id),
            },
        )

    def test_transfer_dataset_requires_permission(self) -> None:
        UserPolicy.objects.filter(specifyuser=self.specifyuser).delete()

        response = self.client.post(
            f"/api/workbench/transfer/{self.dataset.id}/",
            data={"specifyuserid": self.new_owner.id},
        )

        self.assertEqual(response.status_code, 403)
        self.dataset.refresh_from_db()
        self.assertEqual(self.dataset.specifyuser, self.specifyuser)
        self.assertFalse(Message.objects.filter(user=self.new_owner).exists())

    def test_only_dataset_owner_can_transfer(self) -> None:
        self._add_user_policy(self.new_owner)
        self.client.force_login(self.new_owner)

        response = self.client.post(
            f"/api/workbench/transfer/{self.dataset.id}/",
            data={"specifyuserid": self.new_owner.id},
        )

        self.assertEqual(response.status_code, 403)
        self.dataset.refresh_from_db()
        self.assertEqual(self.dataset.specifyuser, self.specifyuser)
        self.assertFalse(Message.objects.filter(user=self.new_owner).exists())
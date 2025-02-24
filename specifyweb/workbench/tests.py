import json

from django.test import Client

from specifyweb.specify.models import Recordset
from specifyweb.workbench.models import Spdataset
from specifyweb.specify.tests.test_api import ApiTests
from .upload import upload as uploader

class DataSetTests(ApiTests):

    def test_reset_uploadplan_to_null(self) -> None:
        c = Client()
        c.force_login(self.specifyuser)
        response = c.post(
            '/api/workbench/dataset/',
            data={
                'name': "Test data set",
                'columns': [],
                'rows': [],
                'importedfilename': "foobar",
            },
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.content)
        datasetid = data['id']
        response = c.put(
            f'/api/workbench/dataset/{datasetid}/',
            data={
                'name': "Test data set modified",
                'uploadplan': {"baseTableName": "preptype", "uploadable": {"uploadTable": {"wbcols": {"name": "Preparation Type", "isloanable": "Is Loanable"}, "static": {}, "toOne": {}, "toMany": {}}}},
            },
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 204)
        response = c.put(
            f'/api/workbench/dataset/{datasetid}/',
            data={
                'name': "Test data set modified modified",
                'uploadplan': None,
            },
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 204)
        dataset = Spdataset.objects.get(id=datasetid)
        self.assertEqual(dataset.uploadplan, None)

    def test_create_record_set(self) -> None:
        c = Client()
        c.force_login(self.specifyuser)
        response = c.post(
            '/api/workbench/dataset/',
            data={
                'name': "Test data set",
                'columns': ["catno"],
                'rows': [["1"], ["2"], ["3"]],
                'importedfilename': "foobar",
            },
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.content)
        datasetid = data['id']
        response = c.put(
            f'/api/workbench/dataset/{datasetid}/',
            data={
                'name': "Test data set modified",
                'uploadplan': {"baseTableName": "collectionobject", "uploadable": {"uploadTable": {"wbcols": {"catalognumber": "catno",}, "static": {}, "toOne": {}, "toMany": {}}}},
            },
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 204)
        dataset = Spdataset.objects.get(id=datasetid)
        results = uploader.do_upload_dataset(self.collection, self.agent.id, dataset, no_commit=False, allow_partial=False)
        self.assertTrue(dataset.uploadresult['success'])

        response = c.post(
            f'/api/workbench/create_recordset/{datasetid}/',
            data={'name': 'Foobar upload'},
        )
        self.assertEqual(response.status_code, 201)
        recordset_id = json.loads(response.content)

        rs = Recordset.objects.get(id=recordset_id)
        self.assertEqual(rs.recordsetitems.count(), 3)

import json

from django.test import TestCase, Client

from specifyweb.specify.api_tests import ApiTests
from . import models

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
        dataset = models.Spdataset.objects.get(id=datasetid)
        self.assertEqual(dataset.uploadplan, None)

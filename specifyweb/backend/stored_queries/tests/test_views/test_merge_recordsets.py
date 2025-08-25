from specifyweb.backend.datamodel.models import Recordset, Collectionobject, Agent, Recordsetitem
from specifyweb.specify.tests.test_api import ApiTests
from django.test import Client
import json

class TestMergeRecordsets(ApiTests):
    
    def make_request(self, **kwargs):
        c = Client()
        c.force_login(self.specifyuser)
        kwargs['data'] = json.dumps(kwargs.get('data', {}))
        return c.post(
            '/stored_query/merge_recordsets/', 
            content_type='application/json', 
            **kwargs
        )
    
    def test_no_recordset_id(self):
        response = self.make_request()

        self._assertStatusCodeEqual(response, 400)
        self.assertEqual(
            json.loads(response.content.decode()), 
            {"error": "No recordset IDs provided"}
        )

        response = self.make_request(data=dict(recordsetids=[]))

        self._assertStatusCodeEqual(response, 400)
        self.assertEqual(
            json.loads(response.content.decode()), 
            {"error": "No recordset IDs provided"}
        )

    def test_no_valid_recordset(self):
        response = self.make_request(data=dict(recordsetids=[0]))
        self._assertStatusCodeEqual(response, 404)
        self.assertEqual(
            json.loads(response.content.decode()),
            {'error': 'No valid recordsets found'}
        )

    def test_varied_table_id(self):
        recordset_1 = Recordset.objects.create(
            collectionmemberid=self.collection.id,
            dbtableid=Collectionobject.specify_model.tableId,
            name="Test Recordset CO",
            type=0,
            specifyuser=self.specifyuser,
        )
        recordset_2 = Recordset.objects.create(
            collectionmemberid=self.collection.id,
            dbtableid=Agent.specify_model.tableId,
            name="Test Recordset Agent",
            type=0,
            specifyuser=self.specifyuser,
        )

        response = self.make_request(data=dict(recordsetids=[recordset_1.id, recordset_2.id]))
        self._assertStatusCodeEqual(response, 400)
        self.assertEqual(
            json.loads(response.content.decode()), 
            {'error': 'All recordsets must have the same tableid'}
        )

    def test_invalid_table_id(self):
        recordset_1 = Recordset.objects.create(
            collectionmemberid=self.collection.id,
            dbtableid=909090,
            name="Test Recordset CO",
            type=0,
            specifyuser=self.specifyuser,
        )
        recordset_2 = Recordset.objects.create(
            collectionmemberid=self.collection.id,
            dbtableid=909090,
            name="Test Recordset Agent",
            type=0,
            specifyuser=self.specifyuser,
        )

        response = self.make_request(data=dict(recordsetids=[recordset_1.id, recordset_2.id]))
        self._assertStatusCodeEqual(response, 400)
        self.assertEqual(
            json.loads(response.content.decode()), 
            {'error': 'Model not found for tableid'}
        )

    def test_merge(self):
        Recordset.objects.all().delete()
        recordset_1 = Recordset.objects.create(
            collectionmemberid=self.collection.id,
            dbtableid=Collectionobject.specify_model.tableId,
            name="Test Recordset CO - 1",
            type=0,
            specifyuser=self.specifyuser,
        )
        recordset_2 = Recordset.objects.create(
            collectionmemberid=self.collection.id,
            dbtableid=Collectionobject.specify_model.tableId,
            name="Test Recordset CO - 2",
            type=0,
            specifyuser=self.specifyuser,
        )

        Recordsetitem.objects.bulk_create([
            Recordsetitem(
                recordset=recordset_1,
                recordid=record_id,
            ) for record_id in [self.collectionobjects[0].id, self.collectionobjects[1].id]
        ])

        Recordsetitem.objects.bulk_create([
            Recordsetitem(
                recordset=recordset_2,
                recordid=record_id,
            ) for record_id in [self.collectionobjects[2].id, self.collectionobjects[3].id, self.collectionobjects[4].id]
        ])
        
        response = self.make_request(data=dict(recordsetids=[recordset_1.id, recordset_2.id]))
        self._assertStatusCodeEqual(response, 200)
        self.assertEqual(json.loads(response.content.decode()), {'message': 'Recordset merge successful'})

        new_rs = Recordset.objects.all().first()

        self.assertEqual(
            Recordsetitem.objects.filter(recordid__in=[co.id for co in self.collectionobjects], recordset=new_rs).count(),
            5
        )
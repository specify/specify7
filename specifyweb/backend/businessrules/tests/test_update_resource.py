from specifyweb.specify import models
from specifyweb.specify.tests.test_api import ApiTests


class TestUpdateResource(ApiTests):

    def setUp(self):
        super().setUp()

        self.recordset = models.Recordset.objects.create(
            name='1st Record set',
            collectionmemberid=self.collection.id,
            dbtableid=models.Collectionobject.specify_model.tableId,
            specifyuser=self.specifyuser,
            type=0,
        )


    def test_update_recordset(self):
        recordset = self.recordset

        recordset.name= '2nd Record Set Name'
        recordset.save()
        recordset.refresh_from_db()
        
        


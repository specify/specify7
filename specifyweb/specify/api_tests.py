from unittest import skip

from django.test import TestCase, TransactionTestCase
from django.db.models import Max
from django.db import connection

from specifyweb.specify import api, models

class MainSetupTearDown:
    def setUp(self):
        self.institution = models.Institution.objects.create(
            name='Test Institution',
            isaccessionsglobal=True,
            issecurityon=False,
            isserverbased=False,
            issharinglocalities=True,
            issinglegeographytree=True,
            )

        self.division = models.Division.objects.create(
            institution=self.institution,
            name='Test Division')

        self.geologictimeperiodtreedef = models.Geologictimeperiodtreedef.objects.create(
            name='Test gtptd')

        self.geographytreedef = models.Geographytreedef.objects.create(
            name='Test gtd')

        self.geographytreedef.treedefitems.create(name="Planet", rankid="0")

        self.datatype = models.Datatype.objects.create(
            name='Test datatype')

        self.discipline = models.Discipline.objects.create(
            geologictimeperiodtreedef=self.geologictimeperiodtreedef,
            geographytreedef=self.geographytreedef,
            division=self.division,
            datatype=self.datatype)

        self.collection = models.Collection.objects.create(
            catalognumformatname='test',
            collectionname='TestCollection',
            isembeddedcollectingevent=False,
            discipline=self.discipline)

        self.specifyuser = models.Specifyuser.objects.create(
            isloggedin=False,
            isloggedinreport=False,
            name="testuser",
            password="205C0D906445E1C71CA77C6D714109EB6D582B03A5493E4C") # testuser

        self.agent = models.Agent.objects.create(
            agenttype=0,
            firstname="Test",
            lastname="User",
            division=self.division,
            specifyuser=self.specifyuser)

        self.collectingevent = models.Collectingevent.objects.create(
            discipline=self.discipline)

        self.collectionobjects = [
            models.Collectionobject.objects.create(
                collection=self.collection,
                catalognumber="num-%d" % i)
            for i in range(5)]

class ApiTests(MainSetupTearDown, TestCase): pass

class SimpleApiTests(ApiTests):
    def test_get_collection(self):
        data = api.get_collection(self.collection, 'collectionobject')
        self.assertEqual(data['meta']['total_count'], len(self.collectionobjects))
        self.assertEqual(len(data['objects']), len(self.collectionobjects))
        ids = [obj['id'] for obj in data['objects']]
        for co in self.collectionobjects:
            self.assertTrue(co.id in ids)

    def test_get_resouce(self):
        data = api.get_resource('institution', self.institution.id)
        self.assertEqual(data['id'], self.institution.id)
        self.assertEqual(data['name'], self.institution.name)

    def test_create_object(self):
        obj = api.create_obj(self.collection, self.agent, 'collectionobject', {
                'collection': api.uri_for_model('collection', self.collection.id),
                'catalognumber': 'foobar'})
        obj = models.Collectionobject.objects.get(id=obj.id)
        self.assertTrue(obj.id is not None)
        self.assertEqual(obj.collection, self.collection)
        self.assertEqual(obj.catalognumber, 'foobar')
        self.assertEqual(obj.createdbyagent, self.agent)

    def test_update_object(self):
        data = api.get_resource('collection', self.collection.id)
        data['collectionname'] = 'New Name'
        api.update_obj(self.collection, self.agent, 'collection',
                       data['id'], data['version'], data)
        obj = models.Collection.objects.get(id=self.collection.id)
        self.assertEqual(obj.collectionname, 'New Name')

    def test_delete_object(self):
        obj = api.create_obj(self.collection, self.agent, 'collectionobject', {
                'collection': api.uri_for_model('collection', self.collection.id),
                'catalognumber': 'foobar'})
        api.delete_resource(self.collection, self.agent, 'collectionobject', obj.id, obj.version)
        self.assertEqual(models.Collectionobject.objects.filter(id=obj.id).count(), 0)

class RecordSetTests(ApiTests):
    def setUp(self):
        super(RecordSetTests, self).setUp()
        self.recordset = models.Recordset.objects.create(
            collectionmemberid=self.collection.id,
            dbtableid=models.Collectionobject.specify_model.tableId,
            name="Test recordset",
            type=0,
            specifyuser=self.specifyuser)

    def test_post_resource(self):
        obj = api.post_resource(self.collection, self.agent, 'collectionobject', {
                'collection': api.uri_for_model('collection', self.collection.id),
                'catalognumber': 'foobar'}, recordsetid=self.recordset.id)
        self.assertEqual(self.recordset.recordsetitems.filter(recordid=obj.id).count(), 1)

    @skip("errors because of many-to-many stuff checking if Agent is admin. should test with different model.")
    def test_post_bad_resource(self):
        with self.assertRaises(api.RecordSetException) as cm:
            obj = api.post_resource(self.collection, self.agent, 'Agent',
                                    {'agenttype': 0,
                                     'lastname': 'MonkeyWrench',
                                     'division': api.uri_for_model('division', self.division.id)},
                                    recordsetid=self.recordset.id)
        self.assertEqual(models.Agent.objects.filter(lastname='MonkeyWrench').count(), 0)

    @skip("errors because of many-to-many stuff checking if Agent is admin. should test with different model.")
    def test_post_resource_to_bad_recordset(self):
        max_id = models.Recordset.objects.aggregate(Max('id'))['id__max']
        with self.assertRaises(api.RecordSetException) as cm:
            obj = api.post_resource(self.collection, self.agent, 'Agent',
                                    {'agenttype': 0,
                                     'lastname': 'Pitts',
                                     'division': api.uri_for_model('division', self.division.id)},
                                    recordsetid=max_id + 100)
        self.assertEqual(models.Agent.objects.filter(lastname='Pitts').count(), 0)

    def test_remove_from_recordset_on_delete(self):
        ids = [co.id for co in self.collectionobjects]

        for id in ids:
            self.recordset.recordsetitems.create(recordid=id)

        counts = set((self.recordset.recordsetitems.filter(recordid=id).count() for id in ids))
        self.assertEqual(counts, set([1]))

        for co in self.collectionobjects:
            co.delete()

        counts = set((self.recordset.recordsetitems.filter(recordid=id).count() for id in ids))
        self.assertEqual(counts, set([0]))

    def test_get_resource_with_recordset_info(self):
        data = api.get_resource('collectionobject', self.collectionobjects[0].id)
        self.assertFalse(hasattr(data, 'recordset_info'))

        data = api.get_resource('collectionobject', self.collectionobjects[0].id, self.recordset.id)
        self.assertEqual(data['recordset_info'], None)

        self.recordset.recordsetitems.create(recordid=self.collectionobjects[0].id)

        data = api.get_resource('collectionobject', self.collectionobjects[0].id, self.recordset.id)
        self.assertEqual(data['recordset_info']['recordsetid'], self.recordset.id)


    def test_update_object(self):
        data = api.get_resource('collectionobject', self.collectionobjects[0].id, self.recordset.id)
        self.assertEqual(data['recordset_info'], None)

        obj = api.update_obj(self.collection, self.agent, 'collectionobject',
                             data['id'], data['version'], data)


    def test_get_recordset_info(self):
        ids = [co.id for co in self.collectionobjects]

        for id in ids:
            self.recordset.recordsetitems.create(recordid=id)

        for i, co in enumerate(self.collectionobjects):
            info = api.get_recordset_info(co, self.recordset.id)
            self.assertEqual(info['recordsetid'], self.recordset.id)
            self.assertEqual(info['total_count'], len(self.collectionobjects))
            self.assertEqual(info['index'], i)
            self.assertEqual(info['previous'], None if i == 0 else \
                                 api.uri_for_model('collectionobject', self.collectionobjects[i-1].id))

            self.assertEqual(info['next'], None if i == len(self.collectionobjects) - 1 else \
                                 api.uri_for_model('collectionobject', self.collectionobjects[i+1].id))

    def test_no_recordset_info(self):
        info = api.get_recordset_info(self.collectionobjects[0], self.recordset.id)
        self.assertEqual(info, None)

    def test_recordsetitem_ordering(self):
        ids = [co.id for co in self.collectionobjects]
        ids.sort()
        ids.reverse()

        for id in ids:
            self.recordset.recordsetitems.create(recordid=id)

        rsis = api.get_collection(self.collection, 'recordsetitem', params={
            'recordset': self.recordset.id})

        result_ids = [rsi['recordid'] for rsi in rsis['objects']]
        ids.sort()
        self.assertEqual(result_ids, ids)

    def test_deleting_recordset_deletes_items(self):
        ids = [co.id for co in self.collectionobjects]

        for id in ids:
            self.recordset.recordsetitems.create(recordid=id)

        recordset = models.Recordset.objects.get(id=self.recordset.id)
        self.assertNotEqual(recordset.recordsetitems.count(), 0)

        # shouldn't throw integrity exception
        recordset.delete()

        with self.assertRaises(models.Recordset.DoesNotExist) as cm:
            recordset = models.Recordset.objects.get(id=self.recordset.id)

class ApiRelatedFieldsTests(ApiTests):
    def test_get_to_many_uris_with_regular_othersidename(self):
        data = api.get_resource('collectingevent', self.collectingevent.id)
        self.assertEqual(data['collectionobjects'],
                         api.uri_for_model('collectionobject') +
                         '?collectingevent=%d' % self.collectingevent.id)

    def test_get_to_many_uris_with_special_othersidename(self):
        data = api.get_resource('agent', self.agent.id)

        # This one is actually a regular othersidename
        self.assertEqual(data['collectors'],
                         api.uri_for_model('collector') +
                         '?agent=%d' % self.agent.id)

        # This one is the special otherside name ("organization" instead of "agent")
        self.assertEqual(data['orgmembers'],
                         api.uri_for_model('agent') +
                         '?organization=%d' % self.agent.id)


class VersionCtrlApiTests(ApiTests):
    def test_bump_version(self):
        data = api.get_resource('collection', self.collection.id)
        data['collectionname'] = 'New Name'
        obj = api.update_obj(self.collection, self.agent, 'collection',
                             data['id'], data['version'], data)
        self.assertEqual(obj.version, data['version'] + 1)

    def test_update_object(self):
        data = api.get_resource('collection', self.collection.id)
        data['collectionname'] = 'New Name'
        self.collection.version += 1
        self.collection.save()
        with self.assertRaises(api.StaleObjectException) as cm:
            api.update_obj(self.collection, self.agent, 'collection',
                           data['id'], data['version'], data)
        data = api.get_resource('collection', self.collection.id)
        self.assertNotEqual(data['collectionname'], 'New Name')

    def test_delete_object(self):
        obj = api.create_obj(self.collection, self.agent, 'collectionobject', {
                'collection': api.uri_for_model('collection', self.collection.id),
                'catalognumber': 'foobar'})
        data = api.get_resource('collectionobject', obj.id)
        obj.version += 1
        obj.save()
        with self.assertRaises(api.StaleObjectException) as cm:
            api.delete_resource(self.collection, self.agent, 'collectionobject', data['id'], data['version'])
        self.assertEqual(models.Collectionobject.objects.filter(id=obj.id).count(), 1)

    def test_missing_version(self):
        data = api.get_resource('collection', self.collection.id)
        data['collectionname'] = 'New Name'
        self.collection.version += 1
        self.collection.save()
        with self.assertRaises(api.MissingVersionException) as cm:
            api.update_obj(self.collection, self.agent, 'collection',
                           data['id'], None, data)

class InlineApiTests(ApiTests):
    def test_get_resource_with_to_many_inlines(self):
        for i in range(3):
            self.collectionobjects[0].determinations.create(
                iscurrent=False, number1=i)
        data = api.get_resource('collectionobject', self.collectionobjects[0].id)
        self.assertTrue(isinstance(data['determinations'], list))
        self.assertEqual(len(data['determinations']), 3)
        ids = [d['id'] for d in data['determinations']]
        for det in self.collectionobjects[0].determinations.all():
            self.assertTrue(det.id in ids)

    def test_inlined_in_collection(self):
        dets = [self.collectionobjects[0].determinations.create(iscurrent=False, number1=i)
                for i in range(3)]

        data = api.get_collection(self.collection, 'collectionobject')
        for obj in data['objects']:
            self.assertTrue(isinstance(obj['determinations'], list))
            if obj['id'] == self.collectionobjects[0].id:
                serialized_dets = obj['determinations']
                self.assertEqual(len(obj['determinations']), 3)
            else:
                self.assertEqual(len(obj['determinations']), 0)

        ids = {d['id'] for d in serialized_dets}
        for det in dets:
            self.assertTrue(det.id in ids)

    def test_inlined_inlines(self):
        preptype = models.Preptype.objects.create(
            collection=self.collection)

        for i in range(3):
            self.collectionobjects[0].preparations.create(
                collectionmemberid=self.collection.id,
                preptype=preptype)
        data = api.get_collection(self.collection, 'collectionobject')
        co = next(obj for obj in data['objects'] if obj['id'] == self.collectionobjects[0].id)
        self.assertTrue(isinstance(co['preparations'], list))
        self.assertEqual(co['preparations'][0]['preparationattachments'], [])

    def test_get_resource_with_to_one_inlines(self):
        self.collectionobjects[0].collectionobjectattribute = \
            models.Collectionobjectattribute.objects.create(collectionmemberid=self.collection.id)
        self.collectionobjects[0].save()
        data = api.get_resource('collectionobject', self.collectionobjects[0].id)
        self.assertTrue(isinstance(data['collectionobjectattribute'], dict))
        self.assertEqual(data['collectionobjectattribute']['id'],
                         self.collectionobjects[0].collectionobjectattribute.id)

    def test_create_object_with_inlines(self):
        data =  {
            'collection': api.uri_for_model('collection', self.collection.id),
            'catalognumber': 'foobar',
            'determinations': [{
                    'iscurrent': False,
                    'number1': 1
                    }, {
                    'iscurrent': False,
                    'number1': 2
                    }],
            'collectionobjectattribute': {
                'text1': 'some text'}}

        obj = api.create_obj(self.collection, self.agent, 'collectionobject', data)
        co = models.Collectionobject.objects.get(id=obj.id)
        self.assertEqual(set(co.determinations.values_list('number1', flat=True)),
                        set((1, 2)))
        self.assertEqual(co.collectionobjectattribute.text1, 'some text')

    def test_create_object_with_inlined_existing_resource(self):
        coa = models.Collectionobjectattribute.objects.create(
            collectionmemberid=self.collection.id)

        coa_data = api.get_resource('collectionobjectattribute', coa.id)
        co_data = {
            'collection': api.uri_for_model('collection', self.collection.id),
            'collectionobjectattribute': coa_data,
            'catalognumber': 'foobar'}
        obj = api.create_obj(self.collection, self.agent, 'collectionobject', co_data)
        co = models.Collectionobject.objects.get(id=obj.id)
        self.assertEqual(co.collectionobjectattribute, coa)

    def test_update_object_with_inlines(self):
        self.collectionobjects[0].determinations.create(
            collectionmemberid=self.collection.id,
            number1=1,
            remarks='original value')

        data = api.get_resource('collectionobject', self.collectionobjects[0].id)
        data['determinations'][0]['remarks'] = 'changed value'
        data['determinations'].append({
                'number1': 2,
                'remarks': 'a new determination'})
        data['collectionobjectattribute'] = {
            'text1': 'added an attribute'}

        api.update_obj(self.collection, self.agent, 'collectionobject',
                       data['id'], data['version'], data)

        obj = models.Collectionobject.objects.get(id=self.collectionobjects[0].id)
        self.assertEqual(obj.determinations.count(), 2)
        self.assertEqual(obj.determinations.get(number1=1).remarks, 'changed value')
        self.assertEqual(obj.determinations.get(number1=2).remarks, 'a new determination')
        self.assertEqual(obj.collectionobjectattribute.text1, 'added an attribute')

    def test_update_object_with_more_inlines(self):
        for i in range(6):
            self.collectionobjects[0].determinations.create(
                collectionmemberid=self.collection.id,
                number1=i)

        data = api.get_resource('collectionobject', self.collectionobjects[0].id)
        even_dets = [d for d in data['determinations'] if d['number1'] % 2 == 0]
        for d in even_dets: data['determinations'].remove(d)

        data['collectionobjectattribute'] = {'text1': 'look! an attribute'}

        api.update_obj(self.collection, self.agent, 'collectionobject',
                       data['id'], data['version'], data)

        obj = models.Collectionobject.objects.get(id=self.collectionobjects[0].id)
        self.assertEqual(obj.determinations.count(), 3)
        for d in obj.determinations.all():
            self.assertFalse(d.number1 % 2 == 0)

        self.assertEqual(obj.collectionobjectattribute.text1, 'look! an attribute')


    # version control on inlined resources should be tested

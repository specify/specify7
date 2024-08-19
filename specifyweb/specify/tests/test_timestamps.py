"""
Tests for timestamps additional logic
"""
from datetime import datetime
from django.utils import timezone
from specifyweb.specify.tests.test_api import ApiTests, skip_perms_check
from specifyweb.specify import api
from specifyweb.specify.models import Collectionobject

class TimeStampTests(ApiTests):

    def test_blank_timestamps(self):
        cur_time = timezone.now()

        obj = Collectionobject.objects.create(
            collectionmemberid=1,
            collection=self.collection)
        
        self.assertGreaterEqual(obj.timestampcreated, cur_time)
        self.assertGreaterEqual(obj.timestampmodified, cur_time)
    
    def test_can_override_new_timestamps_api(self):
        datetime_1 = datetime(1960, 1, 1, 0, 0, 0)
        datetime_2 = datetime(2020, 1, 1, 0, 0, 0)

        obj = api.create_obj(self.collection, self.agent, 'collectionobject', {
                'collection': api.uri_for_model('collection', self.collection.id),
                'catalognumber': 'foobar', 
                'timestampcreated': datetime_1, 'timestampmodified': datetime_2})

        self.assertEqual(datetime_1, obj.timestampcreated)
        self.assertEqual(datetime_2, obj.timestampmodified)
    
    def test_cannot_override_old_timestamps_api(self):
        datetime_1 = datetime(1960, 1, 1, 0, 0, 0)
        datetime_2 = datetime(2020, 1, 1, 0, 0, 0)
        current = timezone.now()
        co_to_edit = self.collectionobjects[0]
        data = api.get_resource('collectionobject', co_to_edit.id, skip_perms_check)
        data['timestampcreated'] = datetime_1
        data['timestampmodified'] = datetime_2
        obj = api.update_obj(self.collection, self.agent, 'collectionobject', data['id'], data['version'], data)

        obj.refresh_from_db()
        self.assertNotEqual(obj.timestampcreated, datetime_1, "Was able to override!")
        self.assertNotEqual(obj.timestampmodified, datetime_2, "Was able to override!")
        self.assertGreaterEqual(obj.timestampmodified, current, "Timestampmodified did not update correctly!")
        self.assertGreater(current, obj.timestampcreated, "Timestampcreated should be at the past for this record!")
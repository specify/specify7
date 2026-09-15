from django.db.models import ProtectedError
from django.utils import timezone

from specifyweb.specify import models
from specifyweb.specify.tests.test_api import ApiTests

class CollectingEventTests(ApiTests):

    def test_create_date_time(self):
        startdate = timezone.now()

        ce = models.Collectingevent.objects.create(
            discipline=self.discipline,
            startdate=startdate,
        )
        fetched_event = models.Collectingevent.objects.get(id=ce.id)
        self.assertEqual(fetched_event.startdate, startdate)
        self.assertEqual(fetched_event.discipline, self.discipline)

    def test_collectionobjects_block_delete(self):
        ce = models.Collectingevent.objects.create(
            discipline=self.discipline)

        ce.collectionobjects.add(*self.collectionobjects)

        with self.assertRaises(ProtectedError):
            ce.delete()

        ce.collectionobjects.clear()
        ce.delete()

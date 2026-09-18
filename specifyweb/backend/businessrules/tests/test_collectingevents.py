from django.db.models import ProtectedError
from django.utils import timezone

from specifyweb.specify import models
from specifyweb.specify.tests.test_api import ApiTests

class CollectingEventTests(ApiTests):

    def test_create_collectingtrip(self):
        collectingtrip = models.Collectingtrip.objects.create(
            collectingtripname="Test Collecting Trip",
            discipline=self.discipline)

        fetched_trip = models.Collectingtrip.objects.get(id=collectingtrip.id)
        self.assertEqual(fetched_trip.collectingtripname, "Test Collecting Trip")
        self.assertEqual(fetched_trip.discipline, self.discipline)

    def test_create_date_time(self):
        startdate = timezone.now()

        ce = models.Collectingevent.objects.create(
            discipline=self.discipline,
            startdate=startdate,
        )
        fetched_event = models.Collectingevent.objects.get(id=ce.id)
        self.assertEqual(fetched_event.startdate, startdate)
        self.assertEqual(fetched_event.discipline, self.discipline)

    def test_add_existing_collectingtrip(self):
        collectingtrip = models.Collectingtrip.objects.create(
            collectingtripname="Existing Collecting Trip",
            discipline=self.discipline)
        ce = models.Collectingevent.objects.create(
            discipline=self.discipline,
            collectingtrip=collectingtrip)

        fetched_event = models.Collectingevent.objects.get(id=ce.id)
        self.assertEqual(fetched_event.collectingtrip, collectingtrip)
        self.assertEqual(
            fetched_event.collectingtrip.collectingtripname,
            "Existing Collecting Trip")

    def test_add_paleocontext_to_collectingevent(self):
        paleocontext = models.Paleocontext.objects.create(
            paleocontextname="Somewhere",
            discipline=self.discipline)

        ce = models.Collectingevent.objects.create(
            discipline=self.discipline,
            paleocontext=paleocontext)

        fetched_event = models.Collectingevent.objects.get(id=ce.id)
        self.assertEqual(fetched_event.paleocontext, paleocontext)
        self.assertEqual(fetched_event.paleocontext.paleocontextname, "Somewhere")


    def test_collectionobjects_block_delete(self):
        ce = models.Collectingevent.objects.create(
            discipline=self.discipline)

        ce.collectionobjects.add(*self.collectionobjects)

        with self.assertRaises(ProtectedError):
            ce.delete()

        ce.collectionobjects.clear()
        ce.delete()

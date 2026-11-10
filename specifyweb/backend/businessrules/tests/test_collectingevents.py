from django.db.models import ProtectedError
from django.utils import timezone

from specifyweb.specify import models
from specifyweb.specify.api.crud import update_obj
from specifyweb.specify.api.serializers import uri_for_model
from specifyweb.specify.tests.test_api import ApiTests

class CollectingEventTests(ApiTests):

    def test_create_collectingtrip(self):
        collectingtrip = models.Collectingtrip.objects.create(
            collectingtripname="Test Collecting Trip",
            discipline=self.discipline)

        fetched_trip = models.Collectingtrip.objects.get(id=collectingtrip.id)
        self.assertEqual(fetched_trip.collectingtripname, "Test Collecting Trip")
        self.assertEqual(fetched_trip.discipline, self.discipline)

    def test_create_collecting_event(self):
        startdate = timezone.now()
        enddate = timezone.now()

        ce = models.Collectingevent.objects.create(
            discipline=self.discipline,
            startdate=startdate,
            enddate=enddate,
        )
        fetched_event = models.Collectingevent.objects.get(id=ce.id)
        self.assertEqual(fetched_event.startdate, startdate)
        self.assertEqual(fetched_event.enddate, enddate)
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

    def test_add_existing_locality_to_collectingevent(self):
        locality = models.Locality.objects.create(
            localityname="Somewhere",
            srclatlongunit=0,
            discipline=self.discipline)

        ce = models.Collectingevent.objects.create(
            discipline=self.discipline,
            locality=locality)

        fetched_event = models.Collectingevent.objects.get(id=ce.id)
        self.assertEqual(fetched_event.locality, locality)
        self.assertEqual(fetched_event.locality.localityname, "Somewhere")

    def test_shared_collecting_event_links_collection_objects(self):
        collecting_event = models.Collectingevent.objects.create(
            discipline=self.discipline
        )
        first, second = self.collectionobjects[:2]

        for collection_object in (first, second):
            update_obj(
                self.collection,
                self.agent,
                'collectionobject',
                collection_object.id,
                collection_object.version,
                {
                    'collectingevent': uri_for_model(
                        'collectingevent', collecting_event.id
                    )
                },
            )

        self.assertEqual(
            set(collecting_event.collectionobjects.values_list('id', flat=True)),
            {first.id, second.id},
        )

    def test_collectionobjects_block_delete(self):
        ce = models.Collectingevent.objects.create(
            discipline=self.discipline)

        ce.collectionobjects.add(*self.collectionobjects)

        with self.assertRaises(ProtectedError):
            ce.delete()

        ce.collectionobjects.clear()
        ce.delete()

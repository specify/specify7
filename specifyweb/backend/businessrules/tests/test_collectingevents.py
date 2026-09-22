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

    def test_add_multiple_collectors_to_event(self):
        ce = models.Collectingevent.objects.create(
            discipline=self.discipline)

        collector1 = ce.collectors.create(
            isprimary=True,
            ordernumber=0,
            division=self.division,
            agent=self.agent)

        new_agent = models.Agent.objects.create(
            agenttype=0,
            firstname="New",
            lastname="Collector",
            division=self.division)

        collector2 = ce.collectors.create(
            isprimary=False,
            ordernumber=1,
            division=self.division,
            agent=new_agent)

        fetched_event = models.Collectingevent.objects.get(id=ce.id)
        fetched_collectors = list(fetched_event.collectors.order_by('ordernumber'))
        self.assertEqual(len(fetched_collectors), 2)
        self.assertEqual(fetched_collectors[0], collector1)
        self.assertEqual(fetched_collectors[1], collector2)

    def test_collectionobjects_block_delete(self):
        ce = models.Collectingevent.objects.create(
            discipline=self.discipline)

        ce.collectionobjects.add(*self.collectionobjects)

        with self.assertRaises(ProtectedError):
            ce.delete()

        ce.collectionobjects.clear()
        ce.delete()

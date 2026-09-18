from django.db.models import ProtectedError
from specifyweb.specify import models
from specifyweb.specify.tests.test_api import ApiTests

class LocalityBusinessRuleTests(ApiTests):
    def test_create_locality_with_fields(self):
        locality = models.Locality.objects.create(
            localityname="Somewhere",
            srclatlongunit=0,
            discipline=self.discipline)

        fetched_locality = models.Locality.objects.get(id=locality.id)
        self.assertEqual(fetched_locality.localityname, "Somewhere")
        self.assertEqual(fetched_locality.srclatlongunit, 0)
        self.assertEqual(fetched_locality.discipline, self.discipline)

    def test_add_existing_locality_to_collectingevent(self):
        locality = models.Locality.objects.create(
            localityname="Somewhere",
            srclatlongunit=0,
            discipline=self.discipline)

        collectingevent = models.Collectingevent.objects.create(
            discipline=self.discipline,
            locality=locality)

        fetched_event = models.Collectingevent.objects.get(id=collectingevent.id)
        self.assertEqual(fetched_event.locality, locality)
        self.assertEqual(fetched_event.locality.localityname, "Somewhere")

    def test_collectingevents_block_delete(self):
        locality = models.Locality.objects.create(
            localityname="Somewhere",
            srclatlongunit=0,
            discipline=self.discipline)

        collectingevent = models.Collectingevent.objects.create(
            discipline=self.discipline,
            locality=locality)

        with self.assertRaises(ProtectedError):
            locality.delete()

        collectingevent.locality = None
        collectingevent.save()

        locality.delete()


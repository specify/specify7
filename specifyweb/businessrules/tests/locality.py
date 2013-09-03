from django.db.models import ProtectedError
from specify import models
from specify.api_tests import ApiTests

class LocalityBusinessRuleTests(ApiTests):
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


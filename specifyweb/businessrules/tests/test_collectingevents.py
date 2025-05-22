from django.db.models import ProtectedError

from specifyweb.specify import models
from specifyweb.specify.tests.test_api import ApiTests

class CollectingEventTests(ApiTests):
    def test_collectionobjects_block_delete(self):
        ce = models.Collectingevent.objects.create(
            discipline=self.discipline)

        ce.collectionobjects.add(*self.collectionobjects)

        with self.assertRaises(ProtectedError):
            ce.delete()

        ce.collectionobjects.clear()
        ce.delete()

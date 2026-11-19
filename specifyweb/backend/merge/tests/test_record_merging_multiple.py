import json

from django.test import Client

from specifyweb.specify import models
from specifyweb.specify.tests.test_api import ApiTests


class MultipleRecordMergeTests(ApiTests):
    def test_replace_multiple_localities(self):
        c = Client()
        c.force_login(self.specifyuser)

        locality_1 = models.Locality.objects.create(
            localityname="locality_1",
            discipline=self.discipline,
        )
        locality_2 = models.Locality.objects.create(
            localityname="locality_2",
            discipline=self.discipline,
        )
        locality_3 = models.Locality.objects.create(
            localityname="locality_3",
            discipline=self.discipline,
        )
        collecting_event_1 = models.Collectingevent.objects.create(
            discipline=self.discipline,
            locality=locality_1,
        )
        collecting_event_3 = models.Collectingevent.objects.create(
            discipline=self.discipline,
            locality=locality_3,
        )

        response = c.post(
            f"/merge/locality/replace/{locality_2.id}/",
            data=json.dumps(
                {
                    "old_record_ids": [locality_1.id, locality_3.id],
                    "background": False,
                }
            ),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 204)
        self.assertFalse(
            models.Locality.objects.filter(
                id__in=[locality_1.id, locality_3.id]
            ).exists()
        )
        self.assertEqual(
            models.Collectingevent.objects.get(id=collecting_event_1.id).locality_id,
            locality_2.id,
        )
        self.assertEqual(
            models.Collectingevent.objects.get(id=collecting_event_3.id).locality_id,
            locality_2.id,
        )

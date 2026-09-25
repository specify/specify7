from specifyweb.specify import models
from specifyweb.specify.tests.test_api import ApiTests


class DeaccessionTests(ApiTests):
    def test_create_deaccession(self):
        deaccession = models.Deaccession.objects.create(
            deaccessionnumber='DEACCESSION-001',
        )

        fetched_deaccession = models.Deaccession.objects.get(id=deaccession.id)

        self.assertEqual(
            fetched_deaccession.deaccessionnumber,
            'DEACCESSION-001',
        )

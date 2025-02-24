from django.db.models import ProtectedError
from specifyweb.specify import models
from specifyweb.specify.tests.test_api import ApiTests

class JournalBusinessRuleTests(ApiTests):
    def test_referenceworks_block_delete(self):
        journal = models.Journal.objects.create(institution=self.institution)
        journal.referenceworks.create(
            institution=self.institution,
            referenceworktype=0)

        with self.assertRaises(ProtectedError):
            journal.delete()

        journal.referenceworks.all().delete()
        journal.delete()

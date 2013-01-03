from django.db.models import ProtectedError
from specify import models
from specify.api_tests import ApiTests

class JournalBusinessRuleTests(ApiTests):
    def test_referenceworks_block_delete(self):
        journal = models.Journal.objects.create()
        journal.referenceworks.create(
            referenceworktype=0)

        with self.assertRaises(ProtectedError):
            journal.delete()

        journal.referenceworks.all().delete()
        journal.delete()

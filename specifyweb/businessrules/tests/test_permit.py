from django.db.models import ProtectedError
from specifyweb.specify import models
from specifyweb.specify.tests.test_api import ApiTests
from ..exceptions import BusinessRuleException


class PermitTests(ApiTests):
    def test_number_is_unique(self):
        models.Permit.objects.create(
            institution=self.institution,
            permitnumber='1')

        with self.assertRaises(BusinessRuleException):
            models.Permit.objects.create(
                institution=self.institution,
                permitnumber='1')

        models.Permit.objects.create(
            institution=self.institution,
            permitnumber='2')

    def test_delete_blocked_by_accessionauthorization(self):
        permit = models.Permit.objects.create(
            institution=self.institution,
            permitnumber='1')

        aa = permit.accessionauthorizations.create()

        with self.assertRaises(ProtectedError):
            permit.delete()

        aa.delete()
        permit.delete()

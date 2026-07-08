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

    # Create a Permit with required fields only
    def test_create_basic_permit(self):
        permit = models.Permit.objects.create( # creates new Permit record in the database
            institution=self.institution,
            permitnumber='P-BASIC-001',
        )

        # Verify save worked
        self.assertIsNotNone(permit.id) # making sure this is not none
        self.assertEqual(permit.version, 0) # making sure the version starts at 0
        fetched = models.Permit.objects.get(id=permit.id) # refetching the record
        self.assertEqual(fetched.permitnumber, 'P-BASIC-001') # comparing the fetched permitnumber to the actual permit number

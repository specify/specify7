from django.db.models import ProtectedError
from specifyweb.specify import models
from specifyweb.specify.tests.test_api import ApiTests
from ..exceptions import BusinessRuleException
import datetime


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

    def test_create_permit_with_fields(self):
        # Fill in Permit#, Type, and Dates fields
        # Fill in remaining fields
        permit = models.Permit.objects.create( #creating a permit object
            institution=self.institution,
            permitnumber='P-FIELDS-001',
            type='Collection',
            startdate=datetime.datetime(2024, 1, 1),
            enddate=datetime.datetime(2024, 12, 31),
            issueddate=datetime.datetime(2024, 1, 15),
            renewaldate=datetime.datetime(2025, 1, 15),
            status='Active',
            remarks='Annual collection permit',
            permittext='Authorized for scientific collection',
            yesno1=True,
            text1='Filed under drawer 3',
            number1=42.5,
        )
        

    

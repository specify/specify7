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

        # Save + verify all fields persisted
        self.assertIsNotNone(permit.id)
        fetched = models.Permit.objects.get(id=permit.id) # fetch the permit object
        self.assertEqual(fetched.permitnumber, 'P-FIELDS-001') # check all the things in
        self.assertEqual(fetched.type, 'Collection')
        self.assertEqual(fetched.startdate, datetime.datetime(2024, 1, 1))
        self.assertEqual(fetched.enddate, datetime.datetime(2024, 12, 31))
        self.assertEqual(fetched.issueddate, datetime.datetime(2024, 1, 15))
        self.assertEqual(fetched.renewaldate, datetime.datetime(2025, 1, 15))
        self.assertEqual(fetched.status, 'Active')
        self.assertEqual(fetched.remarks, 'Annual collection permit')
        self.assertEqual(fetched.yesno1, True)
        

    def test_create_permit_with_agents(self):
        # Create new Issued By agent
        new_issuedby = models.Agent.objects.create(
            agenttype=0,
            firstname="Issued",
            lastname="ByAgent",
            division=self.division,
        )
        # Create new Issued To agent
        new_issuedto = models.Agent.objects.create(
            agenttype=0,
            firstname="Issued",
            lastname="ToAgent",
            division=self.division,
        )

    
        
    

from django.db.models import ProtectedError
from specifyweb.specify import models
from specifyweb.specify.tests.test_api import ApiTests
from ..exceptions import BusinessRuleException
import datetime
from specifyweb.specify.api.crud import update_obj, get_resource
from specifyweb.specify.api.exceptions import StaleObjectException

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
        # Create permit with existing agent + new agents
        permit = models.Permit.objects.create(
            institution=self.institution,
            permitnumber='P-AGENTS-001',
            issuedby=self.agent,        # Issue By (existing agent)
            issuedto=new_issuedto,      # Issue To (new agent)
        )
        # Verify save + agent relationships
        self.assertIsNotNone(permit.id)
        fetched = models.Permit.objects.get(id=permit.id)
        self.assertEqual(fetched.issuedby, self.agent)
        self.assertEqual(fetched.issuedby.firstname, 'Test')
        self.assertEqual(fetched.issuedto, new_issuedto)
        self.assertEqual(fetched.issuedto.firstname, 'Issued')

    
    def test_add_and_delete_attachment(self):
        # Create a permit first
        permit = models.Permit.objects.create(
            institution=self.institution,
            permitnumber='P-ATT-001',
        )

        # Create an attachment
        attachment = models.Attachment.objects.create(
            origfilename='permit_doc.pdf',
            tableid=permit.specify_model.tableId,
            title='Field Permit',
        )
        permit_attachment = models.Permitattachment.objects.create(
            permit=permit,
            attachment=attachment,
            ordinal=0,
        )

        # Verify attachment is linked
        self.assertEqual(permit.permitattachments.count(), 1)
        self.assertEqual(
            permit.permitattachments.first().attachment.origfilename,
            'permit_doc.pdf'
        )

        # Delete the attachment
        permit_attachment.delete()

        # Verifying it's gone
        self.assertEqual(permit.permitattachments.count(), 0)
        self.assertEqual(models.Attachment.objects.filter(id=attachment.id).count(), 0)


    def test_delete_permit_without_blockers(self):
        permit = models.Permit.objects.create(
            institution=self.institution,
            permitnumber='P-DEL-001',
        )
        permit_id = permit.id

        permit.delete()

        self.assertEqual(
            models.Permit.objects.filter(id=permit_id).count(),
            0,
        )
    
    def test_edit_permit_updates_version(self):
        permit = models.Permit.objects.create(
            institution=self.institution,
            permitnumber='P-EDIT-001',
        )
        skip_perms_check = lambda x: None #skip the permissions checks
        data = get_resource('permit', permit.id, skip_perms_check) # fetches the permit from the database and stores in the data dictionary
        data['remarks'] = 'Updated remark'

        updated = update_obj(
            self.collection,
            self.agent,
            'permit',
            data['id'],
            data['version'],
            data,
        )
        self.assertEqual(updated.version, permit.version + 1)

        fetched = models.Permit.objects.get(id=permit.id)
        self.assertEqual(fetched.remarks, 'Updated remark')
        self.assertEqual(fetched.version, permit.version + 1)

        # Stale object detection
        data['version'] = 0
        with self.assertRaises(StaleObjectException):
            update_obj(
                self.collection,
                self.agent,
                'permit',
                data['id'],
                data['version'],
                data,
            )


    


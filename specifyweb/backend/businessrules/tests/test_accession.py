from django.db.models import ProtectedError

from specifyweb.specify import models
from specifyweb.specify.tests.test_api import ApiTests
from ..exceptions import BusinessRuleException


class AccessionTests(ApiTests):
    def test_accession_number_unique_to_division(self):
        accession1 = models.Accession.objects.create(
            accessionnumber='a',
            division=self.division)

        with self.assertRaises(BusinessRuleException):
            accession2 = models.Accession.objects.create(
                accessionnumber='a',
                division=self.division)

        self.assertEqual(
            models.Accession.objects.filter(accessionnumber='a', division=self.division).count(),
            1)

        different_division = models.Division.objects.create(institution=self.institution)

        accession2 = models.Accession.objects.create(
            accessionnumber='a',
            division=different_division)

        accessions = models.Accession.objects.filter(accessionnumber='a')
        self.assertEqual(accessions.count(), 2)
        self.assertNotEqual(*[a.division for a in accessions])

    def test_no_delete_if_collection_objects_exist(self):
        accession = models.Accession.objects.create(
            accessionnumber='a',
            division=self.division)

        accession.collectionobjects.add(*self.collectionobjects)

        self.assertEqual(
            models.Collectionobject.objects.filter(
                id__in=[co.id for co in self.collectionobjects],
                accession=accession).count(),
            len(self.collectionobjects))

        with self.assertRaises(ProtectedError):
            accession.delete()

        accession.collectionobjects.clear()

        accession.delete()

        self.assertEqual(
            models.Collectionobject.objects.filter(id__in=[co.id for co in self.collectionobjects]).count(),
            len(self.collectionobjects))

    def test_create_accession_with_number_status_and_type(self):
        accession = models.Accession.objects.create(
            accessionnumber="A-8454-001",
            status="Complete",
            type="Gift",
            division=self.division,
        )
        fetched = models.Accession.objects.get(id=accession.id)

        self.assertEqual(fetched.accessionnumber, "A-8454-001")
        self.assertEqual(fetched.status, "Complete")
        self.assertEqual(fetched.type, "Gift")

    def test_add_existing_permit_to_accession(self):
        accession = models.Accession.objects.create(
            accessionnumber='A-PERMIT-001',
            division=self.division,
        )

        permit = models.Permit.objects.create( # since ApiTests doesn't have an existing permit, we create it
            permitnumber='P-EXISTING-001',
            institution=self.institution,
        )

        authorization = accession.accessionauthorizations.create(
            permit=permit,
            remarks='Existing permit authorizations',
        )

        fetched = models.Accessionauthorization.objects.get(
            id=authorization.id
        )

        self.assertEqual(fetched.accession, accession)
        self.assertEqual(fetched.permit, permit)
        self.assertEqual(fetched.remarks, 'Existing permit authorizations')

    def test_add_multiple_agents_and_authorizations(self):
        accession = models.Accession.objects.create(
            accessionnumber='A-MULTIPLE-001',
            division=self.division,
        )
        agent_1 = models.Agent.objects.create(
            agenttype=0,
            firstname='First',
            lastname='Agent',
            division=self.division,
        )
        agent_2 = models.Agent.objects.create(
            agenttype=0,
            firstname='Second',
            lastname='Agent',
            division=self.division,
        )
        permit_1 = models.Permit.objects.create(
            permitnumber='P-MULTIPLE-001',
            institution=self.institution,
        )
        permit_2 = models.Permit.objects.create(
            permitnumber='P-MULTIPLE-002',
            institution=self.institution,
        )
        accession.accessionagents.create(
            agent=agent_1,
            role='Collector',
        )
        accession.accessionagents.create(
            agent=agent_2,
            role='Donor',
        )
        accession.accessionauthorizations.create(
            permit=permit_1,
        )
        accession.accessionauthorizations.create(
            permit=permit_2,
        )
        self.assertEqual(accession.accessionagents.count(), 2)
        self.assertEqual(accession.accessionauthorizations.count(), 2)

        agent_ids = set(accession.accessionagents.values_list('agent_id', flat=True))
        permit_ids = set(accession.accessionauthorizations.values_list('permit_id', flat=True))

        self.assertEqual(agent_ids, {agent_1.id, agent_2.id})
        self.assertEqual(permit_ids, {permit_1.id, permit_2.id})

    def test_add_attachment_to_accession(self):
        accession = models.Accession.objects.create(
            accessionnumber='A-ATTACHMENT-001',
            division=self.division,
        )
        attachment = models.Attachment.objects.create(
            origfilename='accession_document.pdf',
            tableid=accession.specify_model.tableId,
            title='Accession Document',
            mimetype='application/pdf',
        )

        accession_attachment = models.Accessionattachment.objects.create(
            accession=accession,
            attachment=attachment,
            ordinal=0,
        )
        fetched = models.Accessionattachment.objects.get(
            id=accession_attachment.id
        )

        self.assertEqual(accession.accessionattachments.count(), 1)
        self.assertEqual(fetched.accession, accession)
        self.assertEqual(fetched.attachment, attachment)
        self.assertEqual(fetched.attachment.origfilename, 'accession_document.pdf')
        self.assertEqual(fetched.ordinal, 0)

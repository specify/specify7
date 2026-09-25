from decimal import Decimal
from django.utils import timezone

from specifyweb.specify import models
from specifyweb.specify.tests.test_api import ApiTests

class DisposalTests(ApiTests):
    def test_create_disposal_prep_by_choosing_recordset(self):
        self._create_prep_type()
        prep = self._create_prep(self.collectionobjects[0], None)

        record_set = models.Recordset.objects.create(
            collectionmemberid=self.collection.id,
            dbtableid=models.Collectionobject.specify_model.tableId,
            name='Disposal Recordset',
            type=0,
            specifyuser=self.specifyuser,
        )

        record_set.recordsetitems.create(
            recordid=self.collectionobjects[0].id,
        )

        disposal = models.Disposal.objects.create(
            disposalnumber='DISPOSAL-RECORDSET-001',
        )

        disposal_prep = disposal.disposalpreparations.create(
            preparation=prep,
        )

        fetched = models.Disposalpreparation.objects.get(id=disposal_prep.id)

        self.assertEqual(
            fetched.disposal,
            disposal,
        )
        self.assertEqual(
            fetched.preparation,
            prep,
        )

    def test_create_disposal_prep_by_entering_cat_number(self):
        self._create_prep_type()
        self._create_prep(self.collectionobjects[0], None)

        self.collectionobjects[0].catalognumber = 'CAT-1001'
        self.collectionobjects[0].save()

        co = models.Collectionobject.objects.get(catalognumber='CAT-1001')
        prep = models.Preparation.objects.get(collectionobject=co)

        disposal = models.Disposal.objects.create(
            disposalnumber='DISPOSAL-CATNUM-001',
        )
        disposal_prep = models.Disposalpreparation.objects.create(
            disposal=disposal,
            preparation=prep,
        )

        fetched = models.Disposalpreparation.objects.get(id=disposal_prep.id)
        self.assertEqual(fetched.preparation.collectionobject.catalognumber, 'CAT-1001')
        self.assertEqual(fetched.disposal.disposalnumber, 'DISPOSAL-CATNUM-001')

    def test_create_disposal_prep_without_preparations(self):
        disposal = models.Disposal.objects.create(
            disposalnumber='DISPOSAL-NOPREPS-001',
        )

        fetched_disposal = models.Disposal.objects.get(id=disposal.id)

        self.assertEqual(
            fetched_disposal.disposalnumber,
            'DISPOSAL-NOPREPS-001',
        )
        self.assertEqual(
            fetched_disposal.disposalpreparations.count(),
            0,
        )

    def test_fill_disposal_number_and_date(self):
        disposal_date = timezone.now()

        disposal = models.Disposal.objects.create(
            disposalnumber='DISPOSAL-8569-001',
            disposaldate=disposal_date,
        )

        fetched_disposal = models.Disposal.objects.get(id=disposal.id)

        self.assertEqual(
            fetched_disposal.disposalnumber,
            'DISPOSAL-8569-001',
        )
        self.assertEqual(
            fetched_disposal.disposaldate,
            disposal_date,
        )

    def test_add_existing_agent_to_disposal(self):
        disposal = models.Disposal.objects.create(
            disposalnumber='DISPOSAL-AGENT-001',
        )

        disposal_agent = disposal.disposalagents.create(
            agent=self.agent,
            role='Agent',
        )

        fetched_disposal_agent = models.Disposalagent.objects.get(
            id=disposal_agent.id,
        )

        self.assertEqual(
            fetched_disposal_agent.disposal.id,
            disposal.id,
        )
        self.assertEqual(
            fetched_disposal_agent.agent.id,
            self.agent.id,
        )
        self.assertEqual(
            fetched_disposal_agent.role,
            'Agent',
        )

    def test_create_new_agent_for_disposal(self):
        disposal = models.Disposal.objects.create(
            disposalnumber='DISPOSAL-NEW-AGENT-001',
        )

        new_agent = models.Agent.objects.create(
            agenttype=0,
            firstname='New',
            lastname='Disposal Agent',
            division=self.division,
        )

        disposal_agent = disposal.disposalagents.create(
            agent=new_agent,
            role='Agent',
        )

        fetched_agent = models.Agent.objects.get(id=new_agent.id)
        fetched_disposal_agent = models.Disposalagent.objects.get(
            id=disposal_agent.id,
        )

        self.assertEqual(
            fetched_agent.firstname,
            'New',
        )
        self.assertEqual(
            fetched_agent.lastname,
            'Disposal Agent',
        )
        self.assertEqual(
            fetched_disposal_agent.disposal.id,
            disposal.id,
        )
        self.assertEqual(
            fetched_disposal_agent.agent.id,
            new_agent.id,
        )
        self.assertEqual(
            fetched_disposal_agent.role,
            'Agent',
        )

    def test_add_multiple_agents_and_preps_to_disposal(self):
        self._create_prep_type()
        first_prep = self._create_prep(self.collectionobjects[0], None)
        second_prep = self._create_prep(self.collectionobjects[1], None)

        second_agent = models.Agent.objects.create(
            agenttype=0,
            firstname='Second',
            lastname='Disposal Agent',
            division=self.division,
        )

        disposal = models.Disposal.objects.create(
            disposalnumber='DISPOSAL-MULTIPLE-001',
        )

        disposal.disposalagents.create(
            agent=self.agent,
            role='Agent',
        )
        disposal.disposalagents.create(
            agent=second_agent,
            role='Agent',
        )

        disposal.disposalpreparations.create(
            preparation=first_prep,
        )
        disposal.disposalpreparations.create(
            preparation=second_prep,
        )

        fetched_disposal = models.Disposal.objects.get(id=disposal.id)

        self.assertEqual(
            fetched_disposal.disposalagents.count(),
            2,
        )
        self.assertEqual(
            fetched_disposal.disposalpreparations.count(),
            2,
        )

    def test_fill_remaining_disposal_fields(self):
        disposal = models.Disposal.objects.create(
            disposalnumber='DISPOSAL-REMAINING-001',
            type='Loan Transfer',
            donotexport=True,
            number1=Decimal('12.34'),
            number2=Decimal('56.78'),
            remarks='Disposal remarks',
            text1='Disposal text one',
            text2='Disposal text two',
            yesno1=True,
            yesno2=False,
            createdbyagent=self.agent,
            modifiedbyagent=self.agent,
        )

        fetched_disposal = models.Disposal.objects.get(
            id=disposal.id,
        )

        self.assertEqual(
            fetched_disposal.type,
            'Loan Transfer',
        )
        self.assertIs(
            fetched_disposal.donotexport,
            True,
        )
        self.assertEqual(
            fetched_disposal.number1,
            Decimal('12.34'),
        )
        self.assertEqual(
            fetched_disposal.number2,
            Decimal('56.78'),
        )
        self.assertEqual(
            fetched_disposal.remarks,
            'Disposal remarks',
        )
        self.assertEqual(
            fetched_disposal.text1,
            'Disposal text one',
        )
        self.assertEqual(
            fetched_disposal.text2,
            'Disposal text two',
        )
        self.assertIs(
            fetched_disposal.yesno1,
            True,
        )
        self.assertIs(
            fetched_disposal.yesno2,
            False,
        )
        self.assertEqual(
            fetched_disposal.createdbyagent,
            self.agent,
        )
        self.assertEqual(
            fetched_disposal.modifiedbyagent,
            self.agent,
        )





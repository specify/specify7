from decimal import Decimal
from django.utils import timezone

from specifyweb.specify import models
from specifyweb.specify.tests.test_api import ApiTests
from ..exceptions import BusinessRuleException

class LoanTests(ApiTests):
    def test_loan_number_unique_in_discipline(self):
        models.Loan.objects.create(
            loannumber='1',
            discipline=self.discipline)

        with self.assertRaises(BusinessRuleException):
            models.Loan.objects.create(
                loannumber='1',
                discipline=self.discipline)

        models.Loan.objects.create(
            loannumber='2',
            discipline=self.discipline)

    def test_create_loan_by_choosing_recordset(self):
        self._create_prep_type()
        prep = self._create_prep(self.collectionobjects[0], None)

        record_set = models.Recordset.objects.create(
            collectionmemberid=self.collection.id,
            dbtableid=models.Collectionobject.specify_model.tableId,
            name='Loan Recordset',
            type=0,
            specifyuser=self.specifyuser,
        )

        record_set.recordsetitems.create(
            recordid=self.collectionobjects[0].id,
        )

        loan = models.Loan.objects.create(
            loannumber='LOAN-RECORDSET-001',
            discipline=self.discipline,
        )

        loan_prep = loan.loanpreparations.create(
            discipline=self.discipline,
            preparation=prep,
        )

        fetched = models.Loanpreparation.objects.get(id=loan_prep.id)

        self.assertEqual(
            fetched.loan,
            loan,
        )
        self.assertEqual(
            fetched.preparation,
            prep,
        )

    def test_create_loan_by_entering_cat_number(self):
        self._create_prep_type()
        self._create_prep(self.collectionobjects[0], None)

        self.collectionobjects[0].catalognumber = 'CAT-LOAN-1001'
        self.collectionobjects[0].save()

        co = models.Collectionobject.objects.get(catalognumber='CAT-LOAN-1001')
        prep = models.Preparation.objects.get(collectionobject=co)

        loan = models.Loan.objects.create(
            loannumber='LOAN-CATNUM-001',
            discipline=self.discipline,
        )
        loan_prep = models.Loanpreparation.objects.create(
            loan=loan,
            discipline=self.discipline,
            preparation=prep,
        )

        fetched = models.Loanpreparation.objects.get(id=loan_prep.id)
        self.assertEqual(fetched.preparation.collectionobject.catalognumber, 'CAT-LOAN-1001')
        self.assertEqual(fetched.loan.loannumber, 'LOAN-CATNUM-001')

    def test_create_loan_without_preparations(self):
        loan = models.Loan.objects.create(
            loannumber='LOAN-NOPREPS-001',
            discipline=self.discipline,
        )

        fetched_loan = models.Loan.objects.get(id=loan.id)

        self.assertEqual(
            fetched_loan.loannumber,
            'LOAN-NOPREPS-001',
        )
        self.assertEqual(
            fetched_loan.loanpreparations.count(),
            0,
        )

    def test_fill_loan_number_and_dates(self):
        loan = models.Loan.objects.create(
            loannumber='LOAN-DATES-001',
            discipline=self.discipline,
            loandate=timezone.now(),
            originalduedate=timezone.now(),
            currentduedate=timezone.now(),
            datereceived=timezone.now(),
        )

        fetched_loan = models.Loan.objects.get(id=loan.id)

        self.assertEqual(fetched_loan.loannumber, 'LOAN-DATES-001')
        self.assertIsNotNone(fetched_loan.loandate)
        self.assertIsNotNone(fetched_loan.originalduedate)
        self.assertIsNotNone(fetched_loan.currentduedate)
        self.assertIsNotNone(fetched_loan.datereceived)

    def test_add_existing_agent_to_loan(self):
        loan = models.Loan.objects.create(
            loannumber='LOAN-AGENT-001',
            discipline=self.discipline,
        )

        loan_agent = loan.loanagents.create(
            agent=self.agent,
            role='Loan agent',
            discipline=self.discipline,
        )

        fetched = models.Loanagent.objects.get(id=loan_agent.id)

        self.assertEqual(
            fetched.agent,
            self.agent,
        )
        self.assertEqual(
            fetched.loan,
            loan,
        )
        self.assertEqual(
            fetched.role,
            'Loan agent',
        )

    def test_create_new_agent_for_loan(self):
        loan = models.Loan.objects.create(
            loannumber='LOAN-NEWAGENT-001',
            discipline=self.discipline,
        )

        agent = models.Agent.objects.create(
            agenttype=0,
            division=self.division,
        )

        loan_agent = loan.loanagents.create(
            agent=agent,
            role='Loan agent',
            discipline=self.discipline,
        )

        fetched = models.Loanagent.objects.get(id=loan_agent.id)

        self.assertEqual(
            fetched.agent_id,
            agent.id,
        )
        self.assertEqual(
            fetched.agent.agenttype,
            0,
        )

    def test_add_shipment_and_fill_all_fields(self):
        loan = models.Loan.objects.create(
            loannumber='LOAN-SHIPMENT-001',
            discipline=self.discipline,
        )

        shipment = loan.shipments.create(
            shipmentnumber='SHIPMENT-001',
            discipline=self.discipline,
            shipmentdate=timezone.now(),
            shipmentmethod='Courier',
            numberofpackages=2,
            insuredforamount='1000',
            weight='5 kg',
            remarks='Handle with care',
        )

        fetched = models.Shipment.objects.get(id=shipment.id)

        self.assertEqual(
            fetched.loan,
            loan,
        )
        self.assertEqual(
            fetched.shipmentnumber,
            'SHIPMENT-001',
        )
        self.assertEqual(
            fetched.shipmentmethod,
            'Courier',
        )
        self.assertEqual(
            fetched.numberofpackages,
            2,
        )
        self.assertIsNotNone(
            fetched.shipmentdate,
        )

    def test_add_existing_shipped_by_agent_to_shipment(self):
        loan = models.Loan.objects.create(
            loannumber='LOAN-SHIPPEDBY-001',
            discipline=self.discipline,
        )

        shipment = loan.shipments.create(
            shipmentnumber='SHIPMENT-SHIPPEDBY-001',
            discipline=self.discipline,
            shippedby=self.agent,
        )

        fetched = models.Shipment.objects.get(id=shipment.id)

        self.assertEqual(
            fetched.shippedby,
            self.agent,
        )

    def test_create_new_shipped_by_agent_for_shipment(self):
        loan = models.Loan.objects.create(
            loannumber='LOAN-NEWSHIPPEDBY-001',
            discipline=self.discipline,
        )

        agent = models.Agent.objects.create(
            agenttype=0,
            division=self.division,
        )

        shipment = loan.shipments.create(
            shipmentnumber='SHIPMENT-NEWSHIPPEDBY-001',
            discipline=self.discipline,
            shippedby=agent,
        )

        fetched = models.Shipment.objects.get(id=shipment.id)

        self.assertEqual(
            fetched.shippedby_id,
            agent.id,
        )

    def test_add_existing_shipped_to_agent_to_shipment(self):
        loan = models.Loan.objects.create(
            loannumber='LOAN-SHIPPEDTO-001',
            discipline=self.discipline,
        )

        shipment = loan.shipments.create(
            shipmentnumber='SHIPMENT-SHIPPEDTO-001',
            discipline=self.discipline,
            shippedto=self.agent,
        )

        fetched = models.Shipment.objects.get(id=shipment.id)

        self.assertEqual(
            fetched.shippedto,
            self.agent,
        )

    def test_create_new_shipped_to_agent_for_shipment(self):
        loan = models.Loan.objects.create(
            loannumber='LOAN-NEWSHIPPEDTO-001',
            discipline=self.discipline,
        )

        agent = models.Agent.objects.create(
            agenttype=0,
            division=self.division,
        )

        shipment = loan.shipments.create(
            shipmentnumber='SHIPMENT-NEWSHIPPEDTO-001',
            discipline=self.discipline,
            shippedto=agent,
        )

        fetched = models.Shipment.objects.get(id=shipment.id)

        self.assertEqual(
            fetched.shippedto_id,
            agent.id,
        )

    def test_add_multiple_loan_agents_preps_and_shipments(self):
        self._create_prep_type()

        loan = models.Loan.objects.create(
            loannumber='LOAN-MULTIPLE-001',
            discipline=self.discipline,
        )

        loan.loanagents.create(
            agent=self.agent,
            role='Loan agent',
            discipline=self.discipline,
        )
        loan.loanagents.create(
            agent=self.agent,
            role='Shipped by',
            discipline=self.discipline,
        )

        loan.loanpreparations.create(
            discipline=self.discipline,
            preparation=self._create_prep(self.collectionobjects[0], None),
        )
        loan.loanpreparations.create(
            discipline=self.discipline,
            preparation=self._create_prep(self.collectionobjects[1], None),
        )

        loan.shipments.create(
            shipmentnumber='SHIPMENT-MULTI-001',
            discipline=self.discipline,
        )
        loan.shipments.create(
            shipmentnumber='SHIPMENT-MULTI-002',
            discipline=self.discipline,
        )

        fetched_loan = models.Loan.objects.get(id=loan.id)

        self.assertEqual(
            fetched_loan.loanagents.count(),
            2,
        )
        self.assertEqual(
            fetched_loan.loanpreparations.count(),
            2,
        )
        self.assertEqual(
            fetched_loan.shipments.count(),
            2,
        )

    def test_fill_remaining_loan_fields(self):
        loan = models.Loan.objects.create(
            loannumber='LOAN-REMAINING-001',
            discipline=self.discipline,
            purposeofloan='Research',
            status='Active',
            remarks='Loan remarks',
            specialconditions='Keep dry',
            contents='Plant specimens',
            srcgeography='South Africa',
            srctaxonomy='Proteaceae',
            receivedcomments='Received in good condition',
            text1='Text 1',
            text2='Text 2',
            text3='Text 3',
            text4='Text 4',
            text5='Text 5',
            yesno1=True,
            yesno2=False,
            number1=Decimal('1.5'),
            number2=Decimal('2.5'),
            integer1=1,
            integer2=2,
            integer3=3,
            isfinancialresponsibility=True,
        )

        fetched_loan = models.Loan.objects.get(id=loan.id)

        self.assertEqual(fetched_loan.purposeofloan, 'Research')
        self.assertEqual(fetched_loan.status, 'Active')
        self.assertEqual(fetched_loan.remarks, 'Loan remarks')
        self.assertEqual(fetched_loan.specialconditions, 'Keep dry')
        self.assertEqual(fetched_loan.text1, 'Text 1')
        self.assertEqual(fetched_loan.text5, 'Text 5')
        self.assertEqual(fetched_loan.number1, Decimal('1.5'))
        self.assertEqual(fetched_loan.integer1, 1)
        self.assertEqual(fetched_loan.integer3, 3)
        self.assertTrue(fetched_loan.yesno1)
        self.assertFalse(fetched_loan.yesno2)

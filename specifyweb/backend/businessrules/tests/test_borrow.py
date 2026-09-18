from decimal import Decimal

from django.utils import timezone

from specifyweb.specify import models
from specifyweb.specify.tests.test_api import ApiTests


class BorrowTests(ApiTests):
    def test_fill_invoice_number_and_date(self):
        borrow_date = timezone.now()

        borrow = models.Borrow.objects.create(
            collectionmemberid=self.collection.id,
            invoicenumber='BORROW-8524-001',
            borrowdate=borrow_date,
        )

        fetched_borrow = models.Borrow.objects.get(id=borrow.id)

        self.assertEqual(
            fetched_borrow.invoicenumber,
            'BORROW-8524-001',
        )
        self.assertEqual(
            fetched_borrow.borrowdate,
            borrow_date,
        )

    def test_add_existing_agent_to_borrow(self):
        borrow = models.Borrow.objects.create(
            collectionmemberid=self.collection.id,
            invoicenumber='BORROW-AGENT-001',
        )

        borrow_agent = borrow.borrowagents.create(
            agent=self.agent,
            collectionmemberid=self.collection.id,
            role='Borrower',
        )

        fetched_borrow_agent = models.Borrowagent.objects.get(
            id=borrow_agent.id,
        )

        self.assertEqual(
            fetched_borrow_agent.borrow.id,
            borrow.id,
        )
        self.assertEqual(
            fetched_borrow_agent.agent.id,
            self.agent.id,
        )
        self.assertEqual(
            fetched_borrow_agent.role,
            'Borrower',
        )

    def test_create_new_agent_for_borrow(self):
        borrow = models.Borrow.objects.create(
            collectionmemberid=self.collection.id,
            invoicenumber='BORROW-NEW-AGENT-001',
        )

        new_agent = models.Agent.objects.create(
            agenttype=0,
            firstname='New',
            lastname='Borrow Agent',
            division=self.division,
        )

        borrow_agent = models.Borrowagent.objects.create(
            borrow=borrow,
            agent=new_agent,
            collectionmemberid=self.collection.id,
            role='Borrower',
        )

        fetched_agent = models.Agent.objects.get(id=new_agent.id)
        fetched_borrow_agent = models.Borrowagent.objects.get(
            id=borrow_agent.id,
        )

        self.assertEqual(
            fetched_agent.firstname,
            'New',
        )
        self.assertEqual(
            fetched_agent.lastname,
            'Borrow Agent',
        )
        self.assertEqual(
            fetched_agent.agenttype,
            0,
        )
        self.assertEqual(
            fetched_agent.division,
            self.division,
        )
        self.assertEqual(
            fetched_borrow_agent.borrow,
            borrow,
        )
        self.assertEqual(
            fetched_borrow_agent.agent,
            new_agent,
        )
        self.assertEqual(
            fetched_borrow_agent.role,
            'Borrower',
        )

    def test_add_shipment_with_all_fields_to_borrow(self):
        shipment_date = timezone.now()

        borrow = models.Borrow.objects.create(
            collectionmemberid=self.collection.id,
            invoicenumber='BORROW-SHIPMENT-001',
        )

        shipment = borrow.shipments.create(
            shipmentnumber='BORROW-SHIPMENT-001',
            shipmentdate=shipment_date,
            shipmentmethod='Courier',
            numberofpackages=3,
            insuredforamount='500.00',
            weight='12.5 kg',
            number1=Decimal('10.25'),
            number2=Decimal('20.50'),
            remarks='Borrow shipment remarks',
            text1='Borrow shipment text one',
            text2='Borrow shipment text two',
            yesno1=True,
            yesno2=False,
            shipper=self.agent,
            discipline=self.discipline,
        )

        fetched_shipment = models.Shipment.objects.get(
            id=shipment.id,
        )

        self.assertEqual(
            fetched_shipment.borrow,
            borrow,
        )
        self.assertEqual(
            fetched_shipment.shipmentnumber,
            'BORROW-SHIPMENT-001',
        )
        self.assertEqual(
            fetched_shipment.shipmentdate,
            shipment_date,
        )
        self.assertEqual(
            fetched_shipment.shipmentmethod,
            'Courier',
        )
        self.assertEqual(
            fetched_shipment.numberofpackages,
            3,
        )
        self.assertEqual(
            fetched_shipment.insuredforamount,
            '500.00',
        )
        self.assertEqual(
            fetched_shipment.weight,
            '12.5 kg',
        )
        self.assertEqual(
            fetched_shipment.number1,
            Decimal('10.25'),
        )
        self.assertEqual(
            fetched_shipment.number2,
            Decimal('20.50'),
        )
        self.assertEqual(
            fetched_shipment.remarks,
            'Borrow shipment remarks',
        )
        self.assertEqual(
            fetched_shipment.text1,
            'Borrow shipment text one',
        )
        self.assertEqual(
            fetched_shipment.text2,
            'Borrow shipment text two',
        )
        self.assertIs(
            fetched_shipment.yesno1,
            True,
        )
        self.assertIs(
            fetched_shipment.yesno2,
            False,
        )
        self.assertEqual(
            fetched_shipment.shipper,
            self.agent,
        )
        self.assertEqual(
            fetched_shipment.discipline,
            self.discipline,
        )

    def test_add_existing_shipped_by_agent(self):
        borrow = models.Borrow.objects.create(
            collectionmemberid=self.collection.id,
            invoicenumber='BORROW-SHIPPED-BY-001',
        )

        shipment = borrow.shipments.create(
            shipmentnumber='BORROW-SHIPPED-BY-001',
            shippedby=self.agent,
            discipline=self.discipline,
        )

        fetched_shipment = models.Shipment.objects.get(
            id=shipment.id,
        )

        self.assertEqual(
            fetched_shipment.borrow,
            borrow,
        )
        self.assertEqual(
            fetched_shipment.shippedby,
            self.agent,
        )
        self.assertEqual(
            fetched_shipment.shipmentnumber,
            'BORROW-SHIPPED-BY-001',
        )
        self.assertEqual(
            fetched_shipment.discipline,
            self.discipline,
        )

    def test_create_new_shipped_by_agent(self):
        new_agent = models.Agent.objects.create(
            agenttype=0,
            firstname='New',
            lastname='Borrow Agent',
            division=self.division,
        )

        borrow = models.Borrow.objects.create(
            collectionmemberid=self.collection.id,
            invoicenumber='BORROW-SHIPPED-BY-001',
        )

        shipment = borrow.shipments.create(
            shipmentnumber='BORROW-SHIPPED-BY-001',
            shippedby=new_agent,
            discipline=self.discipline,
        )

        fetched_shipment = models.Shipment.objects.get(
            id=shipment.id
        )

        self.assertEqual(
            fetched_shipment.borrow,
            borrow,
        )
        self.assertEqual(
            fetched_shipment.shippedby,
            new_agent
        )
        self.assertEqual(
            fetched_shipment.shipmentnumber,
            'BORROW-SHIPPED-BY-001',
        )
        self.assertEqual(
            fetched_shipment.shippedby.firstname,
            'New',
        )
        self.assertEqual(
            fetched_shipment.shippedby.lastname,
            'Borrow Agent',
        )
        self.assertEqual(
            fetched_shipment.discipline,
            self.discipline,
        )

    def test_add_existing_shipped_to_agent(self):
        borrow = models.Borrow.objects.create(
            collectionmemberid=self.collection.id,
            invoicenumber='BORROW-SHIPPED-TO-001',
        )

        shipment = borrow.shipments.create(
            shipmentnumber='BORROW-SHIPPED-TO-001',
            shippedto=self.agent,
            discipline=self.discipline,
        )

        fetched_shipment = models.Shipment.objects.get(
            id=shipment.id,
        )

        self.assertEqual(
            fetched_shipment.borrow,
            borrow,
        )
        self.assertEqual(
            fetched_shipment.shippedto,
            self.agent,
        )
        self.assertEqual(
            fetched_shipment.shipmentnumber,
            'BORROW-SHIPPED-TO-001',
        )
        self.assertEqual(
            fetched_shipment.discipline,
            self.discipline,
        )

    def test_create_new_shipped_to_agent(self):
        new_agent = models.Agent.objects.create(
            agenttype=0,
            firstname='New',
            lastname='Shipped To Agent',
            division=self.division,
        )

        borrow = models.Borrow.objects.create(
            collectionmemberid=self.collection.id,
            invoicenumber='BORROW-NEW-SHIPPED-TO-001',
        )

        shipment = borrow.shipments.create(
            shipmentnumber='BORROW-NEW-SHIPPED-TO-001',
            shippedto=new_agent,
            discipline=self.discipline,
        )

        fetched_shipment = models.Shipment.objects.get(
            id=shipment.id,
        )

        self.assertEqual(
            fetched_shipment.borrow,
            borrow,
        )
        self.assertEqual(
            fetched_shipment.shippedto,
            new_agent,
        )
        self.assertEqual(
            fetched_shipment.shippedto.firstname,
            'New',
        )
        self.assertEqual(
            fetched_shipment.shippedto.lastname,
            'Shipped To Agent',
        )
        self.assertEqual(
            fetched_shipment.discipline,
            self.discipline,
        )

    def test_add_borrow_material_with_all_fields(self):
        borrow = models.Borrow.objects.create(
            collectionmemberid=self.collection.id,
            invoicenumber='BORROW-MATERIAL-001',
        )

        borrow_material = borrow.borrowmaterials.create(
            collectionmemberid=self.collection.id,
            materialnumber='MATERIAL-001',
            description='Borrow material description',
            quantity=10,
            quantityresolved=4,
            quantityreturned=3,
            incomments='Borrow material incoming comments',
            outcomments='Borrow material outgoing comments',
            text1='Borrow material text one',
            text2='Borrow material text two',
            createdbyagent=self.agent,
            modifiedbyagent=self.agent,
        )

        fetched_material = models.Borrowmaterial.objects.get(
            id=borrow_material.id,
        )

        self.assertEqual(
            fetched_material.borrow,
            borrow,
        )
        self.assertEqual(
            fetched_material.collectionmemberid,
            self.collection.id,
        )
        self.assertEqual(
            fetched_material.materialnumber,
            'MATERIAL-001',
        )
        self.assertEqual(
            fetched_material.description,
            'Borrow material description',
        )
        self.assertEqual(
            fetched_material.quantity,
            10,
        )
        self.assertEqual(
            fetched_material.quantityresolved,
            4,
        )
        self.assertEqual(
            fetched_material.quantityreturned,
            3,
        )
        self.assertEqual(
            fetched_material.incomments,
            'Borrow material incoming comments',
        )
        self.assertEqual(
            fetched_material.outcomments,
            'Borrow material outgoing comments',
        )
        self.assertEqual(
            fetched_material.text1,
            'Borrow material text one',
        )
        self.assertEqual(
            fetched_material.text2,
            'Borrow material text two',
        )
        self.assertEqual(
            fetched_material.createdbyagent,
            self.agent,
        )
        self.assertEqual(
            fetched_material.modifiedbyagent,
            self.agent,
        )



    

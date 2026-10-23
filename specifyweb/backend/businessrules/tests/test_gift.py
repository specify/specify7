from decimal import Decimal
from django.db import IntegrityError
from django.utils import timezone
from specifyweb.specify import models
from specifyweb.specify.tests.test_api import ApiTests
from ..exceptions import BusinessRuleException

class GiftTests(ApiTests):
    def test_gift_number_unique_in_discipline(self):
        models.Gift.objects.create(
            giftnumber='1',
            discipline=self.discipline)

        with self.assertRaises(BusinessRuleException):
            models.Gift.objects.create(
                giftnumber='1',
                discipline=self.discipline)

        models.Gift.objects.create(
            giftnumber='2',
            discipline=self.discipline)

    def test_gift_number_required(self):
        with self.assertRaises(IntegrityError):
            models.Gift.objects.create(
                giftnumber=None,
                discipline=self.discipline)

    def test_discipline_required(self):
        with self.assertRaises(IntegrityError):
            models.Gift.objects.create(
                giftnumber='12',
                discipline=None)

    def test_create_gift_with_number_and_date(self):
        gift_date = timezone.now()

        gift = models.Gift.objects.create(
            giftnumber='GIFT-8492-001',
            giftdate=gift_date,
            discipline=self.discipline,
        )

        fetched = models.Gift.objects.get(id=gift.id)

        self.assertEqual(fetched.giftnumber, 'GIFT-8492-001')
        self.assertEqual(fetched.giftdate, gift_date)
        self.assertEqual(fetched.discipline, self.discipline)

    def test_add_existing_agent_to_gift(self):
        gift = models.Gift.objects.create(
            giftnumber='GIFT-AGENT-001',
            discipline=self.discipline,
        )

        gift_agent = gift.giftagents.create(
            agent=self.agent,
            role='Recipient',
            discipline=self.discipline,
        )

        fetched = models.Giftagent.objects.get(id=gift_agent.id)

        self.assertEqual(fetched.gift, gift)
        self.assertEqual(fetched.agent, self.agent)
        self.assertEqual(fetched.role, 'Recipient')
        self.assertEqual(fetched.discipline, self.discipline)

    def test_create_new_agent_for_gift(self):
        gift = models.Gift.objects.create(
            giftnumber='GIFT-NEW-AGENT-001',
            discipline=self.discipline,
        )

        new_agent = models.Agent.objects.create(
            agenttype=0,
            firstname='New',
            lastname='Gift Agent',
            division=self.division,
        )

        gift_agent = models.Giftagent.objects.create(
            gift=gift,
            agent=new_agent,
            role='Recipient',
            discipline=self.discipline,
        )

        fetched_agent = models.Agent.objects.get(id=new_agent.id)
        fetched_gift_agent = models.Giftagent.objects.get(id=gift_agent.id)

        self.assertEqual(fetched_agent.firstname, 'New')
        self.assertEqual(fetched_agent.lastname, 'Gift Agent')
        self.assertEqual(fetched_agent.agenttype, 0)
        self.assertEqual(fetched_agent.division, self.division)

        self.assertEqual(fetched_gift_agent.role, 'Recipient')
        self.assertEqual(fetched_gift_agent.gift, gift)
        self.assertEqual(fetched_gift_agent.agent, new_agent)
        self.assertEqual(fetched_gift_agent.discipline, self.discipline)

    def test_add_shipment_with_all_fields_to_gift(self):
        shipment_date = timezone.now()

        gift = models.Gift.objects.create(
            giftnumber='GIFT-SHIPMENT-001',
            discipline=self.discipline,
        )

        shipment = gift.shipments.create(
            shipmentnumber='SHIPMENT-001',
            shipmentdate=shipment_date,
            shipmentmethod='Courier',
            numberofpackages=3,
            insuredforamount='500.00',
            weight='12.5 kg',
            number1=Decimal('10.25'),
            number2=Decimal('20.50'),
            remarks='Shipment remarks',
            text1='Shipment text one',
            text2='Shipment text two',
            yesno1=True,
            yesno2=False,
            shipper=self.agent,
            discipline=self.discipline,
        )

        fetched = models.Shipment.objects.get(id=shipment.id)

        self.assertEqual(fetched.gift, gift)
        self.assertEqual(fetched.shipmentnumber, 'SHIPMENT-001')
        self.assertEqual(fetched.shipmentdate, shipment_date)
        self.assertEqual(fetched.shipmentmethod, 'Courier')
        self.assertEqual(fetched.numberofpackages, 3)
        self.assertEqual(fetched.insuredforamount, '500.00')
        self.assertEqual(fetched.weight, '12.5 kg')
        self.assertEqual(fetched.number1, Decimal('10.25'))
        self.assertEqual(fetched.number2, Decimal('20.50'))
        self.assertEqual(fetched.remarks, 'Shipment remarks')
        self.assertEqual(fetched.text1, 'Shipment text one')
        self.assertEqual(fetched.text2, 'Shipment text two')
        self.assertIs(fetched.yesno1, True)
        self.assertIs(fetched.yesno2, False)
        self.assertEqual(fetched.shipper, self.agent)
        self.assertEqual(fetched.discipline, self.discipline)

    def test_add_existing_shipped_by_agent(self):
        gift = models.Gift.objects.create(
            giftnumber='GIFT-SHIPPED-BY-001',
            discipline=self.discipline,
        )

        shipment = gift.shipments.create(
            shipmentnumber='SHIPMENT-SHIPPED-BY-001',
            shippedby=self.agent,
            discipline=self.discipline,
        )

        fetched = models.Shipment.objects.get(id=shipment.id)

        self.assertEqual(fetched.gift, gift)
        self.assertEqual(fetched.shippedby, self.agent)
        self.assertEqual(
            fetched.shipmentnumber,
            'SHIPMENT-SHIPPED-BY-001',
        )
        self.assertEqual(fetched.discipline, self.discipline)

    def test_add_new_shipped_by_agent(self):
        gift = models.Gift.objects.create(
            giftnumber='GIFT-NEW-SHIPPED-BY-001',
            discipline=self.discipline,
        )

        new_shipped_by = models.Agent.objects.create(
            agenttype=0,
            firstname='New',
            lastname='Shipped By Agent',
            division=self.division,
        )

        shipment = gift.shipments.create(
            shipmentnumber='SHIPMENT-NEW-SHIPPED-BY-001',
            shippedby=new_shipped_by,
            discipline=self.discipline,
        )

        fetched_agent = models.Agent.objects.get(id=new_shipped_by.id)
        fetched_shipment = models.Shipment.objects.get(id=shipment.id)

        self.assertEqual(fetched_agent.firstname, 'New')
        self.assertEqual(fetched_agent.lastname, 'Shipped By Agent')
        self.assertEqual(fetched_agent.agenttype, 0)
        self.assertEqual(fetched_agent.division, self.division)

        self.assertEqual(fetched_shipment.gift, gift)
        self.assertEqual(fetched_shipment.shippedby, fetched_agent)
        self.assertEqual(
            fetched_shipment.shipmentnumber,
            'SHIPMENT-NEW-SHIPPED-BY-001',
        )
        self.assertEqual(fetched_shipment.discipline, self.discipline)

    def test_add_existing_shipped_to_agent(self):
        gift = models.Gift.objects.create(
            giftnumber='GIFT-SHIPPED-TO-001',
            discipline=self.discipline,
        )

        shipment = gift.shipments.create(
            shipmentnumber='SHIPMENT-SHIPPED-TO-001',
            shippedto=self.agent,
            discipline=self.discipline,
        )

        fetched = models.Shipment.objects.get(id=shipment.id)

        self.assertEqual(fetched.gift, gift)
        self.assertEqual(fetched.shippedto, self.agent)
        self.assertEqual(
            fetched.shipmentnumber,
            'SHIPMENT-SHIPPED-TO-001',
        )
        self.assertEqual(fetched.discipline, self.discipline)

    def test_add_new_shipped_to_agent(self):
        gift = models.Gift.objects.create(
            giftnumber='GIFT-NEW-SHIPPED-TO-001',
            discipline=self.discipline,
        )

        new_shipped_to = models.Agent.objects.create(
            agenttype=0,
            firstname='New',
            lastname='Shipped To Agent',
            division=self.division,
        )

        shipment = gift.shipments.create(
            shipmentnumber='SHIPMENT-NEW-SHIPPED-TO-001',
            shippedto=new_shipped_to,
            discipline=self.discipline,
        )

        fetched_agent = models.Agent.objects.get(id=new_shipped_to.id)
        fetched_shipment = models.Shipment.objects.get(id=shipment.id)

        self.assertEqual(fetched_agent.firstname, 'New')
        self.assertEqual(fetched_agent.lastname, 'Shipped To Agent')
        self.assertEqual(fetched_agent.agenttype, 0)
        self.assertEqual(fetched_agent.division, self.division)

        self.assertEqual(fetched_shipment.gift, gift)
        self.assertEqual(fetched_shipment.shippedto, fetched_agent)
        self.assertEqual(
            fetched_shipment.shipmentnumber,
            'SHIPMENT-NEW-SHIPPED-TO-001',
        )
        self.assertEqual(fetched_shipment.discipline, self.discipline)

    def test_add_multiple_agents_preparations_and_shipments(self):
        gift = models.Gift.objects.create(
            giftnumber='GIFT-MULTIPLE-001',
            discipline=self.discipline,
        )

        second_agent = models.Agent.objects.create(
            agenttype=0,
            firstname='Second',
            lastname='Gift Agent',
            division=self.division,
        )

        models.Giftagent.objects.create(
            gift=gift,
            agent=self.agent,
            role='Recipient',
            discipline=self.discipline,
        )
        models.Giftagent.objects.create(
            gift=gift,
            agent=second_agent,
            role='Donor',
            discipline=self.discipline,
        )

        self._create_prep_type()

        first_preparation = self._create_prep(
            self.collectionobjects[0],
            None,
            countamt=2,
        )
        second_preparation = self._create_prep(
            self.collectionobjects[1],
            None,
            countamt=3,
        )

        models.Giftpreparation.objects.create(
            gift=gift,
            preparation=first_preparation,
            quantity=1,
            discipline=self.discipline,
        )
        models.Giftpreparation.objects.create(
            gift=gift,
            preparation=second_preparation,
            quantity=2,
            discipline=self.discipline,
        )

        gift.shipments.create(
            shipmentnumber='GIFT-SHIPMENT-001',
            discipline=self.discipline,
        )
        gift.shipments.create(
            shipmentnumber='GIFT-SHIPMENT-002',
            discipline=self.discipline,
        )

        fetched = models.Gift.objects.get(id=gift.id)

        self.assertEqual(fetched.giftagents.count(), 2)
        self.assertEqual(fetched.giftpreparations.count(), 2)
        self.assertEqual(fetched.shipments.count(), 2)

        agent_roles = dict(
            fetched.giftagents.values_list('agent_id', 'role')
        )
        self.assertEqual(
            agent_roles,
            {
                self.agent.id: 'Recipient',
                second_agent.id: 'Donor',
            },
        )

        preparation_quantities = dict(
            fetched.giftpreparations.values_list(
                'preparation_id',
                'quantity',
            )
        )
        self.assertEqual(
            preparation_quantities,
            {
                first_preparation.id: 1,
                second_preparation.id: 2,
            },
        )

        shipment_numbers = set(
            fetched.shipments.values_list(
                'shipmentnumber',
                flat=True,
            )
        )
        self.assertEqual(
            shipment_numbers,
            {
                'GIFT-SHIPMENT-001',
                'GIFT-SHIPMENT-002',
            },
        )

    def test_fill_remaining_gift_fields(self):
        gift_date = timezone.now()
        date_received = timezone.now()

        gift = models.Gift.objects.create(
            giftnumber='GIFT-REMAINING-001',
            contents='Gift contents',
            date1=gift_date,
            date1precision=1,
            datereceived=date_received,
            integer1=1,
            integer2=2,
            integer3=3,
            isfinancialresponsibility=True,
            number1=Decimal('10.25'),
            number2=Decimal('20.50'),
            purposeofgift='Research',
            receivedcomments='Received in good condition',
            remarks='Gift remarks',
            specialconditions='Handle with care',
            srcgeography='USA',
            srctaxonomy='Quercus',
            status='Completed',
            text1='Text one',
            text2='Text two',
            text3='Text three',
            text4='Text four',
            text5='Text five',
            yesno1=True,
            yesno2=False,
            discipline=self.discipline,
        )

        fetched = models.Gift.objects.get(id=gift.id)

        self.assertEqual(fetched.contents, 'Gift contents')
        self.assertEqual(fetched.date1, gift_date)
        self.assertEqual(fetched.date1precision, 1)
        self.assertEqual(fetched.datereceived, date_received)
        self.assertEqual(fetched.integer1, 1)
        self.assertEqual(fetched.integer2, 2)
        self.assertEqual(fetched.integer3, 3)
        self.assertEqual(fetched.isfinancialresponsibility, True)
        self.assertEqual(fetched.number1, Decimal('10.25'))
        self.assertEqual(fetched.number2, Decimal('20.50'))
        self.assertEqual(fetched.purposeofgift, 'Research')
        self.assertEqual(fetched.receivedcomments, 'Received in good condition')
        self.assertEqual(fetched.remarks, 'Gift remarks')
        self.assertEqual(fetched.specialconditions, 'Handle with care')
        self.assertEqual(fetched.srcgeography, 'USA')
        self.assertEqual(fetched.srctaxonomy, 'Quercus')
        self.assertEqual(fetched.status, 'Completed')
        self.assertEqual(fetched.text1, 'Text one')
        self.assertEqual(fetched.text2, 'Text two')
        self.assertEqual(fetched.text3, 'Text three')
        self.assertEqual(fetched.text4, 'Text four')
        self.assertEqual(fetched.text5, 'Text five')
        self.assertEqual(fetched.yesno1, True)
        self.assertEqual(fetched.yesno2, False)
        self.assertEqual(fetched.discipline, self.discipline)

    def test_add_attachment_to_gift(self):
        gift = models.Gift.objects.create(
            giftnumber='GIFT-ATTACHMENT-001',
            discipline=self.discipline
        )

        attachment = models.Attachment.objects.create(
            origfilename='gift_doc.pdf',
            tableid=gift.specify_model.tableId,
            title='Gift Document',
        )

        gift_attachment = models.Giftattachment.objects.create(
            gift=gift,
            attachment=attachment,
            ordinal=0,
        )

        fetched = models.Giftattachment.objects.get(id=gift_attachment.id)

        self.assertEqual(fetched.gift, gift)
        self.assertEqual(fetched.attachment, attachment)
        self.assertEqual(fetched.ordinal, 0)
        self.assertEqual(fetched.attachment.origfilename, 'gift_doc.pdf')
        self.assertEqual(fetched.attachment.tableid, gift.specify_model.tableId)
        self.assertEqual(fetched.attachment.title, 'Gift Document')
        self.assertEqual(fetched.gift.giftnumber, 'GIFT-ATTACHMENT-001')
        self.assertEqual(fetched.gift.discipline, self.discipline)

    def test_delete_attachment_from_gift(self):
        gift = models.Gift.objects.create(
            giftnumber='GIFT-ATTACHMENT-DELETE-001',
            discipline=self.discipline,
        )
        attachment = models.Attachment.objects.create(
            origfilename='gift_doc_delete.pdf',
            tableid=gift.specify_model.tableId,
            title='Gift Document',
        )
        gift_attachment = models.Giftattachment.objects.create(
            gift=gift,
            attachment=attachment,
            ordinal=0,
        )
        attachment_id = attachment.id
        gift_attachment_id = gift_attachment.id

        gift_attachment.delete()

        self.assertEqual(
            models.Giftattachment.objects.filter(id=gift_attachment_id).count(), 0
        )
        self.assertEqual(
            models.Attachment.objects.filter(id=attachment_id).count(), 0
        )


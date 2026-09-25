from decimal import Decimal
from django.utils import timezone

from specifyweb.specify import models
from specifyweb.specify.tests.test_api import ApiTests


class DeaccessionTests(ApiTests):
    def test_create_deaccession(self):
        deaccession = models.Deaccession.objects.create(
            deaccessionnumber='DEACCESSION-001',
        )

        fetched_deaccession = models.Deaccession.objects.get(id=deaccession.id)

        self.assertEqual(
            fetched_deaccession.deaccessionnumber,
            'DEACCESSION-001',
        )

    def test_fill_all_deaccession_fields(self):
        deaccession_date = timezone.now()
        date_one = timezone.now()
        date_two = timezone.now()

        deaccession = models.Deaccession.objects.create(
            deaccessionnumber='DEACCESSION-FIELDS-001',
            deaccessiondate=deaccession_date,
            date1=date_one,
            date2=date_two,
            integer1=1,
            integer2=2,
            integer3=3,
            integer4=4,
            integer5=5,
            number1=Decimal('11.11'),
            number2=Decimal('22.22'),
            number3=Decimal('33.33'),
            number4=Decimal('44.44'),
            number5=Decimal('55.55'),
            remarks='Deaccession remarks',
            status='In Progress',
            text1='Deaccession text one',
            text2='Deaccession text two',
            text3='Deaccession text three',
            text4='Deaccession text four',
            text5='Deaccession text five',
            agent1=self.agent,
            agent2=self.agent,
        )

        fetched_deaccession = models.Deaccession.objects.get(id=deaccession.id)

        self.assertEqual(
            fetched_deaccession.deaccessiondate,
            deaccession_date,
        )
        self.assertEqual(
            fetched_deaccession.date1,
            date_one,
        )
        self.assertEqual(
            fetched_deaccession.date2,
            date_two,
        )
        self.assertEqual(
            fetched_deaccession.integer1,
            1,
        )
        self.assertEqual(
            fetched_deaccession.integer2,
            2,
        )
        self.assertEqual(
            fetched_deaccession.integer3,
            3,
        )
        self.assertEqual(
            fetched_deaccession.integer4,
            4,
        )
        self.assertEqual(
            fetched_deaccession.integer5,
            5,
        )
        self.assertEqual(
            fetched_deaccession.number1,
            Decimal('11.11'),
        )
        self.assertEqual(
            fetched_deaccession.number2,
            Decimal('22.22'),
        )
        self.assertEqual(
            fetched_deaccession.number3,
            Decimal('33.33'),
        )
        self.assertEqual(
            fetched_deaccession.number4,
            Decimal('44.44'),
        )
        self.assertEqual(
            fetched_deaccession.number5,
            Decimal('55.55'),
        )
        self.assertEqual(
            fetched_deaccession.remarks,
            'Deaccession remarks',
        )
        self.assertEqual(
            fetched_deaccession.status,
            'In Progress',
        )
        self.assertEqual(
            fetched_deaccession.text1,
            'Deaccession text one',
        )
        self.assertEqual(
            fetched_deaccession.text2,
            'Deaccession text two',
        )
        self.assertEqual(
            fetched_deaccession.text3,
            'Deaccession text three',
        )
        self.assertEqual(
            fetched_deaccession.text4,
            'Deaccession text four',
        )
        self.assertEqual(
            fetched_deaccession.text5,
            'Deaccession text five',
        )
        self.assertEqual(
            fetched_deaccession.agent1,
            self.agent,
        )
        self.assertEqual(
            fetched_deaccession.agent2,
            self.agent,
        )

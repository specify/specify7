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

from django.db import IntegrityError
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

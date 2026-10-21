from specifyweb.backend.interactions.cog_preps import get_availability_count
from specifyweb.backend.interactions.tests.test_cog import TestCogInteractions
from specifyweb.specify.models import (
    Loan,
    Gift,
    Loanpreparation,
    Giftpreparation,
    Exchangeout,
    Exchangeoutprep,
)

from unittest import skip


# We don't need to strictly depend on TestCogInteractions, but there are helper functions that are useful
class TestGetAvailabilityCount(TestCogInteractions):

    def setUp(self):
        super().setUp()
        self.loan = Loan.objects.create(discipline_id=self.discipline.id)
        self.gift = Gift.objects.create(discipline_id=self.discipline.id)
        self.exchangeout = Exchangeout.objects.create(
            agentcatalogedby=self.agent, agentsentto=self.agent, division=self.division
        )

    @skip("Currently, it doesn't work")
    def test_simple_count(self):

        prep_1 = self._create_prep(self.collectionobjects[0], None, countamt=6)

        lp_1 = Loanpreparation.objects.create(
            loan=self.loan,
            discipline=self.discipline,
            quantity=2,
            preparation=prep_1,
            quantityresolved=0,
        )

        lp_2 = Loanpreparation.objects.create(
            loan=self.loan,
            discipline=self.discipline,
            quantity=3,
            preparation=prep_1,
            quantityresolved=0,
        )

        Giftpreparation.objects.create(
            gift=self.gift, quantity=0, preparation=prep_1, discipline=self.discipline
        )
        Giftpreparation.objects.create(
            gift=self.gift, quantity=0, preparation=prep_1, discipline=self.discipline
        )

        count = get_availability_count(prep_1, lp_1.id, "loanpreparations__id")
        self.assertEqual(count, 3)

    def test_count_no_extras_loan(self):
        prep_1 = self._create_prep(self.collectionobjects[0], None, countamt=8)

        lp_1 = Loanpreparation.objects.create(
            loan=self.loan,
            discipline=self.discipline,
            quantity=2,
            preparation=prep_1,
            quantityresolved=0,
        )

        lp_2 = Loanpreparation.objects.create(
            loan=self.loan,
            discipline=self.discipline,
            quantity=2,
            preparation=prep_1,
            quantityresolved=0,
        )

        lp_3 = Loanpreparation.objects.create(
            loan=self.loan,
            discipline=self.discipline,
            quantity=3,
            preparation=prep_1,
            quantityresolved=0,
        )

        count = get_availability_count(prep_1, lp_1.id, "loanpreparations__id")
        self.assertEqual(count, 3)

        lp_3.quantityresolved = 2
        lp_3.save()

        count = get_availability_count(prep_1, lp_1.id, "loanpreparations__id")
        self.assertEqual(count, 5)

    def test_count_no_extras_gift(self):

        prep_1 = self._create_prep(self.collectionobjects[0], None, countamt=8)

        gift_1 = Giftpreparation.objects.create(
            gift=self.gift, quantity=2, preparation=prep_1, discipline=self.discipline
        )
        gift_2 = Giftpreparation.objects.create(
            gift=self.gift, quantity=3, preparation=prep_1, discipline=self.discipline
        )

        gift_3 = Giftpreparation.objects.create(
            gift=self.gift, quantity=1, preparation=prep_1, discipline=self.discipline
        )

        count = get_availability_count(prep_1, gift_2.id, "giftpreparations__id")
        self.assertEqual(count, 5)

    def test_count_no_exchangeout(self):

        prep_1 = self._create_prep(self.collectionobjects[0], None, countamt=8)

        ep_1 = Exchangeoutprep.objects.create(
            discipline=self.discipline,
            preparation=prep_1,
            quantity=3,
            exchangeout=self.exchangeout,
        )
        ep_2 = Exchangeoutprep.objects.create(
            discipline=self.discipline,
            preparation=prep_1,
            quantity=2,
            exchangeout=self.exchangeout,
        )
        ep_3 = Exchangeoutprep.objects.create(
            discipline=self.discipline,
            preparation=prep_1,
            quantity=1,
            exchangeout=self.exchangeout,
        )

        count = get_availability_count(prep_1, ep_3.id, "exchangeoutpreps__id")
        self.assertEqual(count, 3)

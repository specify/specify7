from specifyweb.interactions.cog_preps import get_availability_count
from specifyweb.interactions.tests.test_cog import TestCogInteractions
from specifyweb.specify.models import Loan, Gift, Loanpreparation, Giftpreparation

from unittest import skip


# We don't need to strictly depend on TestCogInteractions, but there are helper functions that are useful
class TestGetAvailabilityCount(TestCogInteractions):

    def setUp(self):
        super().setUp()
        self.loan = Loan.objects.create(discipline_id=self.discipline.id)
        self.gift = Gift.objects.create(discipline_id=self.discipline.id)

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
        self.assertEqual(count, 4)

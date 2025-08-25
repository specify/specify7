from specifyweb.backend.interactions.tests.test_preps_available_context import (
    TestPrepsAvailableContext,
)
from specifyweb.specify.calculated_fields import calc_prep_item_count
from specifyweb.backend.datamodel.models import Disposalpreparation


class TestCalcPrepItemCount(TestPrepsAvailableContext):

    def test_no_prep_loan(self):
        extras = {}
        calc_prep_item_count(self.loan, "loanpreparations", extras)
        self.assertEqual(extras, dict(totalPreps=0, totalItems=0))

    def test_no_prep_gift(self):
        extras = {}
        calc_prep_item_count(self.gift, "giftpreparations", extras)
        self.assertEqual(extras, dict(totalPreps=0, totalItems=0))

    def test_no_prep_exchangeout(self):
        extras = {}
        calc_prep_item_count(self.exchangeout, "exchangeoutpreps", extras)
        self.assertEqual(extras, dict(totalPreps=0, totalItems=0))

    def test_no_prep_disposal(self):
        extras = {}
        calc_prep_item_count(self.disposal, "disposalpreparations", extras)
        self.assertEqual(extras, dict(totalPreps=0, totalItems=0))

    def test_with_preps_gift(self):
        self._preps_available_interacted()
        extras = {}
        calc_prep_item_count(self.gift, "giftpreparations", extras)
        self.assertEqual(extras, dict(totalPreps=4, totalItems=5))

    def test_with_preps_exchangeout(self):
        self._preps_available_interacted()
        extras = {}
        calc_prep_item_count(self.exchangeout, "exchangeoutpreps", extras)
        self.assertEqual(extras, dict(totalPreps=3, totalItems=6))

    def test_with_preps_disposal(self):
        prep_1 = self._create_prep(self.collectionobjects[0], None, countamt=5)
        prep_2 = self._create_prep(self.collectionobjects[1], None, countamt=5)
        prep_3 = self._create_prep(self.collectionobjects[2], None, countamt=5)

        Disposalpreparation.objects.create(
            preparation=prep_1, quantity=2, disposal=self.disposal
        )
        Disposalpreparation.objects.create(
            preparation=prep_2, quantity=3, disposal=self.disposal
        )
        Disposalpreparation.objects.create(
            preparation=prep_3, quantity=4, disposal=self.disposal
        )

        extras = {}
        calc_prep_item_count(self.disposal, "disposalpreparations", extras)
        self.assertEqual(extras, dict(totalPreps=3, totalItems=9))

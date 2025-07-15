from specifyweb.interactions.tests.utils import _create_interaction_prep_generic
from specifyweb.specify.models import Gift
from specifyweb.specify.tests.test_api import ApiTests


class TestPreparationIsOnGift(ApiTests):
    def setUp(self):
        super().setUp()
        self._create_prep_type()
        self.gift = Gift.objects.create(discipline_id=self.discipline.id)

    def test_not_gift_simple(self):
        prep = self._create_prep(self.collectionobjects[0], None)
        self.assertFalse(prep.isongift())

    def test_on_gift(self):
        prep = self._create_prep(self.collectionobjects[0], None, countamt=4)
        _create_interaction_prep_generic(self, self.gift, prep, None, quantity=3)
        _create_interaction_prep_generic(self, self.gift, prep, None, quantity=1)
        self.assertTrue(prep.isongift())

    def test_not_gift_zero_quantity(self):
        prep = self._create_prep(self.collectionobjects[0], None, countamt=4)
        _create_interaction_prep_generic(self, self.gift, prep, None, quantity=0)
        self.assertFalse(prep.isongift())
        
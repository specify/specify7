from specifyweb.backend.interactions.tests.utils import _create_interaction_prep_generic
from specifyweb.specify.models import Exchangeout, Exchangeoutprep
from specifyweb.specify.tests.test_api import ApiTests


class TestPreparationIsOnExchangeout(ApiTests):
    def setUp(self):
        super().setUp()
        self._create_prep_type()
        self.exchangeout = Exchangeout.objects.create(
            agentcatalogedby=self.agent, agentsentto=self.agent, division=self.division
        )

    def test_not_exchangeout_simple(self):
        prep = self._create_prep(self.collectionobjects[0], None)
        self.assertFalse(prep.isonexchangeout())

    def test_on_exchangeout(self):
        prep = self._create_prep(self.collectionobjects[0], None, countamt=4)
        _create_interaction_prep_generic(self, self.exchangeout, prep, None, quantity=3)
        _create_interaction_prep_generic(self, self.exchangeout, prep, None, quantity=1)
        self.assertTrue(prep.isonexchangeout())

    def test_not_exchangeout_zero_quantity(self):
        prep = self._create_prep(self.collectionobjects[0], None, countamt=4)
        _create_interaction_prep_generic(self, self.exchangeout, prep, None, quantity=0)
        self.assertFalse(prep.isonexchangeout())
        
    def test_not_exchangeout_negative_quantity(self):
        prep = self._create_prep(self.collectionobjects[0], None, countamt=4)
        exchangeout_prep = _create_interaction_prep_generic(self, self.exchangeout, prep, None, quantity=0)
        Exchangeoutprep.objects.filter(id=exchangeout_prep.id).update(
            quantity=-3
        )
        self.assertFalse(prep.isonexchangeout())
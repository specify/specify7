from specifyweb.backend.interactions.tests.utils import _create_interaction_prep_generic
from specifyweb.specify.models import Exchangein, Exchangeinprep
from specifyweb.specify.tests.test_api import ApiTests


class TestPreparationIsOnExchangeIn(ApiTests):
    def setUp(self):
        super().setUp()
        self._create_prep_type()
        self.exchangein = Exchangein.objects.create(
            agentcatalogedby=self.agent,
            division=self.division,
            agentreceivedfrom=self.agent
        )

    def test_not_exchangein_simple(self):
        prep = self._create_prep(self.collectionobjects[0], None)
        self.assertFalse(prep.isonexchangein())

    def test_on_exchangein(self):
        prep = self._create_prep(self.collectionobjects[0], None, countamt=4)
        _create_interaction_prep_generic(self, self.exchangein, prep, None, quantity=3)
        _create_interaction_prep_generic(self, self.exchangein, prep, None, quantity=1)
        self.assertTrue(prep.isonexchangein())

    def test_not_exchangein_zero_quantity(self):
        prep = self._create_prep(self.collectionobjects[0], None, countamt=4)
        _create_interaction_prep_generic(self, self.exchangein, prep, None, quantity=0)
        self.assertFalse(prep.isonexchangein())

    def test_not_exchangein_negative_quantity(self):
        prep = self._create_prep(self.collectionobjects[0], None, countamt=4)
        exchangein_prep = _create_interaction_prep_generic(self, self.exchangein, prep, None, quantity=0)
        Exchangeinprep.objects.filter(id=exchangein_prep.id).update(
            quantity=-3
        )
        self.assertFalse(prep.isonexchangein())
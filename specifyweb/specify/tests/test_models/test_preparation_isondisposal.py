from specifyweb.interactions.tests.utils import _create_interaction_prep_generic
from specifyweb.specify.models import Disposal, Disposalpreparation
from specifyweb.specify.tests.test_api import ApiTests


class TestPreparationIsOnDisposal(ApiTests):
    def setUp(self):
        super().setUp()
        self._create_prep_type()
        self.disposal = Disposal.objects.create()

    def test_not_disposal_simple(self):
        prep = self._create_prep(self.collectionobjects[0], None)
        self.assertFalse(prep.isondisposal())

    def test_on_disposal(self):
        prep = self._create_prep(self.collectionobjects[0], None, countamt=4)
        _create_interaction_prep_generic(self, self.disposal, prep, None, quantity=3)
        _create_interaction_prep_generic(self, self.disposal, prep, None, quantity=1)
        self.assertTrue(prep.isondisposal())

    def test_not_disposal_zero_quantity(self):
        prep = self._create_prep(self.collectionobjects[0], None, countamt=4)
        _create_interaction_prep_generic(self, self.disposal, prep, None, quantity=0)
        self.assertFalse(prep.isondisposal())
        
    def test_not_disposal_negative_quantity(self):
        prep = self._create_prep(self.collectionobjects[0], None, countamt=4)
        disposalprep = _create_interaction_prep_generic(self, self.disposal, prep, None, quantity=0)
        Disposalpreparation.objects.filter(id=disposalprep.id).update(
            quantity=-3
        )
        self.assertFalse(prep.isondisposal())

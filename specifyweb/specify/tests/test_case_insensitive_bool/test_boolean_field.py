from specifyweb.specify.models import Collectionobject
from specifyweb.specify.tests.test_api import ApiTests
from unittest import expectedFailure


class TestBooleanField(ApiTests):
    def setUp(self):
        super().setUp()
        self._update(self.collectionobjects[0], dict(yesno1=True))
        self._update(self.collectionobjects[1], dict(yesno1=False))

    def test_upper_case(self):

        self.assertEqual(Collectionobject.objects.filter(yesno1="True").count(), 1)
        self.assertEqual(Collectionobject.objects.filter(yesno1="False").count(), 1)

    # See https://github.com/specify/specify7/issues/7081 and https://github.com/specify/specify7/issues/340
    @expectedFailure
    def test_lower_case(self):

        self.assertEqual(Collectionobject.objects.filter(yesno1="true").count(), 1)
        self.assertEqual(Collectionobject.objects.filter(yesno1="false").count(), 1)

from specify import models
from specify.api_tests import ApiTests
from ..exceptions import BusinessRuleException

class PrepTypeTests(ApiTests):
    def test_name_unique_in_collection(self):
        models.Preptype.objects.create(
            collection=self.collection,
            name='foobar',
            isloanable=True)

        with self.assertRaises(BusinessRuleException):
            models.Preptype.objects.create(
                collection=self.collection,
                name='foobar',
                isloanable=True)

        models.Preptype.objects.create(
            collection=self.collection,
            name='foobaz',
            isloanable=True)

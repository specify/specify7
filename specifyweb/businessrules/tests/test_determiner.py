
from unittest import skipUnless
from specifyweb.specify import models
from specifyweb.specify.tests.test_api import ApiTests
from ..exceptions import BusinessRuleException

class DeterminerTests(ApiTests):
    @skipUnless(hasattr(models, 'Determiner'), "Determiner table added in 6.8.02")
    def test_agent_unique_in_determination(self):
        determination = models.Determination.objects.create(
            collectionobject=self.collectionobjects[0],
            collectionmemberid=self.collection.id,
            iscurrent=True,
        )

        determination.determiners.create(
            isprimary=True,
            ordernumber=0,
            agent=self.agent)

        with self.assertRaises(BusinessRuleException):
            determination.determiners.create(
                isprimary=False,
                ordernumber=1,
                agent=self.agent)

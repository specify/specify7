from specify import models
from specify.api_tests import ApiTests
from ..exceptions import BusinessRuleException

class RepositoryAgreementTests(ApiTests):
    def test_number_is_unique_in_division(self):
        models.Repositoryagreement.objects.create(
            repositoryagreementnumber='foobar',
            division=self.division,
            originator=self.agent)

        with self.assertRaises(BusinessRuleException):
            models.Repositoryagreement.objects.create(
                repositoryagreementnumber='foobar',
                division=self.division,
                originator=self.agent)

        models.Repositoryagreement.objects.create(
            repositoryagreementnumber='foobaz',
            division=self.division,
            originator=self.agent)

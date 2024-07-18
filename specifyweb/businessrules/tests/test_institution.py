from specifyweb.specify import models
from specifyweb.specify.tests.test_api import ApiTests
from ..exceptions import BusinessRuleException

class InstitutionTests(ApiTests):
    def test_name_is_unique(self):
        with self.assertRaises(BusinessRuleException):
            models.Institution.objects.create(
                name=self.institution.name,
                isaccessionsglobal=True,
                issecurityon=False,
                isserverbased=False,
                issharinglocalities=True,
                issinglegeographytree=True)

        models.Institution.objects.create(
            name='A different name',
            isaccessionsglobal=True,
            issecurityon=False,
            isserverbased=False,
            issharinglocalities=True,
            issinglegeographytree=True)

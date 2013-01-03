from django.db.models import ProtectedError

from specify import models
from specify.api_tests import ApiTests
from ..exceptions import BusinessRuleException

class GeologictimeperiodtreedefitemTests(ApiTests):
    def test_cannot_delete_root(self):
        root = self.geologictimeperiodtreedef.treedefitems.create(
            name="root",
            rankid=0)

        with self.assertRaises(BusinessRuleException):
            root.delete()

    # def test_delete_blocked_by_geography(self):
    #     earth = models.Geography.objects.create(
    #         name="Earth",
    #         definition=self.geographytreedef,
    #         definitionitem=self.geographytreedef.treedefitems.all()[0])

    #     continent = earth.definitionitem.children.create(
    #         name="Continent",
    #         treedef=earth.definition,
    #         rankid=earth.definitionitem.rankid+100)

    #     asia = earth.children.create(
    #         name="Asia",
    #         definition=earth.definition,
    #         definitionitem=continent)

    #     with self.assertRaises(ProtectedError):
    #         continent.delete()

    #     asia.delete()
    #     continent.delete()

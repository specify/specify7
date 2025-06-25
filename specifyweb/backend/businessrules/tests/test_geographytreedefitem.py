from django.db.models import ProtectedError

from specifyweb.specify import models
from specifyweb.specify.tests.test_api import ApiTests
from ..exceptions import TreeBusinessRuleException

class GeographyTreeDefItem(ApiTests):

    def test_delete_blocked_by_geography(self):
        earth = models.Geography.objects.create(
            name="Earth",
            definition=self.geographytreedef,
            definitionitem=self.geographytreedef.treedefitems.all()[0])

        continent = earth.definitionitem.children.create(
            name="Continent",
            treedef=earth.definition,
            rankid=earth.definitionitem.rankid+100)

        asia = earth.children.create(
            name="Asia",
            definition=earth.definition,
            definitionitem=continent)

        with self.assertRaises(ProtectedError):
            continent.delete()

        asia.delete()
        continent.delete()

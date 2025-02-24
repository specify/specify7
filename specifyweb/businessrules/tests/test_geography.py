
from unittest import skip
from django.db.models import ProtectedError

from specifyweb.specify import models
from specifyweb.specify.tests.test_api import ApiTests


class GeographyTests(ApiTests):
    def test_delete_blocked_by_locality(self):
        geography = models.Geography.objects.create(
            name="Earth",
            definition=self.geographytreedef,
            definitionitem=self.geographytreedef.treedefitems.all()[0])

        geography.localities.create(
            localityname="TestLocality",
            srclatlongunit=0,
            discipline=self.discipline)

        with self.assertRaises(ProtectedError):
            geography.delete()

        geography.localities.all().delete()
        geography.delete()

    def test_delete_blocked_by_agentgeography(self):
        geography = models.Geography.objects.create(
            name="Eartth",
            definition=self.geographytreedef,
            definitionitem=self.geographytreedef.treedefitems.all()[0])

        models.Agentgeography.objects.create(
            geography=geography,
            agent=self.agent)

        with self.assertRaises(ProtectedError):
            geography.delete()

        models.Agentgeography.objects.filter(geography=geography).delete()
        geography.delete()

    def test_isaccepted_on_save(self):
        earth = models.Geography.objects.create(
            name="Earth",
            definition=self.geographytreedef,
            definitionitem=self.geographytreedef.treedefitems.all()[0])

        continent = earth.definitionitem.children.create(
            name="Continent",
            treedef=earth.definition)

        na = earth.children.create(
            name="North America",
            definition=earth.definition,
            definitionitem=continent)

        other_na = earth.children.create(
            name="Americas",
            acceptedgeography=na,
            definition=earth.definition,
            definitionitem=continent)

        self.assertTrue(na.isaccepted)
        self.assertFalse(other_na.isaccepted)

    @skip("this behavior was eliminated by https://github.com/specify/specify7/issues/136")
    def test_delete_cascades_to_deletable_children(self):
        earth = models.Geography.objects.create(
            name="Earth",
            definition=self.geographytreedef,
            definitionitem=self.geographytreedef.treedefitems.all()[0])

        continent = earth.definitionitem.children.create(
            name="Continent",
            treedef=earth.definition,
            rankid=earth.definitionitem.rankid+100)

        na = earth.children.create(
            name="North America",
            definition=earth.definition,
            definitionitem=continent)

        sa = earth.children.create(
            name="South America",
            definition=earth.definition,
            definitionitem=continent)

        l = sa.localities.create(
            localityname="Test Locality",
            srclatlongunit=0,
            discipline=self.discipline)

        with self.assertRaises(ProtectedError):
            earth.delete()

        l.delete()

        earth.delete()

        self.assertEqual(models.Geography.objects.filter(
            id__in=(na.id, sa.id)).count(), 0)

    @skip("not clear if this is correct.")
    def test_accepted_children_acceptedparent_set_to_null_on_delete(self):
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

        me = earth.children.create(
            name="Middle East",
            definition=earth.definition,
            definitionitem=continent)

        country = continent.children.create(
            name="Country",
            treedef=continent.treedef,
            rankid=continent.rankid+100)

        lugash = me.children.create(
            acceptedgeography=asia,
            name="Lugash",
            definition=me.definition,
            definitionitem=country)

        asia.delete()
        self.assertEqual(models.Geography.objects.get(
            id=lugash.id).acceptedgeography, None)

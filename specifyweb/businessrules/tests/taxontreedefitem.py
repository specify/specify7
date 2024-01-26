from django.db.models import ProtectedError
from specifyweb.specify.api_tests import ApiTests
from ..exceptions import TreeBusinessRuleException
from specifyweb.specify import models

class TaxonTreeDefItemTests(ApiTests):
    def setUp(self):
        super(TaxonTreeDefItemTests, self).setUp()

        self.taxontreedef = models.Taxontreedef.objects.create(
            name="Test Taxon tree def")

        self.roottaxontreedefitem = self.taxontreedef.treedefitems.create(
            name="root",
            rankid=0)

        self.roottaxon = self.roottaxontreedefitem.treeentries.create(
            name="Life",
            definition=self.roottaxontreedefitem.treedef,
            rankid=self.roottaxontreedefitem.rankid)

    def test_cannot_delete_root(self):
        self.roottaxon.delete()

        with self.assertRaises(TreeBusinessRuleException):
            self.roottaxontreedefitem.delete()

    def test_delete_blocked_by_taxon(self):
        kingdom = self.roottaxontreedefitem.children.create(
            name="Kingdom",
            treedef=self.taxontreedef,
            rankid=self.roottaxontreedefitem.rankid+100)

        animals = kingdom.treeentries.create(
            parent=self.roottaxon,
            name="Animals",
            definition=kingdom.treedef,
            rankid=kingdom.rankid)

        with self.assertRaises(ProtectedError):
            kingdom.delete()

        animals.delete()
        kingdom.delete()

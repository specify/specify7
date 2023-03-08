from django.db.models import ProtectedError
from specifyweb.specify.api_tests import ApiTests
from ..exceptions import TreeBusinessRuleException
from specifyweb.specify import models

class LithostrattreedefitemTests(ApiTests):
    def setUp(self):
        super(LithostrattreedefitemTests, self).setUp()

        self.lithostrattreedef = models.Lithostrattreedef.objects.create(
            name="Test Lithostrat tree def")

        self.rootlithostrattreedefitem = self.lithostrattreedef.treedefitems.create(
            name="root",
            rankid=0)

        self.rootlithostrat = self.rootlithostrattreedefitem.treeentries.create(
            name="Rocks",
            definition=self.rootlithostrattreedefitem.treedef,
            rankid=self.rootlithostrattreedefitem.rankid)

    def test_cannot_delete_root(self):
        self.rootlithostrat.delete()

        with self.assertRaises(TreeBusinessRuleException):
            self.rootlithostrattreedefitem.delete()

    def test_delete_blocked_by_lithostrat(self):
        layer = self.rootlithostrattreedefitem.children.create(
            name="Layer",
            treedef=self.lithostrattreedef,
            rankid=self.rootlithostrattreedefitem.rankid+100)

        deep = layer.treeentries.create(
            parent=self.rootlithostrat,
            name="Deep Layer",
            definition=layer.treedef,
            rankid=layer.rankid)

        with self.assertRaises(ProtectedError):
            layer.delete()

        deep.delete()
        layer.delete()

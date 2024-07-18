
from unittest import skip

from django.db.models import ProtectedError

from specifyweb.specify import models
from specifyweb.specify.tests.test_api import ApiTests

class LithostratTests(ApiTests):
    def setUp(self):
        super(LithostratTests, self).setUp()

        self.lithostrattreedef = models.Lithostrattreedef.objects.create(
            name="Test Lithostrat tree def")

        self.rootlithostrattreedefitem = self.lithostrattreedef.treedefitems.create(
            name="root",
            rankid=0)

        self.rootlithostrat = self.rootlithostrattreedefitem.treeentries.create(
            name="Rocks",
            definition=self.rootlithostrattreedefitem.treedef,
            rankid=self.rootlithostrattreedefitem.rankid)

    def test_delete_blocked_by_paleocontext(self):
        self.rootlithostrat.paleocontexts.create(
            discipline=self.discipline)

        with self.assertRaises(ProtectedError):
            self.rootlithostrat.delete()

        self.rootlithostrat.paleocontexts.all().delete()
        self.rootlithostrat.delete()

    @skip("this behavior was eliminated by https://github.com/specify/specify7/issues/136")
    def test_delete_cascades_to_deletable_children(self):
        layer = self.rootlithostrattreedefitem.children.create(
            name="Layer",
            treedef=self.lithostrattreedef,
            rankid=self.rootlithostrattreedefitem.rankid+100)

        deep = layer.treeentries.create(
            parent=self.rootlithostrat,
            name="Deep Layer",
            definition=layer.treedef,
            rankid=layer.rankid)

        shallow = layer.treeentries.create(
            parent=self.rootlithostrat,
            name="Shallow Layer",
            definition=layer.treedef,
            rankid=layer.rankid)

        context = deep.paleocontexts.create(
            discipline=self.discipline)

        with self.assertRaises(ProtectedError):
            self.rootlithostrat.delete()

        context.delete()
        self.rootlithostrat.delete()
        self.assertEqual(models.Geologictimeperiod.objects.filter(id__in=(deep.id, shallow.id)).count(), 0)

    @skip("not clear if this is correct.")
    def test_accepted_children_acceptedparent_set_to_null_on_delete(self):
        layer = self.rootlithostrattreedefitem.children.create(
            name="Layer",
            treedef=self.lithostrattreedef,
            rankid=self.rootlithostrattreedefitem.rankid+100)

        deep = layer.treeentries.create(
            parent=self.rootlithostrat,
            name="Deep Layer",
            definition=layer.treedef,
            rankid=layer.rankid)

        shallow = layer.treeentries.create(
            parent=self.rootlithostrat,
            name="Shallow Layer",
            definition=layer.treedef,
            rankid=layer.rankid)

        vasty_deep = layer.treeentries.create(
            parent=self.rootlithostrat,
            name="Vasty Deep Layer",
            definition=layer.treedef,
            rankid=layer.rankid,
            acceptedlithostrat=deep)

        deep.delete()

        self.assertEqual(
            models.Lithostrat.objects.get(id=vasty_deep.id).acceptedlithostrat,
            None)

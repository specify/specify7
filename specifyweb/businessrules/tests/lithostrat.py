from django.db.models import ProtectedError

from specifyweb.specify import models
from specifyweb.specify.api_tests import ApiTests

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
            collectionmemberid=0)

        with self.assertRaises(ProtectedError):
            self.rootlithostrat.delete()

        self.rootlithostrat.paleocontexts.all().delete()
        self.rootlithostrat.delete()

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
            collectionmemberid=0)

        with self.assertRaises(ProtectedError):
            self.rootlithostrat.delete()

        context.delete()
        self.rootlithostrat.delete()
        self.assertEqual(models.Geologictimeperiod.objects.filter(id__in=(deep.id, shallow.id)).count(), 0)

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

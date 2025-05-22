from django.db.models import ProtectedError
from specifyweb.specify.tests.test_api import ApiTests
from ..exceptions import TreeBusinessRuleException
from specifyweb.specify import models

class StorageTreeDefItemTests(ApiTests):
    def setUp(self):
        super().setUp()

        self.storagetreedef = models.Storagetreedef.objects.create(
            name="Test Storage tree def")

        self.rootstoragetreedefitem = self.storagetreedef.treedefitems.create(
            name="root",
            rankid=0)

        self.rootstorage = self.rootstoragetreedefitem.treeentries.create(
            name="Storage",
            definition=self.rootstoragetreedefitem.treedef,
            rankid=self.rootstoragetreedefitem.rankid)

    def test_delete_blocked_by_storage(self):
        site = self.rootstoragetreedefitem.children.create(
            name="Site",
            treedef=self.storagetreedef,
            rankid=self.rootstoragetreedefitem.rankid+100)

        local = site.treeentries.create(
            parent=self.rootstorage,
            name="Local",
            definition=site.treedef,
            rankid=site.rankid)

        with self.assertRaises(ProtectedError):
            site.delete()

        local.delete()
        site.delete()

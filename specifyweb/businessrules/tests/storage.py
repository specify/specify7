
from unittest import skip
from django.db.models import ProtectedError

from specifyweb.specify import models
from specifyweb.specify.tests.test_api import ApiTests

class StorageTests(ApiTests):
    def setUp(self):
        super(StorageTests, self).setUp()

        self.storagetreedef = models.Storagetreedef.objects.create(
            name="Test Storage tree def")

        self.rootstoragetreedefitem = self.storagetreedef.treedefitems.create(
            name="root",
            rankid=0)

        self.rootstorage = self.rootstoragetreedefitem.treeentries.create(
            name="Storage",
            definition=self.rootstoragetreedefitem.treedef,
            rankid=self.rootstoragetreedefitem.rankid)

    def test_delete_blocked_by_preparation(self):
        prep = self.collectionobjects[0].preparations.create(
            storage=self.rootstorage,
            collectionmemberid=self.collection.id,
            preptype=models.Preptype.objects.create(
                collection=self.collection,
                name="whatever",
                isloanable=True))

        with self.assertRaises(ProtectedError):
            self.rootstorage.delete()

        prep.storage = None
        prep.save()
        self.rootstorage.delete()

    def test_delete_blocked_by_container(self):
        container = models.Container.objects.create(
            storage=self.rootstorage,
            collectionmemberid=self.collection.id)

        with self.assertRaises(ProtectedError):
            self.rootstorage.delete()

        container.storage = None
        container.save()
        self.rootstorage.delete()


    @skip("this behavior was eliminated by https://github.com/specify/specify7/issues/136")
    def test_delete_cascades_to_deletable_children(self):
        site = self.rootstoragetreedefitem.children.create(
            name="Site",
            treedef=self.storagetreedef,
            rankid=self.rootstoragetreedefitem.rankid+100)

        local = site.treeentries.create(
            parent=self.rootstorage,
            name="Local",
            definition=site.treedef,
            rankid=site.rankid)

        remote = site.treeentries.create(
            parent=self.rootstorage,
            name="Remote",
            definition=site.treedef,
            rankid=site.rankid)

        container = local.containers.create(
            collectionmemberid=self.collection.id)

        with self.assertRaises(ProtectedError):
            self.rootstorage.delete()

        container.delete()
        self.rootstorage.delete()
        self.assertEqual(models.Storage.objects.filter(id__in=(local.id, remote.id)).count(), 0)

    @skip("not clear if this is correct.")
    def test_accepted_children_acceptedparent_set_to_null_on_delete(self):
        site = self.rootstoragetreedefitem.children.create(
            name="Site",
            treedef=self.storagetreedef,
            rankid=self.rootstoragetreedefitem.rankid+100)

        local = site.treeentries.create(
            parent=self.rootstorage,
            name="Local",
            definition=site.treedef,
            rankid=site.rankid)

        remote = site.treeentries.create(
            parent=self.rootstorage,
            name="Remote",
            definition=site.treedef,
            rankid=site.rankid)

        off_site = site.treeentries.create(
            parent=self.rootstorage,
            name="Off-site",
            definition=site.treedef,
            rankid=site.rankid,
            acceptedstorage=remote)

        remote.delete()

        self.assertEqual(
            models.Storage.objects.get(id=off_site.id).acceptedstorage,
            None)

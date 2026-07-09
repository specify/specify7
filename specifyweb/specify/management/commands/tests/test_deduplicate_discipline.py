from datetime import timedelta

from django.apps import apps as django_apps
from django.utils import timezone

from specifyweb.specify import models
from specifyweb.specify.management.commands import run_key_migration_functions as rkm
from specifyweb.specify.tests.test_api import ApiTests

class KeyMigrationAppResourceDirDatabaseTests(ApiTests):
    def test_deduplicate_discipline_resource_dirs_deletes_only_empty_duplicates(self):
        base_time = timezone.now() - timedelta(days=1)
        keep_oldest = models.Spappresourcedir.objects.create(
            discipline=self.discipline,
            ispersonal=False,
            timestampcreated=base_time,
        )
        empty_duplicate = models.Spappresourcedir.objects.create(
            discipline=self.discipline,
            ispersonal=False,
            timestampcreated=base_time + timedelta(minutes=1),
        )
        duplicate_with_resource = models.Spappresourcedir.objects.create(
            discipline=self.discipline,
            ispersonal=False,
            timestampcreated=base_time + timedelta(minutes=2),
        )
        models.Spappresource.objects.create(
            spappresourcedir=duplicate_with_resource,
            name="PreservedResource",
            level=0,
            specifyuser=self.specifyuser,
        )
        collection_scoped_duplicate = models.Spappresourcedir.objects.create(
            collection=self.collection,
            discipline=self.discipline,
            ispersonal=False,
            timestampcreated=base_time + timedelta(minutes=3),
        )

        rkm.deduplicate_discipline_resource_dirs(django_apps)

        self.assertTrue(
            models.Spappresourcedir.objects.filter(id=keep_oldest.id).exists()
        )
        self.assertFalse(
            models.Spappresourcedir.objects.filter(id=empty_duplicate.id).exists()
        )
        self.assertTrue(
            models.Spappresourcedir.objects.filter(
                id=duplicate_with_resource.id
            ).exists()
        )
        self.assertTrue(
            models.Spappresourcedir.objects.filter(
                id=collection_scoped_duplicate.id
            ).exists()
        )

    def test_deduplicate_discipline_resource_dirs_equal_timestamps_are_preserved(self):
        timestamp = timezone.now()

        first = models.Spappresourcedir.objects.create(
            discipline=self.discipline,
            ispersonal=False,
            timestampcreated=timestamp,
        )
        second = models.Spappresourcedir.objects.create(
            discipline=self.discipline,
            ispersonal=False,
            timestampcreated=timestamp,
        )

        rkm.deduplicate_discipline_resource_dirs(django_apps)

        self.assertTrue(
            models.Spappresourcedir.objects.filter(id=first.id).exists()
        )
        self.assertTrue(
            models.Spappresourcedir.objects.filter(id=second.id).exists()
        )

    def test_deduplicate_discipline_resource_dirs_preserves_scoped_dirs(self):
        base_time = timezone.now()
        unscoped = models.Spappresourcedir.objects.create(
            discipline=self.discipline,
            ispersonal=False,
            timestampcreated=base_time,
        )
        personal = models.Spappresourcedir.objects.create(
            discipline=self.discipline,
            ispersonal=True,
            timestampcreated=base_time + timedelta(minutes=1),
        )
        usertype_scoped = models.Spappresourcedir.objects.create(
            discipline=self.discipline,
            ispersonal=False,
            usertype="Manager",
            timestampcreated=base_time + timedelta(minutes=2),
        )

        rkm.deduplicate_discipline_resource_dirs(django_apps)

        self.assertTrue(
            models.Spappresourcedir.objects.filter(id=unscoped.id).exists()
        )
        self.assertTrue(
            models.Spappresourcedir.objects.filter(id=personal.id).exists()
        )
        self.assertTrue(
            models.Spappresourcedir.objects.filter(id=usertype_scoped.id).exists()
        )
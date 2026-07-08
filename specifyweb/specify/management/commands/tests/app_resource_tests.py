from unittest.mock import Mock

from django.apps import apps

from specifyweb.specify.management.commands import run_key_migration_functions as rkm
from specifyweb.specify.management.commands.tests.test_migration_base import MigrationCommandTestCase
from specifyweb.specify.models import Spappresourcedir


class AppResourceTests(MigrationCommandTestCase):
    def setUp(self):
        super().setUp()
        self.disciplines = [self.discipline, self.fish, self.birds]
        Spappresourcedir.objects.bulk_create(
            [
                Spappresourcedir(
                    discipline=self.discipline,
                    ispersonal=False,
                    collection=None,
                    usertype=None,
                    disciplinetype=self.discipline.name
                ),
                Spappresourcedir(
                    discipline=self.fish,
                    ispersonal=False,
                    collection=None,
                    usertype=None,
                    disciplinetype="somethingwrong"
                )
            ]
        )

    def test_create_missing_app_resource_dirs(self):
        stdout = Mock()

        rkm.create_missing_app_resource_dirs(stdout, apps)

        stdout.assert_called_once_with(
            "Ensured discipline app resource directories: created=1, updated=1"
        )

        discipline_directories = Spappresourcedir.objects.filter(
            discipline__isnull=False,
            ispersonal=False,
            collection__isnull=True,
            usertype__isnull=True
        ).order_by("discipline_id").values_list("discipline_id", "disciplinetype")

        self.assertEqual(
            len(discipline_directories), 3
        )

        discipline_map = {
            discipline.pk: discipline.name
            for discipline in [self.discipline, self.fish, self.birds]
        }
        expected_disciplines = list(map(lambda dis: dis.pk, self.disciplines))
        for (discipline_id, discipline_type) in discipline_directories:
            expected_disciplines.remove(discipline_id)
            self.assertEqual(
                discipline_type,
                discipline_map[discipline_id]
            )
        self.assertEqual(
            len(expected_disciplines),
            0
        )

    def test_deduplicate_discipline_resource_dirs(self):
        stdout = Mock()
        Spappresourcedir.objects.bulk_create(
            [
                # A strict duplicate: should be removed
                Spappresourcedir(
                    ispersonal=False,
                    collection=None,
                    usertype=None,
                    discipline=self.discipline,
                    disciplinetype=self.discipline.name
                ),
                # Has a different disciplinetype, but that is not included in
                # the duplicate query so this is also a duplicate
                Spappresourcedir(
                    ispersonal=False,
                    collection=None,
                    usertype=None,
                    discipline=self.discipline,
                    disciplinetype=None
                ),
                # This one is NOT a duplicate, as the directory is marked as
                # personal and will not be returned by the duplicate query
                Spappresourcedir(
                    ispersonal=True,
                    collection=None,
                    usertype=None,
                    discipline=self.discipline,
                    disciplinetype=self.discipline.name
                ),
                # This one is a duplicate, and should be deleted
                # Note the different discpilinetype compared to the one created
                # during setup ("somethingwrong")
                Spappresourcedir(
                    ispersonal=False,
                    collection=None,
                    usertype=None,
                    discipline=self.fish,
                    disciplinetype=self.fish.name
                ),
                # This is the first directory in the discipline, so should not be
                # deleted
                Spappresourcedir(
                    ispersonal=False,
                    collection=None,
                    usertype=None,
                    discipline=self.birds,
                    disciplinetype=self.birds.name
                )
            ]
        )
        rkm.deduplicate_discipline_resource_dirs(apps)
        all_directories = Spappresourcedir.objects.all().order_by(
            "pk").select_related("discipline")
        self.assertEqual(len(all_directories), 4)
        expected = {}
        expected[self.discipline.pk] = [
            {"ispersonal": False, "disciplinetype": self.discipline.name},
            {"ispersonal": True, "disciplinetype": self.discipline.name}
        ]
        expected[self.birds.pk] = [
            {"ispersonal": False, "disciplinetype": self.birds.name}]
        expected[self.fish.pk] = [
            {"ispersonal": False, "disciplinetype": "somethingwrong"}]
        actual = {
            discipline.pk: []
            for discipline in self.disciplines
        }
        for directory in all_directories:
            self.assertIsNotNone(directory.discipline)
            actual[directory.discipline.pk].append(
                {"ispersonal": directory.ispersonal,
                 "disciplinetype": directory.disciplinetype}
            )
        self.assertEqual(expected, actual)

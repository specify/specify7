from io import StringIO

from django.core.management import call_command

from specifyweb.backend.businessrules.models import (
    UniquenessRule,
    UniquenessRuleField,
)
from specifyweb.backend.permissions.models import (
    LibraryRole,
    LibraryRolePolicy,
    Role,
    RolePolicy,
    UserPolicy,
    UserRole,
)
from specifyweb.specify import models
from specifyweb.specify.tests.test_api import ApiTests


TRACKED_MODELS = {
    "Collectionobjecttype": models.Collectionobjecttype,
    "Picklist": models.Picklist,
    "Picklistitem": models.Picklistitem,
    "Splocalecontainer": models.Splocalecontainer,
    "Splocalecontaineritem": models.Splocalecontaineritem,
    "Splocaleitemstr": models.Splocaleitemstr,
    "UniquenessRule": UniquenessRule,
    "UniquenessRuleField": UniquenessRuleField,
    "LibraryRole": LibraryRole,
    "LibraryRolePolicy": LibraryRolePolicy,
    "Role": Role,
    "RolePolicy": RolePolicy,
    "UserRole": UserRole,
    "UserPolicy": UserPolicy,
    "Spappresourcedir": models.Spappresourcedir,
    "Tectonicunittreedef": models.Tectonicunittreedef,
    "Tectonicunittreedefitem": models.Tectonicunittreedefitem,
    "Tectonicunit": models.Tectonicunit,
}


def record_counts():
    return {
        name: model.objects.count()
        for name, model in TRACKED_MODELS.items()
    }


def count_diff(before, after):
    return {
        name: after_count - before[name]
        for name, after_count in after.items()
        if after_count != before[name]
    }


class RunKeyMigrationFunctionsTests(ApiTests):

    def setUp(self):
        super().setUp()
        self.discipline.name = "Test Discipline"
        self.discipline.taxontreedef = self.taxontreedef
        self.discipline.save(update_fields=["name", "taxontreedef"])

    def create_user_config_records(self, suffix):
        picklist = models.Picklist.objects.create(
            name=f"Test Picklist {suffix}",
            type=0,
            collection=self.collection,
        )
        models.Picklistitem.objects.create(
            picklist=picklist,
            title=f"Test Picklist Item {suffix}",
            value=f"test-picklist-item-{suffix}",
            ordinal=0,
        )

        role = Role.objects.create(
            collection=self.collection,
            name=f"Test Role {suffix}",
            description="User-created role",
        )
        RolePolicy.objects.create(
            role=role,
            resource=f"/test/resource/{suffix}",
            action="read",
        )
        UserRole.objects.create(
            specifyuser=self.specifyuser,
            role=role,
        )
        UserPolicy.objects.create(
            collection=self.collection,
            specifyuser=self.specifyuser,
            resource=f"/test/user-policy/{suffix}",
            action="read",
        )

    def run_key_migration_functions(self):
        out = StringIO()
        call_command("run_key_migration_functions", stdout=out)
        return out.getvalue()

    def test_second_run_does_not_create_duplicate_records(self):
        self.create_user_config_records("before-first-run")

        before_first_run = record_counts()
        self.run_key_migration_functions()
        after_first_run = record_counts()
        first_run_diff = count_diff(before_first_run, after_first_run)

        self.assertTrue(
            any(change > 0 for change in first_run_diff.values()),
            f"Expected first run to create or backfill records. Diff: {first_run_diff}",
        )

        self.create_user_config_records("between-runs")

        before_second_run = record_counts()
        self.run_key_migration_functions()
        after_second_run = record_counts()
        second_run_diff = count_diff(before_second_run, after_second_run)

        self.assertEqual(
            second_run_diff,
            {},
            f"Second run created or removed tracked records: {second_run_diff}",
        )

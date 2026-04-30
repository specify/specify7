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
    "Collectionobjectgrouptype": models.Collectionobjectgrouptype,
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

    def simulate_specify7_usage(
        self, suffix, *, include_collection_object_group_type=True
    ):
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

        collection_object_type = models.Collectionobjecttype.objects.create(
            name=f"Test Collection Object Type {suffix}",
            collection=self.collection,
            taxontreedef=self.taxontreedef,
        )
        collection_object = models.Collectionobject.objects.create(
            collection=self.collection,
            catalognumber=f"cat-{suffix}",
            collectionobjecttype=collection_object_type,
        )

        collection_object_group_type = (
            models.Collectionobjectgrouptype.objects.create(
                name=f"Test Collection Object Group Type {suffix}",
                type="Discrete",
                collection=self.collection,
            )
            if include_collection_object_group_type
            else None
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

        library_role = LibraryRole.objects.create(
            name=f"Test Library Role {suffix}",
            description="User-created library role",
        )
        LibraryRolePolicy.objects.create(
            role=library_role,
            resource=f"/test/library-resource/{suffix}",
            action="read",
        )

        app_resource_dir = models.Spappresourcedir.objects.create(
            collection=self.collection,
            ispersonal=False,
        )
        app_resource = models.Spappresource.objects.create(
            spappresourcedir=app_resource_dir,
            specifyuser=self.specifyuser,
            level=0,
            name=f"Test App Resource {suffix}",
        )
        models.Spappresourcedata.objects.create(
            spappresource=app_resource,
            data=f"test app resource data {suffix}".encode(),
        )

        schema_container = models.Splocalecontainer.objects.create(
            name=f"test_schema_container_{suffix.replace('-', '_')}",
            schematype=0,
            discipline=self.discipline,
        )
        schema_item = models.Splocalecontaineritem.objects.create(
            name=f"test_schema_item_{suffix.replace('-', '_')}",
            container=schema_container,
        )
        models.Splocaleitemstr.objects.create(
            itemname=schema_item,
            language="en",
            text=f"Test Schema Item {suffix}",
        )

        return {
            "app_resource_dir_id": app_resource_dir.id,
            "app_resource_id": app_resource.id,
            "collection_object_group_type_id": (
                None
                if collection_object_group_type is None
                else collection_object_group_type.id
            ),
            "collection_object_id": collection_object.id,
            "collection_object_type_id": collection_object_type.id,
            "library_role_id": library_role.id,
            "picklist_id": picklist.id,
            "role_id": role.id,
            "schema_container_id": schema_container.id,
            "schema_item_id": schema_item.id,
            "suffix": suffix,
        }

    def assert_simulated_specify7_usage_preserved(self, usage):
        self.assertEqual(
            models.Picklist.objects.filter(
                id=usage["picklist_id"],
                name=f"Test Picklist {usage['suffix']}",
                collection=self.collection,
            ).count(),
            1,
        )
        self.assertEqual(
            models.Picklistitem.objects.filter(
                picklist_id=usage["picklist_id"],
                value=f"test-picklist-item-{usage['suffix']}",
            ).count(),
            1,
        )
        self.assertEqual(
            models.Collectionobjecttype.objects.filter(
                id=usage["collection_object_type_id"],
                name=f"Test Collection Object Type {usage['suffix']}",
                collection=self.collection,
            ).count(),
            1,
        )
        self.assertEqual(
            models.Collectionobject.objects.filter(
                id=usage["collection_object_id"],
                collectionobjecttype_id=usage["collection_object_type_id"],
            ).count(),
            1,
        )
        if usage["collection_object_group_type_id"] is not None:
            self.assertEqual(
                models.Collectionobjectgrouptype.objects.filter(
                    id=usage["collection_object_group_type_id"],
                    name=f"Test Collection Object Group Type {usage['suffix']}",
                    collection=self.collection,
                ).count(),
                1,
            )
        self.assertEqual(
            Role.objects.filter(
                id=usage["role_id"],
                collection=self.collection,
                name=f"Test Role {usage['suffix']}",
            ).count(),
            1,
        )
        self.assertEqual(
            RolePolicy.objects.filter(
                role_id=usage["role_id"],
                resource=f"/test/resource/{usage['suffix']}",
            ).count(),
            1,
        )
        self.assertEqual(
            UserRole.objects.filter(
                specifyuser=self.specifyuser,
                role_id=usage["role_id"],
            ).count(),
            1,
        )
        self.assertEqual(
            UserPolicy.objects.filter(
                collection=self.collection,
                specifyuser=self.specifyuser,
                resource=f"/test/user-policy/{usage['suffix']}",
            ).count(),
            1,
        )
        self.assertEqual(
            LibraryRole.objects.filter(
                id=usage["library_role_id"],
                name=f"Test Library Role {usage['suffix']}",
            ).count(),
            1,
        )
        self.assertEqual(
            LibraryRolePolicy.objects.filter(
                role_id=usage["library_role_id"],
                resource=f"/test/library-resource/{usage['suffix']}",
            ).count(),
            1,
        )
        self.assertEqual(
            models.Spappresourcedir.objects.filter(
                id=usage["app_resource_dir_id"],
                collection=self.collection,
            ).count(),
            1,
        )
        self.assertEqual(
            models.Spappresource.objects.filter(
                id=usage["app_resource_id"],
                spappresourcedir_id=usage["app_resource_dir_id"],
                specifyuser=self.specifyuser,
                name=f"Test App Resource {usage['suffix']}",
            ).count(),
            1,
        )
        self.assertEqual(
            models.Spappresourcedata.objects.filter(
                spappresource_id=usage["app_resource_id"],
            ).count(),
            1,
        )
        self.assertEqual(
            models.Splocalecontainer.objects.filter(
                id=usage["schema_container_id"],
                discipline=self.discipline,
            ).count(),
            1,
        )
        self.assertEqual(
            models.Splocalecontaineritem.objects.filter(
                id=usage["schema_item_id"],
                container_id=usage["schema_container_id"],
            ).count(),
            1,
        )
        self.assertEqual(
            models.Splocaleitemstr.objects.filter(
                itemname_id=usage["schema_item_id"],
                language="en",
                text=f"Test Schema Item {usage['suffix']}",
            ).count(),
            1,
        )

    def run_key_migration_functions(self):
        out = StringIO()
        call_command("run_key_migration_functions", stdout=out)
        return out.getvalue()

    def test_second_run_does_not_create_duplicate_records(self):
        self.simulate_specify7_usage(
            "before-first-run",
            include_collection_object_group_type=False,
        )

        before_first_run = record_counts()
        self.run_key_migration_functions()
        after_first_run = record_counts()
        first_run_diff = count_diff(before_first_run, after_first_run)

        self.assertTrue(
            any(change > 0 for change in first_run_diff.values()),
            f"Expected first run to create or backfill records. Diff: {first_run_diff}",
        )

        between_run_usage = self.simulate_specify7_usage("between-runs")

        before_second_run = record_counts()
        self.run_key_migration_functions()
        after_second_run = record_counts()
        second_run_diff = count_diff(before_second_run, after_second_run)

        self.assertEqual(
            second_run_diff,
            {},
            f"Second run created or removed tracked records: {second_run_diff}",
        )
        self.assert_simulated_specify7_usage_preserved(between_run_usage)

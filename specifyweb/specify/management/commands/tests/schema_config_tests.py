from contextlib import ExitStack
from types import SimpleNamespace
from unittest.mock import Mock, patch
from specifyweb.specify.management.commands import run_key_migration_functions as rkm
from specifyweb.specify.management.commands.tests.test_migration_base import MigrationCommandTestCase
from types import SimpleNamespace

from django.apps import apps as django_apps

from specifyweb.specify import models
from specifyweb.specify.tests.test_api import ApiTests

class SchemaConfigTests(MigrationCommandTestCase):
    def test_fix_schema_config_runs_migrations_and_schema_defaults_in_order(self):
        calls = []
        stdout = Mock()
        discipline_1 = SimpleNamespace(id=11, type="botany")
        discipline_2 = SimpleNamespace(id=12, type="paleobotany")

        class FakeDiscipline:
            objects = SimpleNamespace(all=lambda: [discipline_1, discipline_2])

        class FakeApps:
            def get_model(self, app_label, model_name):
                self.model_request = (app_label, model_name)
                return FakeDiscipline

        def apply_schema_defaults(args):
            calls.append(("apply_schema_defaults_task.apply", args))

        names = [
            # Ordered per fix_schema_config implementation
            "create_geo_table_schema_config_with_defaults",
            "create_cotype_splocalecontaineritem",
            "create_strat_table_schema_config_with_defaults",
            "create_agetype_picklist",
            "create_cogtype_picklist",
            "update_relative_age_fields",
            "add_cojo_to_schema_config",
            "update_cog_schema_config",
            "update_age_schema_config",
            "add_tectonicunit_to_pc_in_schema_config",
            "update_storage_unique_id_fields",
            "remove_componentparent_item",
            "create_table_schema_config_with_defaults",
            "create_discipline_type_picklist",
            "apply_schema_overrides_for_all_disciplines",
            "deduplicate_schema_config_orm",
        ]
        fake_apps = FakeApps()

        with ExitStack() as stack:
            stack.enter_context(patch.object(rkm, "apps", fake_apps))
            self._patch_recorders(stack, [(rkm.usc, name) for name in names], calls)
            schema_defaults_apply_path = (
                "specifyweb.backend.setup_tool.schema_defaults."
                "apply_schema_defaults_task.apply"
            )
            stack.enter_context(
                patch(
                    schema_defaults_apply_path,
                    apply_schema_defaults,
                )
            )

            rkm.fix_schema_config(stdout)

        self.assertEqual(fake_apps.model_request, ("specify", "Discipline"))
        self.assertEqual(
            calls,
            [(name, fake_apps) for name in names[:-1]]
            + [
                ("apply_schema_defaults_task.apply", [discipline_1.id]),
                ("apply_schema_defaults_task.apply", [discipline_2.id]),
                (names[-1], fake_apps),
            ],
        )
        stdout.assert_any_call("Running apply_schema_overrides_for_all_disciplines...")
        stdout.assert_any_call(
            "Applying schema defaults/overrides for discipline 11 (botany)..."
        )
        stdout.assert_any_call(
            "Applying schema defaults/overrides for discipline 12 (paleobotany)..."
        )

class KeyMigrationSelectedHelperDatabaseTests(ApiTests):
    def _make_schema_container(self, name, **kwargs):
        return models.Splocalecontainer.objects.create(
            name=name,
            discipline=self.discipline,
            schematype=0,
            **kwargs,
        )

    def test_bulk_create_splocaleitemstr_idempotent_updates_and_dedupes(self):
        container = self._make_schema_container(
            f"bulkitemstr{self.collection.id}",
        )
        item = models.Splocalecontaineritem.objects.create(
            container=container,
            name="field1",
        )
        keeper = models.Splocaleitemstr.objects.create(
            itemname=item,
            language="en",
            text="Old Name",
        )
        duplicate = models.Splocaleitemstr.objects.create(
            itemname=item,
            language="en",
            text="Duplicate Name",
        )

        created_count = rkm.usc.bulk_create_splocaleitemstr_idempotent(
            models.Splocaleitemstr,
            [
                {
                    "itemname": item,
                    "language": "en",
                    "version": 0,
                    "text": "Updated Name",
                },
                {
                    "itemdesc": item,
                    "language": "en",
                    "version": 0,
                    "text": "Created Description",
                },
            ],
        )

        keeper.refresh_from_db()
        self.assertEqual(created_count, 1)
        self.assertEqual(keeper.text, "Updated Name")
        self.assertFalse(
            models.Splocaleitemstr.objects.filter(id=duplicate.id).exists()
        )
        self.assertEqual(
            list(
                models.Splocaleitemstr.objects.filter(
                    itemdesc=item,
                    language="en",
                ).values_list("text", flat=True)
            ),
            ["Created Description"],
        )

    def test_deduplicate_containeritems_and_strings_repoints_unique_strings(self):
        container = self._make_schema_container(
            f"dedupeitems{self.collection.id}",
        )
        keeper = models.Splocalecontaineritem.objects.create(
            container=container,
            name="field1",
        )
        duplicate = models.Splocalecontaineritem.objects.create(
            container=container,
            name="field1",
        )
        models.Splocaleitemstr.objects.create(
            itemname=keeper,
            language="en",
            text="Keeper Name",
        )
        duplicate_name = models.Splocaleitemstr.objects.create(
            itemname=duplicate,
            language="es",
            text="Duplicate Name ES",
        )
        duplicate_desc = models.Splocaleitemstr.objects.create(
            itemdesc=duplicate,
            language="en",
            text="Duplicate Desc",
        )
        duplicate_conflicting_name = models.Splocaleitemstr.objects.create(
            itemname=duplicate,
            language="en",
            text="Duplicate Name EN",
        )

        with patch("builtins.print"):
            rkm.usc.deduplicate_containeritems_and_strings(django_apps)

        self.assertFalse(
            models.Splocalecontaineritem.objects.filter(id=duplicate.id).exists()
        )
        duplicate_name.refresh_from_db()
        duplicate_desc.refresh_from_db()
        self.assertEqual(duplicate_name.itemname_id, keeper.id)
        self.assertEqual(duplicate_desc.itemdesc_id, keeper.id)
        self.assertFalse(
            models.Splocaleitemstr.objects.filter(
                id=duplicate_conflicting_name.id,
            ).exists()
        )
        self.assertEqual(
            set(keeper.names.values_list("language", "text")),
            {("en", "Keeper Name"), ("es", "Duplicate Name ES")},
        )

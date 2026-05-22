from contextlib import ExitStack
from datetime import timedelta
from io import StringIO
from types import SimpleNamespace
from unittest.mock import Mock, call, patch, sentinel

from django.apps import apps as django_apps
from django.test import SimpleTestCase, TestCase
from django.utils import timezone

from specifyweb.backend.businessrules.models import (
    UniquenessRule,
    UniquenessRuleField,
)
from specifyweb.specify import models
from specifyweb.specify.management.commands import run_key_migration_functions as rkm
from specifyweb.specify.tests.test_api import ApiTests


class KeyMigrationCommandTests(TestCase):
    section_names = (
        "apply_patches",
        "fix_cots",
        "fix_permissions",
        "fix_business_rules",
        "fix_schema_config",
        "fix_app_resource_dirs",
        "fix_tectonic_ranks",
        "fix_misc",
    )

    def _command(self):
        return rkm.Command(stdout=StringIO(), stderr=StringIO())

    def test_full_pipeline_dispatches_sections_in_order_with_verbose_stdout(self):
        calls = []

        def section(name):
            return lambda stdout: calls.append((name, stdout is not None))

        command = self._command()
        command.funcs = {name: section(name) for name in self.section_names}

        command.handle(functions=[], verbose=True)

        self.assertEqual(calls, [(name, True) for name in self.section_names])

    def test_selected_sections_run_in_requested_order_without_verbose_stdout(self):
        calls = []

        def section(name):
            return lambda stdout: calls.append((name, stdout))

        command = self._command()
        command.funcs = {name: section(name) for name in self.section_names}

        command.handle(
            functions=["fix_misc", "fix_cots", "fix_permissions"],
            verbose=False,
        )

        self.assertEqual(
            calls,
            [
                ("fix_misc", None),
                ("fix_cots", None),
                ("fix_permissions", None),
            ],
        )

    def test_apply_patches_dispatch_passes_apps_registry_not_stdout(self):
        command = self._command()

        with (
            patch.object(rkm, "apps", sentinel.apps),
            patch.object(rkm, "apply_patches") as apply_patches,
        ):
            command.handle(functions=["apply_patches"], verbose=True)

        apply_patches.assert_called_once_with(sentinel.apps)

    def test_unknown_function_writes_error_and_dispatches_nothing(self):
        stdout = StringIO()
        stderr = StringIO()
        command = rkm.Command(stdout=stdout, stderr=stderr)
        command.funcs = {"known": Mock()}

        command.handle(functions=["unknown"], verbose=True)

        command.funcs["known"].assert_not_called()
        self.assertIn("Unknown function: unknown", stderr.getvalue())


class KeyMigrationSectionTests(SimpleTestCase):
    def _recorder(self, name, calls):
        def func(apps):
            calls.append((name, apps))

        func.__name__ = name
        return func

    def _patch_recorders(self, stack, patch_targets, calls):
        for target, attr in patch_targets:
            stack.enter_context(
                patch.object(target, attr, self._recorder(attr, calls))
            )

    def _assert_section_calls(self, section, patch_targets, expected_names):
        calls = []
        stdout = Mock()

        with ExitStack() as stack:
            stack.enter_context(patch.object(rkm, "apps", sentinel.apps))
            self._patch_recorders(stack, patch_targets, calls)

            section(stdout)

        self.assertEqual(calls, [(name, sentinel.apps) for name in expected_names])
        self.assertEqual(
            stdout.call_args_list,
            [call(f"Running {name}...") for name in expected_names],
        )

    def test_fix_cots_runs_migrations_in_order(self):
        names = [
            "create_default_collection_types",
            "create_default_discipline_for_tree_defs",
            "create_cogtype_type_picklist",
            "set_discipline_for_taxon_treedefs",
            "fix_taxon_treedef_discipline_links",
            "create_cotype_picklist",
        ]

        self._assert_section_calls(
            rkm.fix_cots,
            [(rkm, name) for name in names],
            names,
        )

    def test_log_and_run_without_stdout_still_calls_each_function(self):
        calls = []
        funcs = [
            self._recorder("first", calls),
            self._recorder("second", calls),
        ]

        with patch.object(rkm, "apps", sentinel.apps):
            rkm.log_and_run(funcs, stdout=None)

        self.assertEqual(calls, [("first", sentinel.apps), ("second", sentinel.apps)])

    def test_fix_permissions_runs_migrations_in_order(self):
        names = [
            "initialize_permissions",
            "add_permission",
            "add_stats_edit_permission",
        ]

        self._assert_section_calls(
            rkm.fix_permissions,
            [(rkm, name) for name in names],
            names,
        )

    def test_initialize_permissions_passes_expected_options(self):
        with patch.object(rkm, "initialize") as initialize:
            rkm.initialize_permissions(sentinel.apps)

        initialize.assert_called_once_with(
            False,
            sentinel.apps,
            migrate_sp6_users=False,
        )

    def test_fix_business_rules_runs_migrations_in_order(self):
        names = [
            "apply_default_uniqueness_rules_to_disciplines",
            "catnum_rule_editable",
            "fix_global_default_rules",
        ]

        self._assert_section_calls(
            rkm.fix_business_rules,
            [(rkm, name) for name in names],
            names,
        )

    def test_fix_tectonic_ranks_runs_migrations_in_order(self):
        names = [
            "create_default_tectonic_ranks",
            "create_root_tectonic_node",
            "fix_tectonic_unit_treedef_discipline_links",
        ]

        self._assert_section_calls(
            rkm.fix_tectonic_ranks,
            [(rkm, name) for name in names],
            names,
        )

    def test_fix_misc_runs_migrations_in_order(self):
        names = ["make_selectseries_false"]

        self._assert_section_calls(
            rkm.fix_misc,
            [(rkm, name) for name in names],
            names,
        )

    def test_fix_app_resource_dirs_runs_creation_then_deduplication(self):
        calls = []
        stdout = Mock()

        def create_missing_app_resource_dirs(stdout_arg, apps):
            calls.append(("create_missing_app_resource_dirs", stdout_arg, apps))

        def deduplicate_discipline_resource_dirs(apps):
            calls.append(("deduplicate_discipline_resource_dirs", apps))

        with (
            patch.object(rkm, "apps", sentinel.apps),
            patch.object(
                rkm,
                "create_missing_app_resource_dirs",
                create_missing_app_resource_dirs,
            ),
            patch.object(
                rkm,
                "deduplicate_discipline_resource_dirs",
                deduplicate_discipline_resource_dirs,
            ),
        ):
            rkm.fix_app_resource_dirs(stdout)

        self.assertEqual(
            calls,
            [
                ("create_missing_app_resource_dirs", stdout, sentinel.apps),
                ("deduplicate_discipline_resource_dirs", sentinel.apps),
            ],
        )
        self.assertEqual(
            stdout.call_args_list,
            [
                call("Running <lambda>..."),
                call("Running deduplicate_discipline_resource_dirs..."),
            ],
        )

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
            "create_geo_table_schema_config_with_defaults",
            "create_cotype_splocalecontaineritem",
            "create_strat_table_schema_config_with_defaults",
            "create_agetype_picklist",
            "update_cog_type_fields",
            "create_cogtype_picklist",
            "update_cogtype_splocalecontaineritem",
            "update_systemcogtypes_picklist",
            "update_cogtype_type_splocalecontaineritem",
            "update_relative_age_fields",
            "add_cojo_to_schema_config",
            "update_cog_schema_config",
            "update_age_schema_config",
            "schemaconfig_fixes",
            "add_cot_catnum_to_schema",
            "add_tectonicunit_to_pc_in_schema_config",
            "fix_hidden_geo_prop",
            "update_schema_config_field_desc",
            "update_hidden_prop",
            "update_storage_unique_id_fields",
            "update_co_children_fields",
            "remove_collectionobject_parentco",
            "add_quantities_gift",
            "update_paleo_desc",
            "update_accession_date_fields",
            "update_loan_and_gift_agent_fields",
            "update_loan_and_gift_agents",
            "componets_schema_config_migrations",
            "create_discipline_type_picklist",
            "update_discipline_type_splocalecontaineritem",
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

    def test_create_missing_app_resource_dirs_writes_summary(self):
        stdout = Mock()

        ensure_dirs_path = (
            "specifyweb.backend.setup_tool.app_resource_defaults."
            "ensure_all_discipline_resource_dirs"
        )
        with patch(
            ensure_dirs_path,
            return_value={"total_disciplines": 4, "created": 2, "updated": 1},
        ) as ensure_dirs:
            rkm.create_missing_app_resource_dirs(stdout, sentinel.apps)

        ensure_dirs.assert_called_once_with()
        stdout.assert_called_once_with(
            "Ensured discipline app resource directories: total=4, created=2, updated=1"
        )

    def test_create_missing_app_resource_dirs_without_stdout_writes_nothing(self):
        ensure_dirs_path = (
            "specifyweb.backend.setup_tool.app_resource_defaults."
            "ensure_all_discipline_resource_dirs"
        )
        with patch(
            ensure_dirs_path,
            return_value={"total_disciplines": 4, "created": 2, "updated": 1},
        ) as ensure_dirs:
            rkm.create_missing_app_resource_dirs(None, sentinel.apps)

        ensure_dirs.assert_called_once_with()

    def test_apply_default_uniqueness_rules_skips_existing_db_constraints(self):
        discipline_without_constraint = SimpleNamespace(id=1)
        discipline_with_constraint = SimpleNamespace(id=2)

        class FakeDiscipline:
            objects = SimpleNamespace(
                all=lambda: [discipline_without_constraint, discipline_with_constraint]
            )

        class FakeUniquenessRuleManager:
            def filter(self, discipline, isDatabaseConstraint):
                self.last_is_database_constraint = isDatabaseConstraint
                return SimpleNamespace(
                    exists=lambda: discipline is discipline_with_constraint
                )

        fake_uniqueness_rule_manager = FakeUniquenessRuleManager()

        class FakeUniquenessRule:
            objects = fake_uniqueness_rule_manager

        class FakeApps:
            def get_model(self, app_label, model_name):
                return {
                    ("specify", "Discipline"): FakeDiscipline,
                    ("businessrules", "UniquenessRule"): FakeUniquenessRule,
                }[(app_label, model_name)]

        fake_apps = FakeApps()

        with patch.object(rkm, "apply_default_uniqueness_rules") as apply_rules:
            rkm.apply_default_uniqueness_rules_to_disciplines(fake_apps)

        apply_rules.assert_called_once_with(
            discipline_without_constraint,
            registry=fake_apps,
        )
        self.assertIs(fake_uniqueness_rule_manager.last_is_database_constraint, True)


class KeyMigrationSelectedHelperDatabaseTests(ApiTests):
    def _make_schema_container(self, name, **kwargs):
        return models.Splocalecontainer.objects.create(
            name=name,
            discipline=self.discipline,
            schematype=0,
            **kwargs,
        )

    def test_create_cotype_picklist_creates_readonly_system_picklist_idempotently(self):
        new_collection = models.Collection.objects.create(
            catalognumformatname="test",
            collectionname=f"TestCollection{self.collection.id}",
            isembeddedcollectingevent=False,
            discipline=self.discipline,
        )
        models.Picklist.objects.filter(
            collection__in=[self.collection, new_collection],
            name="CollectionObjectType",
        ).delete()

        rkm.create_cotype_picklist(django_apps)
        rkm.create_cotype_picklist(django_apps)

        for collection in [self.collection, new_collection]:
            picklists = models.Picklist.objects.filter(
                collection=collection,
                name="CollectionObjectType",
            )
            self.assertEqual(picklists.count(), 1)
            picklist = picklists.get()
            self.assertTrue(picklist.issystem)
            self.assertTrue(picklist.readonly)
            self.assertEqual(picklist.type, 1)
            self.assertEqual(picklist.tablename, "collectionobjecttype")
            self.assertEqual(picklist.sizelimit, -1)
            self.assertEqual(picklist.sorttype, 1)
            self.assertEqual(picklist.formatter, "CollectionObjectType")

    def test_create_cogtype_type_picklist_creates_default_items_idempotently(self):
        models.Picklist.objects.filter(
            collection=self.collection,
            name="SystemCOGTypes",
        ).delete()

        rkm.create_cogtype_type_picklist(django_apps)
        rkm.create_cogtype_type_picklist(django_apps)

        picklist = models.Picklist.objects.get(
            collection=self.collection,
            name="SystemCOGTypes",
        )
        self.assertFalse(picklist.issystem)
        self.assertFalse(picklist.readonly)
        self.assertEqual(picklist.type, 0)
        self.assertEqual(
            set(picklist.picklistitems.values_list("title", "value")),
            {
                ("Discrete", "Discrete"),
                ("Consolidated", "Consolidated"),
                ("Drill Core", "Drill Core"),
            },
        )
        self.assertEqual(picklist.picklistitems.count(), 3)

    def test_set_discipline_for_taxon_treedefs_uses_collection_discipline(self):
        taxon_tree_def = models.Taxontreedef.objects.create(
            name=f"Unlinked Taxon Tree {self.collection.id}",
        )
        self.collectionobjecttype.taxontreedef = taxon_tree_def
        self.collectionobjecttype.save()

        rkm.set_discipline_for_taxon_treedefs(django_apps)

        taxon_tree_def.refresh_from_db()
        self.assertEqual(taxon_tree_def.discipline_id, self.discipline.id)

    def test_catnum_rule_editable_only_updates_matching_catalog_number_rule(self):
        matching_rule = UniquenessRule.objects.create(
            modelName="Collectionobject",
            discipline=self.discipline,
            isDatabaseConstraint=True,
        )
        UniquenessRuleField.objects.create(
            uniquenessrule=matching_rule,
            fieldPath="catalogNumber",
            isScope=False,
        )
        UniquenessRuleField.objects.create(
            uniquenessrule=matching_rule,
            fieldPath="collection",
            isScope=True,
        )
        nonmatching_rule = UniquenessRule.objects.create(
            modelName="Collectionobject",
            discipline=self.discipline,
            isDatabaseConstraint=True,
        )
        UniquenessRuleField.objects.create(
            uniquenessrule=nonmatching_rule,
            fieldPath="catalogNumber",
            isScope=False,
        )
        UniquenessRuleField.objects.create(
            uniquenessrule=nonmatching_rule,
            fieldPath="discipline",
            isScope=True,
        )

        rkm.catnum_rule_editable(django_apps)

        matching_rule.refresh_from_db()
        nonmatching_rule.refresh_from_db()
        self.assertFalse(matching_rule.isDatabaseConstraint)
        self.assertTrue(nonmatching_rule.isDatabaseConstraint)

    def test_create_default_tectonic_ranks_creates_chain_and_assigns_discipline(self):
        self.discipline.tectonicunittreedef = None
        self.discipline.save()
        models.Tectonicunittreedef.objects.filter(
            discipline=self.discipline,
        ).delete()

        rkm.create_default_tectonic_ranks(django_apps)

        self.discipline.refresh_from_db()
        tree_def = self.discipline.tectonicunittreedef
        self.assertIsNotNone(tree_def)
        items = list(
            models.Tectonicunittreedefitem.objects.filter(
                treedef=tree_def,
            ).order_by("rankid")
        )
        self.assertEqual(
            [(item.name, item.rankid) for item in items],
            [
                ("Root", 0),
                ("Superstructure", 10),
                ("Tectonic Domain", 20),
                ("Tectonic Subdomain", 30),
                ("Tectonic Unit", 40),
                ("Tectonic Subunit", 50),
            ],
        )
        self.assertIsNone(items[0].parent)
        for parent, child in zip(items, items[1:]):
            self.assertEqual(child.parent_id, parent.id)

    def test_create_root_tectonic_node_is_idempotent(self):
        tree_def = models.Tectonicunittreedef.objects.create(
            name="Tectonic Unit",
            discipline=self.discipline,
        )
        models.Tectonicunittreedefitem.objects.create(
            name="Root",
            title="Root",
            rankid=0,
            treedef=tree_def,
        )

        rkm.create_root_tectonic_node(django_apps)
        rkm.create_root_tectonic_node(django_apps)

        roots = models.Tectonicunit.objects.filter(
            name="Root",
            definition=tree_def,
        )
        self.assertEqual(roots.count(), 1)
        root = roots.get()
        self.assertEqual(root.fullname, "Root")
        self.assertEqual(root.rankid, 0)
        self.assertIsNone(root.parent)
        self.assertTrue(root.isaccepted)

    def test_make_selectseries_false_updates_only_null_smushed_values(self):
        null_query = models.Spquery.objects.create(
            name=f"Null Smushed {self.collection.id}",
            contextname="Collectionobject",
            contexttableid=models.Collectionobject.specify_model.tableId,
            specifyuser=self.specifyuser,
            smushed=None,
        )
        false_query = models.Spquery.objects.create(
            name=f"False Smushed {self.collection.id}",
            contextname="Collectionobject",
            contexttableid=models.Collectionobject.specify_model.tableId,
            specifyuser=self.specifyuser,
            smushed=False,
        )
        true_query = models.Spquery.objects.create(
            name=f"True Smushed {self.collection.id}",
            contextname="Collectionobject",
            contexttableid=models.Collectionobject.specify_model.tableId,
            specifyuser=self.specifyuser,
            smushed=True,
        )

        rkm.make_selectseries_false(django_apps)

        null_query.refresh_from_db()
        false_query.refresh_from_db()
        true_query.refresh_from_db()
        self.assertFalse(null_query.smushed)
        self.assertFalse(false_query.smushed)
        self.assertTrue(true_query.smushed)

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

    def test_update_loan_and_gift_agents_hides_and_upserts_locale_strings(self):
        container = self._make_schema_container("loan")
        item = models.Splocalecontaineritem.objects.create(
            container=container,
            name="agent1",
            ishidden=False,
        )
        first_desc = models.Splocaleitemstr.objects.create(
            itemdesc=item,
            language="en",
            text="Old Desc",
        )
        duplicate_desc = models.Splocaleitemstr.objects.create(
            itemdesc=item,
            language="en",
            text="Duplicate Desc",
        )

        rkm.usc.update_loan_and_gift_agents(django_apps)

        item.refresh_from_db()
        first_desc.refresh_from_db()
        self.assertTrue(item.ishidden)
        self.assertEqual(first_desc.text, "Agent 1")
        self.assertFalse(
            models.Splocaleitemstr.objects.filter(id=duplicate_desc.id).exists()
        )
        self.assertEqual(
            list(item.names.values_list("language", "text")),
            [("en", "Agent 1")],
        )


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

    def test_deduplicate_discipline_resource_dirs_tie_breaks_on_id(self):
        timestamp = timezone.now()
        keep_lower_id = models.Spappresourcedir.objects.create(
            discipline=self.discipline,
            ispersonal=False,
            timestampcreated=timestamp,
        )
        delete_higher_id = models.Spappresourcedir.objects.create(
            discipline=self.discipline,
            ispersonal=False,
            timestampcreated=timestamp,
        )

        rkm.deduplicate_discipline_resource_dirs(django_apps)

        self.assertTrue(
            models.Spappresourcedir.objects.filter(id=keep_lower_id.id).exists()
        )
        self.assertFalse(
            models.Spappresourcedir.objects.filter(id=delete_higher_id.id).exists()
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

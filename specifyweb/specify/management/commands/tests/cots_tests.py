from django.apps import apps as django_apps
from specifyweb.specify import models
from specifyweb.specify.management.commands import run_key_migration_functions as rkm
from specifyweb.specify.management.commands.tests.test_migration_base import (
    MigrationCommandTestCase,
    MigrationDatabaseTestCase,
)

class CotsMigrationTests(MigrationCommandTestCase):
    def test_fix_cots_runs_migrations_in_order(self):
        names = [
            "create_default_collection_types",
            "create_default_discipline_for_tree_defs",
            "create_cogtype_type_picklist",
            "set_discipline_for_taxon_treedefs",
            "fix_taxon_treedef_discipline_links",
            "create_cotype_picklist"
        ]

        self._assert_section_calls(
            rkm.fix_cots,
            [(rkm, name) for name in names],
            names,
        )


class CotsDatabaseTests(MigrationDatabaseTestCase):    
    def test_set_discipline_for_taxon_treedefs_uses_collection_discipline(self):
        taxon_tree_def = models.Taxontreedef.objects.create(
            name=f"Unlinked Taxon Tree {self.collection.id}",
        )
        self.collectionobjecttype.taxontreedef = taxon_tree_def
        self.collectionobjecttype.save()

        rkm.set_discipline_for_taxon_treedefs(django_apps)

        taxon_tree_def.refresh_from_db()
        self.assertEqual(taxon_tree_def.discipline_id, self.discipline.id)

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
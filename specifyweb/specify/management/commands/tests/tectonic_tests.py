from .test_migration_base import MigrationDatabaseTestCase
from specifyweb.specify import models
from specifyweb.specify.management.commands import run_key_migration_functions as rkm
from django.apps import apps as django_apps

class TectonicDatabaseTests(MigrationDatabaseTestCase):
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
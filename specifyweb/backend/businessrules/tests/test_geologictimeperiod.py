from unittest import skip
from django.db.models import ProtectedError

from specifyweb.specify import models
from specifyweb.specify.api.crud import delete_resource, post_resource, update_obj
from specifyweb.specify.api.serializers import uri_for_model
from specifyweb.specify.tests.test_api import ApiTests

class Geologictimeperiod(ApiTests):
    def setUp(self):
        super().setUp()

        self.rootgtp = models.Geologictimeperiod.objects.create(
            name="Eternity",
            definition=self.geologictimeperiodtreedef,
            definitionitem=self.geologictimeperiodtreedef.treedefitems.create(
                name="root",
                rankid=0))
        self.era_rank = self.rootgtp.definitionitem.children.create(
            name="Era",
            rankid=100,
            treedef=self.geologictimeperiodtreedef,
        )

    def _period_data(self, name, **overrides):
        data = {
            "name": name,
            "parent": uri_for_model("geologictimeperiod", self.rootgtp.id),
            "definitionitem": uri_for_model(
                "geologictimeperiodtreedefitem", self.era_rank.id
            ),
            "remarks": "Test period",
            "startperiod": 251.9,
            "endperiod": 66.0,
            "isbiostrat": True,
        }
        data.update(overrides)
        return data

    def _create_period(self, name, **overrides):
        return post_resource(
            self.collection,
            self.agent,
            "geologictimeperiod",
            self._period_data(name, **overrides),
        )

    def _create_existing_period(self, name):
        return self.rootgtp.children.create(
            name=name,
            definition=self.geologictimeperiodtreedef,
            definitionitem=self.era_rank,
            rankid=self.era_rank.rankid,
            remarks="Created before this version",
        )

    def test_add_geologictimeperiod(self):
        period = self._create_period("Mesozoic")

        self.assertIsNotNone(period.id)
        self.assertExists(
            models.Geologictimeperiod.objects.filter(
                id=period.id,
                name="Mesozoic",
                parent=self.rootgtp,
            )
        )
        self.assertEqual(period.definition_id, self.geologictimeperiodtreedef.id)
        self.assertEqual(period.definitionitem_id, self.era_rank.id)
        self.assertEqual(period.rankid, self.era_rank.rankid)

        period.delete()

    def test_clone_geologictimeperiod(self):
        original = self._create_period(
            "Paleozoic",
            remarks="Original remarks",
            startperiod=541.0,
            endperiod=252.0,
            isbiostrat=False,
        )

        clone = self._create_period(
            original.name,
            remarks=original.remarks,
            startperiod=original.startperiod,
            endperiod=original.endperiod,
            isbiostrat=original.isbiostrat,
        )

        self.assertNotEqual(clone.id, original.id)
        self.assertEqual(clone.name, original.name)
        self.assertEqual(clone.parent_id, original.parent_id)
        self.assertEqual(clone.definitionitem_id, original.definitionitem_id)
        self.assertEqual(clone.remarks, original.remarks)
        self.assertEqual(clone.startperiod, original.startperiod)
        self.assertEqual(clone.endperiod, original.endperiod)
        self.assertEqual(clone.isbiostrat, original.isbiostrat)

        original.refresh_from_db()
        self.assertEqual(original.name, "Paleozoic")

        clone.delete()
        original.delete()

    def test_delete_new_geologictimeperiod(self):
        period = self._create_period("Triassic")
        period_id = period.id

        delete_resource(
            self.collection,
            self.agent,
            "geologictimeperiod",
            period_id,
            period.version,
        )

        self.assertNotExists(
            models.Geologictimeperiod.objects.filter(id=period_id)
        )

    def test_edit_geologictimeperiod_created_in_previous_version(self):
        period = self._create_existing_period("Jurassic")

        update_obj(
            self.collection,
            self.agent,
            "geologictimeperiod",
            period.id,
            period.version,
            {"name": "Jurassic (updated)", "remarks": "Updated remarks"},
        )

        period.refresh_from_db()
        self.assertEqual(period.name, "Jurassic (updated)")
        self.assertEqual(period.remarks, "Updated remarks")
        self.assertEqual(period.version, 1)

        period.delete()

    def test_delete_geologictimeperiod_created_in_previous_version(self):
        period = self._create_existing_period("Cretaceous")
        period_id = period.id

        delete_resource(
            self.collection,
            self.agent,
            "geologictimeperiod",
            period_id,
            period.version,
        )

        self.assertNotExists(
            models.Geologictimeperiod.objects.filter(id=period_id)
        )

    def test_delete_blocked_by_biostratspaleocontext(self):
        self.rootgtp.biostratspaleocontext.create(
            discipline=self.discipline)

        with self.assertRaises(ProtectedError):
            self.rootgtp.delete()

        self.rootgtp.biostratspaleocontext.all().delete()
        self.rootgtp.delete()

    def test_delete_blocked_by_chronosstratspaleocontext(self):
        self.rootgtp.chronosstratspaleocontext.create(
            discipline=self.discipline)

        with self.assertRaises(ProtectedError):
            self.rootgtp.delete()

        self.rootgtp.chronosstratspaleocontext.all().delete()
        self.rootgtp.delete()

    def test_delete_blocked_by_chronosstratendpaleocontext(self):
        t = models.Paleocontext.objects.create(
            discipline=self.discipline,
            chronosstratend=self.rootgtp)

        with self.assertRaises(ProtectedError):
            self.rootgtp.delete()

        t.delete()
        self.rootgtp.delete()

    @skip("this behavior was eliminated by https://github.com/specify/specify7/issues/136")
    def test_delete_cascades_to_deletable_children(self):
        age = self.rootgtp.definitionitem.children.create(
            name="Age",
            treedef=self.rootgtp.definition,
            rankid=self.rootgtp.definitionitem.rankid+100)

        first_age = self.rootgtp.children.create(
            name="First Age",
            definition=age.treedef,
            definitionitem=age)

        second_age = self.rootgtp.children.create(
            name="Second Age",
            definition=age.treedef,
            definitionitem=age)

        context = first_age.chronosstratspaleocontext.create(
            discipline=self.discipline)

        with self.assertRaises(ProtectedError):
            self.rootgtp.delete()

        context.delete()
        self.rootgtp.delete()
        self.assertEqual(models.Geologictimeperiod.objects.filter(id__in=(first_age.id, second_age.id)).count(), 0)

    @skip("not clear if this is correct.")
    def test_accepted_children_acceptedparent_set_to_null_on_delete(self):
        age = self.rootgtp.definitionitem.children.create(
            name="Age",
            treedef=self.rootgtp.definition,
            rankid=self.rootgtp.definitionitem.rankid+100)

        first_age = self.rootgtp.children.create(
            name="First Age",
            definition=age.treedef,
            definitionitem=age)

        second_age = self.rootgtp.children.create(
            name="Second Age",
            definition=age.treedef,
            definitionitem=age)

        age_of_magic = self.rootgtp.children.create(
            name="Age of Magic",
            definition=age.treedef,
            definitionitem=age,
            acceptedgeologictimeperiod=first_age)

        first_age.delete()

        self.assertEqual(
            models.Geologictimeperiod.objects.get(id=age_of_magic.id).acceptedgeologictimeperiod,
            None)

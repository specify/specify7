from decimal import Decimal
from unittest import skip

from django.db.models import ProtectedError

from specifyweb.specify import models
from specifyweb.specify.api.crud import delete_resource, post_resource, update_obj
from specifyweb.specify.api.serializers import uri_for_model
from specifyweb.specify.tests.test_api import ApiTests

class LithostratTests(ApiTests):
    def setUp(self):
        super().setUp()

        self.lithostrattreedef = models.Lithostrattreedef.objects.create(
            name="Test Lithostrat tree def")

        self.rootlithostrattreedefitem = self.lithostrattreedef.treedefitems.create(
            name="root",
            rankid=0)

        self.rootlithostrat = self.rootlithostrattreedefitem.treeentries.create(
            name="Rocks",
            definition=self.rootlithostrattreedefitem.treedef,
            rankid=self.rootlithostrattreedefitem.rankid)

        self.formation_rank = self.rootlithostrattreedefitem.children.create(
            name="Formation",
            rankid=100,
            treedef=self.lithostrattreedef,
        )

    def _lithostrat_data(self, name, **overrides):
        data = {
            "name": name,
            "parent": uri_for_model("lithostrat", self.rootlithostrat.id),
            "definitionitem": uri_for_model(
                "lithostrattreedefitem", self.formation_rank.id
            ),
        }
        data.update(overrides)
        return data

    def _create_lithostrat(self, name, **overrides):
        return post_resource(
            self.collection,
            self.agent,
            "lithostrat",
            self._lithostrat_data(name, **overrides),
        )

    def _create_existing_lithostrat(self, name):
        return self.rootlithostrat.children.create(
            name=name,
            definition=self.lithostrattreedef,
            definitionitem=self.formation_rank,
            rankid=self.formation_rank.rankid,
            remarks="Created before this version",
        )

    def test_create_lithostrat(self):
        lithostrat = self._create_lithostrat(
            "Sandstone",
            remarks="Test lithostrat",
        )

        self.assertIsNotNone(lithostrat.id)
        self.assertExists(
            models.Lithostrat.objects.filter(
                id=lithostrat.id,
                name="Sandstone",
                parent=self.rootlithostrat,
            )
        )
        self.assertEqual(lithostrat.definition_id, self.lithostrattreedef.id)
        self.assertEqual(lithostrat.definitionitem_id, self.formation_rank.id)
        self.assertEqual(lithostrat.rankid, self.formation_rank.rankid)

        lithostrat.delete()

    def test_lithostrat_optional_fields_round_trip(self):
        lithostrat = self._create_lithostrat(
            "Shale",
            remarks="Test remarks",
            text1="Lower unit",
            text2="Upper unit",
            number1=Decimal("12.5"),
            number2=Decimal("7.25"),
            yesno1=True,
            yesno2=False,
        )

        lithostrat.refresh_from_db()
        self.assertEqual(lithostrat.remarks, "Test remarks")
        self.assertEqual(lithostrat.text1, "Lower unit")
        self.assertEqual(lithostrat.text2, "Upper unit")
        self.assertEqual(lithostrat.number1, Decimal("12.5"))
        self.assertEqual(lithostrat.number2, Decimal("7.25"))
        self.assertIs(lithostrat.yesno1, True)
        self.assertIs(lithostrat.yesno2, False)

        lithostrat.delete()

    def test_clone_lithostrat(self):
        original = self._create_lithostrat(
            "Limestone",
            remarks="Original remarks",
            text1="Original text",
            number1=Decimal("3.5"),
            yesno1=True,
        )
        clone = self._create_lithostrat(
            "Limestone copy",
            remarks=original.remarks,
            text1=original.text1,
            number1=original.number1,
            yesno1=original.yesno1,
        )

        self.assertNotEqual(clone.id, original.id)
        clone.refresh_from_db()
        self.assertEqual(clone.parent_id, original.parent_id)
        self.assertEqual(clone.definitionitem_id, original.definitionitem_id)
        self.assertEqual(clone.remarks, "Original remarks")
        self.assertEqual(clone.text1, "Original text")
        self.assertEqual(clone.number1, Decimal("3.5"))
        self.assertIs(clone.yesno1, True)

        clone.delete()
        original.delete()

    def test_delete_new_lithostrat(self):
        lithostrat = self._create_lithostrat("Dolomite")
        lithostrat_id = lithostrat.id

        delete_resource(
            self.collection,
            self.agent,
            "lithostrat",
            lithostrat_id,
            lithostrat.version,
        )

        self.assertNotExists(
            models.Lithostrat.objects.filter(id=lithostrat_id)
        )

    def test_delete_blocked_by_paleocontext(self):
        self.rootlithostrat.paleocontexts.create(
            discipline=self.discipline)

        with self.assertRaises(ProtectedError):
            self.rootlithostrat.delete()

        self.rootlithostrat.paleocontexts.all().delete()
        self.rootlithostrat.delete()

    @skip("this behavior was eliminated by https://github.com/specify/specify7/issues/136")
    def test_delete_cascades_to_deletable_children(self):
        layer = self.rootlithostrattreedefitem.children.create(
            name="Layer",
            treedef=self.lithostrattreedef,
            rankid=self.rootlithostrattreedefitem.rankid+100)

        deep = layer.treeentries.create(
            parent=self.rootlithostrat,
            name="Deep Layer",
            definition=layer.treedef,
            rankid=layer.rankid)

        shallow = layer.treeentries.create(
            parent=self.rootlithostrat,
            name="Shallow Layer",
            definition=layer.treedef,
            rankid=layer.rankid)

        context = deep.paleocontexts.create(
            discipline=self.discipline)

        with self.assertRaises(ProtectedError):
            self.rootlithostrat.delete()

        context.delete()
        self.rootlithostrat.delete()
        self.assertEqual(models.Geologictimeperiod.objects.filter(id__in=(deep.id, shallow.id)).count(), 0)

    @skip("not clear if this is correct.")
    def test_accepted_children_acceptedparent_set_to_null_on_delete(self):
        layer = self.rootlithostrattreedefitem.children.create(
            name="Layer",
            treedef=self.lithostrattreedef,
            rankid=self.rootlithostrattreedefitem.rankid+100)

        deep = layer.treeentries.create(
            parent=self.rootlithostrat,
            name="Deep Layer",
            definition=layer.treedef,
            rankid=layer.rankid)

        shallow = layer.treeentries.create(
            parent=self.rootlithostrat,
            name="Shallow Layer",
            definition=layer.treedef,
            rankid=layer.rankid)

        vasty_deep = layer.treeentries.create(
            parent=self.rootlithostrat,
            name="Vasty Deep Layer",
            definition=layer.treedef,
            rankid=layer.rankid,
            acceptedlithostrat=deep)

        deep.delete()

        self.assertEqual(
            models.Lithostrat.objects.get(id=vasty_deep.id).acceptedlithostrat,
            None)

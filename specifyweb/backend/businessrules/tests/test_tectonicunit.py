from decimal import Decimal

from specifyweb.specify import models
from specifyweb.specify.api.crud import delete_resource, post_resource, update_obj
from specifyweb.specify.api.serializers import uri_for_model
from specifyweb.specify.tests.test_api import ApiTests


class TectonicunitTests(ApiTests):
    def setUp(self):
        super().setUp()

        self.tectonicunittreedef = models.Tectonicunittreedef.objects.create(
            name="Test Tectonic Unit tree def"
        )
        self.root_treedefitem = self.tectonicunittreedef.treedefitems.create(
            name="root", rankid=0
        )
        self.root_tectonicunit = self.root_treedefitem.treeentries.create(
            name="Crust",
            definition=self.tectonicunittreedef,
            rankid=self.root_treedefitem.rankid,
        )
        self.unit_rank = self.root_treedefitem.children.create(
            name="Unit",
            rankid=100,
            treedef=self.tectonicunittreedef,
        )

    def _tectonicunit_data(self, name, **overrides):
        data = {
            "name": name,
            "parent": uri_for_model("tectonicunit", self.root_tectonicunit.id),
            "definitionitem": uri_for_model(
                "tectonicunittreedefitem", self.unit_rank.id
            ),
        }
        data.update(overrides)
        return data

    def _create_tectonicunit(self, name, **overrides):
        return post_resource(
            self.collection,
            self.agent,
            "tectonicunit",
            self._tectonicunit_data(name, **overrides),
        )

    def _create_existing_tectonicunit(self, name):
        return self.root_tectonicunit.children.create(
            name=name,
            definition=self.tectonicunittreedef,
            definitionitem=self.unit_rank,
            rankid=self.unit_rank.rankid,
            remarks="Created before this version",
        )

    def test_create_tectonicunit(self):
        tectonicunit = self._create_tectonicunit(
            "Plateau",
            remarks="Test tectonic unit",
        )

        self.assertIsNotNone(tectonicunit.id)
        self.assertExists(
            models.Tectonicunit.objects.filter(
                id=tectonicunit.id,
                name="Plateau",
                parent=self.root_tectonicunit,
            )
        )
        tectonicunit.refresh_from_db()
        self.assertEqual(tectonicunit.definition_id, self.tectonicunittreedef.id)
        self.assertEqual(tectonicunit.definitionitem_id, self.unit_rank.id)
        self.assertEqual(tectonicunit.rankid, self.unit_rank.rankid)

        tectonicunit.delete()

    def test_tectonicunit_optional_fields_round_trip(self):
        tectonicunit = self._create_tectonicunit(
            "Basin",
            remarks="Test remarks",
            text1="Lower unit",
            text2="Upper unit",
            number1=Decimal("12.5"),
            number2=Decimal("7.25"),
            yesno1=True,
            yesno2=False,
        )

        tectonicunit.refresh_from_db()
        self.assertEqual(tectonicunit.remarks, "Test remarks")
        self.assertEqual(tectonicunit.text1, "Lower unit")
        self.assertEqual(tectonicunit.text2, "Upper unit")
        self.assertEqual(tectonicunit.number1, Decimal("12.5"))
        self.assertEqual(tectonicunit.number2, Decimal("7.25"))
        self.assertIs(tectonicunit.yesno1, True)
        self.assertIs(tectonicunit.yesno2, False)

        tectonicunit.delete()

    def test_add_accepted_tectonicunit(self):
        accepted = self._create_tectonicunit("Accepted unit")
        synonym = self._create_tectonicunit(
            "Synonym unit",
            acceptedtectonicunit=uri_for_model("tectonicunit", accepted.id),
            isaccepted=True,
        )

        accepted.refresh_from_db()
        synonym.refresh_from_db()
        self.assertTrue(accepted.isaccepted)
        self.assertFalse(synonym.isaccepted)
        self.assertEqual(synonym.acceptedtectonicunit_id, accepted.id)

        synonym.delete()
        accepted.delete()

    def test_delete_new_tectonicunit(self):
        tectonicunit = self._create_tectonicunit("Terrane")
        tectonicunit_id = tectonicunit.id

        delete_resource(
            self.collection,
            self.agent,
            "tectonicunit",
            tectonicunit_id,
            tectonicunit.version,
        )

        self.assertNotExists(
            models.Tectonicunit.objects.filter(id=tectonicunit_id)
        )


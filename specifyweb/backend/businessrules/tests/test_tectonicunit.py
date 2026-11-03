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


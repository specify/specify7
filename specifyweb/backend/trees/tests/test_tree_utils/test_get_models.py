from specifyweb.specify.models import (
    Geography,
    Geographytreedef,
    Geographytreedefitem,
    Geologictimeperiod,
    Geologictimeperiodtreedef,
    Geologictimeperiodtreedefitem,
    Lithostrat,
    Lithostrattreedef,
    Lithostrattreedefitem,
    Storage,
    Storagetreedef,
    Storagetreedefitem,
    Taxon,
    Taxontreedef,
    Taxontreedefitem,
    Tectonicunit,
    Tectonicunittreedef,
    Tectonicunittreedefitem,
)
from specifyweb.specify.tests.test_api import ApiTests
from specifyweb.backend.trees.utils import get_models


class TestGetModels(ApiTests):
    def test_taxon(self):
        self.assertEqual(get_models("Taxon"), (Taxontreedef, Taxontreedefitem, Taxon))

    def test_geography(self):
        self.assertEqual(
            get_models("Geography"), (Geographytreedef, Geographytreedefitem, Geography)
        )

    def test_lithostrat(self):
        self.assertEqual(
            get_models("LithoStrat"),
            (Lithostrattreedef, Lithostrattreedefitem, Lithostrat),
        )

    def test_geologictimeperiod(self):
        self.assertEqual(
            get_models("GeologicTimePeriod"),
            (
                Geologictimeperiodtreedef,
                Geologictimeperiodtreedefitem,
                Geologictimeperiod,
            ),
        )

    def test_storage(self):
        self.assertEqual(
            get_models("Storage"),
            (Storagetreedef, Storagetreedefitem, Storage),
        )

    def test_tectonicunit(self):
        self.assertEqual(
            get_models("Tectonicunit"),
            (Tectonicunittreedef, Tectonicunittreedefitem, Tectonicunit),
        )

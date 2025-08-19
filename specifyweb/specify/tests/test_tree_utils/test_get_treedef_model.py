from specifyweb.specify.models import Geographytreedef, Geologictimeperiodtreedef, Lithostrattreedef, Storagetreedef, Taxontreedef, Tectonicunittreedef
from specifyweb.specify.tests.test_api import ApiTests
from specifyweb.specify.tree_utils import get_treedef_model


class TestGetTreedefModel(ApiTests):

    def test_taxon(self):
        self.assertIs(get_treedef_model("Taxon"), Taxontreedef)

    def test_geography(self):
        self.assertIs(get_treedef_model("Geography"), Geographytreedef)

    def test_lithostrat(self):
        self.assertIs(get_treedef_model("LithoStrat"), Lithostrattreedef)

    def test_geologictimeperiod(self):
        self.assertIs(get_treedef_model("GeologicTimePeriod"), Geologictimeperiodtreedef)

    def test_storage(self):
        self.assertIs(get_treedef_model("Storage"), Storagetreedef)

    def test_tectonicunit(self):
        self.assertIs(get_treedef_model("Tectonicunit"), Tectonicunittreedef)
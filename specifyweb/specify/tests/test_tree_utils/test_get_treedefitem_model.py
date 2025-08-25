from specifyweb.backend.datamodel.models import Geographytreedefitem, Taxontreedefitem, Lithostrattreedefitem, Geologictimeperiodtreedefitem, Storagetreedefitem,Tectonicunittreedefitem 
from specifyweb.specify.tests.test_api import ApiTests
from specifyweb.specify.tree_utils import get_treedefitem_model


class TestGetTreedefitemModel(ApiTests):

    def test_taxon(self):
        self.assertIs(get_treedefitem_model("Taxon"), Taxontreedefitem)

    def test_geography(self):
        self.assertIs(get_treedefitem_model("Geography"), Geographytreedefitem)

    def test_lithostrat(self):
        self.assertIs(get_treedefitem_model("LithoStrat"), Lithostrattreedefitem)

    def test_geologictimeperiod(self):
        self.assertIs(get_treedefitem_model("GeologicTimePeriod"), Geologictimeperiodtreedefitem)

    def test_storage(self):
        self.assertIs(get_treedefitem_model("Storage"), Storagetreedefitem)

    def test_tectonicunit(self):
        self.assertIs(get_treedefitem_model("Tectonicunit"), Tectonicunittreedefitem)
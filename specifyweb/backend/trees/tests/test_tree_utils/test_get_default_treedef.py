from specifyweb.specify.datamodel import datamodel
from specifyweb.specify.models import Lithostrattreedef, Storagetreedef, Taxontreedef, Tectonicunittreedef
from specifyweb.specify.tests.test_api import ApiTests
from specifyweb.backend.trees.tree_utils import get_default_treedef

class TestGetDefaultTreedef(ApiTests):

    def test_taxon(self):
        self.assertEqual(
            get_default_treedef(datamodel.get_table_strict("taxon"), self.collection).id,
            # This is a bug in the testing environment.
            Taxontreedef.objects.get(name="Sample1").id
        )

    def test_geography(self):
        self.assertEqual(
            get_default_treedef(datamodel.get_table_strict("geography"), self.collection).id,
            self.geographytreedef.id
        )

    def test_lithostrat(self):
        lst = Lithostrattreedef.objects.create(name="Test Lithostrat tree def")
        self._update(self.discipline, dict(lithostrattreedef=lst))
        self.assertEqual(
            get_default_treedef(datamodel.get_table_strict("lithostrat"), self.collection).id,
            lst.id
        )

    def test_geologictimeperiod(self):
        self.assertEqual(
            get_default_treedef(datamodel.get_table_strict("geologictimeperiod"), self.collection).id,
            self.geologictimeperiodtreedef.id
        )

    def test_storage(self):
        storage = Storagetreedef.objects.create(name="Test Storage tree def")

        self._update(self.institution, dict(storagetreedef=storage))

        self.assertEqual(
            get_default_treedef(datamodel.get_table_strict("storage"), self.collection).id,
            storage.id
        )

    def test_tectonic_unit(self):
        tec_tree = Tectonicunittreedef.objects.create(name="TestTree")
        
        self._update(self.discipline, dict(tectonicunittreedef=tec_tree))
        self.assertEqual(
            get_default_treedef(datamodel.get_table_strict("TectonicUnit"), self.collection).id,
            tec_tree.id
        )

    def test_no_tree_error(self):

        with self.assertRaises(Exception) as context:
            get_default_treedef(datamodel.get_table_strict("Collection"), self.collection)
        
        self.assertIn("unexpected tree type: Collection", str(context.exception))
from typing import List, Dict, Tuple

from specifyweb.specify.api_tests import ApiTests
from specifyweb.specify import models
from . import example_plan

def get_table(name: str):
    return getattr(models, name.capitalize())

def cols_and_rows(data: List[Dict[str, str]]) -> Tuple[List[str], List[List[str]]]:
    cols = list(data[0].keys())
    rows = [[r[c] for c in cols] for r in data]
    return cols, rows

class UploadTestsBase(ApiTests):
    def setUp(self) -> None:
        super().setUp()

        spard = get_table('Spappresourcedir').objects.create(usertype='Prefs')
        spar = get_table('Spappresource').objects.create(name='preferences', spappresourcedir=spard, level=3, specifyuser=self.specifyuser)
        get_table('Spappresourcedata').objects.create(data='ui.formatting.scrdateformat=dd/MM/yyyy\n', spappresource=spar)

        self.collection.catalognumformatname = "CatalogNumberNumeric"
        self.collection.save()

        self.geographytreedef.treedefitems.create(name='Continent', rankid=100)
        self.geographytreedef.treedefitems.create(name='Country', rankid=200)
        self.geographytreedef.treedefitems.create(name='State', rankid=300)
        self.geographytreedef.treedefitems.create(name='County', rankid=400)
        self.geographytreedef.treedefitems.create(name='City', rankid=500)


        self.taxontreedef = get_table('Taxontreedef').objects.create(name="Test Taxonomy")
        self.taxontreedef.treedefitems.create(name='Taxonomy Root', rankid=0)
        self.taxontreedef.treedefitems.create(name='Kingdom', rankid=10)
        self.taxontreedef.treedefitems.create(name='Phylum', rankid=30)
        self.taxontreedef.treedefitems.create(name='Class', rankid=60)
        self.taxontreedef.treedefitems.create(name='Order', rankid=100)
        self.taxontreedef.treedefitems.create(name='Superfamily', rankid=130)
        self.taxontreedef.treedefitems.create(name='Family', rankid=140)
        self.taxontreedef.treedefitems.create(name='Genus', rankid=180)
        self.taxontreedef.treedefitems.create(name='Subgenus', rankid=190)
        self.taxontreedef.treedefitems.create(name='Species', rankid=220)
        self.taxontreedef.treedefitems.create(name='Subspecies', rankid=230)

        # some views are not defined above the discipline level
        self.discipline.type = "fish"
        self.discipline.taxontreedef = self.taxontreedef
        self.discipline.save()

        self.example_plan = example_plan.with_scoping(self.collection)

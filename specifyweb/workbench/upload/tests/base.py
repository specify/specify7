from specifyweb.specify.tests.test_api import get_table
from specifyweb.specify.tests.test_trees import TestTreeSetup
from . import example_plan


class UploadTestsBase(TestTreeSetup):
    def setUp(self) -> None:
        super().setUp()

        spard = get_table('Spappresourcedir').objects.create(usertype='Prefs')
        spar = get_table('Spappresource').objects.create(name='preferences', spappresourcedir=spard, level=3, specifyuser=self.specifyuser)
        get_table('Spappresourcedata').objects.create(data='ui.formatting.scrdateformat=dd/MM/yyyy\n', spappresource=spar)

        self.collection.catalognumformatname = "CatalogNumberNumeric"
        self.collection.save()

        # some views are not defined above the discipline level
        self.discipline.type = "fish"
        self.discipline.taxontreedef = self.taxontreedef
        self.discipline.save()

        self.example_plan = example_plan.with_scoping(self.collection)

from django.db.models import ProtectedError
from specifyweb.specify.api_tests import ApiTests
from ..exceptions import TreeBusinessRuleException

class GeologictimeperiodtreedefitemTests(ApiTests):
    def test_cannot_delete_root(self):
        root = self.geologictimeperiodtreedef.treedefitems.create(
            name="root",
            rankid=0)

        with self.assertRaises(TreeBusinessRuleException):
            root.delete()

    def test_delete_blocked_by_geologictimeperiod(self):
        root = self.geologictimeperiodtreedef.treedefitems.create(
            name="root",
            rankid=0)

        eternity = root.treeentries.create(
            name="Eternity",
            definition=root.treedef)

        age = root.children.create(
            name="Age",
            treedef=root.treedef,
            rankid=root.rankid+100)

        first_age = eternity.children.create(
            name="First Age",
            definition=age.treedef,
            definitionitem=age)

        with self.assertRaises(ProtectedError):
            age.delete()

        first_age.delete()
        age.delete()

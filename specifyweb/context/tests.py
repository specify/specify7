
from specifyweb.specify import models, api
from specifyweb.specify.api_tests import ApiTests
from . import viewsets

class ViewTests(ApiTests):
    def setUp(self):
        super(ViewTests, self).setUp()

        # some views are not defined above the discipline level
        self.discipline.type = "fish"
        self.discipline.save()

    def test_get_view(self):
        viewsets.get_view(self.collection, self.specifyuser, "CollectionObject")


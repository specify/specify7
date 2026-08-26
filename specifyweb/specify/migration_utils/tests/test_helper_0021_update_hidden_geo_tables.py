from django.apps import apps

from specifyweb.specify.models import Discipline, Splocalecontainer, Splocalecontaineritem
from specifyweb.specify.tests.test_api import ApiTests
from specifyweb.specify.migration_utils.migration_helpers import helper_0021_update_hidden_geo_tables


class FixHiddenGeoPropTests(ApiTests):

    def setUp(self):
        super().setUp()
        self.other_discipline = Discipline.objects.create(
            geologictimeperiodtreedef=self.geologictimeperiodtreedef,
            geographytreedef=self.geographytreedef,
            division=self.division,
            datatype=self.datatype,
            type='botany',
        )
        self.container = Splocalecontainer.objects.create(
            name='collectionobject',
            schematype=0,
            discipline=self.other_discipline,
            aggregator='',
            defaultui='',
            format='',
            ishidden=False,
            issystem=False,
        )
        self.relative_item = Splocalecontaineritem.objects.create(
            container=self.container,
            name='relativeAges',
            ishidden=False,
            issystem=False,
        )
        self.absolute_item = Splocalecontaineritem.objects.create(
            container=self.container,
            name='absoluteAges',
            ishidden=False,
            issystem=False,
        )
        self.cojo_item = Splocalecontaineritem.objects.create(
            container=self.container,
            name='cojo',
            ishidden=False,
            issystem=False,
        )

    def test_fix_hidden_geo_prop(self):
        helper_0021_update_hidden_geo_tables.fix_hidden_geo_prop(apps)

        self.relative_item.refresh_from_db()
        self.absolute_item.refresh_from_db()
        self.cojo_item.refresh_from_db()

        self.assertTrue(self.relative_item.ishidden)
        self.assertTrue(self.absolute_item.ishidden)
        self.assertTrue(self.cojo_item.ishidden)


class ReverseFixHiddenGeoPropTests(ApiTests):

    def setUp(self):
        super().setUp()
        self.other_discipline = Discipline.objects.create(
            geologictimeperiodtreedef=self.geologictimeperiodtreedef,
            geographytreedef=self.geographytreedef,
            division=self.division,
            datatype=self.datatype,
            type='botany',
        )
        self.container = Splocalecontainer.objects.create(
            name='collectionobject',
            schematype=0,
            discipline=self.other_discipline,
            aggregator='',
            defaultui='',
            format='',
            ishidden=False,
            issystem=False,
        )
        self.relative_item = Splocalecontaineritem.objects.create(
            container=self.container,
            name='relativeAges',
            ishidden=True,
            issystem=False,
        )
        self.absolute_item = Splocalecontaineritem.objects.create(
            container=self.container,
            name='absoluteAges',
            ishidden=True,
            issystem=False,
        )
        self.cojo_item = Splocalecontaineritem.objects.create(
            container=self.container,
            name='cojo',
            ishidden=True,
            issystem=False,
        )

    def test_reverse_fix_hidden_geo_prop(self):
        helper_0021_update_hidden_geo_tables.reverse_fix_hidden_geo_prop(apps)

        self.relative_item.refresh_from_db()
        self.absolute_item.refresh_from_db()
        self.cojo_item.refresh_from_db()

        self.assertFalse(self.relative_item.ishidden)
        self.assertFalse(self.absolute_item.ishidden)
        self.assertFalse(self.cojo_item.ishidden)

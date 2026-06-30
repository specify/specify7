from django.apps import apps

from specifyweb.specify.models import (
    Splocalecontainer,
    Splocalecontaineritem,
    Splocaleitemstr,
)
from specifyweb.specify.tests.test_api import ApiTests
from specifyweb.specify.migration_utils.migration_helpers import helper_0033_update_paleo_desc


class UpdatePaleoDescTests(ApiTests):

    def setUp(self):
        super().setUp()
        self.paleo_container = Splocalecontainer.objects.create(
            name='paleocontext',
            schematype=0,
            discipline=self.discipline,
            aggregator='',
            defaultui='',
            format='',
            ishidden=False,
            issystem=False,
        )
        self.paleo_item = Splocalecontaineritem.objects.create(
            container=self.paleo_container,
            name='paleoDescItem',
            ishidden=False,
            issystem=False,
        )
        self.paleo_desc = Splocaleitemstr.objects.create(
            language='en',
            country='US',
            text='old-description',
            itemdesc=self.paleo_item,
        )

    def test_update_paleo_desc(self):
        helper_0033_update_paleo_desc.update_paleo_desc(apps)

        self.paleo_desc.refresh_from_db()
        expected_desc = helper_0033_update_paleo_desc.MIGRATION_0033_TABLES[0][1]
        self.assertEqual(self.paleo_desc.text, expected_desc)

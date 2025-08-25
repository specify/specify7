from specifyweb.specify.tests.test_api import ApiTests
from unittest.mock import patch, Mock
from specifyweb.backend.datamodel.models import datamodel
from xml.etree.ElementTree import tostring

from specifyweb.backend.stored_queries.format import ObjectFormatter

simple_def = """
    <formatters>
        <aggregators>
        <aggregator
          name="AccessionAgent"
          title="AccessionAgent"
          class="edu.ku.brc.specify.datamodel.AccessionAgent"
          default="false"
          separator="; "
          ending=""
          count="9"
          format="AccessionAgent"
          orderfieldname=""
        />
        </aggregators>
    </formatters>
"""

simple_def_default = """
    <formatters>
        <aggregators>
        <aggregator
          name="AccessionAgentNamed"
          title="AccessionAgentNamed"
          class="edu.ku.brc.specify.datamodel.AccessionAgent"
          default="false"
          separator="; "
          ending=""
          count="4"
          format="AccessionAgent"
          orderfieldname=""
        />
        </aggregators>
        <aggregators>
        <aggregator
          name="AccessionAgent"
          title="AccessionAgent"
          class="edu.ku.brc.specify.datamodel.AccessionAgent"
          default="true"
          separator="; "
          ending=""
          count="9"
          format="AccessionAgent"
          orderfieldname=""
        />
        </aggregators>
    </formatters>
"""


class TestGetAggregatorDef(ApiTests):
    
    @patch('specifyweb.backend.stored_queries.format.app_resource.get_app_resource')
    def test_no_default(self, get_app_resource: Mock):
        get_app_resource.return_value = (simple_def, None, None)
        obj_format = ObjectFormatter(self.collection, self.specifyuser, False)
        result = obj_format.getAggregatorDef(datamodel.get_table("AccessionAgent"), None)
        self.assertIsNone(result)

    @patch('specifyweb.backend.stored_queries.format.app_resource.get_app_resource')
    def test_default_found(self, get_app_resource: Mock):
        get_app_resource.return_value = (simple_def_default, None, None)
        obj_format = ObjectFormatter(self.collection, self.specifyuser, False)
        result = obj_format.getAggregatorDef(datamodel.get_table("AccessionAgent"), None)
        stred = tostring(result, encoding='unicode')
        self.assertIn('count="9"', stred)

    @patch('specifyweb.backend.stored_queries.format.app_resource.get_app_resource')
    def test_matched_name(self, get_app_resource: Mock):
        get_app_resource.return_value = (simple_def_default, None, None)
        obj_format = ObjectFormatter(self.collection, self.specifyuser, False)
        result = obj_format.getAggregatorDef(datamodel.get_table("AccessionAgent"), "AccessionAgentNamed")
        stred = tostring(result, encoding='unicode')
        self.assertIn('count="4"', stred)
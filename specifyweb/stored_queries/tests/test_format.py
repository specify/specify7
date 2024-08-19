from specifyweb.stored_queries.format import ObjectFormatter
from specifyweb.stored_queries.query_construct import QueryConstruct
from specifyweb.stored_queries.tests.tests import SQLAlchemySetup
from xml.etree import ElementTree
import specifyweb.specify.models as spmodels
import specifyweb.stored_queries.models as models

# Used for pretty-formatting sql code for testing
import sqlparse


class FormatterAggregatorTests(SQLAlchemySetup):

    def setUp(self):
        super().setUp()
        object_formatter = ObjectFormatter(self.collection, self.specifyuser, False)
        def _get_formatter(formatter_def):
            object_formatter.formattersDom = ElementTree.fromstring(formatter_def)
            return object_formatter
        self.get_formatter = _get_formatter

    def test_basic_formatters(self):

        formatter_def = """
        <formatters>
          <format
            name="Accession"
            title="Accession"
            class="edu.ku.brc.specify.datamodel.Accession"
            default="true"
          >
            <switch single="true">
              <fields>
                <field>accessionNumber</field>
              </fields>
            </switch>
          </format>
          <format
            name="AccessionAgent"
            title="AccessionAgent"
            class="edu.ku.brc.specify.datamodel.AccessionAgent"
            default="true"
          >
            <switch single="true">
              <fields>
                <field formatter="Agent">agent</field>
                <field sep=" - ">role</field>
              </fields>
            </switch>
          </format>
          <format
            name="Agent"
            title="Agent"
            class="edu.ku.brc.specify.datamodel.Agent"
            default="true"
          >
            <switch single="false" field="agentType">
              <fields value="0">
                <field>lastName</field>
              </fields>
              <fields value="1">
                <field>lastName</field>
                <field sep=", ">firstName</field>
                <field sep=" ">middleInitial</field>
              </fields>
              <fields value="2">
                <field>lastName</field>
              </fields>
              <fields value="3">
                <field>lastName</field>
              </fields>
            </switch>
          </format>
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

        object_formatter = self.get_formatter(formatter_def)

        accession_1 = spmodels.Accession.objects.create(
            accessionnumber='1',
            division=self.division
        )

        agent_2 = spmodels.Agent.objects.create(
            agenttype=1,
            firstname="Test",
            lastname="User",
            middleinitial="MiddleInitial",
            division=self.division,
            specifyuser=self.specifyuser
        )

        accession_agent_1 = spmodels.Accessionagent.objects.create(
            agent=self.agent,
            role='role1',
            accession=accession_1
        )
        accession_agent_2 = spmodels.Accessionagent.objects.create(
            agent=agent_2,
            role='role2',
            accession=accession_1
        )

        with FormatterAggregatorTests.test_session_context() as session:
            query = QueryConstruct(
                collection=self.collection,
                objectformatter=object_formatter,
                query=session.query()
            )
            _, accession_expr = object_formatter.objformat(query, models.Accession, None)
            self.assertEqual(str(accession_expr), 'IFNULL(accession."AccessionNumber", \'\')')
            _, agent_expr = object_formatter.objformat(query, models.Agent, None)
            self.assertEqual(str(agent_expr),
                             'IFNULL(CASE IFNULL(agent."AgentType", \'\') '
                                    'WHEN :param_1 THEN IFNULL(agent."LastName", \'\') '
                                    'WHEN :param_2 THEN concat(IFNULL(agent."LastName", \'\'), IFNULL(concat(:concat_1, agent."FirstName"), \'\'), IFNULL(concat(:concat_2, agent."MiddleInitial"), \'\')) '
                                    'WHEN :param_3 THEN IFNULL(agent."LastName", \'\') '
                                    'WHEN :param_4 THEN IFNULL(agent."LastName", \'\') END, \'\')')
            orm_field = object_formatter.aggregate(query, spmodels.datamodel.get_table('Accession').get_relationship('accessionagents'), models.Accession, None, [])
            self.assertEqual(sqlparse.format(str(orm_field), reindent=True),
                             '\n  '
                             '(SELECT IFNULL(GROUP_CONCAT(IFNULL(concat(IFNULL(CASE IFNULL(agent_1."AgentType", \'\')'
                             '\n                                                       WHEN :param_1 THEN IFNULL(agent_1."LastName", \'\')'
                             '\n                                                       WHEN :param_2 THEN concat(IFNULL(agent_1."LastName", \'\'), IFNULL(concat(:concat_1, agent_1."FirstName"), \'\'), IFNULL(concat(:concat_2, agent_1."MiddleInitial"), \'\'))'
                             '\n                                                       WHEN :param_3 THEN IFNULL(agent_1."LastName", \'\')'
                             '\n                                                       WHEN :param_4 THEN IFNULL(agent_1."LastName", \'\')'
                             '\n                                                   END, \'\'), IFNULL(concat(:concat_3, accessionagent."Role"), \'\')), \'\') SEPARATOR :sep), \'\') AS blank_nulls_1'
                             '\n   FROM accession,'
                             '\n        accessionagent'
                             '\n   LEFT OUTER JOIN agent AS agent_1 ON agent_1."AgentID" = accessionagent."AgentID"'
                             '\n   WHERE accessionagent."AccessionID" = accession."AccessionID"'
                             '\n   LIMIT :param_5)')
            query, expr = object_formatter.objformat(query, models.AccessionAgent, None)
            query = query.query.add_column(expr)
            self.assertCountEqual(list(query), [('User - role1',), ('User, Test MiddleInitial - role2',)])


    def test_aggregation_in_formatters(self):
        formatter_def = """
        <formatters>
          <format
            name="Accession"
            title="Accession"
            class="edu.ku.brc.specify.datamodel.Accession"
            default="true"
          >
            <switch single="true">
              <fields>
                <field>accessionAgents</field>
              </fields>
            </switch>
          </format>
          <format
            name="AccessionAgent"
            title="AccessionAgent"
            class="edu.ku.brc.specify.datamodel.AccessionAgent"
            default="true"
          >
            <switch single="true">
              <fields>
                <field>role</field>
              </fields>
            </switch>
          </format>
            <aggregators>
            <aggregator
              name="AccessionAgent"
              title="AccessionAgent"
              class="edu.ku.brc.specify.datamodel.AccessionAgent"
              default="true"
              separator="; "
              ending=""
              count=""
              format="AccessionAgent"
              orderfieldname="timestampCreated"
            />
            </aggregators>
        </formatters>
        """
        object_formatter = self.get_formatter(formatter_def)
        accession_1 = spmodels.Accession.objects.create(
            accessionnumber='a',
            division=self.division)
        accession_2 = spmodels.Accession.objects.create(
            accessionnumber='b',
            division=self.division)
        accession_agent_1 = spmodels.Accessionagent.objects.create(
            agent=self.agent,
            role='role2',
            accession=accession_1,
        )
        accession_agent_2 = spmodels.Accessionagent.objects.create(
            agent=self.agent,
            role='role1',
            accession=accession_1,
        )
        accession_agent_3 = spmodels.Accessionagent.objects.create(
            agent=self.agent,
            role='role3',
            accession=accession_2,

        )
        accession_agent_4 = spmodels.Accessionagent.objects.create(
            agent=self.agent,
            role='role4',
            accession=accession_2,
        )
        with FormatterAggregatorTests.test_session_context() as session:
            query = QueryConstruct(
                collection=self.collection,
                objectformatter=object_formatter,
                query=session.query()
            )
            query, expr = object_formatter.objformat(query, models.Accession, None)
            self.assertEqual(sqlparse.format(str(expr), reindent=True),
                             'IFNULL('
                             '\n         (SELECT IFNULL(GROUP_CONCAT(IFNULL(accessionagent."Role", \'\')'
                             '\n                                     ORDER BY accessionagent."TimestampCreated" SEPARATOR :sep), \'\') AS blank_nulls_1'
                             '\n          FROM accessionagent, accession'
                             '\n          WHERE accessionagent."AccessionID" = accession."AccessionID"), \'\')'
                             )
            query = query.query.add_columns(models.Accession.accessionNumber, expr)
            self.assertCountEqual(list(query), [('a', 'role2; role1'), ('b', 'role3; role4')])

    def test_detect_cycles(self):
        formatter_def = """
        <formatters>
          <format
            name="Accession"
            title="Accession"
            class="edu.ku.brc.specify.datamodel.Accession"
            default="true"
          >
            <switch single="true">
              <fields>
                <field>accessionAgents</field>
              </fields>
            </switch>
          </format>
          <format
            name="AccessionAgent"
            title="AccessionAgent"
            class="edu.ku.brc.specify.datamodel.AccessionAgent"
            default="true"
          >
            <switch single="true">
              <fields>
                <field>role</field>
                <field>accession</field>
                <field>accession.accessionnumber</field>
              </fields>
            </switch>
          </format>
            <aggregators>
            <aggregator
              name="AccessionAgent"
              title="AccessionAgent"
              class="edu.ku.brc.specify.datamodel.AccessionAgent"
              default="true"
              separator="; "
              ending=""
              count=""
              format="AccessionAgent"
              orderfieldname=""
            />
            </aggregators>
        </formatters>
        """
        object_formatter = self.get_formatter(formatter_def)
        accession_1 = spmodels.Accession.objects.create(
            accessionnumber='Some_number',
            division=self.division)
        accession_agent_1 = spmodels.Accessionagent.objects.create(
            agent=self.agent,
            role='roleA',
            accession=accession_1,
        )
        with FormatterAggregatorTests.test_session_context() as session:
            query = QueryConstruct(
                collection=self.collection,
                objectformatter=object_formatter,
                query=session.query()
            )
            query, expr = object_formatter.objformat(query, models.Accession, None)
            query = query.query.add_column(expr)
            self.assertCountEqual(list(query),
                                  [(
                                   "roleASome_number",)]
                                  )

    def test_relationships_in_switch_fields(self):
        formatter_def = """
        <formatters>
          <format
            name="Accession"
            title="Accession"
            class="edu.ku.brc.specify.datamodel.Accession"
            default="true"
          >
            <switch single="true">
              <fields>
                <field>text1</field>
              </fields>
            </switch>
          </format>
          <format
            name="AccessionAgent"
            title="AccessionAgent"
            class="edu.ku.brc.specify.datamodel.AccessionAgent"
            default="true"
          >
            <switch single="false" field="accession.accessionNumber">
              <fields value="1">
                <field>accession</field>
              </fields>
              <fields value="2">
                <field sep=" ">accession.text2</field>
                <field sep=" ">role</field>
              </fields>
            </switch>
          </format>
        </formatters>
        """
        object_formatter = self.get_formatter(formatter_def)
        accession_1 = spmodels.Accession.objects.create(
            accessionnumber='1',
            division=self.division,
            text1='text 1 value for this accession',
            text2='this should never be seen'
        )
        accession_2 = spmodels.Accession.objects.create(
            accessionnumber='2',
            division=self.division,
            text1='this should never be seen',
            text2='text 2 value for this accession'
        )

        accession_agent_1 = spmodels.Accessionagent.objects.create(
            agent=self.agent,
            role='role',
            accession=accession_1,

        )
        accession_agent_2 = spmodels.Accessionagent.objects.create(
            agent=self.agent,
            role='role2',
            accession=accession_2,
        )
        with FormatterAggregatorTests.test_session_context() as session:
            query = QueryConstruct(
                collection=self.collection,
                objectformatter=object_formatter,
                query=session.query()
            )
            query, expr = object_formatter.objformat(query, models.AccessionAgent, None)
            query = query.query.add_columns(expr)
            self.assertCountEqual(list(query), [('text 1 value for this accession',), (' text 2 value for this accession role2',)])

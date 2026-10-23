from specifyweb.backend.stored_queries.format import ObjectFormatter
from specifyweb.backend.context.app_resource import merge_formatters
from specifyweb.backend.stored_queries.query_construct import QueryConstruct
from specifyweb.backend.stored_queries.tests.base_format import SIMPLE_DEF
from specifyweb.backend.stored_queries.tests.tests import SQLAlchemySetup
from xml.etree import ElementTree
import specifyweb.specify.models as spmodels
import specifyweb.backend.stored_queries.models as models

class FormatterAggregatorTests(SQLAlchemySetup):

    def setUp(self):
        super().setUp()
        object_formatter = ObjectFormatter(self.collection, self.specifyuser, False)
        def _get_formatter(formatter_def):
            object_formatter.formattersDom = ElementTree.fromstring(formatter_def)
            return object_formatter
        self.get_formatter = _get_formatter

    def test_basic_formatters(self):

        formatter_def = SIMPLE_DEF

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
        agent_3 = spmodels.Agent.objects.create(
            agenttype=1,
            firstname="",
            lastname="Smith",
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
            agent_results = session.query(models.Agent._id, agent_expr).filter(
                models.Agent._id.in_([self.agent.id, agent_2.id, agent_3.id])
            ).all()
            self.assertCountEqual(agent_results, [
                (self.agent.id, 'User'),
                (agent_2.id, 'User, Test MiddleInitial'),
                (agent_3.id, 'Smith'),
            ])
            orm_field = object_formatter.aggregate(query, spmodels.datamodel.get_table('Accession').get_relationship_strict('accessionagents'), models.Accession, None, [])
            aggregated = session.query(orm_field).select_from(models.Accession).filter(
                models.Accession._id == accession_1.id
            ).scalar()
            self.assertCountEqual(
                aggregated.split('; '),
                ['User - role1', 'User, Test MiddleInitial - role2']
            )
            query, expr = object_formatter.objformat(query, models.AccessionAgent, None)
            query = query.query.add_column(expr)
            self.assertCountEqual(list(query), [('User - role1',), ('User, Test MiddleInitial - role2',)])

    def test_default_agent_id_aggregators(self):
        formatter = ObjectFormatter(self.collection, self.specifyuser, False)
        custom = '''<formatters>
          <format name="Collector" class="edu.ku.brc.specify.datamodel.Collector" default="true"/>
          <format name="Determiner" class="edu.ku.brc.specify.datamodel.Determiner" default="true"/>
        </formatters>'''
        formatter.formattersDom = ElementTree.fromstring(
            merge_formatters(custom, ElementTree.tostring(formatter.formattersDom))
        )
        event = spmodels.Collectingevent.objects.create(
            discipline=self.discipline, stationfieldnumber='id-aggregations'
        )
        determination = spmodels.Determination.objects.create(
            collectionobject=self.collectionobjects[0],
            collectionmemberid=self.collection.id,
            iscurrent=True,
        )
        agents = []
        for index in range(2):
            agent = spmodels.Agent.objects.create(
                agenttype=1,
                lastname=f'Person {index}',
                division=self.division,
            )
            agents.append(agent)
            spmodels.Agentidentifier.objects.create(
                agent=agent, identifiertype='ORCID', identifier=f'id-{index}'
            )
            spmodels.Collector.objects.create(
                collectingevent=event, agent=agent, ordernumber=1 - index
            )
            spmodels.Determiner.objects.create(
                determination=determination, agent=agent, ordernumber=1 - index
            )

        with FormatterAggregatorTests.test_session_context() as session:
            query = QueryConstruct(
                collection=self.collection,
                objectformatter=formatter,
                query=session.query(),
            )
            collector_ids = formatter.aggregate(
                query,
                spmodels.datamodel.get_table('CollectingEvent').get_relationship_strict('collectors'),
                models.CollectingEvent,
                'CollectorIDs',
            )
            determiner_ids = formatter.aggregate(
                query,
                spmodels.datamodel.get_table('Determination').get_relationship_strict('determiners'),
                models.Determination,
                'DeterminerIDs',
            )
            singular_determiner_id = formatter.aggregate(
                query,
                spmodels.datamodel.get_table('Agent').get_relationship_strict('identifiers'),
                models.Agent,
                'AgentIdentifier',
            )
            expected = 'https://orcid.org/id-1 | https://orcid.org/id-0'
            for model, identifier, expression in [
                (models.CollectingEvent, event.id, collector_ids),
                (models.Determination, determination.id, determiner_ids),
            ]:
                result = session.query(expression).select_from(model).filter(
                    model._id == identifier
                ).scalar()
                self.assertEqual(result, expected)
            self.assertEqual(
                session.query(singular_determiner_id)
                .select_from(models.Agent)
                .filter(models.Agent._id == agents[0].id)
                .scalar(),
                'https://orcid.org/id-0',
            )

    def test_aggregator_skips_empty_nested_formatter_values(self):
        object_formatter = self.get_formatter("""
            <formatters>
              <format name="CollectorID" class="edu.ku.brc.specify.datamodel.Collector">
                <switch single="true"><fields>
                  <field sep=" ">agent.identifiers</field>
                </fields></switch>
              </format>
              <format name="AgentIdentifier" class="edu.ku.brc.specify.datamodel.AgentIdentifier">
                <switch single="true"><fields><field>identifier</field></fields></switch>
              </format>
              <aggregators>
                <aggregator name="CollectorID" class="edu.ku.brc.specify.datamodel.Collector"
                    separator=" | " format="CollectorID" />
                <aggregator name="AgentIdentifier" class="edu.ku.brc.specify.datamodel.AgentIdentifier"
                    default="true" separator="; " format="AgentIdentifier" />
              </aggregators>
            </formatters>
        """)
        event = spmodels.Collectingevent.objects.create(
            discipline=self.discipline, stationfieldnumber="empty-collector-ids"
        )
        agents = [
            spmodels.Agent.objects.create(
                agenttype=1, lastname=f"Collector {index}", division=self.division
            )
            for index in range(3)
        ]
        for index, agent in enumerate(agents):
            spmodels.Collector.objects.create(
                collectingevent=event, agent=agent, ordernumber=index
            )
        spmodels.Agentidentifier.objects.create(agent=agents[1], identifier="ID-1")

        with FormatterAggregatorTests.test_session_context() as session:
            query = QueryConstruct(
                collection=self.collection,
                objectformatter=object_formatter,
                query=session.query(),
            )
            formatted = object_formatter.aggregate(
                query,
                spmodels.datamodel.get_table('CollectingEvent').get_relationship_strict('collectors'),
                models.CollectingEvent,
                'CollectorID',
                [],
            )
            result = session.query(formatted).select_from(models.CollectingEvent).filter(
                models.CollectingEvent._id == event.id
            ).scalar()
            self.assertEqual(result, ' ID-1')


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

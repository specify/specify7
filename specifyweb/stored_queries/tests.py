from sqlalchemy import orm, inspect
from unittest import skip, expectedFailure

from specifyweb.accounts import models as acccounts_models
from specifyweb.attachment_gw import models as attachment_gw_models
from specifyweb.businessrules import models as businessrules_models
from specifyweb.context import models as context_models
from specifyweb.notifications import models as notifications_models
from specifyweb.permissions import models as permissions_models
from specifyweb.interactions import models as interactions_models
from specifyweb.workbench import models as workbench_models

from django.test import TestCase
import specifyweb.specify.models as spmodels
from specifyweb.specify.tests.test_api import ApiTests
from .format import ObjectFormatter
from .query_construct import QueryConstruct
from .queryfieldspec import QueryFieldSpec
from MySQLdb.cursors import SSCursor
from django.conf import settings
import sqlalchemy
from sqlalchemy.dialects import mysql
from django.db import connection
from sqlalchemy import event
from . import models
from xml.etree import ElementTree
# Used for pretty-formatting sql code for testing
import sqlparse

class QueryFieldTests(TestCase):
    def test_stringid_roundtrip_from_bug(self) -> None:
        fs = QueryFieldSpec.from_stringid("4.taxon.Genus", False)
        self.assertEqual("4.taxon.Genus", fs.to_stringid())

    @expectedFailure
    def test_stringid_roundtrip_en_masse(self) -> None:
        for (stringid, relfld) in STRINGID_LIST:
            fs = QueryFieldSpec.from_stringid(stringid, relfld)
            self.assertEqual(relfld == 1, fs.is_relationship())
            self.assertEqual(stringid.lower(), fs.to_stringid().lower())


""""
Provides a gateway to test sqlalchemy queries, while
using django models. The idea is to use django.db's connection.cursor()
to execute the query, and make a literal query for it. This is done because django's unit test
will run inside a nested transaction, and any other transaction will never see the changes
so SqlAlchemy queries will not see the changes.

Multiple-session context safe. So, the following usage is valid

with session.context() as session:
    query_1 = session.query(...)
    query_2 = session.query(...)

"""


class SQLAlchemySetup(ApiTests):

    test_sa_url = None
    engine = None
    test_session_context = None

    @classmethod
    def setUpClass(cls):
        # Django creates a new database for testing. SQLAlchemy needs to connect to the test database
        super().setUpClass()
        _engine = sqlalchemy.create_engine(settings.SA_TEST_DB_URL, pool_recycle=settings.SA_POOL_RECYCLE,
                                  connect_args={'cursorclass': SSCursor})

        cls.engine = _engine
        Session = orm.sessionmaker(bind=_engine)

        cls.test_session_context = models.make_session_context(Session)

        @event.listens_for(_engine, 'before_cursor_execute', retval=True)
        # Listen to low-level cursor execution events. Just before query is executed by SQLAlchemy, run it instead
        # by Django, and then return a wrapped sql statement which will return the same result set.
        def run_django_query(conn, cursor, statement, parameters, context, executemany):
            django_cursor = connection.cursor()
            # Get MySQL Compatible compiled query.
            django_cursor.execute(statement, parameters)
            result_set = django_cursor.fetchall()
            columns = django_cursor.description
            django_cursor.close()
            # SqlAlchemy needs to find columns back in the rows, hence adding label to columns
            selects = [sqlalchemy.select([sqlalchemy.literal(column).label(columns[idx][0]) for idx, column in enumerate(row)]) for row
                       in result_set]
            # union all instead of union because rows can be duplicated in the original query,
            # but still need to preserve the duplication
            unioned = sqlalchemy.union_all(*selects)
            # Tests will fail when migrated to different background. TODO: Auto-detect dialects
            final_query = str(unioned.compile(compile_kwargs={"literal_binds": True, }, dialect=mysql.dialect()))
            return final_query, ()



class SQLAlchemySetupTest(SQLAlchemySetup):

    def test_collection_object_count(self):

        with SQLAlchemySetupTest.test_session_context() as session:

            co_aliased = orm.aliased(models.CollectionObject)
            sa_collection_objects = list(session.query(co_aliased._id).filter(co_aliased.collectionMemberId == self.collection.id))
            sa_ids = [_id for (_id, ) in sa_collection_objects]
            ids = [co.id for co in self.collectionobjects]

            self.assertEqual(sa_ids, ids)
            min_co_id, = session.query(sqlalchemy.sql.func.min(co_aliased.collectionObjectId)).filter(co_aliased.collectionMemberId == self.collection.id).first()

            self.assertEqual(min_co_id, min(ids))

            max_co_id, = session.query(sqlalchemy.sql.func.max(co_aliased.collectionObjectId)).filter(co_aliased.collectionMemberId == self.collection.id).first()

            self.assertEqual(max_co_id, max(ids))


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

@skip("These tests are out of date.")
class StoredQueriesTests(ApiTests):
    # def setUp(self):
    #     super(StoredQueriesTests, self).setUp()
    #     self.q = models.Spquery.objects.create(
    #         contextname='CollectionObject',
    #         contexttableid=1,
    #         name='test query',
    #         specifyuser=self.specifyuser)

    def test_id_field(self):
        self.assertEqual(models.Taxon._id, 'taxonId')

    def test_basic(self):
        fs = FieldSpec(field_name='lastName',
                       date_part=None,
                       root_table=models.CollectionObject,
                       join_path=[('cataloger', models.Agent)],
                       is_relation=False,
                       op_num=1,
                       value='Bentley',
                       negate=False,
                       display=True,
                       sort_type=0,
                       spqueryfieldid=None)

        q, f = fs.add_to_query(orm.Query(models.CollectionObject.collectionObjectId))
        sql = str(q)
        self.assertTrue('WHERE agent_1."LastName" = :LastName_1' in sql)

    def test_year_equal_predicate(self):
        fs = FieldSpec(field_name='startDate',
                       date_part='year',
                       root_table=models.CollectionObject,
                       join_path=[('collectingEvent', models.CollectingEvent)],
                       is_relation=False,
                       op_num=1,
                       value='2000',
                       negate=False,
                       display=True,
                       sort_type=0,
                       spqueryfieldid=None)

        q, f = fs.add_to_query(orm.Query(models.CollectionObject.collectionObjectId))
        sql = str(q)
        self.assertTrue('WHERE EXTRACT(year FROM collectingevent_1."StartDate") = :param_1' in sql)

    def test_tree_predicate(self):
        fs = FieldSpec(field_name='Family',
                       date_part=None,
                       root_table=models.Taxon,
                       join_path=[],
                       is_relation=False,
                       op_num=1,
                       value='Percidae',
                       negate=False,
                       display=True,
                       sort_type=0,
                       spqueryfieldid=None)

        q, f = fs.add_to_query(orm.Query(models.Taxon.taxonId))
        sql = str(q)
        self.assertEqual(sql,
                         'SELECT taxon."TaxonID" AS "taxon_TaxonID" \n'
                         'FROM taxon '
                         'JOIN taxon AS taxon_1 '
                         'ON taxon."TaxonTreeDefID" = taxon_1."TaxonTreeDefID" '
                         'AND taxon."NodeNumber" BETWEEN taxon_1."NodeNumber" AND taxon_1."HighestChildNodeNumber" '
                         'JOIN taxontreedefitem AS taxontreedefitem_1 '
                         'ON taxontreedefitem_1."TaxonTreeDefItemID" = taxon_1."TaxonTreeDefItemID" \n'
                         'WHERE taxontreedefitem_1."Name" = :Name_1 AND taxon_1."Name" = :Name_2')

    # def test_month_between_predicate(self):
    #     self.q.fields.create(
    #         fieldname='startDate',
    #         isdisplay=True,
    #         isnot=False,
    #         operstart=9,
    #         position=0,
    #         sorttype=0,
    #         startvalue='3,9',
    #         stringid='1,10.collectingevent.startDateNumericMonth',
    #         tablelist='1,10')

    #     qs = execute(self.q)
    #     sql, params = qs.query.sql_with_params()
    #     self.assertTrue('WHERE (MONTH("collectingevent"."StartDate") BETWEEN %s and %s AND '
    #                     '"collectingevent"."StartDatePrecision" IN (%s, %s))' in sql)
    #     self.assertEqual(params, (3, 9, 1, 2))

    def test_date_part_filter_combined(self):
        fs1 = FieldSpec(field_name='startDate',
                        date_part='year',
                        root_table=models.CollectionObject,
                        join_path=[('collectingEvent', models.CollectingEvent)],
                        is_relation=False,
                        op_num=1,
                        value='2000',
                        negate=False,
                       display=True,
                       sort_type=0,
                       spqueryfieldid=None)

        fs2 = FieldSpec(field_name='lastName',
                        date_part=None,
                        root_table=models.CollectionObject,
                        join_path=[('cataloger', models.Agent)],
                        is_relation=False,
                        op_num=1,
                        value='Bentley',
                        negate=False,
                       display=True,
                       sort_type=0,
                       spqueryfieldid=None)

        q = orm.Query(models.CollectionObject.collectionObjectId)
        q, f1 = fs1.add_to_query(q)
        q, f2 = fs2.add_to_query(q)
        sql = str(q)
        self.assertTrue('agent_1."LastName" = :LastName_1' in sql)
        self.assertTrue('EXTRACT(year FROM collectingevent_1."StartDate") = :param_1' in sql)

    # def test_year_between_predicate(self):
    #     self.q.fields.create(
    #         fieldname='startDate',
    #         isdisplay=True,
    #         isnot=False,
    #         operstart=9,
    #         position=0,
    #         sorttype=0,
    #         startvalue='2000,1990',
    #         stringid='1,10.collectingevent.startDateNumericYear',
    #         tablelist='1,10')

    #     qs = execute(self.q)
    #     sql, params = qs.query.sql_with_params()
    #     self.assertTrue('WHERE YEAR("collectingevent"."StartDate") BETWEEN %s and %s' in sql)
    #     self.assertEqual(params, (2000, 1990))

    # def test_year_in_predicate(self):
    #     self.q.fields.create(
    #         fieldname='startDate',
    #         isdisplay=True,
    #         isnot=False,
    #         operstart=10,
    #         position=0,
    #         sorttype=0,
    #         startvalue='2000,1990,1980',
    #         stringid='1,10.collectingevent.startDateNumericYear',
    #         tablelist='1,10')

    #     qs = execute(self.q)
    #     sql, params = qs.query.sql_with_params()
    #     self.assertTrue('WHERE YEAR("collectingevent"."StartDate") IN (%s, %s, %s)' in sql)
    #     self.assertEqual(params, (2000, 1990, 1980))

    # def test_year_empty_predicate(self):
    #     self.q.fields.create(
    #         fieldname='startDate',
    #         isdisplay=True,
    #         isnot=False,
    #         operstart=12,
    #         position=0,
    #         sorttype=0,
    #         startvalue='ignored',
    #         stringid='1,10.collectingevent.startDateNumericYear',
    #         tablelist='1,10')

    #     qs = execute(self.q)
    #     sql, params = qs.query.sql_with_params()
    #     self.assertTrue('WHERE ("collectingevent"."StartDate" IS NULL)' in sql)

    # def test_month_empty_predicate(self):
    #     self.q.fields.create(
    #         fieldname='startDate',
    #         isdisplay=True,
    #         isnot=False,
    #         operstart=12,
    #         position=0,
    #         sorttype=0,
    #         startvalue='ignored',
    #         stringid='1,10.collectingevent.startDateNumericMonth',
    #         tablelist='1,10')

    #     qs = execute(self.q)
    #     sql, params = qs.query.sql_with_params()
    #     self.assertTrue('WHERE ("collectingevent"."StartDate" IS NULL OR '
    #                     'NOT (("collectingevent"."StartDatePrecision" IN (%s, %s) AND '
    #                     'NOT ("collectingevent"."CollectingEventID" IS NULL) AND '
    #                     '"collectingevent"."StartDatePrecision" IS NOT NULL)))' in sql)
    #     self.assertEqual(params, (1,2))

    # def test_day_empty_predicate(self):
    #     self.q.fields.create(
    #         fieldname='startDate',
    #         isdisplay=True,
    #         isnot=False,
    #         operstart=12,
    #         position=0,
    #         sorttype=0,
    #         startvalue='ignored',
    #         stringid='1,10.collectingevent.startDateNumericDay',
    #         tablelist='1,10')

    #     qs = execute(self.q)
    #     sql, params = qs.query.sql_with_params()
    #     self.assertTrue('WHERE ("collectingevent"."StartDate" IS NULL OR '
    #                     'NOT (("collectingevent"."StartDatePrecision" = %s  AND '
    #                     'NOT ("collectingevent"."CollectingEventID" IS NULL) AND '
    #                     '"collectingevent"."StartDatePrecision" IS NOT NULL)))' in sql)
    #     self.assertEqual(params, (1,))

    # def test_aliased_columns_year(self):
    #     self.q.fields.create(
    #         fieldname='startDate',
    #         isdisplay=True,
    #         isnot=False,
    #         operstart=1,
    #         position=0,
    #         sorttype=0,
    #         startvalue='2000',
    #         stringid='1,9-determinations.determination.determinedDateNumericYear',
    #         tablelist='1,9-determinations')

    #     self.q.fields.create(
    #         fieldname='startDate',
    #         isdisplay=True,
    #         isnot=False,
    #         operstart=1,
    #         position=0,
    #         sorttype=0,
    #         startvalue='1990',
    #         stringid='1,10,1-collectionObjects,9-determinations.determination.determinedDateNumericYear',
    #         tablelist='1,10,1-collectionObjects,9-determinations')

    #     qs = execute(self.q)
    #     sql, params = qs.query.sql_with_params()
    #     self.assertTrue('WHERE (YEAR("determination"."DeterminedDate") = %s  AND '
    #                     'YEAR(T5."DeterminedDate") = %s )' in sql)
    #     self.assertEqual(params, (2000, 1990))

    # def test_aliased_columns_month(self):
    #     self.q.fields.create(
    #         fieldname='startDate',
    #         isdisplay=True,
    #         isnot=False,
    #         operstart=1,
    #         position=0,
    #         sorttype=0,
    #         startvalue='7',
    #         stringid='1,9-determinations.determination.determinedDateNumericMonth',
    #         tablelist='1,9-determinations')

    #     self.q.fields.create(
    #         fieldname='startDate',
    #         isdisplay=True,
    #         isnot=False,
    #         operstart=1,
    #         position=0,
    #         sorttype=0,
    #         startvalue='8',
    #         stringid='1,10,1-collectionObjects,9-determinations.determination.determinedDateNumericMonth',
    #         tablelist='1,10,1-collectionObjects,9-determinations')

    #     qs = execute(self.q)
    #     sql, params = qs.query.sql_with_params()
    #     self.assertTrue('WHERE ((MONTH("determination"."DeterminedDate") = %s  AND '
    #                     '"determination"."DeterminedDatePrecision" IN (%s, %s)) AND '
    #                     '(MONTH(T5."DeterminedDate") = %s  AND '
    #                     'T5."DeterminedDatePrecision" IN (%s, %s)))' in sql)
    #     self.assertEqual(params, (7, 1, 2, 8, 1, 2))


def test_sqlalchemy_model(datamodel_table):
    table_errors = {
        'not_found': [],  # Fields / Relationships not found
        'incorrect_direction': {},  # Relationship direct not correct
        'incorrect_columns': {},  # Relationship columns not correct
        'incorrect_table': {}  # Relationship related model not correct
    }
    orm_table = orm.aliased(getattr(models, datamodel_table.name))
    known_fields = datamodel_table.all_fields

    for field in known_fields:

        in_sql = getattr(orm_table, field.name, None) or getattr(orm_table, field.name.lower(), None)

        if in_sql is None:
            table_errors['not_found'].append(field.name)
            continue

        if not field.is_relationship:
            continue

        sa_relationship = inspect(in_sql).property

        sa_direction = sa_relationship.direction.name.lower()
        datamodel_direction = field.type.replace('-', '').lower()

        if sa_direction != datamodel_direction:
            table_errors['incorrect_direction'][field.name] = [sa_direction, datamodel_direction]
            print(f"Incorrect direction: {field.name} {sa_direction} {datamodel_direction}")

        remote_sql_table = sa_relationship.target.name.lower()
        remote_datamodel_table = field.relatedModelName.lower()

        if remote_sql_table.lower() != remote_datamodel_table:
            # Check case where the relation model's name is different from the DB table name
            remote_sql_table = sa_relationship.mapper._log_desc.split('(')[1].split('|')[0].lower()
            if remote_sql_table.lower() != remote_datamodel_table:
                table_errors['incorrect_table'][field.name] = [remote_sql_table, remote_datamodel_table]
                print(f"Incorrect table: {field.name} {remote_sql_table} {remote_datamodel_table}")

        sa_column = list(sa_relationship.local_columns)[0].name
        if sa_column.lower() != (
        datamodel_table.idColumn.lower() if not getattr(field, 'column', None) else field.column.lower()):
            table_errors['incorrect_columns'][field.name] = [sa_column, datamodel_table.idColumn.lower(),
                                                             getattr(field, 'column', None)]
            print(f"Incorrect columns: {field.name} {sa_column} {datamodel_table.idColumn.lower()} {getattr(field, 'column', None)}")

    return {key: value for key, value in table_errors.items() if len(value) > 0}

class SQLAlchemyModelTest(TestCase):
    def test_sqlalchemy_model_errors(self):
        for table in spmodels.datamodel.tables:
            table_errors = test_sqlalchemy_model(table)
            self.assertTrue(len(table_errors) == 0 or table.name in expected_errors, f"Did not find {table.name}. Has errors: {table_errors}")
            if 'not_found' in table_errors:
                table_errors['not_found'] = sorted(table_errors['not_found'])
            if table_errors:
                self.assertDictEqual(table_errors, expected_errors[table.name])

STRINGID_LIST = [
    # (stringid, isrelfld)
    ("1,10,110-collectingEventAttachments,41.attachment.attachment", 1),
    ("1,10,110-collectingEventAttachments,41.attachment.copyrightHolder", 0),
    ("1,10,110-collectingEventAttachments,41.attachment.credit", 0),
    ("1,10,110-collectingEventAttachments,41.attachment.fileCreatedDate", 0),
    ("1,10,110-collectingEventAttachments,41.attachment.guid", 0),
    ("1,10,110-collectingEventAttachments,41.attachment.license", 0),
    ("1,10,110-collectingEventAttachments,41.attachment.licenseLogoUrl", 0),
    ("1,10,110-collectingEventAttachments,41.attachment.mimeType", 0),
    ("1,10,110-collectingEventAttachments,41.attachment.subjectOrientation", 0),
    ("1,10,110-collectingEventAttachments,41.attachment.subtype", 0),
    ("1,10,110-collectingEventAttachments,41.attachment.title", 0),
    ("1,10,110-collectingEventAttachments,41.attachment.type", 0),
    ("1,10,2,123-geoCoordDetails,5-geoRefDetBy.agent.geoRefDetBy", 1),
    ("1,10,2,123-geoCoordDetails.geocoorddetail.geoRefDetDate", 0),
    ("1,10,2,123-geoCoordDetails.geocoorddetail.geoRefRemarks", 0),
    ("1,10,2,123-geoCoordDetails.geocoorddetail.maxUncertaintyEst", 0),
    ("1,10,2,124-localityDetails.localitydetail.island", 0),
    ("1,10,2,124-localityDetails.localitydetail.islandGroup", 0),
    ("1,10,2,124-localityDetails.localitydetail.waterBody", 0),
    ("1,10,2,124-localitydetails.localitydetail.waterBody", 0),
    ("1,10,2,3.geography.Continent", 0),
    ("1,10,2,3.geography.Country", 0),
    ("1,10,2,3.geography.County", 0),
    ("1,10,2,3.geography.State", 0),
    ("1,10,2,3.geography.geography", 1),
    ("1,10,2.locality.datum", 0),
    ("1,10,2.locality.elevationMethod", 0),
    ("1,10,2.locality.latLongMethod", 0),
    ("1,10,2.locality.latitude1", 0),
    ("1,10,2.locality.localityName", 0),
    ("1,10,2.locality.longitude1", 0),
    ("1,10,2.locality.remarks", 0),
    ("1,10,30-collectors,5.agent.lastName", 0),
    ("1,10,30-collectors.collector.collectors", 1),
    ("1,10,87.collectingtrip.collectingTrip", 1),
    ("1,10,92.collectingeventattribute.number12", 0),
    ("1,10,92.collectingeventattribute.number13", 0),
    ("1,10,92.collectingeventattribute.text1", 0),
    ("1,10,92.collectingeventattribute.text2", 0),
    ("1,10,92.collectingeventattribute.text3", 0),
    ("1,10.collectingevent.collectingEvent", 1),
    ("1,10.collectingevent.endDate", 0),
    ("1,10.collectingevent.endTime", 0),
    ("1,10.collectingevent.method", 0),
    ("1,10.collectingevent.remarks", 0),
    ("1,10.collectingevent.startDate", 0),
    ("1,10.collectingevent.startDateNumericDay", 0),
    ("1,10.collectingevent.startDateNumericMonth", 0),
    ("1,10.collectingevent.startDateNumericYear", 0),
    ("1,10.collectingevent.startTime", 0),
    ("1,10.collectingevent.stationFieldNumber", 0),
    ("1,10.collectingevent.text1", 0),
    ("1,10.collectingevent.text2", 0),
    ("1,10.collectingevent.text3", 0),
    ("1,10.collectingevent.text5", 0),
    ("1,111-collectionObjectAttachments,41.attachment.attachment", 1),
    ("1,111-collectionObjectAttachments,41.attachment.copyrightHolder", 0),
    ("1,111-collectionObjectAttachments,41.attachment.credit", 0),
    ("1,111-collectionObjectAttachments,41.attachment.fileCreatedDate", 0),
    ("1,111-collectionObjectAttachments,41.attachment.guid", 0),
    ("1,111-collectionObjectAttachments,41.attachment.license", 0),
    ("1,111-collectionObjectAttachments,41.attachment.licenseLogoUrl", 0),
    ("1,111-collectionObjectAttachments,41.attachment.mimeType", 0),
    ("1,111-collectionObjectAttachments,41.attachment.origFilename", 0),
    ("1,111-collectionObjectAttachments,41.attachment.subjectOrientation", 0),
    ("1,111-collectionObjectAttachments,41.attachment.subtype", 0),
    ("1,111-collectionObjectAttachments,41.attachment.title", 0),
    ("1,111-collectionObjectAttachments,41.attachment.type", 0),
    ("1,111-collectionObjectAttachments.collectionobjectattachment.collectionObjectAttachments", 1),
    ("1,121-dnaSequences,5-sequencer.agent.sequencer", 1),
    ("1,121-dnaSequences.dnasequence.boldBarcodeId", 0),
    ("1,121-dnaSequences.dnasequence.dnaSequences", 1),
    ("1,121-dnaSequences.dnasequence.moleculeType", 0),
    ("1,121-dnaSequences.dnasequence.text1", 0),
    ("1,121-dnaSequences.dnasequence.text2", 0),
    ("1,121-dnaSequences.dnasequence.timestampCreated", 0),
    ("1,155-voucherrelationships.voucherrelationship.voucherRelationships", 1),
    ("1,23,26,96,94.institution.altName", 0),
    ("1,23,26,96,94.institution.code", 0),
    ("1,23,26,96,94.institution.copyright", 0),
    ("1,23,26,96,94.institution.termsOfUse", 0),
    ("1,23.collection.code", 0),
    ("1,23.collection.collectionType", 0),
    ("1,23.collection.description", 0),
    ("1,23.collection.scope", 0),
    ("1,29-collectionObjectCitations,69,17-authors.author.authors", 1),
    ("1,29-collectionObjectCitations,69,51.journal.journalName", 0),
    ("1,29-collectionObjectCitations,69.referencework.guid", 0),
    ("1,29-collectionObjectCitations,69.referencework.pages", 0),
    ("1,29-collectionObjectCitations,69.referencework.placeOfPublication", 0),
    ("1,29-collectionObjectCitations,69.referencework.publisher", 0),
    ("1,29-collectionObjectCitations,69.referencework.referenceWorkType", 0),
    ("1,29-collectionObjectCitations,69.referencework.text1", 0),
    ("1,29-collectionObjectCitations,69.referencework.text2", 0),
    ("1,29-collectionObjectCitations,69.referencework.title", 0),
    ("1,29-collectionObjectCitations,69.referencework.url", 0),
    ("1,29-collectionObjectCitations,69.referencework.volume", 0),
    ("1,29-collectionObjectCitations,69.referencework.workDate", 0),
    ("1,29-collectionObjectCitations.collectionobjectcitation.collectionObjectCitations", 1),
    ("1,5-cataloger.agent.lastName", 0),
    ("1,63-preparations,132-giftPreparations,131.gift.giftNumber", 0),
    ("1,63-preparations,132-giftpreparations,131.gift.giftNumber", 0),
    ("1,63-preparations,54-loanpreparations,52.loan.loanNumber", 0),
    ("1,63-preparations,54-loanpreparations.loanpreparation.isResolved", 0),
    ("1,63-preparations,58.storage.Aisle", 0),
    ("1,63-preparations,58.storage.Cabinet", 0),
    ("1,63-preparations,58.storage.storage", 1),
    ("1,63-preparations,65.preptype.name", 0),
    ("1,63-preparations.preparation.countAmt", 0),
    ("1,63-preparations.preparation.preparations", 1),
    ("1,63-preparations.preparation.remarks", 0),
    ("1,63-preparations.preparation.sampleNumber", 0),
    ("1,63-preparations.preparation.storageLocation", 0),
    ("1,63-preparations.preparation.text1", 0),
    ("1,63-preparations.preparation.text2", 0),
    ("1,63-preparations.preparation.yesNo1", 0),
    ("1,66-projects.project.projects", 1),
    ("1,9-determinations,4,77-definitionItem.taxontreedefitem.name", 0),
    ("1,9-determinations,4-preferredTaxon.taxon.Class", 0),
    ("1,9-determinations,4-preferredTaxon.taxon.Family", 0),
    ("1,9-determinations,4-preferredTaxon.taxon.Genus", 0),
    ("1,9-determinations,4-preferredTaxon.taxon.Kingdom", 0),
    ("1,9-determinations,4-preferredTaxon.taxon.Order", 0),
    ("1,9-determinations,4-preferredTaxon.taxon.Phylum", 0),
    ("1,9-determinations,4-preferredTaxon.taxon.Species", 0),
    ("1,9-determinations,4-preferredTaxon.taxon.Subspecies", 0),
    ("1,9-determinations,4-preferredTaxon.taxon.author", 0),
    ("1,9-determinations,4-preferredTaxon.taxon.fullName", 0),
    ("1,9-determinations,4-preferredtaxon.taxon.fullName", 0),
    ("1,9-determinations,4.taxon.Class", 0),
    ("1,9-determinations,4.taxon.Family", 0),
    ("1,9-determinations,4.taxon.Genus", 0),
    ("1,9-determinations,4.taxon.Kingdom", 0),
    ("1,9-determinations,4.taxon.Order", 0),
    ("1,9-determinations,4.taxon.Phylum", 0),
    ("1,9-determinations,4.taxon.Species", 0),
    ("1,9-determinations,4.taxon.Subspecies", 0),
    ("1,9-determinations,4.taxon.commonName", 0),
    ("1,9-determinations,4.taxon.fullName", 0),
    ("1,9-determinations,4.taxon.name", 0),
    ("1,9-determinations,5-determiner.agent.determiner", 1),
    ("1,9-determinations,5-determiner.agent.lastName", 0),
    ("1,9-determinations.determination.determinations", 1),
    ("1,9-determinations.determination.determinedDate", 0),
    ("1,9-determinations.determination.isCurrent", 0),
    ("1,9-determinations.determination.remarks", 0),
    ("1,9-determinations.determination.typeStatusName", 0),
    ("1,93.collectionobjectattribute.text1", 0),
    ("1,93.collectionobjectattribute.text10", 0),
    ("1,93.collectionobjectattribute.text11", 0),
    ("1,93.collectionobjectattribute.text12", 0),
    ("1,93.collectionobjectattribute.text13", 0),
    ("1,93.collectionobjectattribute.text14", 0),
    ("1,93.collectionobjectattribute.text2", 0),
    ("1,93.collectionobjectattribute.text3", 0),
    ("1,93.collectionobjectattribute.text5", 0),
    ("1,93.collectionobjectattribute.text8", 0),
    ("1,99-leftSideRels.collectionrelationship.leftSideRels", 1),
    ("1,99-rightSideRels,1-leftSide,10.collectingevent.collectingEvent", 1),
    ("1,99-rightSideRels,1-leftSide,63-preparations,65.preptype.name", 0),
    ("1,99-rightSideRels,1-leftSide,63-preparations.preparation.text2", 0),
    ("1,99-rightSideRels,1-leftSide,9-determinations,4.taxon.Family", 0),
    ("1,99-rightSideRels,1-leftSide,9-determinations,4.taxon.Genus", 0),
    ("1,99-rightSideRels,1-leftSide,9-determinations,4.taxon.Species", 0),
    ("1,99-rightSideRels,1-leftSide,9-determinations.determination.isCurrent", 0),
    ("1,99-rightSideRels,1-leftSide.collectionobject.catalogNumber", 0),
    ("1,99-rightSideRels,1-leftSide.collectionobject.guid", 0),
    ("1.collectionobject.altCatalogNumber", 0),
    ("1.collectionobject.catalogNumber", 0),
    ("1.collectionobject.catalogedDate", 0),
    ("1.collectionobject.countAmt", 0),
    ("1.collectionobject.fieldNumber", 0),
    ("1.collectionobject.guid", 0),
    ("1.collectionobject.remarks", 0),
    ("1.collectionobject.reservedText", 0),
    ("1.collectionobject.text1", 0),
    ("1.collectionobject.timestampModified", 0),
    ("10,110-collectingEventAttachments,41.attachment.attachmentLocation", 0),
    ("10,2,124-localitydetails.localitydetail.drainage", 0),
    ("10,2,124-localitydetails.localitydetail.text1", 0),
    ("10,2,124-localitydetails.localitydetail.waterBody", 0),
    ("10,2,3.geography.Country", 0),
    ("10,2,3.geography.State", 0),
    ("10,2,3.geography.geography", 1),
    ("10,2.locality.latitude1", 0),
    ("10,2.locality.latitude2", 0),
    ("10,2.locality.localityName", 0),
    ("10,2.locality.longitude1", 0),
    ("10,2.locality.longitude2", 0),
    ("10,30-collectors,5.agent.lastName", 0),
    ("10,30-collectors.collector.collectors", 1),
    ("10,92.collectingeventattribute.text1", 0),
    ("10,92.collectingeventattribute.text2", 0),
    ("10,92.collectingeventattribute.text4", 0),
    ("10,92.collectingeventattribute.text5", 0),
    ("10,92.collectingeventattribute.text7", 0),
    ("10.collectingevent.endDate", 0),
    ("10.collectingevent.endTime", 0),
    ("10.collectingevent.method", 0),
    ("10.collectingevent.startDate", 0),
    ("10.collectingevent.startDateNumericDay", 0),
    ("10.collectingevent.startDateNumericMonth", 0),
    ("10.collectingevent.startDateNumericYear", 0),
    ("10.collectingevent.startTime", 0),
    ("10.collectingevent.stationFieldNumber", 0),
    ("10.collectingevent.text1", 0),
    ("10.collectingevent.text2", 0),
    ("10.collectingevent.text3", 0),
    ("131,132-giftPreparations,63,1,10,2,124-localityDetails.localitydetail.drainage", 0),
    ("131,132-giftPreparations,63,1,10,2,3.geography.Continent", 0),
    ("131,132-giftPreparations,63,1,10,2,3.geography.Country", 0),
    ("131,132-giftPreparations,63,1,10,2,3.geography.County", 0),
    ("131,132-giftPreparations,63,1,10,2,3.geography.State", 0),
    ("131,132-giftPreparations,63,1,10,2,3.geography.fullName", 0),
    ("131,132-giftPreparations,63,1,10,2,3.geography.isCurrent", 0),
    ("131,132-giftPreparations,63,1,10,2.locality.latitude1", 0),
    ("131,132-giftPreparations,63,1,10,2.locality.locality", 1),
    ("131,132-giftPreparations,63,1,10,2.locality.localityName", 0),
    ("131,132-giftPreparations,63,1,10,2.locality.longitude1", 0),
    ("131,132-giftPreparations,63,1,10.collectingevent.startDate", 0),
    ("131,132-giftPreparations,63,1,10.collectingevent.startDateNumericDay", 0),
    ("131,132-giftPreparations,63,1,10.collectingevent.startDateNumericMonth", 0),
    ("131,132-giftPreparations,63,1,10.collectingevent.startDateNumericYear", 0),
    ("131,132-giftPreparations,63,1,10.collectingevent.stationFieldNumber", 0),
    ("131,132-giftPreparations,63,1,9-determinations,4.taxon.Genus", 0),
    ("131,132-giftPreparations,63,1,9-determinations,4.taxon.Species", 0),
    ("131,132-giftPreparations,63,1,9-determinations,4.taxon.fullName", 0),
    ("131,132-giftPreparations,63,1,9-determinations.determination.isCurrent", 0),
    ("131,132-giftPreparations,63,1.collectionobject.catalogNumber", 0),
    ("131,132-giftPreparations,63,1.collectionobject.catalogedDate", 0),
    ("131,132-giftPreparations,63,1.collectionobject.catalogedDateNumericDay", 0),
    ("131,132-giftPreparations,63,1.collectionobject.catalogedDateNumericMonth", 0),
    ("131,132-giftPreparations,63,1.collectionobject.catalogedDateNumericYear", 0),
    ("131,132-giftPreparations,63,1.collectionobject.fieldNumber", 0),
    ("131,132-giftPreparations,63,54-loanPreparations.loanpreparation.outComments", 0),
    ("131,132-giftPreparations,63,65.preptype.name", 0),
    ("131,132-giftPreparations,63,65.preptype.prepType", 1),
    ("131,132-giftPreparations,63.preparation.countAmt", 0),
    ("131,132-giftPreparations.giftpreparation.quantity", 0),
    ("131,133-giftAgents,5,8-addresses.address.address", 0),
    ("131,133-giftAgents,5,8-addresses.address.address2", 0),
    ("131,133-giftAgents,5,8-addresses.address.city", 0),
    ("131,133-giftAgents,5,8-addresses.address.country", 0),
    ("131,133-giftAgents,5,8-addresses.address.isCurrent", 0),
    ("131,133-giftAgents,5,8-addresses.address.postalCode", 0),
    ("131,133-giftAgents,5,8-addresses.address.state", 0),
    ("131,133-giftAgents,5.agent.agent", 1),
    ("131,133-giftAgents,5.agent.email", 0),
    ("131,133-giftAgents,5.agent.firstName", 0),
    ("131,133-giftAgents,5.agent.lastName", 0),
    ("131,133-giftAgents,5.agent.middleInitial", 0),
    ("131,133-giftAgents.giftagent.role", 0),
    ("131,71-shipments,5-shippedBy.agent.firstName", 0),
    ("131,71-shipments,5-shippedBy.agent.lastName", 0),
    ("131,71-shipments,5-shippedBy.agent.middleInitial", 0),
    ("131,71-shipments,5-shippedTo,8-addresses.address.address", 0),
    ("131,71-shipments,5-shippedTo,8-addresses.address.address2", 0),
    ("131,71-shipments,5-shippedTo,8-addresses.address.city", 0),
    ("131,71-shipments,5-shippedTo,8-addresses.address.country", 0),
    ("131,71-shipments,5-shippedTo,8-addresses.address.phone1", 0),
    ("131,71-shipments,5-shippedTo,8-addresses.address.postalCode", 0),
    ("131,71-shipments,5-shippedTo,8-addresses.address.state", 0),
    ("131,71-shipments,5-shippedTo.agent.email", 0),
    ("131,71-shipments,5-shippedTo.agent.firstName", 0),
    ("131,71-shipments,5-shippedTo.agent.lastName", 0),
    ("131,71-shipments.shipment.numberOfPackages", 0),
    ("131,71-shipments.shipment.shipmentDateNumericDay", 0),
    ("131,71-shipments.shipment.shipmentDateNumericMonth", 0),
    ("131,71-shipments.shipment.shipmentDateNumericYear", 0),
    ("131,71-shipments.shipment.shipmentMethod", 0),
    ("131.gift.giftDate", 0),
    ("131.gift.giftDateNumericDay", 0),
    ("131.gift.giftDateNumericMonth", 0),
    ("131.gift.giftDateNumericYear", 0),
    ("131.gift.giftNumber", 0),
    ("131.gift.remarks", 0),
    ("131.gift.text1", 0),
    ("131.gift.text2", 0),
    ("18,19-borrowAgents,5,8-addresses.address.address", 0),
    ("18,19-borrowAgents,5,8-addresses.address.address2", 0),
    ("18,19-borrowAgents,5,8-addresses.address.city", 0),
    ("18,19-borrowAgents,5,8-addresses.address.country", 0),
    ("18,19-borrowAgents,5,8-addresses.address.postalCode", 0),
    ("18,19-borrowAgents,5,8-addresses.address.state", 0),
    ("18,19-borrowAgents,5.agent.agent", 1),
    ("18,19-borrowAgents,5.agent.firstName", 0),
    ("18,19-borrowAgents,5.agent.lastName", 0),
    ("18,19-borrowAgents.borrowagent.role", 0),
    ("18,20-borrowMaterials,21-borrowReturnMaterials.borrowreturnmaterial.remarks", 0),
    ("18,20-borrowMaterials,21-borrowReturnMaterials.borrowreturnmaterial.returnedDate", 0),
    ("18,20-borrowMaterials,21-borrowReturnMaterials.borrowreturnmaterial.returnedDateNumericDay", 0),
    ("18,20-borrowMaterials,21-borrowReturnMaterials.borrowreturnmaterial.returnedDateNumericMonth", 0),
    ("18,20-borrowMaterials,21-borrowReturnMaterials.borrowreturnmaterial.returnedDateNumericYear", 0),
    ("18,20-borrowMaterials.borrowmaterial.description", 0),
    ("18,20-borrowMaterials.borrowmaterial.inComments", 0),
    ("18,20-borrowMaterials.borrowmaterial.materialNumber", 0),
    ("18,20-borrowMaterials.borrowmaterial.outComments", 0),
    ("18,20-borrowMaterials.borrowmaterial.quantity", 0),
    ("18,20-borrowMaterials.borrowmaterial.quantityReturned", 0),
    ("18,71-shipments,5-shippedBy.agent.email", 0),
    ("18,71-shipments,5-shippedBy.agent.firstName", 0),
    ("18,71-shipments,5-shippedBy.agent.lastName", 0),
    ("18,71-shipments,5-shippedBy.agent.middleInitial", 0),
    ("18,71-shipments,5-shippedTo,8-addresses.address.address", 0),
    ("18,71-shipments,5-shippedTo,8-addresses.address.address2", 0),
    ("18,71-shipments,5-shippedTo,8-addresses.address.city", 0),
    ("18,71-shipments,5-shippedTo,8-addresses.address.country", 0),
    ("18,71-shipments,5-shippedTo,8-addresses.address.phone1", 0),
    ("18,71-shipments,5-shippedTo,8-addresses.address.postalCode", 0),
    ("18,71-shipments,5-shippedTo,8-addresses.address.roomOrBuilding", 0),
    ("18,71-shipments,5-shippedTo,8-addresses.address.state", 0),
    ("18,71-shipments,5-shippedTo.agent.email", 0),
    ("18,71-shipments,5-shippedTo.agent.firstName", 0),
    ("18,71-shipments,5-shippedTo.agent.lastName", 0),
    ("18,71-shipments,5-shippedTo.agent.middleInitial", 0),
    ("18,71-shipments.shipment.numberOfPackages", 0),
    ("18,71-shipments.shipment.shipmentDate", 0),
    ("18,71-shipments.shipment.shipmentDateNumericDay", 0),
    ("18,71-shipments.shipment.shipmentDateNumericMonth", 0),
    ("18,71-shipments.shipment.shipmentDateNumericYear", 0),
    ("18,71-shipments.shipment.shipmentMethod", 0),
    ("18.borrow.invoiceNumber", 0),
    ("18.borrow.remarks", 0),
    ("4,77-definitionItem.taxontreedefitem.name", 0),
    ("4,9-determinations,1.collectionobject.catalogNumber", 0),
    ("4,9-determinations.determination.isCurrent", 0),
    ("4.taxon.", 0),
    ("4.taxon.Species", 0),
    ("4.taxon.author", 0),
    ("4.taxon.fullName", 0),
    ("4.taxon.taxonId", 0),
    ("5.agent.firstName", 0),
    ("5.agent.lastName", 0),
    ("5.agent.middleInitial", 0),
    ("52,114-loanattachments,41.attachment.origFilename", 0),
    ("52,53-loanAgents,5,8-addresses.address.address", 0),
    ("52,53-loanAgents,5,8-addresses.address.address2", 0),
    ("52,53-loanAgents,5,8-addresses.address.city", 0),
    ("52,53-loanAgents,5,8-addresses.address.country", 0),
    ("52,53-loanAgents,5,8-addresses.address.postalCode", 0),
    ("52,53-loanAgents,5,8-addresses.address.roomOrBuilding", 0),
    ("52,53-loanAgents,5,8-addresses.address.state", 0),
    ("52,53-loanAgents,5.agent.email", 0),
    ("52,53-loanAgents,5.agent.firstName", 0),
    ("52,53-loanAgents,5.agent.lastName", 0),
    ("52,53-loanAgents,5.agent.middleInitial", 0),
    ("52,53-loanAgents.loanagent.loanAgents", 1),
    ("52,53-loanAgents.loanagent.role", 0),
    ("52,54-loanPreparations,63,1,10,2,124-localityDetails.localitydetail.drainage", 0),
    ("52,54-loanPreparations,63,1,10,2,3.geography.Continent", 0),
    ("52,54-loanPreparations,63,1,10,2,3.geography.Country", 0),
    ("52,54-loanPreparations,63,1,10,2,3.geography.County", 0),
    ("52,54-loanPreparations,63,1,10,2,3.geography.State", 0),
    ("52,54-loanPreparations,63,1,10,2.locality.latitude1", 0),
    ("52,54-loanPreparations,63,1,10,2.locality.locality", 1),
    ("52,54-loanPreparations,63,1,10,2.locality.localityName", 0),
    ("52,54-loanPreparations,63,1,10,2.locality.longitude1", 0),
    ("52,54-loanPreparations,63,1,10.collectingevent.startDateNumericDay", 0),
    ("52,54-loanPreparations,63,1,10.collectingevent.startDateNumericMonth", 0),
    ("52,54-loanPreparations,63,1,10.collectingevent.startDateNumericYear", 0),
    ("52,54-loanPreparations,63,1,10.collectingevent.stationFieldNumber", 0),
    ("52,54-loanPreparations,63,1,9-determinations,4-preferredTaxon.taxon.Family", 0),
    ("52,54-loanPreparations,63,1,9-determinations,4-preferredTaxon.taxon.fullName", 0),
    ("52,54-loanPreparations,63,1,9-determinations,4.taxon.fullName", 0),
    ("52,54-loanPreparations,63,1,9-determinations.determination.isCurrent", 0),
    ("52,54-loanPreparations,63,1,9-determinations.determination.typeStatusName", 0),
    ("52,54-loanPreparations,63,1.collectionobject.catalogNumber", 0),
    ("52,54-loanPreparations,63,1.collectionobject.catalogedDateNumericDay", 0),
    ("52,54-loanPreparations,63,1.collectionobject.catalogedDateNumericMonth", 0),
    ("52,54-loanPreparations,63,1.collectionobject.catalogedDateNumericYear", 0),
    ("52,54-loanPreparations,63,5-preparedByAgent.agent.firstName", 0),
    ("52,54-loanPreparations,63,5-preparedByAgent.agent.lastName", 0),
    ("52,54-loanPreparations,63,65.preptype.name", 0),
    ("52,54-loanPreparations,63,65.preptype.prepType", 1),
    ("52,54-loanPreparations,63.preparation.countAmt", 0),
    ("52,54-loanPreparations.loanpreparation.descriptionOfMaterial", 0),
    ("52,54-loanPreparations.loanpreparation.isResolved", 0),
    ("52,54-loanPreparations.loanpreparation.outComments", 0),
    ("52,54-loanPreparations.loanpreparation.quantity", 0),
    ("52,54-loanPreparations.loanpreparation.quantityResolved", 0),
    ("52,54-loanPreparations.loanpreparation.quantityReturned", 0),
    ("52,54-loanpreparations,63,1,9-determinations,4.taxon.Genus", 0),
    ("52,54-loanpreparations,63,1,9-determinations,4.taxon.Species", 0),
    ("52,54-loanpreparations,63,1.collectionobject.catalogNumber", 0),
    ("52,54-loanpreparations.loanpreparation.isResolved", 0),
    ("52,71-shipments,5-shippedBy.agent.firstName", 0),
    ("52,71-shipments,5-shippedBy.agent.lastName", 0),
    ("52,71-shipments,5-shippedBy.agent.middleInitial", 0),
    ("52,71-shipments,5-shippedTo,8-addresses.address.address", 0),
    ("52,71-shipments,5-shippedTo,8-addresses.address.address2", 0),
    ("52,71-shipments,5-shippedTo,8-addresses.address.city", 0),
    ("52,71-shipments,5-shippedTo,8-addresses.address.country", 0),
    ("52,71-shipments,5-shippedTo,8-addresses.address.phone1", 0),
    ("52,71-shipments,5-shippedTo,8-addresses.address.postalCode", 0),
    ("52,71-shipments,5-shippedTo,8-addresses.address.state", 0),
    ("52,71-shipments,5-shippedTo.agent.email", 0),
    ("52,71-shipments,5-shippedTo.agent.firstName", 0),
    ("52,71-shipments,5-shippedTo.agent.lastName", 0),
    ("52,71-shipments,5-shippedTo.agent.middleInitial", 0),
    ("52,71-shipments.shipment.numberOfPackages", 0),
    ("52,71-shipments.shipment.remarks", 0),
    ("52,71-shipments.shipment.shipmentDateNumericDay", 0),
    ("52,71-shipments.shipment.shipmentDateNumericMonth", 0),
    ("52,71-shipments.shipment.shipmentDateNumericYear", 0),
    ("52,71-shipments.shipment.shipmentMethod", 0),
    ("52.loan.currentDueDate", 0),
    ("52.loan.currentDueDateNumericDay", 0),
    ("52.loan.currentDueDateNumericMonth", 0),
    ("52.loan.currentDueDateNumericYear", 0),
    ("52.loan.isClosed", 0),
    ("52.loan.loanDate", 0),
    ("52.loan.loanDateNumericDay", 0),
    ("52.loan.loanDateNumericMonth", 0),
    ("52.loan.loanDateNumericYear", 0),
    ("52.loan.loanNumber", 0),
    ("52.loan.originalDueDate", 0),
    ("52.loan.remarks", 0),
    ("52.loan.text1", 0),
    ("52.loan.yesNo1", 0),
    ("69.referencework.text2", 0),
    ("69.referencework.title", 0),
]

expected_errors = {
  "Attachment": {
    "incorrect_table": {
      "dnaSequencingRunAttachments": [
        "dnasequencerunattachment",
        "dnasequencingrunattachment"
      ]
    }
  },
  "AutoNumberingScheme": {
    "not_found": [
      "collections",
      "disciplines",
      "divisions"
    ]
  },
  "Collection": {
    "not_found": [
      "numberingSchemes",
      "userGroups"
    ]
  },
  "CollectionObject": {
    "not_found": [
      "projects"
    ]
  },
  "DNASequencingRun": {
    "incorrect_table": {
      "attachments": [
        "dnasequencerunattachment",
        "dnasequencingrunattachment"
      ]
    }
  },
  "Discipline": {
    "not_found": [
      "numberingSchemes",
      "userGroups"
    ],
    "incorrect_direction": {
      "taxonTreeDef": [
        "manytoone",
        "onetoone"
      ]
    }
  },
  "Division": {
    "not_found": [
      "numberingSchemes",
      "userGroups"
    ]
  },
  "Institution": {
    "not_found": [
      "userGroups"
    ]
  },
  "InstitutionNetwork": {
    "not_found": [
      "collections",
      "contacts"
    ]
  },
  "Locality": {
    "incorrect_direction": {
      "geoCoordDetails": [
        "onetomany",
        "zerotoone"
      ],
      "localityDetails": [
        "onetomany",
        "zerotoone"
      ]
    }
  },
  "Project": {
    "not_found": [
      "collectionObjects"
    ]
  },
  "SpExportSchema": {
    "not_found": [
      "spExportSchemaMappings"
    ]
  },
  "SpExportSchemaMapping": {
    "not_found": [
      "spExportSchemas"
    ]
  },
  "SpPermission": {
    "not_found": [
      "principals"
    ]
  },
  "SpPrincipal": {
    "not_found": [
      "permissions",
      "scope",
      "specifyUsers"
    ]
  },
  "SpReport": {
    "incorrect_direction": {
      "workbenchTemplate": [
        "manytoone",
        "onetoone"
      ]
    }
  },
  "SpecifyUser": {
    "not_found": [
      "spPrincipals"
    ]
  },
  "TaxonTreeDef": {
    "incorrect_direction": {
      "discipline": [
        "onetomany",
        "onetoone"
      ]
    }
  }
}
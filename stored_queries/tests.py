import unittest

from specify import models
from specify.api_tests import ApiTests
from fieldspec import FieldSpec
from views import make_queryset

def execute(query):
    field_specs = [FieldSpec(field) for field in query.fields.all()]
    qs = make_queryset(query, field_specs)
    return qs

class StoredQueriesTests(ApiTests):
    def setUp(self):
        super(StoredQueriesTests, self).setUp()
        self.q = models.Spquery.objects.create(
            contextname='CollectionObject',
            contexttableid=1,
            name='test query',
            specifyuser=self.specifyuser)

    def test_basic(self):
        self.q.fields.create(
            fieldname='lastName',
            isdisplay=True,
            isnot=False,
            operstart=1,
            position=0,
            sorttype=0,
            startvalue='Bentley',
            stringid='1,5-cataloger.agent.lastName',
            tablelist='1,5-cataloger')

        qs = execute(self.q)
        sql, params = qs.query.sql_with_params()
        self.assertTrue('WHERE "agent"."LastName" = %s' in sql)
        self.assertEqual(params, (u'Bentley',))

    def test_year_equal_predicate(self):
        self.q.fields.create(
            fieldname='startDate',
            isdisplay=True,
            isnot=False,
            operstart=1,
            position=0,
            sorttype=0,
            startvalue='2000',
            stringid='1,10.collectingevent.startDateNumericYear',
            tablelist='1,10')

        qs = execute(self.q)
        sql, params = qs.query.sql_with_params()
        self.assertTrue('WHERE YEAR("collectingevent"."StartDate") = %s' in sql)
        self.assertEqual(params, (2000,))

    def test_month_between_predicate(self):
        self.q.fields.create(
            fieldname='startDate',
            isdisplay=True,
            isnot=False,
            operstart=9,
            position=0,
            sorttype=0,
            startvalue='3,9',
            stringid='1,10.collectingevent.startDateNumericMonth',
            tablelist='1,10')

        qs = execute(self.q)
        sql, params = qs.query.sql_with_params()
        self.assertTrue('WHERE (MONTH("collectingevent"."StartDate") BETWEEN %s and %s AND '
                        '"collectingevent"."StartDatePrecision" IN (%s, %s))' in sql)
        self.assertEqual(params, (3, 9, 1, 2))

    def test_date_part_filter_combined(self):
        self.q.fields.create(
            fieldname='startDate',
            isdisplay=True,
            isnot=False,
            operstart=1,
            position=0,
            sorttype=0,
            startvalue='2000',
            stringid='1,10.collectingevent.startDateNumericYear',
            tablelist='1,10')

        self.q.fields.create(
            fieldname='lastName',
            isdisplay=True,
            isnot=False,
            operstart=1,
            position=0,
            sorttype=0,
            startvalue='Bentley',
            stringid='1,5-cataloger.agent.lastName',
            tablelist='1,5-cataloger')

        qs = execute(self.q)
        sql, params = qs.query.sql_with_params()
        self.assertTrue('"agent"."LastName" = %s' in sql)
        self.assertTrue('YEAR("collectingevent"."StartDate") = %s' in sql)
        self.assertTrue(u'Bentley' in params)
        self.assertTrue(2000 in params)

    def test_year_between_predicate(self):
        self.q.fields.create(
            fieldname='startDate',
            isdisplay=True,
            isnot=False,
            operstart=9,
            position=0,
            sorttype=0,
            startvalue='2000,1990',
            stringid='1,10.collectingevent.startDateNumericYear',
            tablelist='1,10')

        qs = execute(self.q)
        sql, params = qs.query.sql_with_params()
        self.assertTrue('WHERE YEAR("collectingevent"."StartDate") BETWEEN %s and %s' in sql)
        self.assertEqual(params, (2000, 1990))

    def test_year_in_predicate(self):
        self.q.fields.create(
            fieldname='startDate',
            isdisplay=True,
            isnot=False,
            operstart=10,
            position=0,
            sorttype=0,
            startvalue='2000,1990,1980',
            stringid='1,10.collectingevent.startDateNumericYear',
            tablelist='1,10')

        qs = execute(self.q)
        sql, params = qs.query.sql_with_params()
        self.assertTrue('WHERE YEAR("collectingevent"."StartDate") IN (%s, %s, %s)' in sql)
        self.assertEqual(params, (2000, 1990, 1980))

    def test_year_empty_predicate(self):
        self.q.fields.create(
            fieldname='startDate',
            isdisplay=True,
            isnot=False,
            operstart=12,
            position=0,
            sorttype=0,
            startvalue='ignored',
            stringid='1,10.collectingevent.startDateNumericYear',
            tablelist='1,10')

        qs = execute(self.q)
        sql, params = qs.query.sql_with_params()
        self.assertTrue('WHERE ("collectingevent"."StartDate" IS NULL)' in sql)

    def test_month_empty_predicate(self):
        self.q.fields.create(
            fieldname='startDate',
            isdisplay=True,
            isnot=False,
            operstart=12,
            position=0,
            sorttype=0,
            startvalue='ignored',
            stringid='1,10.collectingevent.startDateNumericMonth',
            tablelist='1,10')

        qs = execute(self.q)
        sql, params = qs.query.sql_with_params()
        self.assertTrue('WHERE ("collectingevent"."StartDate" IS NULL OR '
                        'NOT (("collectingevent"."StartDatePrecision" IN (%s, %s) AND '
                        'NOT ("collectingevent"."CollectingEventID" IS NULL) AND '
                        '"collectingevent"."StartDatePrecision" IS NOT NULL)))' in sql)
        self.assertEqual(params, (1,2))

    def test_day_empty_predicate(self):
        self.q.fields.create(
            fieldname='startDate',
            isdisplay=True,
            isnot=False,
            operstart=12,
            position=0,
            sorttype=0,
            startvalue='ignored',
            stringid='1,10.collectingevent.startDateNumericDay',
            tablelist='1,10')

        qs = execute(self.q)
        sql, params = qs.query.sql_with_params()
        self.assertTrue('WHERE ("collectingevent"."StartDate" IS NULL OR '
                        'NOT (("collectingevent"."StartDatePrecision" = %s  AND '
                        'NOT ("collectingevent"."CollectingEventID" IS NULL) AND '
                        '"collectingevent"."StartDatePrecision" IS NOT NULL)))' in sql)
        self.assertEqual(params, (1,))

    def test_aliased_columns_year(self):
        self.q.fields.create(
            fieldname='startDate',
            isdisplay=True,
            isnot=False,
            operstart=1,
            position=0,
            sorttype=0,
            startvalue='2000',
            stringid='1,9-determinations.determination.determinedDateNumericYear',
            tablelist='1,9-determinations')

        self.q.fields.create(
            fieldname='startDate',
            isdisplay=True,
            isnot=False,
            operstart=1,
            position=0,
            sorttype=0,
            startvalue='1990',
            stringid='1,10,1-collectionObjects,9-determinations.determination.determinedDateNumericYear',
            tablelist='1,10,1-collectionObjects,9-determinations')

        qs = execute(self.q)
        sql, params = qs.query.sql_with_params()
        self.assertTrue('WHERE (YEAR("determination"."DeterminedDate") = %s  AND '
                        'YEAR(T5."DeterminedDate") = %s )' in sql)
        self.assertEqual(params, (2000, 1990))

    def test_aliased_columns_month(self):
        self.q.fields.create(
            fieldname='startDate',
            isdisplay=True,
            isnot=False,
            operstart=1,
            position=0,
            sorttype=0,
            startvalue='7',
            stringid='1,9-determinations.determination.determinedDateNumericMonth',
            tablelist='1,9-determinations')

        self.q.fields.create(
            fieldname='startDate',
            isdisplay=True,
            isnot=False,
            operstart=1,
            position=0,
            sorttype=0,
            startvalue='8',
            stringid='1,10,1-collectionObjects,9-determinations.determination.determinedDateNumericMonth',
            tablelist='1,10,1-collectionObjects,9-determinations')

        qs = execute(self.q)
        sql, params = qs.query.sql_with_params()
        self.assertTrue('WHERE ((MONTH("determination"."DeterminedDate") = %s  AND '
                        '"determination"."DeterminedDatePrecision" IN (%s, %s)) AND '
                        '(MONTH(T5."DeterminedDate") = %s  AND '
                        'T5."DeterminedDatePrecision" IN (%s, %s)))' in sql)
        self.assertEqual(params, (7, 1, 2, 8, 1, 2))


import sqlalchemy
from sqlalchemy.orm.query import Query
engine = sqlalchemy.create_engine('mysql://Master:Master@localhost/KU_Fish_Tissue')
from models import tables, classes

class SqlAlchemyTests(ApiTests):
    def test_select(self):
        s = sqlalchemy.sql.select([tables['agent']])
        connection = engine.connect()
        # for result in  connection.execute(s):
        #     print result

    def test_orm(self):
        Agent = classes['Agent']
        import ipdb; ipdb.set_trace()
        q = Query(Agent).filter(Agent.addresses.City == 'Lawrence')

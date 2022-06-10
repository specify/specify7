from sqlalchemy import orm
from unittest import skip

from django.test import TestCase

from specifyweb.specify.api_tests import ApiTests
from .queryfieldspec import QueryFieldSpec
from . import models


class QueryFieldTests(TestCase):
    def test_stringid_roundtrip_from_bug(self) -> None:
        fs = QueryFieldSpec.from_stringid("4.taxon.Genus", False)
        self.assertEqual("4.taxon.Genus", fs.to_stringid())

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



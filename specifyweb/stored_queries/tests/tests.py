from sqlalchemy import orm, inspect
from unittest import expectedFailure

from django.test import TestCase
import specifyweb.specify.models as spmodels
from specifyweb.specify.tests.test_api import ApiTests
from MySQLdb.cursors import SSCursor
from django.conf import settings
import sqlalchemy
from sqlalchemy.dialects import mysql
from django.db import connection
from sqlalchemy import event
from .. import models

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


def setup_sqlalchemy(url: str):
    engine = sqlalchemy.create_engine(
        url,
        pool_recycle=settings.SA_POOL_RECYCLE,
        connect_args={"cursorclass": SSCursor},
    )

    # BUG: Raise 0-row exception somewhere here.
    @event.listens_for(engine, "before_cursor_execute", retval=True)
    # Listen to low-level cursor execution events. Just before query is executed by SQLAlchemy, run it instead
    # by Django, and then return a wrapped sql statement which will return the same result set.
    def run_django_query(conn, cursor, statement, parameters, context, executemany):
        django_cursor = connection.cursor()
        # Get MySQL Compatible compiled query.
        # print('##################################################################')
        # print(statement % parameters)
        # print('##################################################################')
        django_cursor.execute(statement, parameters)
        result_set = django_cursor.fetchall()
        columns = django_cursor.description
        # SqlAlchemy needs to find columns back in the rows, hence adding label to columns
        selects = [
            sqlalchemy.select(
                [
                    (
                        sqlalchemy.sql.null()
                        if column is None
                        else sqlalchemy.literal(column)
                    ).label(columns[idx][0])
                    for idx, column in enumerate(row)
                ]
            )
            for row in result_set
        ]
        # union all instead of union because rows can be duplicated in the original query,
        # but still need to preserve the duplication
        unioned = sqlalchemy.union_all(*selects)
        # Tests will fail when migrated to different background. TODO: Auto-detect dialects
        final_query = str(
            unioned.compile(
                compile_kwargs={
                    "literal_binds": True,
                },
                dialect=mysql.dialect(),
            )
        )

        return final_query, ()

    Session = orm.sessionmaker(bind=engine)
    return engine, models.make_session_context(lambda: (Session(), connection.cursor()))


class SQLAlchemySetup(ApiTests):

    test_sa_url = None
    engine = None
    test_session_context = None

    @classmethod
    def setUpClass(cls):
        # Django creates a new database for testing. SQLAlchemy needs to connect to the test database
        super().setUpClass()

        engine, session_context = setup_sqlalchemy(settings.SA_TEST_DB_URL)
        cls.engine = engine
        cls.test_session_context = session_context


class SQLAlchemySetupTest(SQLAlchemySetup):

    def test_collection_object_count(self):

        with SQLAlchemySetupTest.test_session_context() as session:

            co_aliased = orm.aliased(models.CollectionObject)
            sa_collection_objects = list(
                session.query(co_aliased._id).filter(
                    co_aliased.collectionMemberId == self.collection.id
                )
            )
            sa_ids = [_id for (_id,) in sa_collection_objects]
            ids = [co.id for co in self.collectionobjects]

            self.assertEqual(sa_ids, ids)
            (min_co_id,) = (
                session.query(sqlalchemy.sql.func.min(co_aliased.collectionObjectId))
                .filter(co_aliased.collectionMemberId == self.collection.id)
                .first()
            )

            self.assertEqual(min_co_id, min(ids))

            (max_co_id,) = (
                session.query(sqlalchemy.sql.func.max(co_aliased.collectionObjectId))
                .filter(co_aliased.collectionMemberId == self.collection.id)
                .first()
            )

            self.assertEqual(max_co_id, max(ids))


class SQLAlchemyModelTest(TestCase):

    @staticmethod
    def validate_sqlalchemy_model(datamodel_table):
        table_errors = {
            "not_found": [],  # Fields / Relationships not found
            "incorrect_direction": {},  # Relationship direct not correct
            "incorrect_columns": {},  # Relationship columns not correct
            "incorrect_table": {},  # Relationship related model not correct
        }
        orm_table = orm.aliased(getattr(models, datamodel_table.name))
        known_fields = datamodel_table.all_fields

        for field in known_fields:

            in_sql = getattr(orm_table, field.name, None) or getattr(
                orm_table, field.name.lower(), None
            )

            if in_sql is None:
                table_errors["not_found"].append(field.name)
                continue

            if not field.is_relationship:
                continue

            sa_relationship = inspect(in_sql).property

            sa_direction = sa_relationship.direction.name.lower()
            datamodel_direction = field.type.replace("-", "").lower()

            if sa_direction != datamodel_direction:
                table_errors["incorrect_direction"][field.name] = [
                    sa_direction,
                    datamodel_direction,
                ]
                print(
                    f"Incorrect direction: {field.name} {sa_direction} {datamodel_direction}"
                )

            remote_sql_table = sa_relationship.target.name.lower()
            remote_datamodel_table = field.relatedModelName.lower()

            if remote_sql_table.lower() != remote_datamodel_table:
                # Check case where the relation model's name is different from the DB table name
                remote_sql_table = (
                    sa_relationship.mapper._log_desc.split("(")[1].split("|")[0].lower()
                )
                if remote_sql_table.lower() != remote_datamodel_table:
                    table_errors["incorrect_table"][field.name] = [
                        remote_sql_table,
                        remote_datamodel_table,
                    ]
                    print(
                        f"Incorrect table: {field.name} {remote_sql_table} {remote_datamodel_table}"
                    )

            sa_column = list(sa_relationship.local_columns)[0].name
            if sa_column.lower() != (
                datamodel_table.idColumn.lower()
                if not getattr(field, "column", None)
                else field.column.lower()
            ):
                table_errors["incorrect_columns"][field.name] = [
                    sa_column,
                    datamodel_table.idColumn.lower(),
                    getattr(field, "column", None),
                ]
                print(
                    f"Incorrect columns: {field.name} {sa_column} {datamodel_table.idColumn.lower()} {getattr(field, 'column', None)}"
                )

        return {key: value for key, value in table_errors.items() if len(value) > 0}

    def test_sqlalchemy_model_errors(self):
        for table in spmodels.datamodel.tables:
            table_errors = SQLAlchemyModelTest.validate_sqlalchemy_model(table)
            self.assertTrue(
                len(table_errors) == 0 or table.name in expected_errors,
                f"Did not find {table.name}. Has errors: {table_errors}",
            )
            if "not_found" in table_errors:
                table_errors["not_found"] = sorted(table_errors["not_found"])
            if table_errors:
                self.assertDictEqual(table_errors, expected_errors[table.name])


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
      "projects", 
    ],
    "incorrect_direction": {
      "cojo": [
        "onetomany",
        "onetoone"
      ]
    }
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
    ]
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
  },
  "CollectionObjectGroupJoin": {
    "incorrect_direction": {
      "childCog": [
        "manytoone",
        "onetoone"
      ],
      "childCo": [
        "manytoone",
        "onetoone"
      ]
    }
  },
  "CollectionObjectGroup": {
    "incorrect_direction": {
      "cojo": [
        "onetomany",
        "onetoone"
      ]
    }
  },
}
import json
from contextlib import closing, contextmanager
from time import sleep
from uuid import uuid4

import sqlalchemy
from django.conf import settings
from django.db import connection
from django.test import override_settings

from specifyweb.backend.cache.redis.connect import RedisConnection
from specifyweb.backend.permissions.models import UserPolicy
from specifyweb.backend.permissions.permissions import NoMatchingRuleException
from specifyweb.backend.stored_queries import models as query_models
from specifyweb.backend.stored_queries.execution import check_query_permissions
from specifyweb.backend.stored_queries.queryfield import fields_from_json
from specifyweb.backend.stored_queries.tests.test_views.raw_query import get_simple_query
from specifyweb.specify import models
from specifyweb.specify.datamodel import datamodel
from specifyweb.specify.models_utils.lock_tables import LockDispatcher
from specifyweb.specify.tests.test_api import ApiTransactionTests

from .coordination import StatisticsBusy, run_statistics_query, statistics_result


class StatisticsIntegrationTests(ApiTransactionTests):
    """Exercise statistics against the test database and configured Redis service."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        # TransactionTestCase commits fixtures, so SQLAlchemy can read them through
        # its own connection instead of substituting Django query results.
        engine = sqlalchemy.create_engine(
            query_models.engine.url.set(database=connection.settings_dict["NAME"]),
            pool_recycle=settings.SA_POOL_RECYCLE,
        )
        original_bind = query_models.Session.kw["bind"]
        query_models.Session.configure(bind=engine)
        cls.addClassCleanup(engine.dispose)
        cls.addClassCleanup(query_models.Session.configure, bind=original_bind)

    def setUp(self):
        super().setUp()
        self.namespace = f"statistics_test_{uuid4().hex}"
        self.enterContext(override_settings(DATABASE_NAME=self.namespace))
        self.redis = RedisConnection().connection
        self.addCleanup(self.redis.close)
        self.addCleanup(self.clear_cache, self.namespace)
        self.assertTrue(self.redis.ping())
        self.client.force_login(self.specifyuser)
        self.client.cookies["collection"] = str(self.collection.id)

    def clear_cache(self, namespace):
        keys = list(self.redis.scan_iter(match=f"specify:{namespace}:statistics:*"))
        if keys:
            self.redis.delete(*keys)

    def cache_keys(self):
        return list(self.redis.scan_iter(
            match=f"specify:{self.namespace}:statistics:*"
        ))

    def expire_cache_entry(self):
        key, = self.cache_keys()
        self.assertTrue(self.redis.pexpire(key, 1))
        sleep(0.01)
        self.assertIsNone(self.redis.get(key))

    def calculate_count(self):
        return json.dumps({
            "count": models.Collectionobject.objects.filter(
                collection=self.collection
            ).count(),
        })

    def run_statistic(self, query_key="count", *, collection=None, user=None):
        return statistics_result(
            collection or self.collection,
            user or self.specifyuser,
            query_key,
            self.calculate_count,
        )

    @contextmanager
    def hold_statistics_lock(self):
        lock_name = LockDispatcher(lock_name_separator=":").lock_name("statistics")
        with closing(connection.copy()) as other:
            with other.cursor() as cursor:
                cursor.execute("SELECT GET_LOCK(%s, 0)", [lock_name])
                self.assertEqual(cursor.fetchone()[0], 1)
                try:
                    yield
                finally:
                    cursor.execute("SELECT RELEASE_LOCK(%s)", [lock_name])
                    self.assertEqual(cursor.fetchone()[0], 1)

    def assert_statistics_lock_available(self):
        with self.hold_statistics_lock():
            pass

    def ephemeral_query(self, *, count_only=True):
        query = get_simple_query(self.specifyuser)
        query["countonly"] = count_only
        query["fields"][0]["sorttype"] = 1
        return query

    def post_ephemeral(self, query=None, *, statistics=True):
        return self.client.post(
            "/stored_query/ephemeral/",
            self.ephemeral_query() if query is None else query,
            content_type="application/json",
            headers={"Specify-Statistic": "true"} if statistics else {},
        )

    def assert_count_response(self, response, count):
        self._assertStatusCodeEqual(response, 200)
        self.assertEqual(response["Content-Type"], "application/json")
        self.assertEqual(response.json(), {"count": count})

    def assert_busy_response(self, response):
        self._assertStatusCodeEqual(response, 409)
        self.assertEqual(response["Specify-Retry-After"], "2")
        self.assertEqual(response.json(), {
            "message": "Statistics are already being calculated. Please retry.",
        })

    def allow_only(self, *resources):
        UserPolicy.objects.filter(specifyuser=self.specifyuser).delete()
        for resource in ("/system/sp7/collection", "/querybuilder/query", *resources):
            UserPolicy.objects.create(
                collection=self.collection,
                specifyuser=self.specifyuser,
                resource=resource,
                action="%",
            )

    def test_result_is_stored_in_redis_with_five_minute_expiration(self):
        result = self.run_statistic()
        self.assertEqual(json.loads(result), {"count": 5})
        keys = self.cache_keys()
        self.assertEqual(len(keys), 1)
        with closing(RedisConnection().connection) as other:
            self.assertEqual(other.get(keys[0]), result)
            self.assertGreaterEqual(other.ttl(keys[0]), 295)
            self.assertLessEqual(other.ttl(keys[0]), 300)
        self.make_co(1)
        self.assertEqual(self.run_statistic(), result)
        self.assert_statistics_lock_available()

    def test_expired_cache_entry_is_recalculated(self):
        self.assertEqual(json.loads(self.run_statistic()), {"count": 5})
        self.make_co(1)
        self.expire_cache_entry()
        self.assertEqual(json.loads(self.run_statistic()), {"count": 6})
        self.assert_statistics_lock_available()

    def test_cache_isolates_users_collections_queries_and_databases(self):
        self.run_statistic()
        self.make_co(1)
        other_user = models.Specifyuser.objects.create(name="other statistics user")
        other_collection = models.Collection.objects.create(
            collectionname="Other statistics collection",
            discipline=self.discipline,
        )
        for arguments in (
            {"user": other_user},
            {"collection": other_collection},
            {"query_key": "another query"},
        ):
            with self.subTest(arguments=arguments):
                self.assertEqual(
                    json.loads(self.run_statistic(**arguments)), {"count": 6}
                )
        other_namespace = f"{self.namespace}_other"
        self.addCleanup(self.clear_cache, other_namespace)
        with override_settings(DATABASE_NAME=other_namespace):
            self.assertEqual(json.loads(self.run_statistic()), {"count": 6})
        self.assertEqual(json.loads(self.run_statistic()), {"count": 5})

    def test_cache_hit_is_available_while_another_connection_holds_lock(self):
        result = self.run_statistic()
        with self.hold_statistics_lock():
            self.assertEqual(self.run_statistic(), result)

    def test_busy_database_does_not_calculate_or_cache_a_miss(self):
        with self.hold_statistics_lock():
            with self.assertRaises(StatisticsBusy):
                self.run_statistic()
            self.assertEqual(self.cache_keys(), [])
        self.assertEqual(json.loads(self.run_statistic()), {"count": 5})
        self.assert_statistics_lock_available()

    def test_different_users_and_collections_share_database_gate(self):
        other_user = models.Specifyuser.objects.create(name="other statistics user")
        other_collection = models.Collection.objects.create(
            collectionname="Other statistics collection",
            discipline=self.discipline,
        )
        with self.hold_statistics_lock():
            with self.assertRaises(StatisticsBusy):
                self.run_statistic(
                    collection=other_collection, user=other_user,
                    query_key="another query",
                )
        self.assert_statistics_lock_available()

    def test_lock_is_held_until_statistics_context_exits(self):
        lock_name = LockDispatcher(lock_name_separator=":").lock_name("statistics")
        with run_statistics_query(self.calculate_count) as result:
            self.assertEqual(json.loads(result), {"count": 5})
            with closing(connection.copy()) as other:
                with other.cursor() as cursor:
                    cursor.execute("SELECT GET_LOCK(%s, 0)", [lock_name])
                    acquired = cursor.fetchone()[0]
                    if acquired == 1:
                        cursor.execute("SELECT RELEASE_LOCK(%s)", [lock_name])
                    self.assertEqual(acquired, 0)
        self.assert_statistics_lock_available()

    def test_long_database_names_have_independent_working_locks(self):
        prefix = f"{self.namespace}{'d' * 64}"
        first, second = f"{prefix}1", f"{prefix}2"
        for namespace in (first, second):
            self.addCleanup(self.clear_cache, namespace)
        with override_settings(DATABASE_NAME=first):
            with self.hold_statistics_lock():
                with self.assertRaises(StatisticsBusy):
                    self.run_statistic()
                with override_settings(DATABASE_NAME=second):
                    self.assertEqual(json.loads(self.run_statistic()), {"count": 5})
                    self.assert_statistics_lock_available()
            self.assertEqual(json.loads(self.run_statistic()), {"count": 5})
            self.assert_statistics_lock_available()

    def test_calculation_errors_release_lock_and_are_not_cached(self):
        def fail():
            raise ValueError("calculation failed")

        with self.assertRaisesRegex(ValueError, "calculation failed"):
            statistics_result(self.collection, self.specifyuser, "count", fail)
        self.assertEqual(self.cache_keys(), [])
        self.assert_statistics_lock_available()
        self.assertEqual(json.loads(self.run_statistic()), {"count": 5})

    def test_query_timeout_is_not_mistaken_for_lock_contention(self):
        def timeout():
            raise TimeoutError("query timeout")

        with self.assertRaisesRegex(TimeoutError, "query timeout"):
            statistics_result(self.collection, self.specifyuser, "count", timeout)
        self.assertEqual(self.cache_keys(), [])
        self.assert_statistics_lock_available()
        self.assertEqual(json.loads(self.run_statistic()), {"count": 5})

    def test_redis_read_error_returns_uncached_result_under_database_lock(self):
        self.run_statistic()
        key, = self.cache_keys()
        self.redis.delete(key)
        self.redis.lpush(key, "not a cached string")
        self.make_co(1)
        with self.assertLogs("specifyweb.backend.stats.coordination", level="WARNING"):
            self.assertEqual(json.loads(self.run_statistic()), {"count": 6})
        self.assertEqual(self.redis.lrange(key, 0, -1), ["not a cached string"])
        self.assert_statistics_lock_available()
        with self.hold_statistics_lock():
            with self.assertLogs("specifyweb.backend.stats.coordination", level="WARNING"):
                with self.assertRaises(StatisticsBusy):
                    self.run_statistic()

    def test_ephemeral_header_enables_caching_and_busy_response(self):
        with self.hold_statistics_lock():
            self.assert_busy_response(self.post_ephemeral())
            self.assertEqual(self.cache_keys(), [])
        response = self.post_ephemeral()
        self.assert_count_response(response, 5)
        self.make_co(1)
        with self.hold_statistics_lock():
            cached = self.post_ephemeral()
            self.assert_count_response(cached, 5)
            self.assertEqual(cached.content, response.content)
        self.assert_statistics_lock_available()

    def test_ordinary_ephemeral_query_bypasses_statistics_cache_and_lock(self):
        self.assert_count_response(self.post_ephemeral(), 5)
        self.make_co(1)
        with self.hold_statistics_lock():
            self.assert_count_response(self.post_ephemeral(statistics=False), 6)
            self.assert_count_response(self.post_ephemeral(), 5)

    def test_ephemeral_cache_expiration_reexecutes_query(self):
        self.assert_count_response(self.post_ephemeral(), 5)
        self.make_co(1)
        self.expire_cache_entry()
        self.assert_count_response(self.post_ephemeral(), 6)

    def test_ephemeral_cache_ignores_metadata_but_not_filters(self):
        query = self.ephemeral_query()
        self.assert_count_response(self.post_ephemeral(query), 5)
        self.make_co(1)
        query.update(name="Renamed", remarks="Updated", version=2)
        query["fields"][0].update(position=3, remarks="Updated", version=1)
        self.assert_count_response(self.post_ephemeral(query), 5)
        query["fields"][0].update(operstart=1, startvalue="num-0")
        self.assert_count_response(self.post_ephemeral(query), 1)

    def test_count_cache_survives_reordering_unsaved_fields(self):
        query = self.ephemeral_query()
        query["fields"].append({
            **query["fields"][0],
            "position": 1,
            "stringid": "1.collectionobject.remarks",
        })
        self.assert_count_response(self.post_ephemeral(query), 5)
        self.make_co(1)
        query["fields"][0]["position"] = 1
        query["fields"][1]["position"] = 0
        query["fields"].reverse()
        with self.hold_statistics_lock():
            self.assert_count_response(self.post_ephemeral(query), 5)
        self.assert_count_response(self.post_ephemeral(query, statistics=False), 6)

    def test_count_cache_handles_reordered_fields_with_same_string_id(self):
        query = self.ephemeral_query()
        query["fields"][0].update(operstart=1, startvalue="num-0")
        query["fields"].append({
            **query["fields"][0],
            "position": 1,
            "operstart": 15,
            "startvalue": "num-",
        })
        self.assert_count_response(self.post_ephemeral(query), 5)
        query["fields"][0]["position"] = 1
        query["fields"][1]["position"] = 0
        with self.hold_statistics_lock():
            self.assert_count_response(self.post_ephemeral(query), 5)
            query["fields"][0]["startvalue"] = "num-1"
            self.assert_busy_response(self.post_ephemeral(query))

    def test_row_cache_preserves_reordered_response_columns(self):
        obj = self.collectionobjects[0]
        obj.remarks = "Statistics remark"
        obj.save()
        query = self.ephemeral_query(count_only=False)
        query["fields"].append({
            **query["fields"][0],
            "position": 1,
            "stringid": "1.collectionobject.remarks",
            "sorttype": 0,
        })
        response = self.post_ephemeral(query)
        self._assertStatusCodeEqual(response, 200)
        self.assertIn(
            [obj.id, obj.catalognumber, obj.remarks], response.json()["results"]
        )
        query["fields"][0]["position"] = 1
        query["fields"][1]["position"] = 0
        with self.hold_statistics_lock():
            self.assert_busy_response(self.post_ephemeral(query))
        response = self.post_ephemeral(query)
        self._assertStatusCodeEqual(response, 200)
        self.assertIn(
            [obj.id, obj.remarks, obj.catalognumber], response.json()["results"]
        )

    def test_ephemeral_cached_response_preserves_unicode_and_json_shape(self):
        obj = self.collectionobjects[0]
        obj.catalognumber = "caf\u00e9-\"specimen\""
        obj.save()
        query = self.ephemeral_query(count_only=False)
        response = self.post_ephemeral(query)
        self._assertStatusCodeEqual(response, 200)
        self.assertEqual(response["Content-Type"], "application/json")
        self.assertEqual(response.json(), {
            "results": [[co.id, co.catalognumber] for co in self.collectionobjects],
        })
        obj.catalognumber = "changed"
        obj.save()
        with self.hold_statistics_lock():
            cached = self.post_ephemeral(query)
        self._assertStatusCodeEqual(cached, 200)
        self.assertEqual(cached.content, response.content)
        ordinary = self.post_ephemeral(query, statistics=False)
        self._assertStatusCodeEqual(ordinary, 200)
        self.assertIn([obj.id, "changed"], ordinary.json()["results"])

    def test_ephemeral_cached_result_rechecks_root_table_permission(self):
        self.assert_count_response(self.post_ephemeral(), 5)
        self.allow_only()
        self._assertStatusCodeEqual(self.post_ephemeral(), 403)
        self.allow_only("/table/collectionobject")
        with self.hold_statistics_lock():
            self.assert_count_response(self.post_ephemeral(), 5)

    def test_ephemeral_cached_result_rechecks_joined_table_permissions(self):
        locality = models.Locality.objects.create(
            discipline=self.discipline, localityname="Statistics locality"
        )
        self.collectingevent.locality = locality
        self.collectingevent.save()
        obj = self.collectionobjects[0]
        obj.collectingevent = self.collectingevent
        obj.save()
        query = self.ephemeral_query()
        query["fields"][0].update(
            stringid="1,10,2.locality.localityName",
            operstart=1, startvalue=locality.localityname,
        )
        self.assert_count_response(self.post_ephemeral(query), 1)
        self.allow_only("/table/collectionobject", "/table/collectingevent")
        self._assertStatusCodeEqual(self.post_ephemeral(query), 403)
        self.allow_only(
            "/table/collectionobject", "/table/collectingevent", "/table/locality"
        )
        with self.hold_statistics_lock():
            self.assert_count_response(self.post_ephemeral(query), 1)

    def test_ephemeral_query_error_does_not_cache_or_leak_lock(self):
        query = self.ephemeral_query()
        query["fields"][0]["operstart"] = 100
        response = self.post_ephemeral(query)
        self._assertStatusCodeEqual(response, 500)
        self.assertEqual(self.cache_keys(), [])
        self.assert_statistics_lock_available()
        self.assert_count_response(self.post_ephemeral(), 5)

    def test_backend_statistics_cache_busy_response_and_expiration(self):
        self._create_prep_type()
        self._create_prep(self.collectionobjects[0], None, countamt=3)
        url = "/stats/collection/preparations/"
        with self.hold_statistics_lock():
            self.assert_busy_response(self.client.get(url))
        response = self.client.get(url)
        self._assertStatusCodeEqual(response, 200)
        self.assertEqual(response.json(), {"testPrepType": {"lots": 1, "total": 3}})
        self._create_prep(self.collectionobjects[1], None, countamt=2)
        with self.hold_statistics_lock():
            cached = self.client.get(url)
            self._assertStatusCodeEqual(cached, 200)
            self.assertEqual(cached.content, response.content)
        self.expire_cache_entry()
        response = self.client.get(url)
        self._assertStatusCodeEqual(response, 200)
        self.assertEqual(response.json(), {"testPrepType": {"lots": 2, "total": 5}})
        self.assert_statistics_lock_available()

    def test_backend_statistics_rejects_revoked_permissions_on_cache_hit(self):
        url = "/stats/collection/preparations/"
        self._assertStatusCodeEqual(self.client.get(url), 200)
        self.allow_only()
        self._assertStatusCodeEqual(self.client.get(url), 403)
        self.allow_only("/table/preparation")
        with self.hold_statistics_lock():
            self._assertStatusCodeEqual(self.client.get(url), 200)

    def test_query_permission_paths_include_root_and_joined_tables(self):
        fields = fields_from_json([{
            "position": 0,
            "stringid": "1,10,2.locality.localityName",
            "isrelfld": False,
        }])
        for missing in ("collectionobject", "collectingevent", "locality"):
            with self.subTest(missing=missing):
                self.allow_only(*(
                    f"/table/{table}" for table in
                    ("collectionobject", "collectingevent", "locality")
                    if table != missing
                ))
                with self.assertRaises(NoMatchingRuleException):
                    check_query_permissions(self.collection, self.specifyuser, fields)
        self.allow_only(
            "/table/collectionobject", "/table/collectingevent", "/table/locality"
        )
        check_query_permissions(self.collection, self.specifyuser, fields)

    def test_tree_rank_permission_paths_include_referenced_tables(self):
        fields = fields_from_json([{
            "position": 0,
            "stringid": "1,9-determinations,4.taxon.Genus",
            "isrelfld": False,
        }])
        self.allow_only("/table/collectionobject", "/table/determination")
        with self.assertRaises(NoMatchingRuleException):
            check_query_permissions(self.collection, self.specifyuser, fields)
        self.allow_only(
            "/table/collectionobject", "/table/determination", "/table/taxon"
        )
        check_query_permissions(self.collection, self.specifyuser, fields)

    def test_table_paths_accept_field_names(self):
        from specifyweb.backend.stored_queries.query_path import tables_in_path

        self.assertEqual(
            tables_in_path(
                datamodel.get_table_strict("Collectionobject"),
                ("collectingEvent", "locality", "localityName"),
            ),
            [
                datamodel.get_table_strict(name)
                for name in ("Collectionobject", "Collectingevent", "Locality")
            ],
        )

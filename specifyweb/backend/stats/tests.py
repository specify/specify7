import hashlib
import json
from types import SimpleNamespace
from unittest.mock import Mock, patch

from django.core.exceptions import PermissionDenied
from django.http import JsonResponse
from django.test import RequestFactory, SimpleTestCase, override_settings
from redis.exceptions import ConnectionError as RedisConnectionError, TimeoutError as RedisTimeoutError

from .coordination import (
    STATISTICS_CACHE_SECONDS,
    StatisticsBusy,
    busy_response,
    statistics_content,
    statistics_result,
)


@override_settings(DATABASE_NAME="statistics_test")
class StatisticsCoordinationTests(SimpleTestCase):
    def setUp(self):
        self.collection = SimpleNamespace(id=1)
        self.user = SimpleNamespace(id=2)
        self.calculate = Mock(return_value='{"count": 12}')
        self.validate = Mock()
        self.cache = Mock()
        self.cache.get.return_value = None
        cache_patch = patch(
            "specifyweb.backend.stats.coordination.redis_connection",
            return_value=self.cache,
        )
        lock_patch = patch("specifyweb.specify.models_utils.lock_tables.Lock")
        self.redis_connection = cache_patch.start()
        self.lock_class = lock_patch.start()
        self.addCleanup(cache_patch.stop)
        self.addCleanup(lock_patch.stop)
        self.lock = self.lock_class.return_value

    def run_statistic(self, query_key="query"):
        return statistics_result(
            self.collection, self.user, query_key, self.calculate, self.validate
        )

    def test_result_is_cached_for_five_minutes(self):
        self.assertEqual(self.run_statistic(), '{"count": 12}')
        self.lock.acquire.assert_called_once_with()
        self.lock.release.assert_called_once_with()
        self.calculate.assert_called_once_with()
        expected_lock_name = (
            "statistics:"
            + hashlib.sha256("statistics_test".encode()).hexdigest()[:48]
        )
        self.assertEqual(self.lock_class.call_args.args[0], expected_lock_name)
        self.assertLessEqual(len(expected_lock_name), 64)
        self.assertEqual(self.lock_class.call_args.args[1], 0)
        self.cache.set.assert_called_once_with(
            self.cache.get.call_args.args[0],
            '{"count": 12}',
            ex=STATISTICS_CACHE_SECONDS,
        )
        self.assertEqual(STATISTICS_CACHE_SECONDS, 300)

    def test_long_database_name_uses_bounded_lock_name(self):
        database_name = "d" * 64
        with override_settings(DATABASE_NAME=database_name):
            self.run_statistic()

        lock_name = self.lock_class.call_args.args[0]
        self.assertEqual(
            lock_name,
            "statistics:" + hashlib.sha256(database_name.encode()).hexdigest()[:48],
        )
        self.assertLessEqual(len(lock_name), 64)

    def assert_uncached_calculation(self):
        self.assertEqual(self.run_statistic(), '{"count": 12}')
        self.calculate.assert_called_once_with()
        self.lock.acquire.assert_called_once_with()
        self.lock.release.assert_called_once_with()
        self.validate.assert_not_called()

    def test_unconfigured_redis_still_calculates_under_lock(self):
        self.redis_connection.side_effect = ValueError("Redis is not correctly configured")
        with self.assertLogs("specifyweb.backend.stats.coordination", level="WARNING"):
            self.assert_uncached_calculation()
        self.cache.get.assert_not_called()
        self.cache.set.assert_not_called()

    def test_redis_connection_failure_still_calculates_under_lock(self):
        self.redis_connection.side_effect = RedisConnectionError("unavailable")
        with self.assertLogs("specifyweb.backend.stats.coordination", level="WARNING"):
            self.assert_uncached_calculation()
        self.cache.set.assert_not_called()

    def test_cache_read_failure_disables_cache_for_request(self):
        self.cache.get.side_effect = RedisConnectionError("unavailable")
        with self.assertLogs("specifyweb.backend.stats.coordination", level="WARNING"):
            self.assert_uncached_calculation()
        self.cache.get.assert_called_once()
        self.cache.set.assert_not_called()

    def test_second_cache_read_failure_still_releases_lock_and_returns_result(self):
        self.cache.get.side_effect = [None, RedisTimeoutError("timed out")]
        with self.assertLogs("specifyweb.backend.stats.coordination", level="WARNING"):
            self.assert_uncached_calculation()
        self.assertEqual(self.cache.get.call_count, 2)
        self.cache.set.assert_not_called()

    def test_cache_write_failure_returns_calculated_result_and_releases_lock(self):
        self.cache.set.side_effect = RedisTimeoutError("timed out")
        with self.assertLogs("specifyweb.backend.stats.coordination", level="WARNING"):
            self.assert_uncached_calculation()
        self.cache.set.assert_called_once()

    def test_unavailable_cache_does_not_bypass_busy_database_lock(self):
        self.cache.get.side_effect = RedisConnectionError("unavailable")
        self.lock.acquire.side_effect = TimeoutError
        with self.assertLogs("specifyweb.backend.stats.coordination", level="WARNING"):
            with self.assertRaises(StatisticsBusy):
                self.run_statistic()
        self.calculate.assert_not_called()
        self.lock.release.assert_called_once_with()

    def test_cached_result_rechecks_permissions_without_running_query(self):
        self.cache.get.return_value = '{"count": 12}'
        self.assertEqual(self.run_statistic(), '{"count": 12}')
        self.validate.assert_called_once_with()
        self.calculate.assert_not_called()
        self.lock.acquire.assert_not_called()

    def test_revoked_permissions_prevent_cached_result_access(self):
        self.cache.get.return_value = '{"count": 12}'
        self.validate.side_effect = PermissionDenied
        with self.assertRaises(PermissionDenied):
            self.run_statistic()
        self.calculate.assert_not_called()

    def test_busy_database_does_not_start_or_wait_for_another_calculation(self):
        self.lock.acquire.side_effect = TimeoutError
        with self.assertRaises(StatisticsBusy):
            self.run_statistic()
        self.calculate.assert_not_called()
        self.cache.set.assert_not_called()
        self.lock.release.assert_called_once_with()
        response = busy_response()
        self.assertEqual(response.status_code, 409)
        self.assertEqual(response["X-Specify-Retry-After"], "2")
        self.assertIn("message", json.loads(response.content))

    def test_lock_connection_errors_are_not_reported_as_busy(self):
        self.lock.acquire.side_effect = ConnectionError
        with self.assertRaises(ConnectionError):
            self.run_statistic()
        self.lock.release.assert_called_once_with()

    def test_interrupted_lock_acquisition_releases_lock(self):
        self.lock.acquire.side_effect = KeyboardInterrupt
        with self.assertRaises(KeyboardInterrupt):
            self.run_statistic()
        self.lock.release.assert_called_once_with()

    def test_calculation_errors_release_lock_without_caching(self):
        self.calculate.side_effect = ValueError("calculation failed")
        with self.assertRaisesRegex(ValueError, "calculation failed"):
            self.run_statistic()
        self.lock.release.assert_called_once_with()
        self.cache.set.assert_not_called()

    def test_query_timeouts_are_not_mistaken_for_lock_contention(self):
        self.calculate.side_effect = TimeoutError("query timeout")
        with self.assertRaisesRegex(TimeoutError, "query timeout"):
            self.run_statistic()
        self.lock.release.assert_called_once_with()

    def test_cache_is_checked_again_after_acquiring_lock(self):
        self.cache.get.side_effect = [None, '{"count": 12}']
        self.assertEqual(self.run_statistic(), '{"count": 12}')
        self.validate.assert_called_once_with()
        self.calculate.assert_not_called()
        self.lock.release.assert_called_once_with()

    def test_cache_keys_isolate_users_collections_queries_and_databases(self):
        keys = []
        self.run_statistic()
        keys.append(self.cache.get.call_args.args[0])
        self.user.id = 3
        self.run_statistic()
        keys.append(self.cache.get.call_args.args[0])
        self.collection.id = 4
        self.run_statistic()
        keys.append(self.cache.get.call_args.args[0])
        self.run_statistic("another query")
        keys.append(self.cache.get.call_args.args[0])
        with override_settings(DATABASE_NAME="another_database"):
            self.run_statistic("another query")
            keys.append(self.cache.get.call_args.args[0])
        self.assertEqual(len(set(keys)), 5)

    def test_different_users_and_collections_share_database_gate(self):
        self.run_statistic()
        name = self.lock_class.call_args.args[0]
        self.user.id = 5
        self.collection.id = 6
        self.run_statistic("another query")
        self.assertEqual(self.lock_class.call_args.args[0], name)

    @patch("specifyweb.backend.stats.coordination.check_table_permissions")
    def test_backend_view_rechecks_permissions_on_cache_hits(self, check):
        table = Mock()
        request = RequestFactory().get("/stats/collection/preparations/")
        request.specify_collection = self.collection
        request.specify_user = self.user
        view = Mock(return_value=JsonResponse({"lots": 12}))
        self.cache.get.return_value = '{"lots": 12}'
        content = statistics_content(
            request, (table,), lambda: view(request).content.decode()
        )
        self.assertEqual(json.loads(content), {"lots": 12})
        check.assert_called_with(self.collection, self.user, table, "read")
        view.assert_not_called()

    @patch(
        "specifyweb.backend.stats.views.statistics_content",
        side_effect=StatisticsBusy,
    )
    def test_backend_view_returns_busy_response(self, statistics_content_mock):
        from specifyweb.backend.stats.views import collection_preparations

        request = RequestFactory().get("/stats/collection/preparations/")
        request.user = SimpleNamespace(is_authenticated=True)
        request.specify_collection = self.collection
        request.specify_user = self.user
        response = collection_preparations(request)
        self.assertEqual(response.status_code, 409)
        statistics_content_mock.assert_called_once()

    def ephemeral_request(self, statistics=True):
        request = RequestFactory().post(
            "/stored_query/ephemeral/",
            {},
            content_type="application/json",
            **({"HTTP_X_SPECIFY_STATISTICS": "true"} if statistics else {}),
        )
        request.user = SimpleNamespace(is_authenticated=True)
        request.specify_user = self.user
        request.specify_collection = self.collection
        return request

    @patch("specifyweb.backend.stored_queries.views.run_ephemeral_query")
    @patch("specifyweb.backend.stored_queries.views.get_query")
    def test_ephemeral_statistics_are_gated_and_cached(self, get_query, execute):
        from specifyweb.backend.stored_queries.views import ephemeral

        query = {"countonly": True}
        get_query.return_value = query, self.collection
        execute.return_value = {"count": 12}
        response = ephemeral(self.ephemeral_request())
        self.assertEqual(json.loads(response.content), {"count": 12})
        execute.assert_called_once_with(self.collection, self.user, query)
        self.lock.acquire.assert_called_once_with()
        self.cache.set.assert_called_once()

    @patch("specifyweb.backend.stored_queries.views.run_ephemeral_query")
    @patch("specifyweb.backend.stored_queries.views.get_query")
    def test_ephemeral_cache_hit_validates_query_without_executing(self, get_query, execute):
        from specifyweb.backend.stored_queries.views import ephemeral

        query = {"countonly": True}
        get_query.return_value = query, self.collection
        self.cache.get.return_value = '{"count": 12}'
        response = ephemeral(self.ephemeral_request())
        self.assertEqual(json.loads(response.content), {"count": 12})
        execute.assert_called_once_with(
            self.collection, self.user, query, validate_only=True
        )
        self.lock.acquire.assert_not_called()

    @patch("specifyweb.backend.stored_queries.views.run_ephemeral_query")
    @patch("specifyweb.backend.stored_queries.views.get_query")
    def test_ephemeral_busy_response_does_not_execute_query(self, get_query, execute):
        from specifyweb.backend.stored_queries.views import ephemeral

        get_query.return_value = {"countonly": True}, self.collection
        self.lock.acquire.side_effect = TimeoutError
        response = ephemeral(self.ephemeral_request())
        self.assertEqual(response.status_code, 409)
        self.assertEqual(response["X-Specify-Retry-After"], "2")
        execute.assert_not_called()

    @patch("specifyweb.backend.stored_queries.views.run_ephemeral_query")
    @patch("specifyweb.backend.stored_queries.views.get_query")
    def test_ordinary_ephemeral_queries_are_unchanged(self, get_query, execute):
        from specifyweb.backend.stored_queries.views import ephemeral

        query = {"countonly": True}
        get_query.return_value = query, self.collection
        execute.return_value = {"count": 12}
        response = ephemeral(self.ephemeral_request(statistics=False))
        self.assertEqual(json.loads(response.content), {"count": 12})
        execute.assert_called_once_with(self.collection, self.user, query)
        self.cache.get.assert_not_called()
        self.lock.acquire.assert_not_called()


class StatisticsPermissionValidationTests(SimpleTestCase):
    @patch("specifyweb.backend.stored_queries.execution.set_group_concat_max_len")
    @patch("specifyweb.backend.stored_queries.execution.build_query")
    def test_validation_builds_and_checks_query_without_evaluating_it(self, build, setup):
        from specifyweb.backend.stored_queries.execution import execute

        query = Mock()
        build.return_value = query, []
        result = execute(
            session=SimpleNamespace(info={"connection": Mock()}),
            collection=Mock(),
            user=Mock(),
            tableid=1,
            distinct=False,
            series=False,
            search_synonymy=False,
            count_only=True,
            query_fields=[],
            limit=0,
            offset=0,
            validate_only=True,
        )
        self.assertIsNone(result)
        setup.assert_called_once()
        build.assert_called_once()
        query.count.assert_not_called()
        query.all.assert_not_called()

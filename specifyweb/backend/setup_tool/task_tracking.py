from typing import Optional
import logging

from specifyweb.backend.cache.redis.connect import RedisConnection, RedisSet
from specifyweb.celery_tasks import CELERY_TASK_STATE, app
from specifyweb.backend.setup_tool.redis import (
    DISCIPLINE_TASKS_REDIS_KEY,
)

logger = logging.getLogger(__name__)

ACTIVE_TASK_STATES = frozenset(
    {
        CELERY_TASK_STATE.PENDING,
        CELERY_TASK_STATE.RECEIVED,
        CELERY_TASK_STATE.STARTED,
        CELERY_TASK_STATE.RETRY,
        "PROGRESS",
        "RUNNING",
    }
)

TERMINAL_TASK_STATES = frozenset(
    {
        CELERY_TASK_STATE.SUCCESS,
        CELERY_TASK_STATE.FAILURE,
        CELERY_TASK_STATE.REVOKED,
    }
)

def _discipline_tasks_key(discipline_id: int) -> str:
    return DISCIPLINE_TASKS_REDIS_KEY.replace("{discipline_id}", str(discipline_id))

def _remove_task_ids_and_delete_empty_key(key: str, *task_ids: str) -> None:
    redis_set = RedisSet(RedisConnection())
    redis_set.remove(key, *task_ids)
    if redis_set.size(key) == 0:
        redis_set.delete(key)

def queue_discipline_background_task(discipline_id: int, task_id: str) -> None:
    try:
        redis_set = RedisSet(RedisConnection())
        key = _discipline_tasks_key(discipline_id)
        redis_set.add(key, task_id)
    except Exception:
        logger.warning(
            "Failed to track discipline task %s for discipline %s.",
            task_id,
            discipline_id,
        )

def finish_discipline_background_task(discipline_id: int, task_id: str) -> None:
    try:
        _remove_task_ids_and_delete_empty_key(_discipline_tasks_key(discipline_id), task_id)
    except Exception:
        logger.warning(
            "Failed to clear tracked discipline task %s for discipline %s.",
            task_id,
            discipline_id,
        )

def _active_task_ids_from_redis_key(key: str) -> set[str]:
    try:
        redis_set = RedisSet(RedisConnection())
        task_ids = redis_set.members(key)
        if not task_ids:
            return set()

        active_task_ids: set[str] = set()
        finished_task_ids: list[str] = []
        for task_id in task_ids:
            task_state = app.AsyncResult(task_id).state
            if task_state in ACTIVE_TASK_STATES:
                active_task_ids.add(task_id)
                continue
            if task_state in TERMINAL_TASK_STATES:
                finished_task_ids.append(task_id)
                continue
            # Unknown states should block readiness until they transition.
            active_task_ids.add(task_id)

        if finished_task_ids:
            _remove_task_ids_and_delete_empty_key(key, *finished_task_ids)

        return active_task_ids
    except Exception:
        logger.warning("Failed to read task tracking key %s.", key)
        return set()

def get_active_discipline_background_tasks(discipline_id: int) -> set[str]:
    return _active_task_ids_from_redis_key(_discipline_tasks_key(discipline_id))

def has_discipline_background_tasks(discipline_id: int) -> bool:
    return len(get_active_discipline_background_tasks(discipline_id)) > 0

def is_discipline_ready_for_config_tasks(discipline_id: int) -> bool:
    return not has_discipline_background_tasks(discipline_id)

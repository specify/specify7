from typing import Optional
import logging

from specifyweb.backend.redis_cache.store import add_to_set, delete_key, remove_from_set, set_members
from specifyweb.celery_tasks import CELERY_TASK_STATE, app
from specifyweb.backend.setup_tool.redis import (
    COLLECTION_TASKS_REDIS_KEY,
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

def _collection_tasks_key(collection_id: int) -> str:
    return COLLECTION_TASKS_REDIS_KEY.replace("{collection_id}", str(collection_id))

def _discipline_tasks_key(discipline_id: int) -> str:
    return DISCIPLINE_TASKS_REDIS_KEY.replace("{discipline_id}", str(discipline_id))

def queue_collection_background_task(collection_id: int, task_id: str) -> None:
    try:
        add_to_set(_collection_tasks_key(collection_id), task_id)
    except Exception:
        logger.warning(
            "Failed to track collection task %s for collection %s.",
            task_id,
            collection_id,
        )

def finish_collection_background_task(collection_id: int, task_id: str) -> None:
    try:
        key = _collection_tasks_key(collection_id)
        remove_from_set(key, task_id)
        if len(set_members(key)) == 0:
            delete_key(key)
    except Exception:
        logger.warning(
            "Failed to clear tracked collection task %s for collection %s.",
            task_id,
            collection_id,
        )

def queue_discipline_background_task(discipline_id: int, task_id: str) -> None:
    try:
        add_to_set(_discipline_tasks_key(discipline_id), task_id)
    except Exception:
        logger.warning(
            "Failed to track discipline task %s for discipline %s.",
            task_id,
            discipline_id,
        )

def finish_discipline_background_task(discipline_id: int, task_id: str) -> None:
    try:
        key = _discipline_tasks_key(discipline_id)
        remove_from_set(key, task_id)
        if len(set_members(key)) == 0:
            delete_key(key)
    except Exception:
        logger.warning(
            "Failed to clear tracked discipline task %s for discipline %s.",
            task_id,
            discipline_id,
        )

def _active_task_ids_from_redis_key(key: str) -> set[str]:
    try:
        task_ids = set_members(key)
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
            remove_from_set(key, *finished_task_ids)
            if len(set_members(key)) == 0:
                delete_key(key)

        return active_task_ids
    except Exception:
        logger.warning("Failed to read task tracking key %s.", key)
        return set()

def get_active_collection_background_tasks(collection_id: int) -> set[str]:
    return _active_task_ids_from_redis_key(_collection_tasks_key(collection_id))

def get_active_discipline_background_tasks(discipline_id: int) -> set[str]:
    return _active_task_ids_from_redis_key(_discipline_tasks_key(discipline_id))

def has_collection_background_tasks(collection_id: int) -> bool:
    return len(get_active_collection_background_tasks(collection_id)) > 0

def has_discipline_background_tasks(discipline_id: int) -> bool:
    return len(get_active_discipline_background_tasks(discipline_id)) > 0

def is_collection_ready_for_config_tasks(collection_id: int, discipline_id: Optional[int] = None) -> bool:
    if has_collection_background_tasks(collection_id):
        return False
    if discipline_id is not None and has_discipline_background_tasks(discipline_id):
        return False
    return True

def is_discipline_ready_for_config_tasks(discipline_id: int) -> bool:
    return not has_discipline_background_tasks(discipline_id)

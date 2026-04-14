from django.apps import AppConfig
from specifyweb.backend.redis_cache.datatypes import RedisString
import logging
logger = logging.getLogger(__name__)

class TreesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "specifyweb.backend.trees"
    label = "trees"

    def ready(self):
        from specifyweb.backend.trees.redis import ACTIVE_DEFAULT_TREE_TASK_REDIS_KEY
        try:
            # Clear potential leftover tree creation tracking information
            data = RedisString().get(ACTIVE_DEFAULT_TREE_TASK_REDIS_KEY, delete_key=True)
            if data is not None:
                logger.debug(f'Clearing last active default tree creation tasks: {data}')
        except Exception:
            logger.warning('Failed to retrieve default tree creation information.')

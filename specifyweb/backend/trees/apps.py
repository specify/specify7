from django.apps import AppConfig
from django.conf import settings
from specifyweb.backend.redis_cache.store import get_string
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
            db_name = getattr(settings, "DATABASE_NAME")
            data = get_string(ACTIVE_DEFAULT_TREE_TASK_REDIS_KEY.format(database=db_name), delete_key=True)
            if data is not None:
                logger.debug(f'Clearing last active default tree creation tasks: {data}')
        except Exception:
            logger.warning('Failed to retrieve default tree creation information.')

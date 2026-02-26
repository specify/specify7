from django.apps import AppConfig
from specifyweb.backend.redis_cache.store import get_string
import logging
logger = logging.getLogger(__name__)

class TreesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "specifyweb.backend.trees"
    label = "trees"

    def ready(self):
        try:
            # Clear potential leftover tree creation tracking information
            data = get_string("specify:trees:active_tree_creation", delete_key=True)
            if data is not None:
                logger.debug(f'Clearing last active default tree creation tasks: {data}')
        except Exception:
            logger.warning('Failed to retrieve default tree creation information.')

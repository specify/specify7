from django.apps import AppConfig
from specifyweb.backend.redis_cache.store import get_string
import logging
logger = logging.getLogger(__name__)


class SetupToolConfig(AppConfig):
    name='specifyweb.backend.setup_tool'

    def ready(self):
        try:
            # Clear potential setup task id leftover from a crash
            task_id = get_string("specify:setup:active_task_id", delete_key=True)
            if task_id is not None:
                logger.debug(f'Clearing last active setup task: {task_id}')
        except Exception:
            logger.warning('Failed to retrieve last active setup task.')

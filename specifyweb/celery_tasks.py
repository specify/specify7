import os
import importlib
import sys

from celery import Celery, Task
from celery.utils.log import get_task_logger
from celery.signals import setup_logging

# set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'specifyweb.settings')

app = Celery('specify7')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
# - namespace='CELERY' means all celery-related configuration keys
#   should have a `CELERY_` prefix.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules only from apps listed in SPECIFY_APPS
def autodiscover_specify_tasks():
    from django.apps import apps
    from django.conf import settings
    
    for app_config in apps.get_app_configs():
        if app_config.name in getattr(settings, "SPECIFY_APPS", []):
            try:
                importlib.import_module(f"{app_config.name}.tasks")
            except ModuleNotFoundError:
                continue

# Run task discovery after Django setup, unless compiling messages
@setup_logging.connect
def on_celery_setup_logging(**kwargs):
    if "compilemessages" not in sys.argv:
        autodiscover_specify_tasks()

class CELERY_TASK_STATE:
    """ Built-In Celery Task States
    See https://docs.celeryq.dev/en/stable/userguide/tasks.html#built-in-states
    """
    FAILURE = 'FAILURE'
    PENDING = 'PENDING'
    RECEIVED = 'RECEIVED'
    RETRY = 'RETRY'
    REVOKED = 'REVOKED'
    STARTED = 'STARTED'
    SUCCESS = 'SUCCESS'

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')


logger = get_task_logger(__name__)


class LogErrorsTask(Task):
    def on_failure(self, exc, task_id, args, kwargs, einfo):
        logger.exception('Celery task failure!!!1', exc_info=exc)
        super().on_failure(
            exc, task_id, args, kwargs, einfo)

class MissingWorkerError(Exception):
    """Raised when worker is not running."""
    pass

def is_worker_alive():
    """Pings the worker to see if its running."""
    try:
        res = app.control.inspect(timeout=1).ping()
        return bool(res)
    except Exception:
        return False

def _extract_active_task_names(active_tasks_by_worker: dict) -> list[str]:
    """Flatten list of task names"""
    task_names: list[str] = []
    for worker_tasks in active_tasks_by_worker.values():
        for task in worker_tasks or []:
            task_name = task.get("name")
            if task_name is not None:
                task_names.append(task_name)
    return task_names

def get_running_worker_task_names() -> list[str]:
    """Returns the names of active Celery tasks across all workers"""
    active_tasks_by_worker = app.control.inspect(timeout=1).active()
    if active_tasks_by_worker is None:
        raise MissingWorkerError("The Specify Worker is not running.")

    return _extract_active_task_names(active_tasks_by_worker)
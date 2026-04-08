"""Celery tasks for DwC export cache building."""
import json
import logging

from specifyweb.celery_tasks import app, LogErrorsTask

logger = logging.getLogger(__name__)


@app.task(base=LogErrorsTask, bind=True)
def build_export_cache(self, dataset_id, user_id):
    """Build cache tables for an ExportDataSet in the background.

    Updates Celery task state with progress and sends a notification
    Message on completion or failure.
    """
    from .models import ExportDataSet
    from .cache import build_cache_tables
    from specifyweb.specify.models import Specifyuser
    from specifyweb.backend.notifications.models import Message

    user = Specifyuser.objects.get(id=user_id)
    dataset = ExportDataSet.objects.get(id=dataset_id)

    def progress(current, total):
        if not self.request.called_directly:
            self.update_state(state='PROGRESS', meta={
                'current': current,
                'total': total,
                'dataset_id': dataset_id,
            })

    try:
        build_cache_tables(dataset, user=user, progress_callback=progress)

        Message.objects.create(user=user, content=json.dumps({
            'type': 'cache-build-complete',
            'datasetId': dataset_id,
            'exportName': dataset.exportname,
        }))
        logger.info('Cache build complete for dataset %s (%s)',
                     dataset_id, dataset.exportname)

    except Exception as e:
        Message.objects.create(user=user, content=json.dumps({
            'type': 'cache-build-failed',
            'datasetId': dataset_id,
            'error': str(e),
        }))
        raise

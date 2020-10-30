from typing import Optional, Any

from celery import shared_task # type: ignore
from celery.utils.log import get_task_logger # type: ignore

from django.db import connection, transaction

from specifyweb.specify import models
from specifyweb.celery import LogErrorsTask, app
Workbench = getattr(models, 'Workbench')
Collection = getattr(models, 'Collection')

from .upload.upload import do_upload_wb

logger = get_task_logger(__name__)

@app.task(base=LogErrorsTask, bind=True)
def upload(self, collection_id: int, wb_id: int, no_commit: bool) -> None:
    wb = Workbench.objects.get(id=wb_id)
    collection = Collection.objects.get(id=collection_id)
    if wb.lockedbyusername != self.request.id:
        logger.info("workbench is locked by other task")
        return

    def progress(current: int, total: Optional[int]) -> None:
        if not self.request.called_directly:
            self.update_state(state='PROGRESS', meta={'current': current, 'total': total})

    try:
        do_upload_wb(collection, wb, no_commit, progress)
    finally:
        wb.lockedbyusername = None
        wb.save()

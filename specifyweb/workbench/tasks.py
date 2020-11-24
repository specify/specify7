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

    def progress(current: int, total: Optional[int]) -> None:
        if not self.request.called_directly:
            self.update_state(state='PROGRESS', meta={'current': current, 'total': total})

    with transaction.atomic():
        wb = Workbench.objects.select_for_update().get(id=wb_id)
        collection = Collection.objects.get(id=collection_id)

        if wb.lockedbyusername is None:
            logger.info("workbench is not locked")
            return

        if not wb.lockedbyusername.startswith(self.request.id):
            logger.info("workbench is not owned by this task")
            return

        task_id, op = wb.lockedbyusername.split(';')

        if op != "uploading":
            assert no_commit

        do_upload_wb(collection, wb, no_commit, progress)

        wb.lockedbyusername = None
        wb.srcfilepath = None if no_commit else "uploaded"
        wb.save()

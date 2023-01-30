from typing import Optional, Any

from celery import shared_task # type: ignore
from celery.utils.log import get_task_logger # type: ignore

from django.db import connection, transaction

from specifyweb.specify import models
from specifyweb.celery import LogErrorsTask, app

from .models import Spdataset, Spdatasetlock

Workbench = getattr(models, 'Workbench')
Collection = getattr(models, 'Collection')

from .upload.upload import do_upload_dataset, unupload_dataset
from .upload.upload_result import UploadResult

logger = get_task_logger(__name__)

@app.task(base=LogErrorsTask, bind=True)
def upload(self, collection_id: int, uploading_agent_id: int, ds_id: int, no_commit: bool, allow_partial: bool) -> None:

    with transaction.atomic():
        ds = Spdataset.objects.get(id=ds_id)
        collection = Collection.objects.get(id=collection_id)

        try:
            lock = Spdatasetlock.objects.select_for_update().get(spdataset=ds)
        except Spdatasetlock.DoesNotExist:
            logger.info("dataset is not assigned to an upload task")
            return

        if lock.info['taskid'] != self.request.id:
            logger.info("dataset is not assigned to this task")
            return

        assert lock.info['operation'] == ("validating" if no_commit else "uploading")

        total = ds.rows.count()
        current = 0
        def progress(result: UploadResult) -> None:
            nonlocal current
            current += 1
            if not self.request.called_directly:
                self.update_state(state='PROGRESS', meta={'current': current, 'total': total})

        do_upload_dataset(collection, uploading_agent_id, ds, no_commit, allow_partial, progress)

        lock.delete()

@app.task(base=LogErrorsTask, bind=True)
def unupload(self, ds_id: int, agent_id: int) -> None:

    with transaction.atomic():
        ds = Spdataset.objects.get(id=ds_id)
        agent = getattr(models, 'Agent').objects.get(id=agent_id)

        try:   
            lock = Spdatasetlock.objects.select_for_update().get(spdataset=ds)
        except Spdatasetlock.DoesNotExist:
            logger.info("dataset is not assigned to an upload task")
            return

        if lock.info['taskid'] != self.request.id:
            logger.info("dataset is not assigned to this task")
            return

        assert lock.info['operation'] == "unuploading" 

        total = ds.rows.count()
        current = 0
        def progress(result: UploadResult) -> None:
            nonlocal current
            current += 1
            if not self.request.called_directly:
                self.update_state(state='PROGRESS', meta={'current': current, 'total': total})

        unupload_dataset(ds, agent, progress)

        lock.delete()

from typing import Optional, Any

from celery import shared_task # type: ignore
from celery.utils.log import get_task_logger # type: ignore

from django.db import connection, transaction

from specifyweb.specify import models
from specifyweb.celery_tasks import LogErrorsTask, app

from .models import Spdataset

Workbench = getattr(models, 'Workbench')
Collection = getattr(models, 'Collection')

from .upload.upload import do_upload_dataset, unupload_dataset

logger = get_task_logger(__name__)

@app.task(base=LogErrorsTask, bind=True)
def upload(self, collection_id: int, uploading_agent_id: int, ds_id: int, no_commit: bool, allow_partial: bool) -> None:

    def progress(current: int, total: Optional[int]) -> None:
        if not self.request.called_directly:
            self.update_state(state='PROGRESS', meta={'current': current, 'total': total})

    with transaction.atomic():
        ds = Spdataset.objects.select_for_update().get(id=ds_id)
        collection = Collection.objects.get(id=collection_id)

        if ds.uploaderstatus is None:
            logger.info("dataset is not assigned to an upload task")
            return

        if ds.uploaderstatus['taskid'] != self.request.id:
            logger.info("dataset is not assigned to this task")
            return

        if not (ds.uploaderstatus['operation'] == ("validating" if no_commit else "uploading")): raise AssertionError(
            f"Invalid status '{ds.uploaderstatus['operation']}' for upload. Expected 'validating' or 'uploading'",
            {"uploadStatus" : ds.uploaderstatus['operation'],
             "operation" : "upload",
             "expectedUploadStatus" : 'validating , uploading',
             "localizationKey" : "invalidUploadStatus"})

        do_upload_dataset(collection, uploading_agent_id, ds, no_commit, allow_partial, progress)

        ds.uploaderstatus = None
        ds.save(update_fields=['uploaderstatus'])

@app.task(base=LogErrorsTask, bind=True)
def unupload(self, ds_id: int, agent_id: int) -> None:

    def progress(current: int, total: Optional[int]) -> None:
        if not self.request.called_directly:
            self.update_state(state='PROGRESS', meta={'current': current, 'total': total})

    with transaction.atomic():
        ds = Spdataset.objects.select_for_update().get(id=ds_id)
        agent = getattr(models, 'Agent').objects.get(id=agent_id)

        if ds.uploaderstatus is None:
            logger.info("dataset is not assigned to an upload task")
            return

        if ds.uploaderstatus['taskid'] != self.request.id:
            logger.info("dataset is not assigned to this task")
            return

        if not (ds.uploaderstatus['operation'] == "unuploading"): raise AssertionError(
            f"Invalid status '{ds.uploaderstatus['operation']}' for unupload. Expected 'unuploading'",
            {"uploadStatus" : ds.uploaderstatus['operation'],
             "operation" : "unupload",
             "expectedUploadStatus" : "unuoloading",
             "localizationKey" : "invalidUploadStatus"})

        unupload_dataset(ds, agent, progress)

        ds.uploaderstatus = None
        ds.save(update_fields=['uploaderstatus'])

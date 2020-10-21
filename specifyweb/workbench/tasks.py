

from celery import shared_task # type: ignore

from specifyweb.specify import models
from specifyweb.celery import LogErrorsTask, app
Workbench = getattr(models, 'Workbench')
Collection = getattr(models, 'Collection')

from .upload.upload import do_upload_wb

@app.task(base=LogErrorsTask)
def upload(collection_id: int, wb_id: int, no_commit: bool) -> None:
    wb = Workbench.objects.get(id=wb_id)
    collection = Collection.objects.get(id=collection_id)
    do_upload_wb(collection, wb, no_commit)


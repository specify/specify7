import os
import traceback
import json

from datetime import datetime
from typing import Optional, Any

from celery import shared_task # type: ignore
from celery.utils.log import get_task_logger # type: ignore

from django.conf import settings

from specifyweb.specify import models
from specifyweb.celery import LogErrorsTask, app

from ..notifications.models import Message
from ..context.app_resource import get_app_resource
from . import dwca, feed

Specifyuser = getattr(models, 'Specifyuser')
Collection = getattr(models, 'Collection')

logger = get_task_logger(__name__)

@app.task(base=LogErrorsTask, bind=True)
def update_feed(self, user_id: Optional[int], force: bool) -> None:
    user = Specifyuser.objects.get(pk=user_id) if user_id is not None else None

    try:
        feed.update_feed(force=force, notify_user=user)
    except Exception as e:
        tb = traceback.format_exc()
        logger.error('update_feed failed: %s', tb)
        if user is not None:
            Message.objects.create(user=user, content=json.dumps({
                'type': 'update-feed-failed',
                'exception': str(e),
                'traceback': tb if settings.DEBUG else None,
            }))

@app.task(base=LogErrorsTask, bind=True)
def make_dwca(self, collection_id: int, user_id: int, dwca_resource: str, eml_resource: str) -> None:
    user = Specifyuser.objects.get(pk=user_id)
    collection = Collection.objects.get(pk=collection_id)

    definition, _ = get_app_resource(collection, user, dwca_resource)

    if eml_resource is not None:
        eml, _ = get_app_resource(collection, user, eml_resource)
    else:
        eml = None

    filename = 'dwca_export_%s.zip' % datetime.now().isoformat()
    path = os.path.join(settings.DEPOSITORY_DIR, filename)

    try:
        dwca.make_dwca(collection, user, definition, path, eml=eml)
    except Exception as e:
        tb = traceback.format_exc()
        logger.error('make_dwca failed: %s', tb)
        Message.objects.create(user=user, content=json.dumps({
            'type': 'dwca-export-failed',
            'exception': str(e),
            'traceback': tb if settings.DEBUG else None,
        }))
    else:
        Message.objects.create(user=user, content=json.dumps({
            'type': 'dwca-export-complete',
            'file': filename
        }))

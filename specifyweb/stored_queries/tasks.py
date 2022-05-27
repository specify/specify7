import os
from celery import shared_task # type: ignore
from celery.utils.log import get_task_logger # type: ignore
from django.conf import settings
from . import models
from .execution import field_specs_from_json, query_to_csv, query_to_kml
from ..notifications.models import Message
import json
from specifyweb.celery import LogErrorsTask, app
from ..specify.models import Collection, Specifyuser

@app.task(base=LogErrorsTask, bind=True)
def do_export(self, spquery, collection_id, user_id, filename, exporttype, host):
    """Executes the given deserialized query definition, sending the
    to a file, and creates "export completed" message when finished.
    See query_to_csv for details of the other accepted arguments.
    """
    recordsetid = spquery.get('recordsetid', None)
    collection = Collection.objects.get(pk=collection_id)
    user = Specifyuser.objects.get(pk=user_id)
    distinct = spquery['selectdistinct']
    tableid = spquery['contexttableid']

    path = os.path.join(settings.DEPOSITORY_DIR, filename)
    message_type = 'query-export-to-csv-complete'

    with models.session_context() as session:
        field_specs = field_specs_from_json(spquery['fields'])
        if exporttype == 'csv':
            query_to_csv(session, collection, user, tableid, field_specs, path,
                         recordsetid=recordsetid, add_header=True, strip_id=True)
        elif exporttype == 'kml':
            query_to_kml(session, collection, user, tableid, field_specs, path, spquery['captions'], host,
                         recordsetid=recordsetid, add_header=True, strip_id=False)
            message_type = 'query-export-to-kml-complete'

    Message.objects.create(user=user, content=json.dumps({
        'type': message_type,
        'file': filename,
    }))
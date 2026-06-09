import json
import logging

from django.db import transaction
from sqlalchemy import inspect

from specifyweb.celery_tasks import LogErrorsTask, app
from specifyweb.backend.notifications.models import Message
from specifyweb.backend.stored_queries import models
from specifyweb.backend.stored_queries.execution import build_query
from specifyweb.backend.stored_queries.queryfield import fields_from_json
from specifyweb.specify.api.crud import delete_resource, get_model_or_404

logger = logging.getLogger(__name__)


@app.task(base=LogErrorsTask, bind=True)
def bulk_delete_task(
    self,
    collection_id: int,
    user_id: int,
    agent_id: int,
    table_name: str,
    ids: list[int],
    spquery: dict | None = None,
) -> None:
    """Run bulk deletion as a background Celery task within a single transaction.

    If *ids* is empty but *spquery* is provided, all IDs matching the
    query are resolved and then deleted.  The entire operation runs inside
    ``transaction.atomic`` so that any failure rolls back everything.
    """
    import specifyweb.specify.models as spmodels

    collection = spmodels.Collection.objects.get(id=collection_id)
    agent = spmodels.Agent.objects.get(id=agent_id)

    def progress(current: int, total: int) -> None:
        if not self.request.called_directly:
            self.update_state(
                state='PROGRESS',
                meta={'current': current, 'total': total},
            )

    # 1) Notify the user that the task has started
    Message.objects.create(
        user_id=user_id,
        content=json.dumps({
            'type': 'bulk-delete-started',
            'table': table_name,
            'count': len(ids) if ids else 'entire query',
            'taskid': self.request.id,
        }),
    )

    try:
        do_bulk_delete(collection, agent, table_name, ids, spquery, progress)

    except Exception:
        # 2a) Task failed – notify the user and re-raise
        Message.objects.create(
            user_id=user_id,
            content=json.dumps({
                'type': 'bulk-delete-failed',
                'table': table_name,
                'taskid': self.request.id,
            }),
        )
        raise

    # 2b) Task succeeded
    total = len(ids)
    if not self.request.called_directly:
        self.update_state(
            state='SUCCESS',
            meta={'current': total, 'total': total},
        )

    Message.objects.create(
        user_id=user_id,
        content=json.dumps({
            'type': 'bulk-delete-succeeded',
            'table': table_name,
            'taskid': self.request.id,
            'count': total,
        }),
    )


@transaction.atomic
def do_bulk_delete(
    collection,
    agent,
    table_name: str,
    ids: list[int],
    spquery: dict | None = None,
    progress=None,
) -> None:
    """Core deletion logic, wrapped in an atomic block."""

    model = get_model_or_404(table_name)

    # Resolve IDs from query if no explicit IDs were provided
    if len(ids) == 0 and spquery is not None:
        with models.session_context() as session:
            tableid = spquery['contexttableid']
            if model.specify_model.tableId != tableid:
                raise ValueError(
                    'Query table does not match bulk delete table.'
                )

            field_specs = fields_from_json(spquery['fields'])
            query, __ = build_query(
                session,
                collection,
                None,         # user
                tableid,
                field_specs,
            )

            entity = query.column_descriptions[0]['entity']
            pk_col = inspect(entity).primary_key[0]

            ids = list(
                session.execute(
                    query.with_entities(pk_col).distinct()
                ).scalars()
            )

    if len(ids) == 0:
        raise ValueError('No record IDs to delete.')

    total = len(ids)
    for current, record_id in enumerate(ids, start=1):
        # delete_resource raises an exception on failure, causing
        # the entire transaction to roll back.
        delete_resource(collection, agent, model, record_id, None)
        if progress is not None:
            progress(current, total)
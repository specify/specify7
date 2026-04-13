from __future__ import annotations

import json

from django.db import transaction
from django.http import HttpResponse, HttpResponseBadRequest, JsonResponse
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_POST

from specifyweb.backend.permissions.permissions import check_table_permissions
from specifyweb.specify.models import Picklist, Picklistitem
from specifyweb.specify.views import login_maybe_required

from .io import (
    ITEMS_PICKLIST_TYPE,
    is_prep_type_picklist,
    parse_picklists_text,
    picklist_to_payload,
    picklists_to_xml,
)

_UPDATABLE_PICKLIST_FIELDS = (
    'fieldname',
    'filterfieldname',
    'filtervalue',
    'formatter',
    'issystem',
    'readonly',
    'sizelimit',
    'sorttype',
    'tablename',
    'type',
)

def _replace_picklist_items(
    picklist: Picklist,
    items: list[dict[str, object]],
    agent,
) -> None:
    picklist.picklistitems.all().delete()
    for item in items:
        Picklistitem.objects.create(
            picklist=picklist,
            title=item['title'],
            value=item.get('value'),
            ordinal=item.get('ordinal'),
            createdbyagent=agent,
            modifiedbyagent=agent,
        )

def _upsert_picklist(collection, agent, payload: dict[str, object]) -> bool:
    picklist = (
        Picklist.objects.select_for_update()
        .prefetch_related('picklistitems')
        .filter(collection=collection, name=payload['name'])
        .first()
    )

    if picklist is not None:
        current_payload = picklist_to_payload(picklist)
        needs_item_cleanup = (
            payload['type'] != ITEMS_PICKLIST_TYPE and picklist.picklistitems.exists()
        )
        if current_payload == payload and not needs_item_cleanup:
            return False
    else:
        picklist = Picklist(
            collection=collection,
            name=payload['name'],
            createdbyagent=agent,
        )

    for field in _UPDATABLE_PICKLIST_FIELDS:
        setattr(picklist, field, payload[field])
    picklist.modifiedbyagent = agent
    picklist.save()

    if payload['type'] == ITEMS_PICKLIST_TYPE:
        _replace_picklist_items(picklist, payload['items'], agent)
    elif picklist.picklistitems.exists():
        picklist.picklistitems.all().delete()

    return True

@login_maybe_required
@require_POST
@never_cache
def export_picklists(request):
    check_table_permissions(request.specify_collection, request.specify_user_agent, Picklist, 'read')
    check_table_permissions(request.specify_collection, request.specify_user_agent, Picklistitem, 'read')

    try:
        request_data = json.loads(request.body)
    except json.JSONDecodeError as error:
        return HttpResponseBadRequest(str(error))

    names = request_data.get('names')
    if not isinstance(names, list) or not all(isinstance(name, str) for name in names):
        return HttpResponseBadRequest('Request body must include a "names" list.')

    requested_names = [name for name in names if isinstance(name, str) and len(name.strip()) > 0]
    if len(requested_names) == 0:
        return HttpResponseBadRequest('At least one picklist name must be selected for export.')

    order = {name: index for index, name in enumerate(requested_names)}
    picklists = sorted(
        Picklist.objects.filter(
            collection=request.specify_collection,
            name__in=requested_names,
        ).prefetch_related('picklistitems'),
        key=lambda picklist: order.get(picklist.name, len(order)),
    )

    payloads = [
        picklist_to_payload(picklist)
        for picklist in picklists
        if not is_prep_type_picklist({'name': picklist.name, 'tablename': picklist.tablename})
    ]
    if len(payloads) == 0:
        return HttpResponseBadRequest('No exportable picklists were found.')

    return HttpResponse(picklists_to_xml(payloads), content_type='text/xml')

@login_maybe_required
@require_POST
@never_cache
def import_picklists(request):
    check_table_permissions(request.specify_collection, request.specify_user_agent, Picklist, 'create')
    check_table_permissions(request.specify_collection, request.specify_user_agent, Picklist, 'update')
    check_table_permissions(request.specify_collection, request.specify_user_agent, Picklistitem, 'create')
    check_table_permissions(request.specify_collection, request.specify_user_agent, Picklistitem, 'update')

    try:
        raw_text = request.body.decode(request.encoding or 'utf-8')
        payloads = parse_picklists_text(raw_text)
    except (UnicodeDecodeError, ValueError, json.JSONDecodeError) as error:
        return HttpResponseBadRequest(str(error))

    if len(payloads) == 0:
        return HttpResponseBadRequest('No picklists were found in the imported file.')

    imported_names: list[str] = []
    skipped_names: list[str] = []
    unchanged_names: list[str] = []

    with transaction.atomic():
        for payload in payloads:
            name = payload['name']
            if is_prep_type_picklist(payload):
                skipped_names.append(name)
                continue

            if _upsert_picklist(request.specify_collection, request.specify_user_agent, payload):
                imported_names.append(name)
            else:
                unchanged_names.append(name)

    return JsonResponse(
        {
            'importedCount': len(imported_names),
            'importedNames': imported_names,
            'skippedNames': skipped_names,
            'unchangedNames': unchanged_names,
        }
    )

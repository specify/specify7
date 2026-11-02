import json

from django.db import transaction
from django.http import (
    HttpRequest,
    HttpResponse,
    HttpResponseBadRequest,
    HttpResponseForbidden,
    JsonResponse,
)
from django.shortcuts import get_object_or_404
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_http_methods

from specifyweb.backend.permissions.models import SpqueryShare
from specifyweb.specify.models import Spquery, Specifyuser
from specifyweb.specify.views import login_maybe_required


@require_http_methods(["GET", "PUT", "DELETE"])
@login_maybe_required
@never_cache
def manage_query_shares(request: HttpRequest, id: int) -> HttpResponse:
    with transaction.atomic():
        query = get_object_or_404(Spquery.objects.select_for_update(), pk=id)
        user = request.specify_user
        if query.specifyuser_id != user.id or not user.is_admin():
            return HttpResponseForbidden(
                "Only the owning Specify Administrator can manage query sharing."
            )

        if request.method == "GET":
            recipient_ids = list(
                query.share_grants.order_by("recipient_id").values_list(
                    "recipient_id", flat=True
                )
            )
            return JsonResponse({"recipientIds": recipient_ids})

        if request.method == "DELETE":
            query.share_grants.all().delete()
            return HttpResponse(status=204)

        try:
            data = json.loads(request.body)
        except ValueError:
            return HttpResponseBadRequest("Request body must contain valid JSON.")

        recipient_ids = data.get("recipientIds") if isinstance(data, dict) else None
        if (
            not isinstance(recipient_ids, list)
            or any(
                type(recipient_id) is not int or recipient_id < 1
                for recipient_id in recipient_ids
            )
            or len(set(recipient_ids)) != len(recipient_ids)
        ):
            return HttpResponseBadRequest(
                "recipientIds must be a list of unique positive user IDs."
            )

        existing_ids = set(
            Specifyuser.objects.filter(id__in=recipient_ids).values_list(
                "id", flat=True
            )
        )
        if existing_ids != set(recipient_ids):
            return HttpResponseBadRequest(
                "recipientIds contains a user that does not exist."
            )

        query.share_grants.all().delete()
        SpqueryShare.objects.bulk_create(
            [
                SpqueryShare(query=query, recipient_id=recipient_id)
                for recipient_id in recipient_ids
            ]
        )

        return JsonResponse({"recipientIds": recipient_ids})

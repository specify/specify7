import json
from functools import wraps

from django.core.exceptions import PermissionDenied
from django.db import connection, transaction
from django.db.models import Model, Q, QuerySet
from django.http import (
    Http404,
    HttpRequest,
    HttpResponse,
    HttpResponseBadRequest,
    HttpResponseForbidden,
    JsonResponse,
)
from django.shortcuts import get_object_or_404
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_http_methods

from specifyweb.backend.permissions.permissions import (
    CollectionAccessPT,
    PermissionsException,
)
from specifyweb.specify.models import Collection, Spquery, Spqueryfield, Specifyuser


def _login_maybe_required(view_func):
    @wraps(view_func)
    def _wrapped(*args, **kwargs):
        from specifyweb.specify.views import login_maybe_required

        return login_maybe_required(view_func)(*args, **kwargs)

    return _wrapped


class QueryWriteDenied(PermissionDenied, PermissionsException):
    status_code = 403

    def to_json(self) -> dict:
        return {"QueryWriteDenied": str(self)}


def get_query_share_recipients() -> dict[str, object]:
    users = list(Specifyuser.objects.order_by("name"))
    collections = list(
        Collection.objects.select_related("discipline__division").order_by(
            "collectionname", "id"
        )
    )
    users_by_collection = {collection.id: [] for collection in collections}
    users_by_id = {user.id: {"id": user.id, "name": user.name} for user in users}
    users_with_collection = set()

    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT DISTINCT collection.usergroupscopeid, specifyuser.specifyuserid
            FROM collection
            CROSS JOIN specifyuser
            WHERE EXISTS (
                SELECT 1
                FROM spuserpolicy
                WHERE (spuserpolicy.collection_id = collection.usergroupscopeid
                       OR spuserpolicy.collection_id IS NULL)
                  AND (spuserpolicy.specifyuser_id = specifyuser.specifyuserid
                       OR spuserpolicy.specifyuser_id IS NULL)
                  AND %(resource)s LIKE spuserpolicy.resource
                  AND %(action)s LIKE spuserpolicy.action
            )
            OR EXISTS (
                SELECT 1
                FROM spuserrole
                JOIN sprole ON sprole.id = spuserrole.role_id
                JOIN sprolepolicy ON sprolepolicy.role_id = sprole.id
                WHERE spuserrole.specifyuser_id = specifyuser.specifyuserid
                  AND sprole.collection_id = collection.usergroupscopeid
                  AND %(resource)s LIKE sprolepolicy.resource
                  AND %(action)s LIKE sprolepolicy.action
            )
            ORDER BY collection.usergroupscopeid, specifyuser.specifyuserid
            """,
            {
                "resource": CollectionAccessPT.resource,
                "action": CollectionAccessPT.access.action(),
            },
        )
        for collection_id, user_id in cursor.fetchall():
            users_by_collection[collection_id].append(users_by_id[user_id])
            users_with_collection.add(user_id)

    users_without_collection = [
        users_by_id[user.id]
        for user in users
        if user.id not in users_with_collection
    ]

    return {
        "collections": [
            {
                "id": collection.id,
                "name": collection.collectionname or "",
                "discipline": {
                    "id": collection.discipline_id,
                    "name": collection.discipline.name or "",
                    "division": {
                        "id": collection.discipline.division_id,
                        "name": collection.discipline.division.name or "",
                    },
                },
                "users": users_by_collection[collection.id],
            }
            for collection in collections
            if users_by_collection[collection.id]
        ],
        "usersWithoutCollection": users_without_collection,
    }


def filter_queries_for_user(
    queries: QuerySet[Spquery], user_id: int
) -> QuerySet[Spquery]:
    return queries.filter(
        Q(specifyuser_id=user_id) | Q(share_grants__recipient_id=user_id)
    ).distinct()


def ensure_query_access(query_id: int, user_id: int) -> None:
    if not filter_queries_for_user(
        Spquery.objects.filter(pk=query_id), user_id
    ).exists():
        raise Http404("Query not found.")


def ensure_query_write_access(obj: Model, user_id: int) -> None:
    if isinstance(obj, Spquery):
        owner_id = obj.specifyuser_id
    elif isinstance(obj, Spqueryfield) and obj.query_id is not None:
        owner_id = obj.query.specifyuser_id
    else:
        return

    if owner_id != user_id:
        raise QueryWriteDenied("Only the query owner can modify its definition.")


@require_http_methods(["GET", "PUT", "DELETE"])
@_login_maybe_required
@never_cache
def manage_query_shares(request: HttpRequest, id: int) -> HttpResponse:
    from specifyweb.backend.permissions.models import SpqueryShare

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
            return JsonResponse(
                {
                    "recipientIds": recipient_ids,
                    **get_query_share_recipients(),
                }
            )

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

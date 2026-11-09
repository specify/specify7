import json

from django.db import connection, transaction
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

from specifyweb.backend.permissions.permissions import CollectionAccessPT
from specifyweb.specify.api.crud import bump_version
from specifyweb.specify.api.exceptions import MissingVersionException, StaleObjectException
from specifyweb.specify.models import Collection, Spquery, Specifyuser
from specifyweb.specify.views import HttpResponseConflict, login_maybe_required


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


@require_http_methods(["GET", "PUT", "DELETE"])
@login_maybe_required
@never_cache
def manage_query_shares(request: HttpRequest, id: int) -> HttpResponse:
    from specifyweb.backend.permissions.models import SpqueryShare

    with transaction.atomic():
        query = get_object_or_404(Spquery.objects.select_for_update(), pk=id)
        user = request.specify_user
        if query.specifyuser_id != user.id:
            return HttpResponseForbidden(
                "Only the query owner can manage query sharing."
            )

        if request.method == "GET":
            recipient_ids = list(
                query.share_grants.order_by("recipient_id").values_list(
                    "recipient_id", flat=True
                )
            )
            response = {"recipientIds": recipient_ids, "version": query.version}
            if user.is_admin():
                response.update(get_query_share_recipients())
            return JsonResponse(response)

        if request.method == "DELETE":
            bump_version(query, query.version)
            query.share_grants.all().delete()
            return JsonResponse({"recipientIds": [], "version": query.version})

        if not user.is_admin():
            return HttpResponseForbidden(
                "Only a Specify Administrator can change query sharing."
            )

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

        # Use the query's optimistic locking version while holding its row lock.
        # A stale save must leave the current grants untouched.
        try:
            bump_version(query, data.get("version"))
        except MissingVersionException:
            return HttpResponseBadRequest(
                "A required version value is missing or invalid."
            )
        except StaleObjectException:
            return HttpResponseConflict(
                "The query was modified by another request. Please reload and try again."
            )

        query.share_grants.all().delete()
        SpqueryShare.objects.bulk_create(
            [
                SpqueryShare(query=query, recipient_id=recipient_id)
                for recipient_id in recipient_ids
            ]
        )

        return JsonResponse({"recipientIds": recipient_ids, "version": query.version})

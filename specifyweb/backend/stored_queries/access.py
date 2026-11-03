from typing import TypeVar

from django.apps import apps
from django.core.exceptions import PermissionDenied
from django.db.models import Model, Q, QuerySet
from django.http import Http404

from specifyweb.backend.permissions.exceptions import PermissionsException

QueryModel = TypeVar("QueryModel", bound=Model)


class QueryWriteDenied(PermissionDenied, PermissionsException):
    status_code = 403

    def to_json(self) -> dict:
        return {"QueryWriteDenied": str(self)}


def filter_queries_for_user(
    queries: QuerySet[QueryModel], user_id: int
) -> QuerySet[QueryModel]:
    return queries.filter(
        Q(specifyuser_id=user_id) | Q(share_grants__recipient_id=user_id)
    ).distinct()


def ensure_query_access(query_id: int, user_id: int) -> None:
    query_model = apps.get_model("specify", "Spquery")
    if not filter_queries_for_user(
        query_model.objects.filter(pk=query_id), user_id
    ).exists():
        raise Http404("Query not found.")


def ensure_query_write_access(obj: Model, user_id: int) -> None:
    if isinstance(obj, apps.get_model("specify", "Spquery")):
        owner_id = getattr(obj, "specifyuser_id")
    elif (
        isinstance(obj, apps.get_model("specify", "Spqueryfield"))
        and getattr(obj, "query_id") is not None
    ):
        owner_id = getattr(obj, "query").specifyuser_id
    else:
        return

    if owner_id != user_id:
        raise QueryWriteDenied("Only the query owner can modify its definition.")

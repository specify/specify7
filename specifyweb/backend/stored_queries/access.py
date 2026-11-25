from typing import TypeVar

from django.apps import apps
from django.core.exceptions import PermissionDenied
from django.db.models import F, Model, Q, QuerySet
from django.http import Http404

from specifyweb.backend.permissions.exceptions import PermissionsException

QueryModel = TypeVar("QueryModel", bound=Model)


class QueryWriteDenied(PermissionDenied, PermissionsException):
    status_code = 403

    def to_json(self) -> dict:
        return {"QueryWriteDenied": str(self)}


def shared_query_ids():
    from specifyweb.backend.permissions.models import SpqueryShare
    from specifyweb.backend.stored_queries.models import QueryFolderMembership

    return (
        SpqueryShare.objects.values('query_id'),
        QueryFolderMembership.objects.filter(
            sharing_folder__sharing_group__isnull=False,
            owner_id=F('query__specifyuser_id'),
        ).values('query_id'),
    )


def query_is_shared(query_id: int) -> bool:
    grants, groups = shared_query_ids()
    query_model = apps.get_model("specify", "Spquery")
    return query_model.objects.filter(pk=query_id).filter(
        Q(pk__in=grants) | Q(pk__in=groups)
    ).exists()


def filter_queries_for_user(
    queries: QuerySet[QueryModel], user_id: int
) -> QuerySet[QueryModel]:
    from specifyweb.backend.permissions.models import UserPolicy
    from specifyweb.backend.stored_queries.models import QueryFolderMembership

    groups = ['everyone']
    if UserPolicy.objects.filter(
        specifyuser_id=user_id, collection=None, resource='%', action='%'
    ).exists():
        groups.append('admins')
    group_queries = QueryFolderMembership.objects.filter(
        sharing_folder__sharing_group__in=groups,
        owner_id=F('query__specifyuser_id'),
    ).values('query_id')
    return queries.filter(
        Q(specifyuser_id=user_id) | Q(share_grants__recipient_id=user_id)
        | Q(pk__in=group_queries)
    ).distinct()


def ensure_query_access(query_id: int, user_id: int) -> None:
    query_model = apps.get_model("specify", "Spquery")
    if not filter_queries_for_user(
        query_model.objects.filter(pk=query_id), user_id
    ).exists():
        raise Http404("Query not found.")


def visible_query_ids(user_id: int) -> tuple[list[int], list[int]]:
    query_model = apps.get_model("specify", "Spquery")
    field_model = apps.get_model("specify", "Spqueryfield")
    query_ids = list(
        filter_queries_for_user(query_model.objects.all(), user_id).values_list(
            "pk", flat=True
        )
    )
    field_ids = list(
        field_model.objects.filter(query_id__in=query_ids).values_list(
            "pk", flat=True
        )
    )
    return query_ids, field_ids


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

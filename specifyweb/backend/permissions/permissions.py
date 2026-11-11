from typing import (
    Any,
    Literal,
    NamedTuple,
)
from collections.abc import Callable, Iterable
from contextvars import ContextVar
from contextlib import contextmanager

import logging

logger = logging.getLogger(__name__)

from django.db import connection
from django.core.exceptions import FieldDoesNotExist, FieldError
from django.db.models import Exists, FilteredRelation, ForeignKey, Model, OuterRef, Q, QuerySet
from django.db.models.fields.reverse_related import ManyToOneRel

from specifyweb.specify.models import Agent
from specifyweb.specify.datamodel import Table
from specifyweb.specify.utils.scoping import Scoping
from specifyweb.backend.cache.thread import ThreadCache

from . import models

registry: dict[str, list[str]] = dict()


class PermissionTargetAction:
    _resource = "undefined"
    _action = "undefined"

    def resource(self) -> str:
        return self._resource

    def action(self) -> str:
        return self._action


class PermissionTargetMeta(type):
    def __new__(cls, name, bases, attrs):
        if bases:  # skip PermissionsTarget base class
            resource: str = attrs["resource"]
            if resource in registry:
                raise AssertionError(
                    f"Resource '{resource}' already in Permissions registry",
                    {
                        "resource": resource,
                        "localizationKey": "resourceInPermissionRegistry",
                    },
                )

            actions = registry[resource] = []

            for k, v in attrs.items():
                if isinstance(v, PermissionTargetAction):
                    v._resource = attrs["resource"]
                    v._action = k
                    actions.append(k)

        return super().__new__(cls, name, bases, attrs)


class PermissionTarget(metaclass=PermissionTargetMeta):
    pass


class PermRequest(NamedTuple):
    collectionid: int | None
    userid: int
    resource: str
    action: str


def check_permission_targets(
    collectionid: int | None, userid: int, targets: list[PermissionTargetAction]
) -> None:
    if not targets:
        return

    perm_requests = [
        PermRequest(collectionid, userid, t.resource(), t.action()) for t in targets
    ]
    results = [(r, *query(*r)) for r in perm_requests]
    logger.debug("permissions check: %s", results)

    denials = [r for r, allowed, _, _ in results if not allowed]
    if denials:
        raise NoMatchingRuleException(denials)


def has_target_permission(
    collectionid: int | None, userid: int, targets: list[PermissionTargetAction]
):
    try:
        check_permission_targets(collectionid, userid, targets)
        return True
    except NoMatchingRuleException:
        return False


class PermissionsException(Exception):
    status_code = 500

    def to_json(self) -> dict:
        return {"PermissionsException": repr(self)}


class NoMatchingRuleException(PermissionsException):
    status_code = 403

    def __init__(self, denials: list[PermRequest]):
        self.denials = denials

    def to_json(self) -> dict:
        return {"NoMatchingRuleException": [d._asdict() for d in self.denials]}


class NoAdminUsersException(PermissionsException):
    status_code = 400

    def to_json(self) -> dict:
        return {"NoAdminUsersException": {}}


def _actor_userid(actor) -> int:
    if isinstance(actor, Agent):
        userid = actor.specifyuser_id
    else:
        if not isinstance(actor, models.Specifyuser):
            raise AssertionError(
                f"Agent '{actor}' is not a SpecifyUser",
                {"actor": actor, "localizationKey": "actorIsNotSpecifyUser"},
            )
        userid = actor.id

    if userid is None:
        raise PermissionsException(f"agent {actor} is not a Specify user")
    return userid


def enforce(
    collection: int | Model | None, actor, resources: list[str], action: str
) -> None:
    if not resources:
        return

    userid = _actor_userid(actor)

    if isinstance(collection, int) or collection is None:
        collectionid = collection
    else:
        if not isinstance(collection, models.Collection):
            raise AssertionError(
                f"Unexpted type of collection '{collection.__class__.__name__}'. Expected '{models.Collection.__class__.__name__}'",
                {
                    "unexptectedTypeName": collection.__class__.__name__,
                    "collectionName": models.Collection.__class__.__name__,
                    "localizationKey": "unexpectedCollectionType",
                },
            )
        collectionid = collection.id

    perm_requests = [
        PermRequest(collectionid, userid, resource, action) for resource in resources
    ]
    results = [(r, *query(*r)) for r in perm_requests]
    logger.debug("permissions check: %s", results)

    denials = [r for r, allowed, _, _ in results if not allowed]
    if denials:
        raise NoMatchingRuleException(denials)


class QueryResult(NamedTuple):
    allowed: bool
    matching_user_policies: list
    matching_role_policies: list

_permission_query_cache = ThreadCache[PermRequest, QueryResult](
    ContextVar(
        "permission_query_cache",
        default=None,
    )
)

def query_pt(
    collectionid: int | None, userid: int, target: PermissionTargetAction
) -> QueryResult:
    return query(collectionid, userid, target.resource(), target.action())


def _get_spuser_policies(collectionid: int | None, userid: int, resource: str, action: str):
    with connection.cursor() as cursor:
        cursor.execute(
            """
        select collection_id, specifyuser_id, resource, action
        from spuserpolicy
        where (collection_id = %(collectionid)s or collection_id is null)
        and (specifyuser_id = %(userid)s or specifyuser_id is null)
        and %(resource)s like resource
        and %(action)s like action
        """,
            {
                "collectionid": collectionid,
                "userid": userid,
                "resource": resource,
                "action": action,
            },
        )

        ups = [
            dict(zip(("collectionid", "userid", "resource", "action"), r))
            for r in cursor.fetchall()
        ]
    return ups

def _get_role_policies(collectionid: int | None, userid: int, resource: str, action: str):
    with connection.cursor() as cursor:
        cursor.execute(
            """
        select r.id, r.name, resource, action
        from spuserrole ur
        join sprole r on r.id = ur.role_id
        join sprolepolicy rp on rp.role_id = r.id
        where ur.specifyuser_id = %(userid)s
        and collection_id = %(collectionid)s
        and %(resource)s like resource
        and %(action)s like action
        """,
            {
                "collectionid": collectionid,
                "userid": userid,
                "resource": resource,
                "action": action,
            },
        )

        rps = [
            dict(zip(("roleid", "rolename", "resource", "action"), r))
            for r in cursor.fetchall()
        ]
    return rps

def query(
    collectionid: int | None, userid: int, resource: str, action: str
) -> QueryResult:
    def get_query_result():
        user_policies = _get_spuser_policies(
            collectionid=collectionid,
            userid=userid,
            resource=resource,
            action=action
        )

        role_policies = _get_role_policies(
            collectionid=collectionid,
            userid=userid,
            resource=resource,
            action=action
        )

        return QueryResult(
            allowed=(bool(user_policies) or bool(role_policies)),
            matching_user_policies=user_policies,
            matching_role_policies=role_policies
        )
    request = PermRequest(collectionid, userid, resource, action)
    return _permission_query_cache.get_or_set(request, get_query_result)

def has_permission_in_scope(
    scope: Model, userid: int, resource: str, action: str
) -> bool:
    """Require collection access and the action in one collection in the scope.

    Grants in different collections cannot be combined. Shared scopes allow
    access through any qualifying collection, using the existing policy rules.
    """
    collection_ids = Scoping.collections_for_scope(scope).values_list("id", flat=True)
    return any(
        query_pt(collectionid, userid, CollectionAccessPT.access).allowed
        and query(collectionid, userid, resource, action).allowed
        for collectionid in collection_ids
    )

def filter_scoped_read_queryset(queryset: QuerySet, actor) -> QuerySet:
    """Apply shared scope rules using collections granting both access and read."""
    userid = _actor_userid(actor)
    resource = f"/table/{queryset.model.specify_model.name.lower()}"
    allowed_ids = [
        collectionid for collectionid in models.Collection.objects.values_list("id", flat=True)
        if query_pt(collectionid, userid, CollectionAccessPT.access).allowed
        and query(collectionid, userid, resource, "read").allowed
    ]
    return Scoping.filter_queryset(
        queryset, models.Collection.objects.filter(id__in=allowed_ids),
    )

def filter_forward_related_read_queryset(
    queryset: QuerySet, fields: Iterable[str], actor
) -> QuerySet:
    """Filter forward FK field paths by each related record's read scope.

    Includes terminal FK names and their raw ``_id`` aliases.
    Null relationships remain visible. Reverse and to-many paths are not
    handled here, because their joins require separate authorization semantics.
    """
    checked_paths = set()
    for projection in fields:
        model = queryset.model
        path = []
        relation_field = None
        for name in projection.split("__"):
            try:
                field = model._meta.pk if name == "pk" else model._meta.get_field(name)
            except FieldDoesNotExist as error:
                if relation_field is not None and relation_field.get_lookup(name) is not None:
                    break
                raise FieldError(str(error)) from error
            if not isinstance(field, ForeignKey):
                break
            path.append(field.name)
            model = field.related_model
            relation_field = field
            lookup = "__".join(path)
            if lookup in checked_paths:
                continue
            allowed = filter_scoped_read_queryset(model.objects.all(), actor)
            queryset = queryset.filter(
                Q(**{f"{lookup}__isnull": True})
                | Q(**{f"{lookup}__in": allowed.values("pk")})
            )
            checked_paths.add(lookup)
    return queryset

def prepare_reverse_related_read_queryset(
    queryset: QuerySet, fields: Iterable[str], actor, *,
    joins: dict[str, str] | None = None,
) -> tuple[QuerySet, dict[str, str]]:
    """Build readable reverse FK joins and return replacement query paths.

    All projections, filters, and ordering must use the replacements so that
    they refer to the same readable children. Authorization belongs in the
    join's ON clause to preserve parents with no readable children.
    Forward hops after a reverse join are restricted in the same way.
    Reuse ``joins`` when preparing more paths on the returned queryset.
    """
    if joins is None:
        joins = {}
    replacements: dict[str, str] = {}
    for projection in fields:
        model = queryset.model
        source_path = []
        path = []
        reverse = False
        relation_field = None
        names = projection.split("__")
        for index, name in enumerate(names):
            try:
                field = model._meta.pk if name == "pk" else model._meta.get_field(name)
            except FieldDoesNotExist as error:
                if relation_field is not None and relation_field.get_lookup(name) is not None:
                    path.extend(names[index:])
                    break
                raise FieldError(str(error)) from error
            if not isinstance(field, (ForeignKey, ManyToOneRel)):
                path.extend(names[index:])
                break
            source_path.append(field.name)
            reverse = reverse or isinstance(field, ManyToOneRel)
            model = field.related_model
            relation_field = field.field if isinstance(field, ManyToOneRel) else field
            if reverse:
                source = "__".join(source_path)
                if source not in joins:
                    alias = f"_scope_read_{len(joins)}"
                    lookup = "__".join([*path, field.name])
                    allowed = filter_scoped_read_queryset(model.objects.all(), actor)
                    queryset = queryset.alias(**{
                        alias: FilteredRelation(
                            lookup, condition=Q(Exists(allowed.filter(pk=OuterRef(alias)))),
                        ),
                    })
                    joins[source] = alias
                path = [joins[source]]
            else:
                path.append(name)
        replacements[projection] = "__".join(path)
    return queryset, replacements

@contextmanager
def cache_permission_queries():
    with (
        _permission_query_cache.activate()
    ):
        yield

TABLE_ACTION = Literal["read", "create", "update", "delete"]

def _enforce_in_scope(scope: Model, actor, resources: list[str], action: str) -> None:
    if not resources:
        return
    userid = _actor_userid(actor)
    denied_resources = [
        resource for resource in resources
        if not has_permission_in_scope(scope, userid, resource, action)
    ]
    if denied_resources:
        collection_ids = Scoping.collections_for_scope(scope).values_list("id", flat=True)
        denials = [
            PermRequest(collectionid, userid, resource, action)
            for collectionid in collection_ids
            for resource in denied_resources
        ]
        logger.debug("record scope permission denied: %s, scope=%s", denials, scope)
        raise NoMatchingRuleException(denials)


def check_permission_in_scope(
    scope: Model, actor, resource: str, action: str
) -> None:
    """Require a resource action using the same actual-scope rules as record checks."""
    _enforce_in_scope(scope, actor, [resource], action)


def check_table_permissions(
    collection, actor, obj, action: TABLE_ACTION, *, scope: Model | None = None
) -> None:
    """Check instances in record or captured scope; model/table checks use collection."""
    if isinstance(obj, Table):
        name = obj.name.lower()
    else:
        name = obj.specify_model.name.lower()
    if isinstance(obj, Model):
        resolved_scope = scope if scope is not None else Scoping.scope_for_record(obj)
        _enforce_in_scope(resolved_scope, actor, [f"/table/{name}"], action)
        return
    enforce(collection, actor, [f"/table/{name}"], action)

def has_table_permission(collection_id, user_id, table_name: str, action: TABLE_ACTION) -> bool:
    return query(collection_id, user_id, f'/table/{table_name.lower()}', action).allowed

def check_field_permissions(
    collection, actor, obj, fields: Iterable[str], action: str, *, scope: Model | None = None
) -> None:
    """Check instance updates in record scope, optionally using a captured scope."""
    if isinstance(obj, Table):
        table = obj.name.lower()
    else:
        table = obj.specify_model.name.lower()
    resources = [f"/field/{table}/{field}" for field in fields]
    if action == "update" and isinstance(obj, Model):
        if resources:
            resolved_scope = scope if scope is not None else Scoping.scope_for_record(obj)
            _enforce_in_scope(resolved_scope, actor, resources, action)
        return
    enforce(collection, actor, resources, action)

def table_permissions_checker(collection, actor, action: TABLE_ACTION) -> Callable[[Any], None]:
    def checker(obj) -> None:
        check_table_permissions(collection, actor, obj, action)

    return checker


def skip_collection_access_check(view):
    view.__skip_sp_collection_access_check = True
    return view


class CollectionAccessPT(PermissionTarget):
    resource = "/system/sp7/collection"
    access = PermissionTargetAction()

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
from django.db.models import Exists, FilteredRelation, ForeignKey, Model, OuterRef, QuerySet, Q
from django.db.models.fields.reverse_related import ManyToOneRel

from specifyweb.specify.models import Agent, Discipline, Division, Institution
from specifyweb.specify.datamodel import Table
from specifyweb.specify.utils.scoping import Scoping, ScopeType
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

_permitted_collection_cache = ThreadCache[PermRequest, frozenset[int]](
    ContextVar("permitted_collection_cache", default=None)
)
_scope_collection_cache = ThreadCache[
    tuple[tuple[str, int | None], ...] | None, frozenset[int]
](
    ContextVar("scope_collection_cache", default=None)
)
_scope_path_cache = ThreadCache[type[Model], tuple[ScopeType, str | None]](
    ContextVar("scope_path_cache", default=None)
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

@contextmanager
def cache_permission_queries():
    with (
        _permission_query_cache.activate(),
        _permitted_collection_cache.activate(),
        _scope_collection_cache.activate(),
        _scope_path_cache.activate(),
    ):
        yield


def invalidate_collection_scope_cache(obj: Model) -> None:
    if isinstance(obj, (models.Collection, Discipline, Division, Institution)):
        _permission_query_cache.clear_keys()
        _permitted_collection_cache.clear_keys()
        _scope_collection_cache.clear_keys()
        _scope_path_cache.clear_keys()


TABLE_ACTION = Literal["read", "create", "update", "delete"]

def _permitted_collection_ids(actor, resource: str, action: str) -> frozenset[int]:
    userid = _actor_userid(actor)

    def calculate():
        collection_ids = _scope_collection_cache.get_or_set(
            (), lambda: frozenset(models.Collection.objects.values_list('id', flat=True)),
        )
        return frozenset(
            collectionid for collectionid in collection_ids
            if query_pt(collectionid, userid, CollectionAccessPT.access).allowed
            and query(collectionid, userid, resource, action).allowed
        )

    return _permitted_collection_cache.get_or_set(
        PermRequest(None, userid, resource, action), calculate,
    )


def permitted_collections(actor, resource: str, action: str) -> QuerySet:
    return models.Collection.objects.filter(pk__in=_permitted_collection_ids(actor, resource, action))


def _record_collection_ids(obj: Model, *, destination: bool = False) -> frozenset[int]:
    """Cache scope values, intersecting current owning scopes for mutations."""
    scope_path = _scope_path_cache.get_or_set(
        type(obj), lambda: Scoping.record_scope_path(type(obj)),
    )
    filters = Scoping.record_scope_filter(obj, scope_path=scope_path)
    key = None if filters is None else tuple(sorted(filters.items()))
    collection_ids = _scope_collection_cache.get_or_set(
        key, lambda: frozenset(Scoping.collections_for_record(obj).values_list('pk', flat=True)),
    )
    if destination:
        for name in Scoping.collection_owner_fields(type(obj)):
            parent = getattr(obj, name)
            if parent is not None:
                collection_ids &= _record_collection_ids(parent, destination=True)
    return collection_ids


def enforce_record(
    actor, obj: Model, resources: list[str], action: str, *,
    collections: QuerySet | None = None, destination: bool = False,
) -> None:
    """Require scope grants, using global grants for existing empty hierarchy records."""
    if not resources:
        return
    userid = _actor_userid(actor)
    candidates = (
        _record_collection_ids(obj, destination=destination) if collections is None
        else frozenset(collections.values_list('pk', flat=True))
    )
    if destination and collections is not None:
        candidates &= _record_collection_ids(obj, destination=True)
    if (
        not candidates
        and isinstance(obj, (Discipline, Division, Institution))
        and obj.pk is not None
        and (collections is None or not _record_collection_ids(obj))
        and type(obj).objects.filter(pk=obj.pk).exists()
    ):
        enforce(None, actor, resources, action)
        return
    denials = []
    for resource in resources:
        if candidates.isdisjoint(_permitted_collection_ids(actor, resource, action)):
            denials.extend(
                PermRequest(collectionid, userid, resource, action)
                for collectionid in sorted(candidates) or [None]
            )
    if denials:
        logger.debug("record permission denied: %s, model=%s, pk=%s", denials, obj._meta.label, obj.pk)
        raise NoMatchingRuleException(denials)


def filter_readable(queryset: QuerySet, actor) -> QuerySet:
    resource = f'/table/{queryset.model.specify_model.name.lower()}'
    return Scoping.filter_records(queryset, permitted_collections(actor, resource, 'read'))


def prepare_read_queryset(
    queryset: QuerySet, actor, paths: Iterable[str],
) -> tuple[QuerySet, dict[str, str]]:
    """Authorize joins before filtering, ordering or projecting related fields."""
    queryset = filter_readable(queryset, actor)
    joins = {}
    aliases = {}
    for projection in paths:
        model = queryset.model
        source = []
        path = []
        relation_field = None
        for name in projection.split('__'):
            try:
                field = model._meta.pk if name == 'pk' else model._meta.get_field(name)
            except FieldDoesNotExist as error:
                if relation_field is not None and relation_field.get_lookup(name) is not None:
                    path.append(name)
                    continue
                raise FieldError(str(error)) from error
            if not isinstance(field, (ForeignKey, ManyToOneRel)):
                path.extend(projection.split('__')[len(source):])
                break
            source.append(field.name)
            model = field.related_model
            relation_field = field.field if isinstance(field, ManyToOneRel) else field
            key = '__'.join(source)
            if key not in joins:
                alias = f'_read_scope_{len(joins)}'
                allowed = filter_readable(model.objects.all(), actor)
                queryset = queryset.alias(**{
                    alias: FilteredRelation(
                        '__'.join([*path, field.name]),
                        condition=Q(Exists(allowed.filter(pk=OuterRef(alias)))),
                    ),
                })
                joins[key] = alias
            path = [joins[key]]
        aliases[projection] = '__'.join(path)
    return queryset, aliases


def check_table_permissions(
    collection, actor, obj, action: TABLE_ACTION, *, destination: bool = False,
) -> None:
    if isinstance(obj, Table):
        name = obj.name.lower()
    else:
        name = obj.specify_model.name.lower()
    if isinstance(obj, Model):
        enforce_record(actor, obj, [f"/table/{name}"], action, destination=destination)
    else:
        enforce(collection, actor, [f"/table/{name}"], action)

def has_table_permission(collection_id, user_id, table_name: str, action: TABLE_ACTION) -> bool:
    return query(collection_id, user_id, f'/table/{table_name.lower()}', action).allowed

def check_field_permissions(
    collection, actor, obj, fields: Iterable[str], action: str, *,
    collections: QuerySet | None = None,
) -> None:
    if isinstance(obj, Table):
        table = obj.name.lower()
    else:
        table = obj.specify_model.name.lower()
    resources = [f"/field/{table}/{field}" for field in fields]
    if isinstance(obj, Model):
        enforce_record(actor, obj, resources, action, collections=collections)
    else:
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

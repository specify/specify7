from typing import Any, Callable, Tuple, List, Dict, Union, Iterable, Optional, NamedTuple

import logging
logger = logging.getLogger(__name__)

from django.db import connection
from django.db.models import Model
from django.core.exceptions import ObjectDoesNotExist

from specifyweb.specify import models as spmodels

from . import models

Agent = getattr(spmodels, 'Agent')

registry: Dict[str, List[str]] = dict()

class PermissionTargetAction:
    _resource = "undefined"
    _action = "undefined"

    def resource(self) -> str:
        return self._resource

    def action(self) -> str:
        return self._action


class PermissionTargetMeta(type):
    def __new__(cls, name, bases, attrs):
        if bases: # skip PermissionsTarget base class
            resource: str = attrs['resource']
            assert resource not in registry

            actions = registry[resource] = []

            for k, v in attrs.items():
                if isinstance(v, PermissionTargetAction):
                    v._resource = attrs['resource']
                    v._action = k
                    actions.append(k)

        return super(PermissionTargetMeta, cls).__new__(cls, name, bases, attrs)

class PermissionTarget(metaclass=PermissionTargetMeta):
    pass

class PermRequest(NamedTuple):
    collectionid: Optional[int]
    userid: int
    resource: str
    action: str

def check_permission_targets(collectionid: Optional[int], userid: int, targets: List[PermissionTargetAction]) -> None:
    if not targets: return

    perm_requests = [PermRequest(collectionid, userid, t.resource(), t.action()) for t in targets]
    results = [(r, *query(*r)) for r in perm_requests]
    logger.debug("permissions check: %s", results)

    denials = [r for r, allowed, _, _ in results if not allowed]
    if denials:
        raise NoMatchingRuleException(denials)

class PermissionsException(Exception):
    http_status = 500

    def to_json(self) -> Dict:
        return {'PermissionsException': repr(self)}

class NoMatchingRuleException(PermissionsException):
    http_status = 403

    def __init__(self, denials: List[PermRequest]):
        self.denials = denials

    def to_json(self) -> Dict:
        return {'NoMatchingRuleException': [d._asdict() for d in self.denials]}

class NoAdminUsersException(PermissionsException):
    http_status = 400

    def to_json(self) -> Dict:
        return {'NoAdminUsersException': {}}

def enforce(collection: Union[int, Model, None], actor, resources: List[str], action: str) -> None:
    if not resources: return

    if isinstance(actor, Agent):
        userid = actor.specifyuser_id
    else:
        assert isinstance(actor, models.Specifyuser)
        userid = actor.id

    if userid is None:
        raise PermissionsException(f"agent {actor} is not a Specify user")

    if isinstance(collection, int) or collection is None:
        collectionid = collection
    else:
        assert isinstance(collection, models.Collection)
        collectionid = collection.id

    perm_requests = [PermRequest(collectionid, userid, resource, action) for resource in resources]
    results = [(r, *query(*r)) for r in perm_requests]
    logger.debug("permissions check: %s", results)

    denials = [r for r, allowed, _, _ in results if not allowed]
    if denials:
        raise NoMatchingRuleException(denials)

class QueryResult(NamedTuple):
    allowed: bool
    matching_user_policies: List
    matching_role_policies: List

def query_pt(collectionid: Optional[int], userid: int, target: PermissionTargetAction) -> QueryResult:
    return query(collectionid, userid, target.resource(), target.action())

def query(collectionid: Optional[int], userid: int, resource: str, action: str) -> QueryResult:
    cursor = connection.cursor()

    cursor.execute("""
    select collection_id, specifyuser_id, resource, action
    from spuserpolicy
    where (collection_id = %(collectionid)s or collection_id is null)
    and (specifyuser_id = %(userid)s or specifyuser_id is null)
    and %(resource)s like resource
    and %(action)s like action
    """, {
        'collectionid': collectionid,
        'userid': userid,
        'resource': resource,
        'action': action
    })

    ups = [
        dict(zip(("collectionid", "userid", "resource", "action"), r))
        for r in cursor.fetchall()
    ]

    cursor.execute("""
    select r.id, r.name, resource, action
    from spuserrole ur
    join sprole r on r.id = ur.role_id
    join sprolepolicy rp on rp.role_id = r.id
    where ur.specifyuser_id = %(userid)s
    and collection_id = %(collectionid)s
    and %(resource)s like resource
    and %(action)s like action
    """, {
        'collectionid': collectionid,
        'userid': userid,
        'resource': resource,
        'action': action
    })

    rps = [
        dict(zip(("roleid", "rolename", "resource", "action"), r))
        for r in cursor.fetchall()
    ]

    return QueryResult(
        allowed=bool(ups) or bool(rps),
        matching_user_policies=ups,
        matching_role_policies=rps,
    )


def check_table_permissions(collection, actor, obj, action: str) -> None:
    name = obj.specify_model.name.lower()
    enforce(collection, actor, [f'/table/{name}'], action)

def check_field_permissions(collection, actor, obj, fields: Iterable[str], action: str) -> None:
    table = obj.specify_model.name.lower()
    enforce(collection, actor, [f'/field/{table}/{field}' for field in fields], action)

def table_permissions_checker(collection, actor, action: str) -> Callable[[Any], None]:
    def checker(obj) -> None:
        check_table_permissions(collection, actor, obj, action)
    return checker

def skip_collection_access_check(view):
    view.__skip_sp_collection_access_check = True
    return view

class CollectionAccessPT(PermissionTarget):
    resource = "/system/sp7/collection"
    access = PermissionTargetAction()


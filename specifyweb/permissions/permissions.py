from typing import Any, Callable, Tuple, List, Dict, Union, Iterable, Optional

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

def check_permission_targets(collectionid: Optional[int], userid: int, targets: List[PermissionTargetAction]) -> None:
    if not targets: return

    perm_requests = [(collectionid, userid, t.resource(), t.action()) for t in targets]
    results = [(r, *enforce_single(*r)) for r in perm_requests]
    logger.debug("permissions check: %s", results)

    denials = [(r, reason) for r, allowed, reason in results if not allowed]
    if denials:
        raise AccessDeniedException(denials)

class AccessDeniedException(Exception):
    pass

def enforce(collection: Union[int, Model, None], actor, resources: List[str], action: str) -> None:
    if not resources: return

    if isinstance(actor, Agent):
        userid = actor.specifyuser_id
    else:
        assert isinstance(actor, models.Specifyuser)
        userid = actor.id

    if userid is None:
        raise AccessDeniedException(f"agent {actor} is not a Specify user")

    if isinstance(collection, int) or collection is None:
        collectionid = collection
    else:
        assert isinstance(collection, models.Collection)
        collectionid = collection.id

    perm_requests = [(collectionid, userid, resource, action) for resource in resources]
    results = [(r, *enforce_single(*r)) for r in perm_requests]
    logger.debug("permissions check: %s", results)

    denials = [(r, reason) for r, allowed, reason in results if not allowed]
    if denials:
        raise AccessDeniedException(denials)

def enforce_single(collectionid: Optional[int] , userid: int, resource: str, action: str) -> Tuple[bool, Any]:
    cursor = connection.cursor()

    cursor.execute("""
    select *
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

    ups = cursor.fetchall()

    cursor.execute("""
    select *
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

    rps = cursor.fetchall()

    return (bool(ups) or bool(rps)), ups + rps


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

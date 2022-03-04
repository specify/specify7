from typing import Any, Callable, Tuple, List

import logging
logger = logging.getLogger(__name__)

from django.db import connection
from django.core.exceptions import ObjectDoesNotExist

from . import models


policy = """
p, abentley, 4, /table/*, read, allow
p, abentley, 4, /table/*, update, allow
p, abentley, 4, /table/*, create, allow
p, abentley, 4, /field/collectingevent/remarks, update, allow
p, abentley, 4, /field/determination/remarks, update, allow

p, testuser, *, /table/*, create, allow
p, testuser, *, /table/*, update, allow
p, testuser, *, /table/*, delete, allow
p, testuser, *, /field/*, update, allow

p, fullaccess, 4, /field/*, update, allow
#p, fullaccess, 4, /field/determination/remarks, update, deny

g, abentley, fullaccess, 4
g, abentley, groupA, 4


"""


class AccessDeniedException(Exception):
    pass

def enforce(collection, agent, resources: List[str], action: str) -> None:
    if not resources: return

    userid = agent.specifyuser_id

    if userid is None:
        raise AccessDeniedException(f"agent {agent} is not a Specify user")

    perm_requests = [(collection.id, userid, resource, action) for resource in resources]
    results = [(r, *enforce_single(*r)) for r in perm_requests]
    logger.debug("permissions check: %s", results)

    denials = [(r, reason) for r, allowed, reason in results if not allowed]
    if denials:
        raise AccessDeniedException(denials)

def enforce_single(collectionid: int , userid: int, resource: str, action: str) -> Tuple[bool, Any]:
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


def check_table_permissions(collection, agent, obj, action):
    name = obj.specify_model.name.lower()
    enforce(collection, agent, [f'/table/{name}'], action)

def check_field_permissions(collection, agent, obj, fields, action):
    table = obj.specify_model.name.lower()
    enforce(collection, agent, [f'/field/{table}/{field}' for field in fields], action)

def table_permissions_checker(collection, agent, action) -> Callable[[Any], None]:
    def checker(obj) -> None:
        check_table_permissions(collection, agent, obj, action)
    return checker

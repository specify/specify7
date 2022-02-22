import logging
logger = logging.getLogger(__name__)

from django.core.exceptions import ObjectDoesNotExist

import casbin

enforcer = casbin.Enforcer("/home/ben/perm_model.conf", "/home/ben/perm_policy.csv")

class AccessDeniedException(Exception):
    pass

def enforce(collection, agent, resources, action):
    if not resources: return

    try:
        subject = agent.specifyuser.name
    except ObjectDoesNotExist:
        raise AccessDeniedException(f"agent {agent} is not a Specify user")

    perm_requests = [(subject, str(collection.id), resource, action) for resource in resources]
    results = [(r, *enforcer.enforce_ex(*r)) for r in perm_requests]
    logger.debug("permissions check: %s", results)

    denials = [(r, reason) for r, allowed, reason in results if not allowed]
    if denials:
        raise AccessDeniedException(denials)

def check_table_permissions(collection, agent, obj, action):
    name = obj.specify_model.name.lower()
    enforce(collection, agent, [f'/table/{name}'], action)

def check_field_permissions(collection, agent, obj, fields, action):
    table = obj.specify_model.name.lower()
    enforce(collection, agent, [f'/field/{table}/{field}' for field in fields], action)


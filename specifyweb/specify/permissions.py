import logging
logger = logging.getLogger(__name__)

from django.core.exceptions import ObjectDoesNotExist

import casbin
from casbin import persist

model = casbin.Enforcer.new_model(text="""
[request_definition]
r = sub, dom, obj, act

[policy_definition]
p = sub, dom, obj, act, eft

[role_definition]
g = _, _, _

[policy_effect]
e = some(where (p.eft == allow)) && !some(where (p.eft == deny))

[matchers]
m = ((r.sub == p.sub && r.dom == p.dom) || g(r.sub, p.sub, r.dom)) && keyMatch(r.obj, p.obj) && r.act == p.act
""")

policy = """
p, abentley, 4, /table/*, read, allow
p, abentley, 4, /table/*, update, allow
p, abentley, 4, /table/*, create, allow
p, abentley, 4, /field/collectingevent/remarks, update, allow
p, abentley, 4, /field/determination/remarks, update, allow

p, fullaccess, 4, /field/*, update, allow
#p, fullaccess, 4, /field/determination/remarks, update, deny

g, abentley, fullaccess, 4
g, abentley, groupA, 4


"""

class SpAdapter(persist.Adapter):
    def load_policy(self, model):
        for line in policy.splitlines():
            persist.load_policy_line(line, model)

adapter = SpAdapter()

enforcer = casbin.Enforcer(model, adapter)

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


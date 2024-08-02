import logging
from typing import Any, NamedTuple, Optional, Union

from specifyweb.specify.auditlog import AuditLog
from specifyweb.permissions.permissions import check_table_permissions
from specifyweb.specify.models import Agent

logger = logging.getLogger(__name__)

class Auditor(NamedTuple):
    collection: Any
    audit_log: Optional[AuditLog]
    skip_create_permission_check: bool = False
    def insert(self, inserted_obj: Any, agent: Union[int, Any], parent_record: Optional[Any]) -> None:

        if agent is None:
            logger.warn('WB inserting %s with no createdbyagent. Skipping permissions check.', inserted_obj)
        elif not self.skip_create_permission_check:
            if isinstance(agent, int):
                # TODO: Optimize this potential w/ just memoization
                agent_obj = Agent.objects.get(id=agent)

            check_table_permissions(self.collection, agent_obj, inserted_obj, "create")

        if self.audit_log is not None:
            self.audit_log.insert(inserted_obj, agent, parent_record)

import logging
from typing import Any, Callable, List, Literal, NamedTuple, Optional, Union


from specifyweb.specify.auditlog import AuditLog
from specifyweb.permissions.permissions import PERMISSION_ACTIONS, check_table_permissions
from specifyweb.specify.models import Agent
from specifyweb.specify.field_change_info import FieldChangeInfo

logger = logging.getLogger(__name__)

class Auditor(NamedTuple):
    collection: Any
    audit_log: Optional[AuditLog]
    skip_create_permission_check: bool = False
    agent: Optional[Agent] = None

    def pre_log(self, obj: Any, action_name: PERMISSION_ACTIONS):
        if self.skip_create_permission_check:
            return
        if self.agent is None:
            logger.warning("WB %s %s with no agent. Skipping Permissions check", action_name, obj)
            return
        check_table_permissions(self.collection, self.agent, obj, action_name)
        return 
    
    def insert(self, inserted_obj: Any, parent_record: Optional[Any]) -> None:
        self.pre_log(inserted_obj, 'create')

        if self.audit_log is not None:
            self.audit_log.insert(inserted_obj, self.agent, parent_record)
    
    def delete(self, deleted_obj: Any, parent_record: Optional[Any]) -> None:
        self.pre_log(deleted_obj, 'delete')

        if self.audit_log is not None:
            self.audit_log.remove(deleted_obj, self.agent, parent_record)
        
    def update(self, updated_obj: Any, parent_obj, dirty_fields: List[FieldChangeInfo]) -> None:
        self.pre_log(updated_obj, 'update')
        if self.audit_log is not None:
            self.audit_log.update(updated_obj, self.agent, parent_obj, dirty_fields)
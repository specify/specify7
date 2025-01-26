import logging
from typing import Any, List, NamedTuple, Optional, TypedDict, Union


from specifyweb.specify.auditlog import AuditLog
from specifyweb.permissions.permissions import (
    TABLE_ACTION,
    check_table_permissions,
)
from specifyweb.specify.models import Agent
from specifyweb.specify.field_change_info import FieldChangeInfo

logger = logging.getLogger(__name__)


class BatchEditPrefs(TypedDict):
    # If set to True, it means the value from the database of a record
    # is not used to match the record
    deferForMatch: bool
    # If set to True, it means value from the database of a record 
    # is not used to determine if the record is "null". If a record is Null
    # it can possibly be deleted (depending on if it is a dependent or not)
    deferForNullCheck: bool

class AuditorProps(NamedTuple):
    # If set to True, dependents are allowed to be deleted.
    # Otherwise, if they _can_ be deleted, they are instead force-saved.
    allow_delete_dependents: bool
    batch_edit_prefs: BatchEditPrefs


# For unit tests + defaults
DEFAULT_BATCH_EDIT_PREFS = BatchEditPrefs(deferForMatch=True, deferForNullCheck=False)
DEFAULT_AUDITOR_PROPS = AuditorProps(
    allow_delete_dependents=True, batch_edit_prefs=DEFAULT_BATCH_EDIT_PREFS
)


class Auditor(NamedTuple):
    collection: Any
    props: AuditorProps
    audit_log: Optional[AuditLog]
    skip_create_permission_check: bool = False
    agent: Optional[Agent] = None

    def pre_log(self, obj: Any, action_name: TABLE_ACTION):
        if self.skip_create_permission_check:
            return
        if self.agent is None:
            logger.warning(
                "WB %s %s with no agent. Skipping Permissions check", action_name, obj
            )
            return
        check_table_permissions(self.collection, self.agent, obj, action_name)
        return

    def insert(self, inserted_obj: Any, parent_record: Optional[Any]) -> None:
        self.pre_log(inserted_obj, "create")

        if self.audit_log is not None:
            self.audit_log.insert(inserted_obj, self.agent, parent_record)

    def delete(self, deleted_obj: Any, parent_record: Optional[Any]) -> None:
        self.pre_log(deleted_obj, "delete")

        if self.audit_log is not None:
            self.audit_log.remove(deleted_obj, self.agent, parent_record)

    def update(
        self, updated_obj: Any, parent_obj, dirty_fields: List[FieldChangeInfo]
    ) -> None:
        self.pre_log(updated_obj, "update")
        if self.audit_log is not None:
            self.audit_log.update(updated_obj, self.agent, parent_obj, dirty_fields)

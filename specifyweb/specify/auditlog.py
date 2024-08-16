import logging
from time import time
from typing import Any
from typing_extensions import TypedDict

from specifyweb.specify.field_change_info import FieldChangeInfo


logger = logging.getLogger(__name__)
import re

from django.db import connection
from django.conf import settings

from specifyweb.specify.models import Spauditlog
from specifyweb.specify.models import Spauditlogfield
from specifyweb.context.remote_prefs import get_remote_prefs, get_global_prefs
from specifyweb.specify.models import datamodel

Collection = datamodel.get_table_strict('Collection')
Discipline = datamodel.get_table_strict('Discipline')
Division = datamodel.get_table_strict('Division')


from . import auditcodes
    
class AuditLog(object):

    _auditingFlds = None
    _auditing = None
    _lastCheck = None
    _checkInterval = 900
    
    def isAuditingFlds(self):
        return self.isAuditing() and self._auditingFlds
        
    def isAuditing(self):
        if settings.DISABLE_AUDITING:
            return False
        if self._auditing is None or self._lastCheck is None or time() - self._lastCheck > self._checkInterval:
            match = re.search(r'auditing\.do_audits=(.+)', get_remote_prefs())
            if match is None:
                self._auditing = True
            else:
                self._auditing = False if match.group(1).lower() == 'false' else True
            match = re.search(r'auditing\.audit_field_updates=(.+)', get_remote_prefs())
            if match is None:
                self._auditingFlds = True
            else:
                self._auditingFlds = False if match.group(1).lower() == 'false' else True
            self.purge()
            self._lastCheck = time()
        return self._auditing;
    
    def update(self, obj, agent, parent_record, dirty_flds):
        self.log_action(auditcodes.UPDATE, obj, agent, parent_record, dirty_flds)
    
    def log_action(self, action, obj, agent, parent_record, dirty_flds):
        log_obj = self._log(action, obj, agent, parent_record)
        if log_obj is not None and self.isAuditingFlds():
            for vals in dirty_flds:
                self._log_fld_update(vals, log_obj, agent)
        return log_obj
        
    def insert(self, obj, agent, parent_record=None):
        return self._log(auditcodes.INSERT, obj, agent, parent_record)

    def remove(self, obj, agent, parent_record=None):
        log_obj = self._log(auditcodes.REMOVE, obj, agent, parent_record)
        if log_obj is not None:
            for spfld in obj.specify_model.fields:
                fldattr = spfld.name.lower()
                if fldattr != 'version' and hasattr(obj, fldattr):
                    val = getattr(obj, fldattr)
                    if val is not None:
                        self._log_fld_update(FieldChangeInfo(field_name=fldattr, old_value=val, new_value=None), log_obj, agent)
            for spfld in obj.specify_model.relationships:
                if spfld.type.lower().endswith("many-to-one"):
                    fldattr = spfld.name.lower()
                    if hasattr(obj, fldattr):
                        val = getattr(obj, fldattr)
                        field = obj._meta.get_field(fldattr);
                        if isinstance(val, field.related_model):
                            self._log_fld_update(FieldChangeInfo(field_name=fldattr, old_value=val.id, new_value=None), log_obj, agent)
                        elif isinstance(val, str) and not val.endswith('.None'):
                            fk_model, fk_id = parse_uri(val)
                            if fk_model == field.related_model.__name__.lower() and  fk_id is not None:
                                self._log_fld_update(FieldChangeInfo(field_name=fldattr, old_value=fk_id, new_value=None), log_obj, agent)
        return log_obj
        
    def _log(self, action, obj, agent, parent_record):
        agent_id = agent if isinstance(agent, int) else (agent and agent.id)
        if self.isAuditing():
            logger.info("inserting into auditlog: %s", [action, obj, agent, parent_record])
            assert obj.id is not None, "attempt to add object with null id to audit log"
            parentId = parent_record and parent_record.id
            parentTbl = parent_record and parent_record.specify_model.tableId
            if not parent_record:
                scoper, model = next(((s,m) for s,m in [
                    ('collectionmemberid', Collection),
                    ('collection_id', Collection),
                    ('discipline_id', Discipline),
                    ('division_id', Division),
                ] if hasattr(obj, s)), (None, None))
                scopeId = scoper and getattr(obj, scoper)
                if scopeId is not None:
                    parentId = scopeId
                    parentTbl = model.tableId

            return Spauditlog.objects.create(
                action=action,
                parentrecordid=parentId,
                parenttablenum=parentTbl,
                recordid=obj.id,
                recordversion=obj.version if hasattr(obj, 'version') else 0,
                tablenum=obj.specify_model.tableId,
                createdbyagent_id=agent_id,
                modifiedbyagent_id=agent_id)
    
    def _log_fld_update(self, vals, log, agent):
        agent_id = agent if isinstance(agent, int) else (agent and agent.id)
        newval = vals['new_value']
        if newval is not None:
            newval = str(vals['new_value'])[:(2**16 - 1)]
        oldval = vals['old_value']
        if oldval is not None:
            oldval = str(vals['old_value'])[:(2**16 - 1)]
        return Spauditlogfield.objects.create(
            fieldname=vals['field_name'],
            newvalue=newval,
            oldvalue=oldval,
            spauditlog=log,
            createdbyagent_id=agent_id,
            modifiedbyagent_id=agent_id)

    def purge(self):
        match = re.search(r'AUDIT_LIFESPAN_MONTHS=(.+)', get_global_prefs())
        logger.info("checking to see if purge is required")
        if match is not None:
            cursor = connection.cursor()
            sql = "delete from spauditlogfield where date_sub(curdate(), Interval " +  match.group(1).lower()+ " month) > timestampcreated"
            logger.info("purging audit log: %s", [sql]);
            cursor.execute(sql)
            sql = "delete from spauditlog where date_sub(curdate(), Interval " +  match.group(1).lower()+ " month) > timestampcreated"
            logger.info("purging audit log: %s", [sql]);
            cursor.execute(sql)
        return True
    
auditlog = AuditLog()

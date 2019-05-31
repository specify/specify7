import logging
logger = logging.getLogger(__name__)
import re

from specifyweb.specify.models import Spauditlog
from specifyweb.specify.models import Spauditlogfield
from django.db import connection
from specifyweb.context.app_resource import get_app_resource
from specifyweb.specify.models import datamodel, Spappresourcedata, Splocalecontainer, Splocalecontaineritem
from time import time

class AuditLog(object):
    INSERT = 0
    UPDATE = 1
    REMOVE = 2
    TREE_MERGE = 3
    TREE_MOVE = 4
    TREE_SYNONYMIZE = 5
    TREE_UNSYNONYMIZE = 6

    _auditingFlds = None
    _auditing = None
    _lastCheck = None
    _checkInterval = 5000
    
    def isAuditingFlds(self):
        return self.isAuditing() and self._auditingFlds
        
    def isAuditing(self):
        if self._auditing is None or self._lastCheck is None or time() - self._lastCheck > self. _checkInterval:
            res = Spappresourcedata.objects.filter(
                spappresource__name='preferences',
                spappresource__spappresourcedir__usertype='Prefs')
            remote_prefs = '\n'.join(r.data for r in res)
            match = re.search(r'auditing\.do_audits=(.+)', remote_prefs)
            if match is None:
                self._auditing = True
            else:
                self._auditing = False if match.group(1).lower() == 'false' else True
            match = re.search(r'auditing\.audit_field_updates=(.+)', remote_prefs)
            if match is None:
                self._auditingFlds = True
            else:
                self._auditingFlds = False if match.group(1).lower() == 'false' else True
            self.purge()
            self._lastCheck = time()
        return self._auditing;
    
    def update(self, obj, agent, parent_record, dirty_flds):
        self.log_action(self.UPDATE, obj, agent, parent_record, dirty_flds)
    
    def log_action(self, action, obj, agent, parent_record, dirty_flds):
        log_obj = self._log(action, obj, agent, parent_record)
        if log_obj is not None:
            for vals in dirty_flds:
                self._log_fld_update(vals, obj, log_obj, agent)
        return log_obj
        
    def insert(self, obj, agent, parent_record=None):
        return self._log(self.INSERT, obj, agent, parent_record)

    def remove(self, obj, agent, parent_record=None):
        return self._log(self.REMOVE, obj, agent, parent_record)

    def _log(self, action, obj, agent, parent_record):
        if self.isAuditing():
            logger.info("inserting into auditlog: %s", [action, obj, agent, parent_record])
            assert obj.id is not None, "attempt to add object with null id to audit log"
            return Spauditlog.objects.create(
                action=action,
                parentrecordid=parent_record and parent_record.id,
                parenttablenum=parent_record and parent_record.specify_model.tableId,
                recordid=obj.id,
                recordversion=obj.version,
                tablenum=obj.specify_model.tableId,
                createdbyagent=agent,
                modifiedbyagent=agent)
    
    def _log_fld_update(self, vals, obj, log, agent):
        return Spauditlogfield.objects.create(
            fieldname=vals['field_name'],
            newvalue=vals['new_value'],
            oldvalue=vals['old_value'],
            spauditlog=log,
            createdbyagent=agent,
            modifiedbyagent=agent)

    def purge(self):
        res = Spappresourcedata.objects.filter(
            spappresource__name='preferences',
            spappresource__spappresourcedir__usertype='Global Prefs')
        global_prefs = '\n'.join(r.data for r in res)
        match = re.search(r'AUDIT_LIFESPAN_MONTHS=(.+)', global_prefs)
        if match is not None:
            cursor = connection.cursor()
            sql = "delete from spauditlogfield where date_sub(curdate(), Interval " +  match.group(1).lower()+ " month) > timestampcreated"
            cursor.execute(sql)
            sql = "delete from spauditlog where date_sub(curdate(), Interval " +  match.group(1).lower()+ " month) > timestampcreated"
            cursor.execute(sql)
        return True
    
auditlog = AuditLog()

import logging
logger = logging.getLogger(__name__)
import re

from specifyweb.specify.models import Spauditlog
from specifyweb.specify.models import Spauditlogfield
from django.db import connection
from specifyweb.context.app_resource import get_app_resource
from specifyweb.specify.models import datamodel, Spappresourcedata, Splocalecontainer, Splocalecontaineritem
from time import time

from . import auditcodes

class AuditLog(object):

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
        self.log_action(auditcodes.UPDATE, obj, agent, parent_record, dirty_flds)
    
    def log_action(self, action, obj, agent, parent_record, dirty_flds):
        log_obj = self._log(action, obj, agent, parent_record)
        if log_obj is not None:
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
                        self._log_fld_update({'field_name': fldattr, 'old_value': val, 'new_value': None}, log_obj, agent)
            for spfld in obj.specify_model.relationships:
                if spfld.type.lower().endswith("many-to-one"):
                    fldattr = spfld.name.lower()
                    if hasattr(obj, fldattr):
                        val = getattr(obj, fldattr)
                        field = obj._meta.get_field(fldattr);
                        if isinstance(val, field.related_model):
                            self._log_fld_update({'field_name': fldattr, 'old_value': val.id, 'new_value': None}, log_obj, agent)
                        elif isinstance(val, basestring) and not val.endswith('.None'):
                            fk_model, fk_id = parse_uri(val)
                            if fk_model == field.related_model.__name__.lower() and  fk_id is not None:
                                self._log_fld_update({'field_name': fldattr, 'old_value': fk_id, 'new_value': None}, log_obj, agent)
        return log_obj
        
    def _log(self, action, obj, agent, parent_record):
        if self.isAuditing():
            logger.info("inserting into auditlog: %s", [action, obj, agent, parent_record])
            assert obj.id is not None, "attempt to add object with null id to audit log"
            parentId = parent_record and parent_record.id
            parentTbl = parent_record and parent_record.specify_model.tableId
            if not parent_record:
                scoper = next((s for s in ['collectionmember', 'collection', 'discipline', 'division'] if hasattr(obj, s)), None)
                scopeObj = scoper and getattr(obj, scoper)
                if scopeObj:
                    parentId = scopeObj.id
                    parentTbl = scopeObj.specify_model.tableId
                
            return Spauditlog.objects.create(
                action=action,
                parentrecordid=parentId,
                parenttablenum=parentTbl,
                recordid=obj.id,
                recordversion=obj.version,
                tablenum=obj.specify_model.tableId,
                createdbyagent=agent,
                modifiedbyagent=agent)
    
    def _log_fld_update(self, vals, log, agent):
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

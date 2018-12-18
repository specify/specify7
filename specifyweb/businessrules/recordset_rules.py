from .orm_signal_handler import orm_signal_handler

from django.db import connection

from specifyweb.specify import models
from specifyweb.specify.models import Recordsetitem

@orm_signal_handler('post_delete')
def remove_from_recordsets(sender, obj):
    if not hasattr(sender, 'specify_model'): return
    if sender in (models.Workbenchtemplate, models.Workbenchrow, models.Workbenchdataitem,
                  models.Workbenchtemplatemappingitem, models.Workbenchrowimage): return
    rsis = Recordsetitem.objects.filter(
        recordset__dbtableid=sender.specify_model.tableId,
        recordid=obj.id)
    rsis.delete()

@orm_signal_handler('pre_save', 'Recordset')
def recordset_pre_save(recordset):
    if recordset.specifyuser_id is None:
        recordset.specifyuser = recordset.createdbyagent.specifyuser

@orm_signal_handler('pre_delete', 'Recordset')
def recordset_pre_delete(recordset):
    cursor = connection.cursor()
    cursor.execute("delete from recordsetitem where recordsetid = %s", [recordset.id])

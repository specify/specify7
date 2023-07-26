import re

from django.db.models import Max

from .orm_signal_handler import orm_signal_handler
from specifyweb.specify.scoping import Scoping
from specifyweb.specify import models

from .exceptions import AbortSave

JOINTABLE_NAME_RE = re.compile('(.*)attachment')

attachment_tables = {model for model in list(models.models_by_tableid.values())
                     if model.__name__.endswith('attachment')}

tables_with_attachments = {getattr(models, model.__name__.replace('attachment', ''))
                           for model in attachment_tables}

@orm_signal_handler('pre_save')
def attachment_jointable_save(sender, obj):
    if sender not in attachment_tables: return

    if obj.attachment_id is None: raise AbortSave()

    attachee = get_attachee(obj)
    obj.attachment.tableid = attachee.specify_model.tableId
    obj.attachment.scopetype, obj.attachment.scopeid = Scoping(attachee)()
    obj.attachment.save()

@orm_signal_handler('post_delete')
def attachment_jointable_deletion(sender, obj):
    if sender in attachment_tables:
        obj.attachment.delete()

@orm_signal_handler('pre_save', 'Attachment')
def attachment_save(attachment):
    if attachment.id is None and attachment.tableid is None:
        # since tableid cannot be null, use Attachment table id as placeholder.
        # the actual table id will be set when the join row is saved. (see above)
        attachment.tableid = models.Attachment.specify_model.tableId

@orm_signal_handler('post_delete', 'Attachment')
def attachment_deletion(attachment):
    from specifyweb.attachment_gw.views import delete_attachment_file
    delete_attachment_file(attachment.attachmentlocation)

def get_attachee(jointable_inst):
    main_table_name = JOINTABLE_NAME_RE.match(jointable_inst.__class__.__name__).group(1)
    return getattr(jointable_inst, main_table_name.lower())


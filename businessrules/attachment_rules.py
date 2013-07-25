import re

from orm_signal_handler import orm_signal_handler
from specify import models
from attachment_gw.views import delete_attachment_file
from exceptions import AbortSave

JOINTABLE_NAME_RE = re.compile('(.*)attachment')

attachment_tables = [model for model in models.models_by_tableid.values()
                     if model.__name__.endswith('attachment')]

@orm_signal_handler('pre_save')
def attachment_save(sender, obj):
    if sender not in attachment_tables: return

    if obj.attachment_id is None: raise AbortSave()

    set_attachment_tableid(obj)
    obj.attachment.save()

@orm_signal_handler('post_delete')
def attachment_deletion(sender, obj):
    if sender in attachment_tables:
        delete_attachment_file(obj.attachment.attachmentlocation)
        obj.attachment.delete()


def set_attachment_tableid(jointable_inst):
    main_table_name = JOINTABLE_NAME_RE.match(jointable_inst.__class__.__name__).group(1)
    if main_table_name == 'Dnasequencerun':
        main_table_name = 'Dnasequencingrun'

    main_table = getattr(models, main_table_name)
    jointable_inst.attachment.tableid = main_table.table_id

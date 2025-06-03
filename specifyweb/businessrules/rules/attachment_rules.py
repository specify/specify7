import re

from specifyweb.businessrules.orm_signal_handler import orm_signal_handler
from specifyweb.specify.scoping import Scoping
from specifyweb.specify import models
from specifyweb.specify.models_by_table_id import get_model_by_table_id, models_iterator
from specifyweb.workbench.models import Spdataset, Spdatasetattachment
from django.db import transaction
from django.apps import apps

from specifyweb.businessrules.exceptions import AbortSave

JOINTABLE_NAME_RE = re.compile('(.*)attachment')

attachment_tables = {model for model in models_iterator()
                     if model.__name__.endswith('attachment')}

tables_with_attachments = {apps.get_model(model._meta.app_label, model.__name__.replace('attachment', ''))
                           for model in attachment_tables}


@orm_signal_handler('pre_save')
def attachment_jointable_save(sender, obj):
    if sender not in attachment_tables:
        return

    if obj.attachment_id is None:
        raise AbortSave()

    attachee = get_attachee(obj)
    obj.attachment.tableid = attachee.specify_model.tableId
    scopetype, scope = Scoping(attachee)()
    obj.attachment.scopetype, obj.attachment.scopeid = scopetype, scope.id
    obj.attachment.save()


@orm_signal_handler('post_delete')
def attachment_jointable_deletion(sender, obj):
    if sender in attachment_tables:
        # Uploaded data sets have attachments that are also referenced by the uploaded records.
        # Do not delete the attachment if it being referenced by a dataset.
        # And do not delete the attachment if it is being referenced by an attachment table.
        if sender == Spdatasetattachment:
            if obj.attachment.tableid != Spdataset.specify_model.tableId:
                parent_model = get_model_by_table_id(obj.attachment.tableid)
                jointable_model = get_jointable_model(parent_model)
                if jointable_model.objects.filter(attachment_id=obj.attachment_id).count() > 0:
                    return
        else:
            if Spdatasetattachment.objects.filter(attachment_id=obj.attachment_id).count() > 0:
                obj.attachment.tableid = Spdataset.specify_model.tableId
                obj.attachment.save()
                return
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
    if attachment.attachmentlocation is not None:
        delete_attachment_file(attachment.attachmentlocation)


def get_attachee(jointable_inst):
    main_table_name = JOINTABLE_NAME_RE.match(
        jointable_inst.__class__.__name__).group(1)
    return getattr(jointable_inst, main_table_name.lower())


def get_jointable_model(main_table_model):
    jointable_name = f"{main_table_model.__name__}attachment"
    return apps.get_model(main_table_model._meta.app_label, jointable_name)
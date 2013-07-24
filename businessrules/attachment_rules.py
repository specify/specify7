from orm_signal_handler import orm_signal_handler

from attachment_gw.views import delete_attachment_file

@orm_signal_handler('post_delete')
def attachment_deletion(sender, obj):
    if not sender.__name__.endswith('attachment') or \
       not hasattr(obj, 'attachment') or \
       obj.attachment is None: return

    delete_attachment_file(obj.attachment.attachmentlocation)
    obj.attachment.delete()

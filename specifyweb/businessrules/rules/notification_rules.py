from specifyweb.businessrules.orm_signal_handler import orm_signal_handler

@orm_signal_handler('post_delete', 'Message')
def message_deletion(message):
    from specifyweb.notifications.views import delete_message_file
    delete_message_file(message)
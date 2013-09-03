from .orm_signal_handler import orm_signal_handler
from specifyweb.specify.models import Specifyuser
from .exceptions import BusinessRuleException

@orm_signal_handler('pre_save', 'Groupperson')
def agent_cannot_be_in_self(groupperson):
    if groupperson.member_id == groupperson.group_id:
        raise BusinessRuleException('a group cannot be made a member of itself')

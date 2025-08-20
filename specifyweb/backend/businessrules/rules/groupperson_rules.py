from specifyweb.backend.businessrules.orm_signal_handler import orm_signal_handler
from django.db.models import Max
from specifyweb.specify.models import Groupperson
from specifyweb.backend.businessrules.exceptions import BusinessRuleException


@orm_signal_handler('pre_save', 'Groupperson')
def agent_cannot_be_in_self(groupperson):
    if groupperson.member_id == groupperson.group_id:
        raise BusinessRuleException(
            'a group cannot be made a member of itself',
            {"table": "GroupPerson",
             "fieldName": "member",
             "groupid": groupperson.group_id})


@orm_signal_handler('pre_save', 'Groupperson')
def grouppersion_pre_save(groupperson):
    if groupperson.id is None:
        if groupperson.ordernumber is None:
            # this should be atomic, but whatever
            others = Groupperson.objects.filter(group=groupperson.group)
            top = others.aggregate(Max('ordernumber'))['ordernumber__max'] or 0
            groupperson.ordernumber = top + 1

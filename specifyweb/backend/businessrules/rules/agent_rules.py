from specifyweb.businessrules.orm_signal_handler import orm_signal_handler
from specifyweb.specify.models import Specifyuser
from specifyweb.businessrules.exceptions import BusinessRuleException


@orm_signal_handler('pre_delete', 'Agent')
def agent_delete_blocked_by_related_specifyuser(agent):
    try:
        user = Specifyuser.objects.get(agents=agent)
    except Specifyuser.DoesNotExist:
        return
    raise BusinessRuleException(
        "agent cannot be deleted while associated with a specifyuser",
        {"table": "Agent",
         "fieldName": "specifyuser",
         "agentid": agent.id,
         "specifyuserid": user.id})

# Disabling this rule because system agents must be created separate from divisions
# @orm_signal_handler('pre_save', 'Agent')
# def agent_division_must_not_be_null(agent):
#     if agent.division is None:
#         raise BusinessRuleException(
#             "agent.division cannot be null",
#             {"table" : "Agent",
#              "fieldName" : "division",
#              "agentid" : agent.id})


@orm_signal_handler('pre_save', 'Agent')
def agent_types_other_and_group_do_not_have_addresses(agent):
    from specifyweb.specify.agent_types import agent_types
    if agent.agenttype is None:
        raise BusinessRuleException(
            "agenttype cannot be null",
            {"table": "Agent",
             "fieldName": "agenttype",
             "agentid": agent.id})

    # This Business Rule (Agents of type Other/Group can not have Addresses) was removed
    # See https://github.com/specify/specify7/issues/2518 for more information
    # if agent_types[agent.agenttype] in ('Other', 'Group'):
        # agent.addresses.all().delete()

from .orm_signal_handler import orm_signal_handler
from specifyweb.specify.models import Specifyuser
from .exceptions import BusinessRuleException

@orm_signal_handler('pre_delete', 'Agent')
def agent_delete_blocked_by_related_specifyuser(agent):
    try:
        Specifyuser.objects.get(agents=agent)
        user = Specifyuser.objects.get(agents=agent)
    except Specifyuser.DoesNotExist:
        return
    raise BusinessRuleException(
        "agent cannot be deleted while associated with a specifyuser", 
        {"table" : "Agent",
         "type" : "DELETE_AGENT_USER",
         "fieldName" : "specifyuser",
         "agentid" : agent.id, 
         "specifyuserid": user.id})

# Disabling this rule because system agents must be created separate from divisions
# @orm_signal_handler('pre_save', 'Agent')
# def agent_division_must_not_be_null(agent):
#     if agent.division is None:
#         raise BusinessRuleException(
#             "agent.division cannot be null",
#             {"table" : "Agent",
#              "type" : "NOT_NULL",
#              "fieldName" : "division",
#              "agentid" : agent.id})

@orm_signal_handler('pre_save', 'Agent')
def agent_types_other_and_group_do_not_have_addresses(agent):
    from specifyweb.specify.agent_types import agent_types
    if agent.agenttype is None:
        raise BusinessRuleException(
            "agenttype cannot be null", 
            {"table" : "Agent",
             "type" : "NOT_NULL",
             "fieldName" : "agenttype",
             "agentid" : agent.id})
    
    # Removing this for now. Need some way to check if the agent has any addresses.
    # if agent_types[agent.agenttype] in ('Other', 'Group'):
    #     raise BusinessRuleException(
    #         "agent of type Other or Group cannot have address", 
    #         {"table" : "Agent",
    #          "type" : "NOT_NULL",
    #          "fieldName" : "addresses",
    #          "agentid" : agent.id})
        # agent.addresses.all().delete()

from .orm_signal_handler import orm_signal_handler
from .exceptions import BusinessRuleException

@orm_signal_handler('pre_save', 'Accessionagent')
def agent_division_must_not_be_null(accessionagent):
    if accessionagent.agent_id is None:
        raise BusinessRuleException("AccessionAgent -> Agent relationship is required.")

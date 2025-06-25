from specifyweb.backend.businessrules.orm_signal_handler import orm_signal_handler
from specifyweb.backend.businessrules.exceptions import BusinessRuleException
from django.utils.translation import gettext as _


@orm_signal_handler('pre_save', 'Accessionagent')
def agent_division_must_not_be_null(accessionagent):
    if accessionagent.agent_id is None:
        raise BusinessRuleException(
            _("AccessionAgent -> Agent relationship is required."),
            {"table": "Accessionagent",
             "fieldName": "agent"})

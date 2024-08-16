from typing import Any, TypedDict
from specifyweb.accounts import models as acccounts_models
from specifyweb.attachment_gw import models as attachment_gw_models
from specifyweb.businessrules import models as businessrules_models
from specifyweb.context import models as context_models
from specifyweb.notifications import models as notifications_models
from specifyweb.permissions import models as permissions_models
from specifyweb.interactions import models as interactions_models
from specifyweb.workbench import models as workbench_models
from specifyweb.specify import models as spmodels

APP_MODELS = [spmodels, acccounts_models, attachment_gw_models, businessrules_models, context_models,
              notifications_models, permissions_models, interactions_models, workbench_models]

def get_app_model(model_name: str):
    for app in APP_MODELS:
        if hasattr(app, model_name):
            return getattr(app, model_name)
    return None
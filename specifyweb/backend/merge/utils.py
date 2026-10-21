from specifyweb.specify import models as spmodels
from specifyweb.backend.accounts import models as acccounts_models
from specifyweb.backend.attachment_gw import models as attachment_gw_models
from specifyweb.backend.businessrules import models as businessrules_models
from specifyweb.backend.context import models as context_models
from specifyweb.backend.notifications import models as notifications_models
from specifyweb.backend.permissions import models as permissions_models
from specifyweb.backend.interactions import models as interactions_models
from specifyweb.backend.workbench import models as workbench_models

APP_MODELS = [spmodels, acccounts_models, attachment_gw_models, businessrules_models, context_models,
              notifications_models, permissions_models, interactions_models, workbench_models]

def get_app_model(model_name: str):
    for app in APP_MODELS:
        if hasattr(app, model_name):
            return getattr(app, model_name)
    return None
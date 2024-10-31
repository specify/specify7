import sys
import logging
from specifyweb.accounts import models as acccounts_models
from specifyweb.attachment_gw import models as attachment_gw_models
from specifyweb.businessrules import models as businessrules_models
from specifyweb.context import models as context_models
from specifyweb.notifications import models as notifications_models
from specifyweb.permissions import models as permissions_models
from specifyweb.interactions import models as interactions_models
from specifyweb.workbench import models as workbench_models
from specifyweb.specify import models as spmodels
from django.conf import settings

logger = logging.getLogger(__name__)

APP_MODELS = [spmodels, acccounts_models, attachment_gw_models, businessrules_models, context_models,
              notifications_models, permissions_models, interactions_models, workbench_models]

def get_app_model(model_name: str):
    for app in APP_MODELS:
        if hasattr(app, model_name):
            return getattr(app, model_name)
    return None

def get_spmodel_class(model_name: str):
    try:
        return getattr(spmodels, model_name.capitalize())
    except AttributeError:
        pass
    # Iterate over all attributes in the models module
    for attr_name in dir(spmodels):
        # Check if the attribute name matches the model name case-insensitively
        if attr_name.lower() == model_name.lower():
            return getattr(spmodels, attr_name)
    raise AttributeError(f"Model '{model_name}' not found in models module.")

def log_sqlalchemy_query(query):
    from sqlalchemy.dialects import mysql
    compiled_query = query.statement.compile(dialect=mysql.dialect(), compile_kwargs={"literal_binds": True})
    raw_sql = str(compiled_query)
    logger.debug(raw_sql)
    # Run in the storred_queries.execute file, in the execute function, right before the return statement, line 546
    # from specifyweb.specify.utils import log_sqlalchemy_query; log_sqlalchemy_query(query)

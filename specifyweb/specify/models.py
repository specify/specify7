from .build_models import build_models
from .check_versions import check_versions
from .setup_user_model import setup_user_model

models_by_tableid = build_models(__name__)

# inject the model definitions into this module's namespace
globals().update((model.__name__, model)
                 for model in models_by_tableid.values())

check_versions(Spversion)
setup_user_model(Specifyuser)

# clean up namespace
del build_models, check_versions, setup_user_model

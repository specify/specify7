from build_models import build_models
from check_versions import check_versions

models_by_tableid = build_models(__name__)

# inject the model definitions into this module's namespace
globals().update((model.__name__, model)
                 for model in models_by_tableid.values())

check_versions(Spversion)

from .build_models import build_models
from .check_versions import check_versions
from .load_datamodel import load_datamodel

datamodel = load_datamodel()

models_by_tableid = build_models(__name__, datamodel)

# inject the model definitions into this module's namespace
globals().update((model.__name__, model)
                 for model in models_by_tableid.values())

#check_versions(Spversion)

# clean up namespace
del build_models, check_versions, load_datamodel

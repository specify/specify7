from build_models import build_models

models_by_tableid = build_models(__name__)

# inject the model definitions into this module's namespace
globals().update((model.__name__, model)
                 for model in models_by_tableid.values())


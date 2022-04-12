"""
Sets up Django ORM with the Specify datamodel
"""

from .build_models import build_models
from .check_versions import check_versions
from .datamodel import datamodel

models_by_tableid = build_models(__name__, datamodel)

# inject the model definitions into this module's namespace
globals().update((model.__name__, model)
                 for model in list(models_by_tableid.values()))

#check_versions(Spversion)

# clean up namespace
del build_models, check_versions

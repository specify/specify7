"""
Sets up Django ORM with the Specify datamodel
"""
from typing import Dict
from django.db.models import Model

from .build_models import build_models
from .check_versions import check_versions
from .datamodel import datamodel

# Returns a dictonary with the table's TableId as keys and the reated django models as values
# The values (class paths) are constructed with this Module's name followed by the table name
# Example: {7: <class 'specifyweb.specify.models.Accession'>}
models_by_tableid : Dict[int, Model] = build_models(__name__, datamodel)

# inject the model definitions into this module's namespace
globals().update((model.__name__, model)
                 for model in list(models_by_tableid.values()))

#check_versions(Spversion)

# clean up namespace
del build_models, check_versions

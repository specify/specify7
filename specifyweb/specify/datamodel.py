from .load_datamodel import Datamodel, Table, Field, Relationship, load_datamodel, DoesNotExistError, TableDoesNotExistError, FieldDoesNotExistError
# from .specify_datamodel_classes import Datamodel, Table, Field, Relationship, DoesNotExistError, TableDoesNotExistError, FieldDoesNotExistError
# from .specify_datamodel import datamodel as specify_datamodel

datamodel: Datamodel = load_datamodel()
# datamodel: Datamodel = specify_datamodel

# from .specify_tables import datamodel as specify_datamodel
# datamodel: Datamodel = specify_datamodel

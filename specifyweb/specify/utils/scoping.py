from inspect import isclass

from enum import Enum
from django.db.models import Model
from django.core.exceptions import ObjectDoesNotExist

from .. import models


class ScopeType(Enum):
    COLLECTION = 0
    DISCIPLINE = 1
    DIVISION = 2
    INSTITUTION = 3
    GLOBAL = 10

    def from_model(obj) -> "ScopeType":
        clazz = obj.__class__

        if clazz is models.Institution:
            return ScopeType.INSTITUTION
        if clazz is models.Division:
            return ScopeType.DIVISION
        if clazz is models.Discipline:
            return ScopeType.DISCIPLINE
        if clazz is models.Collection:
            return ScopeType.COLLECTION
        raise TypeError(f"{clazz.__name__} is not a hierarchy table")

class ModelClassScope:
    def __init__(self, model_class):
        if not isclass(model_class):
            raise TypeError(f"model_class: {model_class} is not a class!")
        self.model_class = model_class

    @property
    def scope_type(self) -> ScopeType:
        table = self.model_class.__name__.lower()
        scope = getattr(self, table, lambda: None)()
        if scope is None:
            return self._infer_scope()
        return scope

    def accession(self):
        institution = models.Institution.objects.get()
        if institution.isaccessionsglobal:
            return ScopeType.INSTITUTION
        else:
            return ScopeType.DIVISION

    def conservevent(self): return ModelClassScope(models.Conservdescription).scope_type

    def fieldnotebookpage(self): return ModelClassScope(models.Fieldnotebookpageset).scope_type

    def fieldnotebookpageset(self): return ModelClassScope(models.Fieldnotebook).scope_type

    def gift(self): return ScopeType.DISCIPLINE

    def loan(self): return ScopeType.DISCIPLINE

    def permit(self):
        return ScopeType.INSTITUTION

    def referencework(self):
        return ScopeType.INSTITUTION

    def taxon(self):
        return ScopeType.DISCIPLINE

    def geography(self):
        return ScopeType.DISCIPLINE
    
    def geologictimeperiod(self):
        return ScopeType.DISCIPLINE
    
    def lithostrat(self):
        return ScopeType.DISCIPLINE
    
    def tectonicunit(self):
        return ScopeType.DISCIPLINE
    
    def storage(self):
        return ScopeType.INSTITUTION


#############################################################################

    def _infer_scope(self):
        if hasattr(self.model_class, "division"):
            return ScopeType.DIVISION
        if hasattr(self.model_class, "discipline"):
            return ScopeType.DISCIPLINE
        if hasattr(self.model_class, "collectionmemberid") or hasattr(self.model_class, "collection"):
            return ScopeType.COLLECTION

        return ScopeType.INSTITUTION

class ModelInstanceScope:
    def __init__(self, model_instance):
        if isclass(model_instance):
            raise ValueError(f"Expected object instead instead of class")
        self.obj = model_instance

    @property
    def scope_type(self) -> ScopeType:
        return self._infer_scope_type()

    @property
    def scope_model(self) -> Model:
        return self._infer_scope_model()

    def _infer_scope_model(self) -> Model:
        table = self.obj.__class__.__name__.lower()
        scope = getattr(self, table, lambda: None)()
        if scope is None:
            return self._infer_scope()

        return scope
    
    def _infer_scope_type(self) -> ScopeType:
        scope_obj = self._infer_scope_model()
        return ScopeType.from_model(scope_obj)

    def accession(self) -> Model:
        institution = models.Institution.objects.get()
        if institution.isaccessionsglobal:
            return models.Institution.objects.get()
        return self.obj.division

    def conservevent(self) -> Model:
        return ModelInstanceScope(self.obj.conservdescription).scope_model
    
    def fieldnotebookpage(self) -> Model:
        return ModelInstanceScope(self.obj.pageset).scope_model
    
    def fieldnotebookpageset(self) -> Model:
        return ModelInstanceScope(self.obj.fieldnotebook).scope_model
    
    def gift(self) -> Model:
        if has_related(self.obj, "discipline"):
            return self.obj.discipline
    
    def loan(self) -> Model:
        if has_related(self.obj, 'discipline'):
            return self.obj.discipline
        
    def permit(self) -> Model:
        if has_related(self.obj, 'institution'):
            return self.obj.institution
    
    def referencework(self) -> Model:
        if has_related(self.obj, 'institution'):
            return self.obj.institution

    def taxon(self) -> Model:
        return self.obj.definition.discipline

    def geography(self):
        return self.obj.definition.discipline
    
    def geologictimeperiod(self):
        return self.obj.definition.discipline
    
    def lithostrat(self):
        return self.obj.definition.discipline
    
    def tectonicunit(self):
        return self.obj.definition.discipline
    
    def storage(self):
        return self.obj.definition.institution
    
    def _infer_scope_model(self) -> Model:
        if has_related(self.obj, "division"):
            return self.obj.division
        if has_related(self.obj, "discipline"):
            return self.obj.discipline
        if has_related(self.obj, "collectionmemberid") or has_related(self.obj, "collection"):
            return self._simple_collection_scope()

        return models.Institution.objects.get()
    
    def _simple_collection_scope(self) -> Model:
        if hasattr(self.obj, "collectionmemberid"):
            try:
                """
                Collectionmemberid is not a primary key, but a plain 
                numerical field, meaning the Collection it is 
                supposed to 'reference' may not exist anymore
                """
                collection = models.Collection.objects.get(
                    pk=self.obj.collectionmemberid)
            except ObjectDoesNotExist:
                if not hasattr(self.obj, "collection"):
                    raise
                collection = self.obj.collection
        else:
            collection = self.obj.collection

        return collection

class Scoping:
    def __init__(self):
        pass

    @staticmethod
    def from_model(model) -> ScopeType:
        return ModelClassScope(model).scope_type
    
    @staticmethod
    def from_instance(obj: Model) -> tuple[ScopeType, Model]:
        instance = ModelInstanceScope(obj)
        return instance.scope_type, instance.scope_model
    
    @staticmethod()
    def model_from_instance(obj: Model) -> Model:
        instance = ModelInstanceScope(obj)
        return instance.scope_model


def has_related(model_instance, field_name: str) -> bool:
    return hasattr(model_instance, field_name) and getattr(model_instance, field_name, None) is not None


def in_same_scope(object1: Model, object2: Model) -> bool:
    """
    Determines whether two Model Objects are in the same scope. 
    Travels up the scoping heirarchy until a matching scope can be resolved
    """
    scope1_type, scope1 = Scoping.from_instance(object1)
    scope2_type, scope2 = Scoping.from_instance(object2)

    if scope1_type > scope2_type:
        while scope2_type != scope1_type:
            scope2_type, scope2 = Scoping.from_instance(scope2)
    elif scope1_type < scope2_type:
        while scope2_type != scope1_type:
            scope1_type, scope1 = Scoping.from_instance(scope1)

    return scope1.id == scope2.id

from collections import namedtuple
from typing import Tuple
from django.db.models import Model
from django.core.exceptions import ObjectDoesNotExist

from . import models


class ScopeType:
    COLLECTION = 0
    DISCIPLINE = 1
    DIVISION = 2
    INSTITUTION = 3
    GLOBAL = 10


class Scoping(namedtuple('Scoping', 'obj')):
    def __call__(self) -> tuple[int, Model]:
        """
        Returns the ScopeType and related Model instance of the 
        hierarchical position the `obj` occupies. 
        Tries and infers the scope based on the fields/relationships
        on the model, and resolves the 'higher' scope before a more 
        specific scope if applicable for the object
        """
        table = self.obj.__class__.__name__.lower()
        scope = getattr(self, table, lambda: None)()
        if scope is None:
            return self._infer_scope()

        return scope

    def get_scope_model(self) -> Model:
        return self.__call__()[1]


################################################################################


    def accession(self):
        institution = models.Institution.objects.get()
        if institution.isaccessionsglobal:
            return ScopeType.INSTITUTION, institution
        else:
            return self._simple_division_scope()

    def borrowagent(self): return Scoping(self.obj.agent)()

    def conservevent(self): return Scoping(self.obj.conservdescription)()

    def fieldnotebookpage(self): return Scoping(self.obj.pageset)()

    def fieldnotebookpageset(self): return Scoping(self.obj.fieldnotebook)()

    def gift(self):
        if has_related(self.obj, 'discipline'):
            return self._simple_discipline_scope()

    def loan(self):
        if has_related(self.obj, 'discipline'):
            return self._simple_discipline_scope()

    def permit(self):
        if has_related(self.obj, 'institution'):
            return ScopeType.INSTITUTION, self.obj.institution

    def referencework(self):
        if has_related(self.obj, 'institution'):
            return ScopeType.INSTITUTION, self.obj.institution

    def taxon(self):
        return ScopeType.DISCIPLINE, self.obj.definition.discipline

#############################################################################

    def _simple_discipline_scope(self) -> tuple[int, Model]:
        return ScopeType.DISCIPLINE, self.obj.discipline

    def _simple_division_scope(self) -> tuple[int, Model]:
        return ScopeType.DIVISION, self.obj.division

    def _simple_collection_scope(self) -> tuple[int, Model]:
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

        return ScopeType.COLLECTION, collection

    def _infer_scope(self):
        if has_related(self.obj, "division"):
            return self._simple_division_scope()
        if has_related(self.obj, "discipline"):
            return self._simple_discipline_scope()
        if has_related(self.obj, "collectionmemberid") or has_related(self.obj, "collection"):
            return self._simple_collection_scope()

        return self._default_institution_scope()

    # If the table has no scope, and scope can not be inferred then scope to institution
    def _default_institution_scope(self) -> tuple[int, Model]:
        institution = models.Institution.objects.get()
        return ScopeType.INSTITUTION, institution


def has_related(model_instance, field_name: str) -> bool:
    return hasattr(model_instance, field_name) and getattr(model_instance, field_name, None) is not None


def in_same_scope(object1: Model, object2: Model) -> bool:
    """
    Determines whether two Model Objects are in the same scope. 
    Travels up the scoping heirarchy until a matching scope can be resolved
    """
    scope1_type, scope1 = Scoping(object1)()
    scope2_type, scope2 = Scoping(object2)()

    if scope1_type > scope2_type:
        while scope2_type != scope1_type:
            scope2_type, scope2 = Scoping(scope2)()
    elif scope1_type < scope2_type:
        while scope2_type != scope1_type:
            scope1_type, scope1 = Scoping(scope1)()

    return scope1.id == scope2.id

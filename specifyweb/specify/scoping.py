from collections import namedtuple
from typing import Tuple, Dict
from django.db.models import Model

from . import models


class ScopeType:
    COLLECTION = 0
    DISCIPLINE = 1
    DIVISION = 2
    INSTITUTION = 3
    GLOBAL = 10


SCOPE_MODEL: Dict[int, Model] = {
    ScopeType.COLLECTION: models.Collection,
    ScopeType.DISCIPLINE: models.Discipline,
    ScopeType.DIVISION: models.Division,
    ScopeType.INSTITUTION: models.Institution
}


class Scoping(namedtuple('Scoping', 'obj')):
    def __call__(self) -> Tuple[int, int]:
        table = self.obj.__class__.__name__.lower()
        scope = getattr(self, table, lambda: None)()
        if scope is None:
            return self._infer_scope()

        return scope


################################################################################

    def accession(self):
        institution = models.Institution.objects.get()
        if institution.isaccessionsglobal:
            return ScopeType.INSTITUTION, institution.id
        else:
            return self._simple_division_scope()

    def conservevent(self): return Scoping(self.obj.conservdescription)()

    def fieldnotebookpage(self): return Scoping(self.obj.pageset)()

    def fieldnotebookpageset(self): return Scoping(self.obj.fieldnotebook)()

    def gift(self): return self._simple_discipline_scope()

    def loan(self): return self._simple_discipline_scope()

    def permit(self):
        return ScopeType.INSTITUTION, self.obj.institution_id

    def referencework(self):
        return ScopeType.INSTITUTION, self.obj.institution.id

    def taxon(self):
        return ScopeType.DISCIPLINE, self.obj.definition.discipline.id

#############################################################################

    def _simple_discipline_scope(self) -> Tuple[int, int]:
        return ScopeType.DISCIPLINE, self.obj.discipline_id

    def _simple_division_scope(self) -> Tuple[int, int]:
        return ScopeType.DIVISION, self.obj.division_id

    def _simple_collection_scope(self) -> Tuple[int, int]:
        if hasattr(self.obj, "collectionmemberid"):
            return ScopeType.COLLECTION, self.obj.collectionmemberid

        return ScopeType.COLLECTION, self.obj.collection_id

    def _infer_scope(self):
        if hasattr(self.obj, "division_id"):
            return self._simple_division_scope()
        if hasattr(self.obj, "discipline_id"):
            return self._simple_discipline_scope()
        if hasattr(self.obj, "collectionmemberid"):
            return self._simple_collection_scope()
        if hasattr(self.obj, "collection_id"):
            return self._simple_collection_scope()
        return self._default_institution_scope()

    # If the table has no scope, and scope can not be inferred then scope to institution
    def _default_institution_scope(self) -> Tuple[int, int]:
        institution = models.Institution.objects.get()
        return ScopeType.INSTITUTION, institution.id


def in_same_scope(object1: Model, object2: Model) -> bool:
    """
        Determines whether two Model Objects are in the same scope. 
        Travels up the scoping heirarchy until a matching scope can be resolved
    """
    scope1_type, scope1_id = Scoping(object1)()
    scope2_type, scope2_id = Scoping(object2)()

    if scope1_type > scope2_type:
        while scope2_type != scope1_type:
            scope_object = SCOPE_MODEL[scope2_type].objects.get(pk=scope2_id)
            scope2_type, scope2_id = Scoping(scope_object)()
    elif scope2_type > scope1_type:
        while scope2_type != scope1_type:
            scope_object = SCOPE_MODEL[scope1_type].objects.get(pk=scope1_id)
            scope1_type, scope1_id = Scoping(scope_object)()

    return scope1_id == scope2_id

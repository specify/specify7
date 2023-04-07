from collections import namedtuple

from . import models

COLLECTION_SCOPE  = 0
DISCIPLINE_SCOPE  = 1
DIVISION_SCOPE    = 2
INSTITUTION_SCOPE = 3
GLOBAL_SCOPE      = 10

class Scoping(namedtuple('Scoping', 'obj')):

    def __call__(self):
        table = self.obj.__class__.__name__.lower()
        try:
            scope =  getattr(self, table)()
        except AttributeError:
            return self._infer_scope
        return scope

################################################################################

    def accession(self):
        institution = models.Institution.objects.get()
        if institution.isaccessionsglobal:
            return INSTITUTION_SCOPE, institution.id
        else:
            return self._simple_division_scope()

    def agent(self): return self._simple_division_scope()

    def conservevent(self): return Scoping(self.obj.conservdescription)()

    def fieldnotebookpage(self): return Scoping(self.obj.pageset)()

    def fieldnotebookpageset(self): return Scoping(self.obj.fieldnotebook)()

    def taxon(self):
        return DISCIPLINE_SCOPE, self.obj.definition.discipline.id

#############################################################################

    def _simple_discipline_scope(self):
        return DISCIPLINE_SCOPE, self.obj.discipline_id

    def _simple_division_scope(self):
        return DIVISION_SCOPE, self.obj.division_id

    def _simple_collection_scope(self):
        return COLLECTION_SCOPE, self.obj.collectionmemberid

    def _infer_scope(self):
        if hasattr(self.obj, "division_id"): return self._simple_division_scope()
        if hasattr(self.obj, "discipline_id") : return self._simple_discipline_scope()
        if hasattr(self.obj, "collectionmemberid"): return self._simple_collection_scope()
        if hasattr(self.obj, "collection_id"): return self._simple_collection_scope()
        return self._default_institution_scope()

    # If the table has no scope, and scope can not be inferred then scope to institution
    def _default_institution_scope(self):
        institution = models.Institution.objects.get()
        return INSTITUTION_SCOPE, institution.id

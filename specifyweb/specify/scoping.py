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
        return getattr(self, table, lambda: None)()

################################################################################

    def accession(self):
        institution = models.Institution.objects.get()
        if institution.isaccessionsglobal:
            return INSTITUTION_SCOPE, institution.id
        else:
            return self._simple_division_scope()

    def agent(self): return self._simple_division_scope()

    def borrow(self): return self._simple_collection_scope()

    def collectingevent(self): return self._simple_discipline_scope()

    def collectionobject(self): return self._simple_collection_scope()

    def conservdescription(self): return self._simple_division_scope()

    def conservevent(self): return Scoping(self.obj.conservdescription)()

    def dnasequence(self): return self._simple_collection_scope()

    def dnasequencing(self): return self._simple_collection_scope()

    def fieldnotebook(self): return self._simple_discipline_scope()

    def fieldnotebookpage(self): return Scoping(self.obj.pageset)()

    def fieldnotebookpageset(self): return Scoping(self.obj.fieldnotebook)()

    def gift(self): return self._simple_discipline_scope()

    def loan(self): return self._simple_discipline_scope()

    def locality(self): return self._simple_discipline_scope()

    def permit(self):
        return INSTITUTION_SCOPE, self.obj.institution_id

    def preparation(self): return self._simple_collection_scope()

    def referencework(self):
        institution = models.Institution.objects.get()
        return INSTITUTION_SCOPE, institution.id

    def repositoryagreement(self): return self._simple_division_scope()

    def taxon(self):
        return DISCIPLINE_SCOPE, self.obj.definition.discipline.id

#############################################################################

    def _simple_discipline_scope(self):
        return DISCIPLINE_SCOPE, self.obj.discipline_id

    def _simple_division_scope(self):
        return DIVISION_SCOPE, self.obj.division_id

    def _simple_collection_scope(self):
        return COLLECTION_SCOPE, self.obj.collectionmemberid

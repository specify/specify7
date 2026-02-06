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

    @staticmethod
    def from_model(obj) -> "ScopeType":
        app_and_model_name = obj._meta.label_lower

        # We can't directly use `obj.__class__ is SomeScopeModel` here because
        # that will break historical fake models during migrations
        # Using the app and model name means this will work in both migration
        # and normal runtimes
        # See https://docs.djangoproject.com/en/6.0/topics/migrations/#historical-models
        # for more information about Django's Histroical models
        mapping = {
            'specify.institution': ScopeType.INSTITUTION,
            'specify.division': ScopeType.DIVISION,
            'specify.discipline': ScopeType.DISCIPLINE,
            'specify.collection': ScopeType.COLLECTION
        }

        scope_type = mapping.get(app_and_model_name, None)
        if scope_type is None:
            raise TypeError(f"{app_and_model_name} is not a hierarchy table")
        return scope_type

    def __gt__(self, other):
        if not isinstance(other, ScopeType):
            return NotImplemented
        return self.value > other.value

    def __ge__(self, other):
        if not isinstance(other, ScopeType):
            return NotImplemented
        return self.value >= other.value

    def __lt__(self, other):
        if not isinstance(other, ScopeType):
            return NotImplemented
        return self.value < other.value

    def __le__(self, other):
        if not isinstance(other, ScopeType):
            return NotImplemented
        return self.value <= other.value

    def __eq__(self, other):
        if not isinstance(other, ScopeType):
            return NotImplemented
        return self.value == other.value


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

    def conservevent(self): return ModelClassScope(
        models.Conservdescription).scope_type

    def fieldnotebookpage(self): return ModelClassScope(
        models.Fieldnotebookpageset).scope_type

    def fieldnotebookpageset(self): return ModelClassScope(
        models.Fieldnotebook).scope_type

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
        if is_related(self.model_class, "division"):
            return ScopeType.DIVISION
        if is_related(self.model_class, "discipline"):
            return ScopeType.DISCIPLINE
        if hasattr(self.model_class, "collectionmemberid") or is_related(self.model_class, "collection"):
            return ScopeType.COLLECTION

        return ScopeType.INSTITUTION


class ModelInstanceScope:
    def __init__(self, model_instance):
        if isclass(model_instance):
            raise ValueError(f"Expected object instead instead of class")
        self.obj = model_instance

    @property
    def scope_type(self) -> ScopeType:
        return ScopeType.from_model(self.scope_model)

    @property
    def scope_model(self) -> Model:
        table = self.obj.__class__.__name__.lower()
        scope = getattr(self, table, lambda: None)()
        if scope is None:
            return self._infer_scope_model()

        return scope

    def accession(self) -> Model:
        institution = models.Institution.objects.get()
        if institution.isaccessionsglobal:
            return institution
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
        if is_related(self.obj.__class__, "division") and has_related(self.obj, "division"):
            return self.obj.division
        if is_related(self.obj.__class__, "discipline") and has_related(self.obj, "discipline"):
            return self.obj.discipline
        if has_related(self.obj, "collectionmemberid") or (is_related(self.obj.__class__, "collection") and has_related(self.obj, "collection")):
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

    @staticmethod
    def scope_type_from_class(model_class) -> ScopeType:
        """
        Returns the ScopeType that a particular class can be scoped to.
        If you have an instantiated instance of the class, prefer using the 
        other methods like `from_instance` or `model_from_instance`

        Example:
        ```
        loan_scope = Scoping.scope_type_from_class(models.Loan)
        # ScopeType.Discipline

        accession_scope = Scoping.scope_type_from_class(models.Accession)
        # ScopeType.Institution if accessions are global else ScopeType.Division
        ```

        :param model_class:
        :return:
        :rtype: ScopeType
        """
        return ModelClassScope(model_class).scope_type

    @staticmethod
    def from_instance(obj: Model) -> tuple[ScopeType, Model]:
        instance = ModelInstanceScope(obj)
        return instance.scope_type, instance.scope_model

    @staticmethod
    def model_from_instance(obj: Model) -> Model:
        """
        Returns the Model that the provided Model instance can be scoped to.
        Usually always one of: Collection, Discipline, Division, or Institution

        Example:
        ```
        my_co = Collectionobject.objects.get(some_filters)
        scoped = Scoping.model_from_instance(my_co)
        isinstance(scoped, models.Collection) #-> True
        ```

        :param obj:
        :type obj: Model
        :return:
        :rtype: Model
        """
        instance = ModelInstanceScope(obj)
        return instance.scope_model

    @staticmethod
    def get_hierarchy_model(collection, scope_type: ScopeType) -> Model:
        """
        Given a collection and desired ScopeType, returns the model associated
        with the ScopeType.

        Example:
        ```
        my_collection = Collection.objects.get(some_filters)
        my_div = Scoping.get_hierarchy_model(ny_collection, ScopeType.Division)
        my_dis = Scoping.get_hierarchy_model(ny_collection, ScopeType.Discipline)
        ```

        :param collection: Description
        :param scope_type: Description
        :type scope_type: ScopeType
        :return:
        :rtype: Model
        """
        steps = [ScopeType.COLLECTION, ScopeType.DISCIPLINE,
                 ScopeType.DIVISION, ScopeType.INSTITUTION]
        num_steps = steps.index(scope_type)
        model = collection
        for _ in range(num_steps):
            model = Scoping.model_from_instance(model)
        return model


def has_related(model_instance: Model, field_name: str) -> bool:
    """
    
    :param model_instance: Description
    :type model_instance: Model
    :param field_name: Description
    :type field_name: str
    :return: Returns true if the model instance contains some non-None value in
    the given field name
    :rtype: bool
    """
    return hasattr(model_instance, field_name) and getattr(model_instance, field_name, None) is not None

def is_related(model_class: Model, field_name: str) -> bool:
    """
    
    :param model_class: Description
    :type model_class: Model
    :param field_name: Description
    :type field_name: str
    :return: Returns true if the field name for the model class is a
    relationship
    :rtype: bool
    """
    if not hasattr(model_class, field_name):
        return False
    field_wrapper = getattr(model_class, field_name)
    field = getattr(field_wrapper, "field")
    return getattr(field, "is_relation", False)

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

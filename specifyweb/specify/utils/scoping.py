from inspect import isclass
from dataclasses import dataclass

from enum import Enum
from django.db.models import Model, Q, QuerySet
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


_COLLECTION_SCOPE_LOOKUPS = {
    'COLLECTION': 'pk',
    'DISCIPLINE': 'discipline_id',
    'DIVISION': 'discipline__division_id',
    'INSTITUTION': 'discipline__division__institution_id',
}

_HIERARCHY_MODELS = {
    'COLLECTION': models.Collection,
    'DISCIPLINE': models.Discipline,
    'DIVISION': models.Division,
    'INSTITUTION': models.Institution,
}


@dataclass(frozen=True)
class ScopePath:
    """A hierarchy relationship shared by instance resolution and SQL filtering."""

    scope_type: ScopeType
    path: str | None = None
    institution_fallback: bool = False
    required_parent: str | None = None

    def resolve(self, obj: Model) -> Model | None:
        if self.path is None:
            return models.Institution.objects.get()
        for field in self.path.split('__'):
            obj = getattr(obj, field)
        return obj

    def condition(self, collections: QuerySet, queryset: QuerySet | None = None) -> Q:
        if self.path is None:
            institution = models.Institution.objects.get()
            allowed = collections.filter(
                discipline__division__institution=institution,
            ).exists()
            return Q() if allowed else Q(pk__in=[])
        lookup = _COLLECTION_SCOPE_LOOKUPS[self.scope_type.name]
        condition = Q(**{f'{self.path}__in': collections.values(lookup)})
        if self.institution_fallback:
            missing = Q(**{f'{self.path}__isnull': True})
            if self.required_parent is not None:
                missing &= Q(**{f'{self.required_parent}__isnull': False})
            if queryset is None or queryset.filter(missing).exists():
                condition |= missing & ScopePath(ScopeType.INSTITUTION).condition(collections)
        return condition


_RECORD_SCOPE_PATHS = {
    'fieldnotebook': ScopePath(ScopeType.DISCIPLINE, 'discipline'),
    'gift': ScopePath(ScopeType.DISCIPLINE, 'discipline'),
    'loan': ScopePath(ScopeType.DISCIPLINE, 'discipline'),
    'permit': ScopePath(ScopeType.INSTITUTION, 'institution'),
    'referencework': ScopePath(ScopeType.INSTITUTION, 'institution'),
    'storage': ScopePath(
        ScopeType.INSTITUTION, 'definition__institution', institution_fallback=True,
    ),
    **{
        tree: ScopePath(
            ScopeType.DISCIPLINE, 'definition__discipline',
            institution_fallback=True, required_parent='definition',
        )
        for tree in (
            'taxon', 'geography', 'geologictimeperiod', 'lithostrat', 'tectonicunit',
        )
    },
}

_INHERITED_SCOPES = {
    'conservevent': ('conservdescription', models.Conservdescription),
    'fieldnotebookpage': ('pageset', models.Fieldnotebookpageset),
    'fieldnotebookpageset': ('fieldnotebook', models.Fieldnotebook),
    'recordsetitem': ('recordset', models.Recordset),
}


def _record_scope_path(model_class) -> ScopePath | None:
    if model_class._meta.model_name == 'accession':
        return (
            ScopePath(ScopeType.INSTITUTION)
            if models.Institution.objects.get().isaccessionsglobal
            else ScopePath(ScopeType.DIVISION, 'division')
        )
    return _RECORD_SCOPE_PATHS.get(model_class._meta.model_name)


def _queryset_scope_path(model_class) -> ScopePath | None:
    if model_class in _HIERARCHY_MODELS.values():
        return ScopePath(ScopeType.from_model(model_class), 'pk')
    path = _record_scope_path(model_class)
    if path is not None:
        return path
    inherited = _INHERITED_SCOPES.get(model_class._meta.model_name)
    if inherited is not None:
        parent_field, parent_model = inherited
        parent_path = _queryset_scope_path(parent_model)
        if parent_path is None:
            return None
        return ScopePath(
            parent_path.scope_type,
            f'{parent_field}__{parent_path.path}' if parent_path.path else None,
            parent_path.institution_fallback,
            (
                f'{parent_field}__{parent_path.required_parent}'
                if parent_path.required_parent else None
            ),
        )
    scope_type = ModelClassScope(model_class).scope_type
    if scope_type == ScopeType.INSTITUTION:
        return ScopePath(scope_type)
    field = scope_type.name.lower()
    if scope_type == ScopeType.COLLECTION:
        field = (
            'collectionmemberid'
            if hasattr(model_class, 'collectionmemberid') else 'collection'
        )
        return ScopePath(scope_type, field)
    competing_fields = (
        ('discipline', 'collectionmemberid', 'collection')
        if scope_type == ScopeType.DIVISION
        else ('division', 'collectionmemberid', 'collection')
    )
    if hasattr(model_class, field) and not any(
        hasattr(model_class, competing) for competing in competing_fields
    ):
        return ScopePath(scope_type, field, institution_fallback=True)
    return None


class ModelClassScope:
    def __init__(self, model_class):
        if not isclass(model_class):
            raise TypeError(f"model_class: {model_class} is not a class!")
        self.model_class = model_class

    @property
    def scope_type(self) -> ScopeType:
        path = _record_scope_path(self.model_class)
        if path is not None:
            return path.scope_type
        inherited = _INHERITED_SCOPES.get(self.model_class._meta.model_name)
        if inherited is not None:
            return ModelClassScope(inherited[1]).scope_type
        return self._infer_scope()

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
        path = _record_scope_path(self.obj.__class__)
        if path is not None:
            scope = path.resolve(self.obj)
            return self._infer_scope_model() if scope is None else scope
        inherited = _INHERITED_SCOPES.get(self.obj._meta.model_name)
        if inherited is not None:
            return ModelInstanceScope(getattr(self.obj, inherited[0])).scope_model
        table = self.obj.__class__.__name__.lower()
        scope = getattr(self, table, lambda: None)()
        if scope is None:
            return self._infer_scope_model()

        return scope

    def attachment(self) -> Model:
        if self.obj.scopetype is None:
            return models.Institution.objects.get()
        scope_type = ScopeType(self.obj.scopetype)
        if scope_type == ScopeType.GLOBAL:
            return models.Institution.objects.get()
        scope_model = _HIERARCHY_MODELS[scope_type.name]
        return scope_model.objects.get(pk=self.obj.scopeid)

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
    def filter_queryset(queryset: QuerySet, collections: QuerySet) -> QuerySet:
        """Restrict rows to hierarchy scopes represented by the given collections.

        Filtering stays in SQL so counts, projections and pagination use the
        same scope paths as record authorization. Unsupported competing scope
        fields retain instance-only checks.
        """
        model = queryset.model
        if model is models.Attachment:
            condition = Q(pk__in=[])
            if collections.exists():
                condition |= Q(scopetype__isnull=True) | Q(
                    scopetype=ScopeType.GLOBAL.value,
                )
            for kind, lookup in _COLLECTION_SCOPE_LOOKUPS.items():
                condition |= Q(
                    scopetype=ScopeType[kind].value,
                    scopeid__in=collections.values(lookup),
                )
            return queryset.filter(condition)
        if model in (models.Spappresourcedir, models.Sptasksemaphore):
            condition = ScopePath(ScopeType.DISCIPLINE, 'discipline').condition(collections)
            condition |= Q(discipline__isnull=True) & ScopePath(
                ScopeType.COLLECTION, 'collection',
            ).condition(collections)
            unscoped = Q(discipline__isnull=True, collection__isnull=True)
            if queryset.filter(unscoped).exists():
                condition |= unscoped & ScopePath(ScopeType.INSTITUTION).condition(collections)
            return queryset.filter(condition)
        path = _queryset_scope_path(model)
        if path is None:
            return queryset
        condition = path.condition(collections, queryset)
        if path.path == 'collectionmemberid' and hasattr(model, 'collection'):
            invalid_membership = (
                Q(collectionmemberid__isnull=True)
                | ~Q(collectionmemberid__in=models.Collection.objects.values('pk'))
            )
            condition |= invalid_membership & ScopePath(
                ScopeType.COLLECTION, 'collection',
            ).condition(collections)
        return queryset.filter(condition)

    @staticmethod
    def scope_for_record(obj: Model) -> Model:
        """Resolve a record's scope, keeping hierarchy records at their own scope.

        Unlike model_from_instance, a Collection resolves to itself rather than
        its Discipline (likewise for Discipline, Division, and Institution).
        Other records use the existing resolver, including its institution
        fallback for records without a defined scope. Invalid associations
        propagate the resolver's errors.
        """
        if isinstance(obj, (
            models.Collection,
            models.Discipline,
            models.Division,
            models.Institution,
        )):
            return obj
        return Scoping.model_from_instance(obj)

    @staticmethod
    def collections_for_scope(scope: Model) -> QuerySet:
        """Return all collections within a resolved hierarchy scope.

        This does not evaluate user permissions or restrict shared scopes to
        the collection the user is logged into.
        """
        scope_type = ScopeType.from_model(scope)
        if scope.pk is None:
            raise ValueError("Cannot resolve collections for an unsaved scope")

        lookup = _COLLECTION_SCOPE_LOOKUPS[scope_type.name]
        return models.Collection.objects.filter(**{lookup: scope.pk})

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

    return scope1.pk == scope2.pk

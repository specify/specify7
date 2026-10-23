from typing_extensions import TypeIs
from typing import Protocol, Any

from django.db.models import Model, QuerySet, Field, ForeignObjectRel, ForeignKey, ManyToManyRel, ManyToManyField
from django.db.models.deletion import PROTECT, CASCADE

from specifyweb.specify.datamodel import datamodel
from specifyweb.specify.models import protect_with_blockers


def valid_blocker_field(field: Field | ForeignObjectRel) -> TypeIs[ForeignObjectRel | ManyToManyField]:
    if not field.is_relation:
        return False
    # The ManyToMany Join Tables do not exist on the Specify Datamodel, so
    # currently this is a convient way to weed out fields on the through models
    # Implementors of DeleteBlocker behavior should work with the
    # ManyToManyField and ManyToManyRel objects directly instead and access
    # these fields through ManyToManyRel.through
    if not hasattr(field.related_model, "specify_model"):
        return False
    # At this point we're generally only concerned with remote fields that
    # reference the model we're trying to get references for.
    # e.g., all relationships B -> A, where A is the table we're getting
    # blockers for.
    # ManyToManyFields don't have non-concrete backreferences the way other
    # fields do, and the FK referencing the table we care about was weeded out
    # in the previous conditional.
    # Because of this, we consider all remote fields AND many to
    # many fields as valid. We'll worry about checking the ON_DELETE behavior
    # later (see ManyToManyBlockerField)
    many_to_many_or_remote = (field.many_to_many
                              or not getattr(field, "concrete", True))
    if not many_to_many_or_remote:
        return False

    # Finally we check the ON_DELETE behavior of the FK. We're only concerned
    # about ON_DELETE behavior of PROTECT or CASCADE: we can ignore fields
    # with other delete behaviors
    field_with_delete_behavior = field
    if field.many_to_many:
        field_with_delete_behavior = many_to_many_foreignkey(field)
    return (relationship_cascades_delete(field_with_delete_behavior)
            or relationship_blocks_deletion(field_with_delete_behavior))


def relationship_blocks_deletion(relationship: ForeignObjectRel | ForeignKey):
    remote = ensure_remote(relationship)
    return remote.on_delete is protect_with_blockers or remote.on_delete is PROTECT


def relationship_cascades_delete(relationship: ForeignObjectRel | ForeignKey):
    remote = ensure_remote(relationship)
    return remote.on_delete is CASCADE


def ensure_remote(field: ForeignObjectRel | ForeignKey) -> ForeignObjectRel:
    if isinstance(field, ForeignKey):
        return field.remote_field
    return field


def django_field_to_blocker_field(field: ForeignKey | ManyToManyField | ForeignObjectRel) -> "DeleteBlockerField":
    if isinstance(field, (ManyToManyField, ManyToManyRel)):
        return ManyToManyBlockerField(field)
    elif isinstance(field, ForeignKey):
        return ForeignKeyBlockerField(field)
    elif isinstance(field, ForeignObjectRel):
        return RemoteBlockerField(field)
    raise TypeError(
        f"Unexpected field type '{field.__class__}' of when constructing blocker field for {field}")


def many_to_many_foreignkey(relationship: ManyToManyRel | ManyToManyField) -> ForeignKey:
    """
    Returns the ForeignKey on a JOIN/THROUGH table for a particular ManyToMany
    field.
    If a ManyToManyRel is supplied (i.e., the remote or non-concrete side of
    the ManyToMany relationship), this returns the FK pointing to the base
    model of the relationship.
    e.g., if the ManyToManyField is defined on A related to some model B, and
    the relationship passed in is B -> A from B then this function will return
    the FK on the JOIN table pointing to B.
    Otherwise a ManyToManyField is supplied which is the 'concrete' side of
    the ManyToMany relationship, in this case A -> B.
    This function will return the FK on the JOIN table pointing to A.
    """
    # The through model can only be accessed from the remote side and the FK
    # names can only be retreived from the concrete side of the relationship
    if isinstance(relationship, ManyToManyField):
        field_to_through_model: ManyToManyRel = relationship.remote_field
        fk_name_on_through_model: str = relationship.m2m_field_name()
    elif isinstance(relationship, ManyToManyRel):
        field_to_through_model = relationship
        field_on_concrete: ManyToManyField = relationship.remote_field
        fk_name_on_through_model: str = field_on_concrete.m2m_reverse_field_name()
    else:
        raise TypeError(
            "Trying to get ManyToMany FK on relationship that's not ManyToMany")

    # Now that we know we have the ManyToManyRel here, we can access its
    # 'through' attribute for direct access to the through Model as defined in
    # its models.py
    through_model = field_to_through_model.through
    # We got the name of the field on the through model earlier, so just look
    # it up. This will return something like a ForwardManyToOneDescriptor
    field_on_through_model = getattr(through_model, fk_name_on_through_model)
    # Now we can finally resolve the field to the actual ForeignKey defined on
    # the through model
    fk_on_through_model = field_on_through_model.field
    return fk_on_through_model


def _get_table_and_field_name(default_table_name: str, default_field_name: str) -> tuple[str, str]:
    table = datamodel.get_table(default_table_name)
    table_name = None
    field_name = None
    if table is not None:
        table_name = table.name
        relationship = table.get_relationship(default_field_name)
        field_name = None if relationship is None else relationship.name

    resolved_table_name = (table_name or default_table_name).lower()
    resolved_field_name = (field_name or default_field_name).lower()
    return resolved_table_name, resolved_field_name


class DeleteBlockerField(Protocol):
    """
    A class implementing this Protocol represents a field to be used with
    DeleteBlockers.
    Its purpose is to encapsulate common delete blocker functionality across
    the many Django relationship types so DeleteBlocker consumers can have a
    consistent interface/contract.
    """
    model: type[Model]
    field: Field | ForeignObjectRel
    db_table_name: str
    django_field_name: str
    # Returns whether the field CASCADEs.
    # If false, the field is assumed to PROTECT
    # If needed, do validation that the field CASCADEs or PROTECTS during or
    # before class initialization
    cascades: bool
    # Human friendly names (from the Specify datamodel) that are included in
    # the API responses
    table_name: str
    field_name: str

    def get_queryset(self, obj: Model) -> QuerySet:
        """
        A basic QuerySet to get all related objects of this field's model that
        point to some given obj.
        e.g., if fetching delete blockers for an Accession through the
        CollectionObject -> accession reference, the QuerySet will be
        equivalent to:
            CollectionObject.objects.filter(accession_id=obj.pk)
        """
        raise NotImplementedError

    def get_queryset_filters(self, obj: Model) -> dict[str, Any]:
        """
        REFACTOR: Might be better to make this a Q object rather than dict
        """
        raise NotImplementedError


class ForeignKeyBlockerField:
    """
    This is the ForeignKey (FK) on the referencing table.
    e.g., If we want to fetch references for some table A and there's a table B
    with a field B -> A, this class should be passed the FK on B.
    When constructing a QuerySet, this class accepts an object of type A to use
    its ID.
    """

    def __init__(self, field: ForeignKey):
        self.field = field
        self.model = field.model
        self.cascades = relationship_cascades_delete(field)
        self.db_table_name = self.model._meta.db_table
        self.django_field_name = field.name
        self.table_name, self.field_name = _get_table_and_field_name(
            self.db_table_name, self.django_field_name)

    def get_queryset_filters(self, obj: Model) -> dict[str, Any]:
        return {self.field.name: obj.pk}

    def get_queryset(self, obj: Model) -> QuerySet:
        return self.model.objects.filter(
            **self.get_queryset_filters(obj)
        )


class RemoteBlockerField(ForeignKeyBlockerField):
    """
    This field exists on the table we want to get blockers for and is a
    "backreference" to the FK of the referencing table.
    e.g., If we want to fetch references for some table A and there's a table B
    with field B -> A, this class should be passed the remote field on A that's
    the reverse of B -> A.
    """

    def __init__(self, field: ForeignObjectRel):
        foreign_key = field.field
        super().__init__(foreign_key)


class ManyToManyBlockerField:
    """
    This is either the concrete (non-remote) ManyToMany field or the remote
    side of the ManyToMany field on the table we want to get blockers for.
    We treat this similarly to RemoteBlockerField, and prepare this class to
    filter on the related table.
    """

    def __init__(self, field: ManyToManyField | ManyToManyRel):
        through_table_fk = many_to_many_foreignkey(field)
        # FIXME: We should invert this for to-many relationships. Or at least
        # handle it better. Delete semantics are a little different than normal
        # DeleteBlockers...
        self.cascades = relationship_cascades_delete(through_table_fk)
        remote_field = field.remote_field
        self.field = remote_field
        self.model = field.related_model
        self.db_table_name = self.model._meta.db_table
        self.django_field_name = self.field.name
        # BUG: While the logic of this class handles cases where the
        # related_name of the ManyToMany field is not set (i.e., '+') and still
        # returns the correct objects from its QuerySet, the "human friendly"
        # field name will be the autogenerated name for the field
        # (something like _specify_maintable_fieldname_+)
        self.table_name, self.field_name = _get_table_and_field_name(
            self.db_table_name, self.django_field_name)

    def get_queryset_filters(self, obj: Model) -> dict[str, Any]:
        return {self.field.name: obj.pk}

    def get_queryset(self, obj: Model) -> QuerySet:
        return self.model.objects.filter(
            **self.get_queryset_filters(obj)
        )

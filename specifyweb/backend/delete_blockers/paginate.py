from django.db.models import Model, ForeignObjectRel, ForeignKey, QuerySet

from specifyweb.specify.models import Spexportschemaitem
from specifyweb.backend.trees.extras import Tree, TreeRank
from specifyweb.backend.delete_blockers.validators import DELETE_BLOCKER_LIMIT
from specifyweb.backend.delete_blockers.utils import node_numbers_valid_for_tree
from specifyweb.backend.delete_blockers.field import relationship_cascades_delete, django_field_to_blocker_field, DeleteBlockerField


class ReferencePaginator:
    def __init__(self,
                 obj: Model,
                 blocker_field: DeleteBlockerField,
                 limit: int = DELETE_BLOCKER_LIMIT,
                 anchor_id: int | None = None,
                 backwards: bool = False):
        self.obj = obj
        self.blocker_field = blocker_field
        self.limit = limit
        self.anchor_id = anchor_id
        self.backwards = backwards

    def _get_base_queryset(self) -> QuerySet:
        return self.blocker_field.get_queryset(self.obj)

    @property
    def table_name(self) -> str:
        return self.blocker_field.table_name

    @property
    def field_name(self) -> str:
        return self.blocker_field.field_name

    def count(self) -> int:
        queryset = self._get_base_queryset()
        return queryset.count()

    def fetch_page(self) -> list[int]:
        queryset = self._get_page_queryset()
        return list(queryset)

    def _get_page_queryset(self):
        queryset = self._get_base_queryset()

        if self.anchor_id is not None:
            direction = "lt" if self.backwards else "gt"
            queryset = queryset.filter(**{f"pk__{direction}": self.anchor_id})

        if self.backwards:
            queryset = queryset.order_by("-pk")
        else:
            queryset = queryset.order_by("pk")

        queryset = queryset.values_list("pk", flat=True)

        if self.limit != 0:
            queryset = queryset[:self.limit]
        return queryset


class TreeTableReferencePaginator(ReferencePaginator):
    """
    This paginator should be used for objects that are Tree Tables
    (Taxon, Geography, Storage, Lithostrat, etc.).
    WARNING: This strictly assumes:

        1. All NodeNumbers for the tree are valid and up-to-date 
        2. The ON_DELETE behavior for the 'parent' FK is set to CASCADE
        3. The NodeNumber column on the tree is indexed

    Use the base ReferencePaginator if you can not guarantee all of the above
    properties.
    """

    def _get_base_queryset(self):
        node_number = self.obj.nodenumber
        highest_node_number = self.obj.highestchildnodenumber
        model = self.blocker_field.model
        # With the assumption that nodenumbers are up-to-date and correctly
        # formed for the tree, we can use their properties to optimize fetching
        # references.
        # Particularly, we know the node and all of its descendants lie within
        # the range >= NodeNumber and <= HighestChildNodeNumber.
        # Essentially node numbers can "flatten" any subtree within the
        # tree so we don't have to worry about expensive or complicated
        # Parent self-joins to traverse the subtree structure
        node_number_filters = {
            f"{self.blocker_field.django_field_name}__nodenumber__range": (node_number, highest_node_number)
            # We shouldn't need a filter on definition, as NodeNumbers should
            # be unique even across trees of the same type
            # TEST: Make sure we have tests for the above assumption in case
            # the behavior is ever changed
        }
        return model.objects.filter(**node_number_filters)

    def fetch_page(self) -> list[int]:
        # With the above node number optimization, we should be able to exclude
        # pages for the parent relationship for delete blockers
        # REFACTOR: This might not be the best place this for this.
        # Consider moving this to DeleteBlockerFilter
        if self.blocker_field.field is self.obj._meta.get_field("parent"):
            return []
        return super().fetch_page()


class TreeNodeToDefinitionPaginator(ReferencePaginator):
    def _get_base_queryset(self) -> QuerySet:
        model = self.blocker_field.model
        base_filters = self.blocker_field.get_queryset_filters(self.obj)
        return model.objects.filter(
            **base_filters,
            parent__isnull=True
        )


class TreeRankToDefinitionPaginator(ReferencePaginator):
    def _get_base_queryset(self) -> QuerySet:
        model = self.blocker_field.model
        base_filters = self.blocker_field.get_queryset_filters(self.obj)
        return model.objects.filter(
            **base_filters,
            parent__isnull=True
        )


class SpLocaleContainerToDisciplinePaginator(ReferencePaginator):
    """
    This optimized Paginator is only possible because the only relationship
    that can block deletion in the chain of
    SpLocaleContainer -> SpLocaleContainerItem -> SpLocaleItemStr, etc. is
    SpExportSchemaItem to SpLocaleContainerItem on splocalecontaineritem.
    REFACTOR: Make this more generic. When resolving a paginator by field,
    recursively check the relationships CASCADEd relationships until a PROTECT
    is found. We can even completely exclude the relationship from Delete
    Blockers if there is no termimal PROTECT, i.e., all relationships CASCADE.
    Reminder to be mindful and handle self JOINs for the above code
    """

    def __init__(self, obj, blocker_field, limit=DELETE_BLOCKER_LIMIT, anchor_id=None, backwards=False):
        resolved_relationship = Spexportschemaitem._meta.get_field(
            "splocalecontaineritem")
        new_blocker_field = django_field_to_blocker_field(resolved_relationship)
        super().__init__(obj, new_blocker_field, limit, anchor_id, backwards)

    def _get_base_queryset(self):
        return Spexportschemaitem.objects.filter(
            splocalecontaineritem__container__discipline_id=self.obj.pk
        )


def is_tree_definition(obj: Model):
    db_table = obj._meta.db_table.lower()
    return db_table.endswith("treedef")


def resolve_reference_paginator(obj: Model, field: DeleteBlockerField) -> type[ReferencePaginator]:
    Paginator = None
    if isinstance(obj, Tree):
        Paginator = _resolve_tree_node_paginator(obj)
    elif is_tree_definition(obj):
        Paginator = _resolve_tree_definition_paginator(obj, field)
    elif _is_discipline(obj):
        Paginator = _resolve_paginator_for_discipline(field)

    if Paginator is None:
        Paginator = ReferencePaginator

    if Paginator is not None:
        return Paginator
    raise TypeError(f"Not able to resolve paginator for field: {field}")


def _resolve_tree_node_paginator(obj: Tree) -> type[ReferencePaginator] | None:
    # This is first because it is far cheaper than checking for NodeNumber validity
    if not _tree_cascades_delete(obj.__class__):
        return None
    definition_id = obj.definition_id
    node_numbers_valid = node_numbers_valid_for_tree(
        obj._meta.db_table, definition_id)
    if node_numbers_valid:
        return TreeTableReferencePaginator
    return None


def _resolve_tree_definition_paginator(obj: Model, blocker_field: DeleteBlockerField) -> type[ReferencePaginator] | None:
    if not isinstance(blocker_field.field, ForeignKey):
        return None

    # These Paginators should only apply when the field CASCADEs delete
    if not blocker_field.cascades:
        return None

    tree_name = obj._meta.db_table.lower().replace("treedef", "")
    django_field_name = blocker_field.field.name
    field_name = django_field_name.lower()

    if field_name not in ("definition", "treedef"):
        return None

    tree_is_valid = node_numbers_valid_for_tree(tree_name, obj.pk)

    if not tree_is_valid:
        return None

    if issubclass(blocker_field.model, Tree) and field_name == "definition":
        return TreeNodeToDefinitionPaginator
    elif issubclass(blocker_field.model, TreeRank) and field_name == "treedef":
        return TreeRankToDefinitionPaginator
    return None


def _tree_cascades_delete(obj: type[Tree]):
    parent_field = obj._meta.get_field("parent")
    if not isinstance(parent_field, ForeignKey):
        return False
    # The ON_DELETE behavior is on the other side of the FK
    other_side = parent_field.remote_field
    if not isinstance(other_side, ForeignObjectRel):
        return False

    return relationship_cascades_delete(other_side)


def _is_discipline(obj: Model) -> bool:
    table_name = obj._meta.db_table.lower()
    return table_name == "discipline"


def _resolve_paginator_for_discipline(blocker_field: DeleteBlockerField):
    """
    We're only interested in custom paginator for the
    SpLocaleContainer -> discipline field
    """
    if blocker_field.db_table_name.lower() != "splocalecontainer":
        return None
    if blocker_field.django_field_name.lower() != "discipline" or not blocker_field.cascades:
        return None
    return SpLocaleContainerToDisciplinePaginator

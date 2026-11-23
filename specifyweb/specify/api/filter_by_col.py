"""
Modules for filtering resources by the collection logged in
"""

from django.core.exceptions import FieldError
from django.db.models import Q

from ..utils.scoping import Scoping, ScopeType
from specifyweb.specify.models import (
    Geography,
    Geologictimeperiod,
    Lithostrat,
    Taxon,
    Storage,
    Attachment,
    Tectonicunit,
    Accession,
    Spquery,
    Spqueryfolder,
)

CONCRETE_HIERARCHY = ["collection", "discipline", "division", "institution"]
HIERARCHY = ["collectionobject", *CONCRETE_HIERARCHY]


class HierarchyException(Exception):
    pass


# REFACTOR: Using Scoping here where possible
def filter_by_collection(queryset, collection, strict=True, user=None):
    if queryset.model is Spqueryfolder:
        visible_folders = (
            Q(scopetype='Collection', collection=collection)
            | Q(scopetype='Discipline', discipline=collection.discipline)
            | Q(scopetype='Database')
        )
        if user is not None:
            visible_folders |= Q(specifyuser=user) & (
                Q(scopetype__isnull=True) | Q(scopetype='')
            )
        return queryset.filter(visible_folders).distinct()

    if queryset.model is Spquery:
        visible_queries = (
            Q(spqueryfolder__scopetype='Collection', spqueryfolder__collection=collection)
            | Q(
                spqueryfolder__scopetype='Discipline',
                spqueryfolder__discipline=collection.discipline,
            )
            | Q(spqueryfolder__scopetype='Database')
        )
        if user is not None:
            visible_queries |= Q(specifyuser=user)
        return queryset.filter(visible_queries).distinct()

    if queryset.model is Attachment:
        return queryset.filter(
            Q(scopetype=None)
            | Q(scopetype=ScopeType.GLOBAL.value)
            | Q(scopetype=ScopeType.COLLECTION.value, scopeid=collection.id)
            | Q(scopetype=ScopeType.DISCIPLINE.value, scopeid=collection.discipline.id)
            | Q(scopetype=ScopeType.DIVISION.value, scopeid=collection.discipline.division.id)
            | Q(
                scopetype=ScopeType.INSTITUTION.value,
                scopeid=collection.discipline.division.institution.id,
            )
        )

    if queryset.model is Accession:
        scope = Scoping.scope_type_from_class(Accession)
        filters = ({"division": collection.discipline.division}
                   if scope == ScopeType.DIVISION
                   else {"division__institution": collection.discipline.division.institution})
        return queryset.filter(**filters)

    if queryset.model in (Geography, Geologictimeperiod, Lithostrat, Tectonicunit):
        return queryset.filter(definition__disciplines=collection.discipline)

    if queryset.model is Taxon:
        return queryset.filter(definition__discipline=collection.discipline)

    if queryset.model is Storage:
        return queryset.filter(
            definition__institutions=collection.discipline.division.institution.id
        )

    try:
        return queryset.filter(collectionmemberid=collection.id)
    except FieldError:
        pass

    for fieldname in HIERARCHY:
        if getattr(queryset.model, fieldname, None):
            break
    else:
        if strict:
            raise HierarchyException(
                "queryset model " + queryset.model.__name__ + " has no hierarchy field"
            )
        else:
            return queryset

    if fieldname == "collectionobject":
        lookup = "collectionobject__collection"
        join = "collection"
    else:
        lookup = join = fieldname

    value = collection
    field = "collection"
    while field != join:
        field = HIERARCHY[1 + HIERARCHY.index(field)]
        value = getattr(value, field)

    return queryset.filter(**{lookup: value})

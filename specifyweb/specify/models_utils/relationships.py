import logging
from collections.abc import Callable
from django.http import Http404
from specifyweb.backend.permissions.permissions import (
    NoMatchingRuleException, check_table_permissions, table_permissions_checker,
)
from specifyweb.backend.workbench.upload.auditlog import auditlog
from specifyweb.specify import models
from ..datamodel import datamodel, Table, Relationship
from specifyweb.specify.api_utils import strict_uri_to_model
from specifyweb.specify.utils.field_change_info import FieldChangeInfo
from specifyweb.specify.utils.scoping import Scoping
from specifyweb.specify.models_utils.load_datamodel import Relationship, Table
from typing import Any, Iterable, TypedDict, cast
from django.core.exceptions import ObjectDoesNotExist

logger = logging.getLogger(__name__)

def _is_circular_relationship(model, field_name: str, parent_relationship: Relationship | None = None) -> bool: 
    table: Table = cast(Table, model.specify_model)
    field = table.get_field(field_name)

    if field is None or parent_relationship is None: 
        return False

    if not field.is_relationship or parent_relationship.otherSideName is None or cast(Relationship, field).otherSideName is None: 
        return False
    
    return datamodel.reverse_relationship(cast(Relationship, field)) is parent_relationship

def is_dependent_field_collection(collection, model, field_name):
    if model.specify_model.get_field(field_name) is None:
        return False

    return (
        model.specify_model.get_field(field_name).dependent

        or (model is models.Collectionobject and
            field_name == 'collectingevent' and
            collection.isembeddedcollectingevent)

        or (field_name == 'paleocontext' and (

            (model is models.Collectionobject and
             collection.discipline.paleocontextchildtable == "collectionobject" and
             collection.discipline.ispaleocontextembedded)

            or (model is models.Collectingevent and
                collection.discipline.paleocontextchildtable == "collectingevent" and
                collection.discipline.ispaleocontextembedded)

            or (model is models.Locality and
                collection.discipline.paleocontextchildtable == "locality" and
                collection.discipline.ispaleocontextembedded))))

def is_dependent_field(obj, field_name: str) -> bool:
    if obj.specify_model.get_field(field_name) is None:
        return False

    return (
        obj.specify_model.get_field(field_name).dependent

        or (obj.__class__ is models.Collectionobject and
            field_name == 'collectingevent' and
            obj.collection.isembeddedcollectingevent)

        or (field_name == 'paleocontext' and (

            (obj.__class__ is models.Collectionobject and
             obj.collection.discipline.paleocontextchildtable == "collectionobject" and
             obj.collection.discipline.ispaleocontextembedded)

            or (obj.__class__ is models.Collectingevent and
                obj.discipline.paleocontextchildtable == "collectingevent" and
                obj.discipline.ispaleocontextembedded)

            or (obj.__class__ is models.Locality and
                obj.discipline.paleocontextchildtable == "locality" and
                obj.discipline.ispaleocontextembedded))))

def get_related_or_none(obj, field_name: str) -> Any:
    try:
        return getattr(obj, field_name)
    except ObjectDoesNotExist:
        return None

def _can_read_dependent(obj, read_checker: Callable[[Any], None]) -> bool:
    try:
        read_checker(obj)
    except NoMatchingRuleException:
        return False
    return True

def _should_apply_dependent_to_one_update(old_related, value, read_checker) -> bool:
    if value is None:
        # The serializer also uses null for an unreadable dependent.
        return _can_read_dependent(old_related, read_checker)
    new_id = value.get('id') if hasattr(value, 'items') else getattr(value, 'pk', None)
    if str(new_id) != str(old_related.pk):
        read_checker(old_related)
    return True

def reorder_fields_for_embedding(cls, data: dict[str, Any]) -> Iterable[tuple[str, Any]]:
    """For objects which can have embedded collectingevent or
    paleocontext, we have to make sure the domain field gets set
    first so that is_dependent_field will work.
    """
    put_first = {
        models.Collectionobject: 'collection',
        models.Collectingevent: 'discipline',
        models.Locality: 'discipline',
    }.get(cls, None)

    if put_first in data:
        yield (put_first, data[put_first])
    for key in data.keys() - {put_first}:
        yield (key, data[key])

def handle_fk_fields(collection, agent, obj, data: dict[str, Any]) -> tuple[list, list[FieldChangeInfo], Callable[[Any], list[str]]]:
    from specifyweb.specify.api.crud import update_or_create_resource
    """Where 'obj' is a Django model instance and 'data' is a dict,
    set foreign key fields in the object from the provided data.

    The returned callback applies deferred to-one updates and reports changed relationship names.
    """

    # This function looks at arbitrary related objects so it needs to be able to check read permissions
    read_checker = table_permissions_checker(collection, agent, "read")

    # A submitted domain change can change which relationships are embedded.
    previously_embedded = set()
    if obj.pk is not None and ('collection' in data or 'discipline' in data):
        previously_embedded = {
            name for name in ('collectingevent', 'paleocontext')
            if name in data and is_dependent_field(obj, name)
        }

    items = reorder_fields_for_embedding(obj.__class__, data)
    dependents_to_delete = []
    remote_to_ones = []
    dirty: list[FieldChangeInfo] = []
    for field_name, val in items:
        field = obj._meta.get_field(field_name)
        if not field.many_to_one and not field.one_to_one: continue

        if field.concrete: 
            some_remote_to_ones = []
            extra_data, some_dependents_to_delete, some_dirty = _handle_fk_field(
                collection, agent, obj, field, val, read_checker,
                was_embedded=field_name in previously_embedded,
            )
        else:
            extra_data = dict()
            some_dependents_to_delete, some_dirty, some_remote_to_ones = _handle_remote_fk_field(obj, field, val, read_checker)
        
        data.update(extra_data)
        dirty += some_dirty
        dependents_to_delete += some_dependents_to_delete
        remote_to_ones += some_remote_to_ones

    def _set_remote_to_ones(created_obj) -> list[str]:
        changed_fields = []
        for field, related_data, is_dependent, old_related_id in remote_to_ones:
            related_data[field.name] = created_obj
            rel_obj = update_or_create_resource(collection, agent, field.model, related_data, created_obj if is_dependent else None)
            setattr(obj, field.remote_field.name, rel_obj)
            if str(old_related_id) != str(rel_obj.id):
                changed_fields.append(field.remote_field.name)
        return changed_fields

    return dependents_to_delete, dirty, _set_remote_to_ones

def _handle_fk_field(collection, agent, obj, field, value, read_checker, *, was_embedded=False):
    from specifyweb.specify.api.crud import get_object_or_404, update_or_create_resource
    from specifyweb.specify.api.serializers import _obj_to_data

    field_name = field.name
    old_related = get_related_or_none(obj, field_name)
    dependent = is_dependent_field(obj, field_name)
    old_related_id = None if old_related is None else old_related.id
    new_related_id = None

    dependents_to_delete = []
    dirty: list[FieldChangeInfo] = []
    data = dict()

    if (dependent or was_embedded) and old_related is not None and not _should_apply_dependent_to_one_update(
        old_related, value, read_checker,
    ):
        return data, dependents_to_delete, dirty

    if value is None:
        setattr(obj, field_name, None)
        rel_obj = None
        if dependent and old_related:
            dependents_to_delete.append(old_related)

    elif isinstance(value, field.related_model):
        # The related value was patched into the data by a parent object.
        setattr(obj, field_name, value)
        rel_obj = value
        new_related_id = value.id

    elif isinstance(value, str):
        # The related object is given by a URI reference.
        assert not dependent, f"didn't get inline data for dependent field {field_name} in {obj}: {value!r}"
        _, fk_id = strict_uri_to_model(value, field.related_model.__name__)
        paths = (
            Scoping.collection_owner_paths(field.related_model)
            if field_name in Scoping.collection_owner_fields(type(obj)) else ()
        )
        queryset = field.related_model.objects.all()
        if paths:
            queryset = queryset.select_related(*paths)
        rel_obj = get_object_or_404(queryset, id=fk_id)
        read_checker(rel_obj)
        setattr(obj, field_name, rel_obj)
        new_related_id = fk_id

    elif hasattr(value, 'items'):  # i.e. it's a dict of some sort
        # The related object is represented by a nested dict of data.
        rel_model = field.related_model
        datamodel_field = obj.specify_model.get_relationship_strict(field_name)
        rel_obj = update_or_create_resource(collection, agent, rel_model, value, obj if dependent else None, datamodel_field)

        setattr(obj, field_name, rel_obj)
        if dependent and old_related and old_related.id != rel_obj.id:
            dependents_to_delete.append(old_related)
        new_related_id = rel_obj.id
        data[field_name] = _obj_to_data(rel_obj, read_checker)
    else:
        raise Exception(f'bad foreign key field in data: {field_name}')

    if str(old_related_id) != str(new_related_id):
        dirty.append(FieldChangeInfo(field_name=field_name, old_value=old_related_id, new_value=new_related_id))

    return data, dependents_to_delete, dirty

def _handle_remote_fk_field(obj, field, value, read_checker): 
    from specifyweb.specify.api.crud import get_object_or_404
    from specifyweb.specify.api.serializers import _obj_to_data

    field_name = field.name
    old_related = get_related_or_none(obj, field_name)
    dependent = is_dependent_field(obj, field_name)
    old_related_id = None if old_related is None else old_related.id
    new_related_id = None

    remote_to_ones = []
    dependents_to_delete = []
    dirty: list[FieldChangeInfo] = []

    if dependent and old_related is not None and not _should_apply_dependent_to_one_update(
        old_related, value, read_checker,
    ):
        return dependents_to_delete, dirty, remote_to_ones

    if value is None:
        rel_data = None
        setattr(obj, field_name, None)
        if dependent and old_related:
            dependents_to_delete.append(old_related)

    elif isinstance(value, field.related_model):
        # The related value was patched into the data by a parent object.
        setattr(obj, field_name, value)
        rel_data = _obj_to_data(value, read_checker)
        new_related_id = value.id

    elif isinstance(value, str):
        # The related object is given by a URI reference.
        assert not dependent, f"didn't get inline data for dependent field {field_name} in {obj}: {value!r}"
        fk_model, fk_id = strict_uri_to_model(value, field.related_model.__name__)
        rel_obj = get_object_or_404(fk_model, id=fk_id)
        setattr(obj, field_name, rel_obj)
        rel_data = _obj_to_data(rel_obj, read_checker)
        new_related_id = rel_obj.pk

    elif hasattr(value, 'items'):  # i.e. it's a dict of some sort
        # The related object is represented by a nested dict of data.
        rel_data = value
        new_related_id = value.get("id", None)
        if dependent and old_related and new_related_id and str(old_related.id) != str(new_related_id):
            dependents_to_delete.append(old_related)
    else:
        raise Exception(f'bad foreign key field in data: {field_name}')

    if str(old_related_id) != str(new_related_id):
        dirty.append(FieldChangeInfo(field_name=field_name, old_value=old_related_id, new_value=new_related_id))

    if not rel_data is None: 
        remote_to_ones.append((field.remote_field, rel_data, dependent, old_related_id))
    return dependents_to_delete, dirty, remote_to_ones

def handle_to_many(collection, agent, obj, data: dict[str, Any]) -> list[str]:
    """For every key in the dict 'data' which is a *-to-many field in the
    Django model instance 'obj', if nested data is provided, use it to
    update the set of related objects.

    A submitted dependent list replaces the actor's readable membership.
    Existing unreadable dependents omitted from the list are retained.
    Nested data items with ids will be updated. Those without ids will be
    created as new resources. Return names of relationships whose membership changed.
    """
    changed_fields = []
    for field_name, val in list(data.items()):
        field = obj._meta.get_field(field_name)
        if not field.is_relation or (field.many_to_one or field.one_to_one): continue # Skip *-to-one fields.
        dependent = is_dependent_field(obj, field_name)

        if isinstance(val, list): 
            assert dependent or (isinstance(obj, models.Recordset) and field_name == 'recordsetitems'), \
                f"got inline data for non dependent field {field_name} in {obj}: {val!r}"
        elif hasattr(val, "items"): 
            assert not dependent, f"got inline dictionary data for dependent field {field_name} in {obj}: {val!r}"
        else: 
            # The field contains something other than nested data. 
            # Probably the URI of the collection
            continue

        if dependent or (isinstance(obj, models.Recordset) and field_name == 'recordsetitems'): 
            changed = _handle_dependent_to_many(collection, agent, obj, field, val)
        else: 
            changed = _handle_independent_to_many(collection, agent, obj, field, val)
        if changed:
            changed_fields.append(field_name)
    return changed_fields

def _handle_dependent_to_many(collection, agent, obj, field, value) -> bool:
    from specifyweb.specify.api.crud import update_or_create_resource

    if not isinstance(value, list): 
        assert isinstance(value, list), f"didn't get inline data for dependent field {field.name} in {obj}: {value!r}"

    rel_model = field.related_model
    related = getattr(obj, field.name)
    existing_ids = set(related.values_list('pk', flat=True)) if obj.pk is not None else set()
    submitted_ids = set()

    for rel_data in value:
        rel_data[field.field.name] = obj
        rel_obj = update_or_create_resource(collection, agent, rel_model, rel_data, parent_obj=obj)

        submitted_ids.add(rel_obj.pk)

    # TODO: Check versions for optimistic locking.
    read_checker = table_permissions_checker(collection, agent, "read")
    removed_ids = []
    for rel_obj in related.exclude(pk__in=submitted_ids).select_for_update():
        if not _can_read_dependent(rel_obj, read_checker):
            continue
        check_table_permissions(collection, agent, rel_obj, "delete")
        auditlog.remove(rel_obj, agent, obj)
        removed_ids.append(rel_obj.pk)

    if removed_ids:
        related.filter(pk__in=removed_ids).delete()
    return bool(removed_ids) or not submitted_ids.issubset(existing_ids)


class IndependentInline(TypedDict): 
    update: list[str | dict[str, Any]]
    remove: list[str]

def _handle_independent_to_many(collection, agent, obj, field, value: IndependentInline) -> bool:
    from ..api.crud import get_model, update_or_create_resource, update_obj  
    from ..api.serializers import obj_to_data, uri_for_model

    logger.warning("Updating independent collections via the API is experimental and the structure may be changed in the future")
    
    rel_model = field.related_model

    to_update = value.get('update', [])
    to_remove = value.get('remove', [])
    current_ids = set(getattr(obj, field.name).values_list('pk', flat=True)) if obj.pk is not None else set()
    changed = False

    ids_to_fetch: list[int] = []
    cached_objs: dict[int, dict[str, Any]] = dict()
    fk_model = None

    to_fetch: tuple[str, ...] = tuple(string_or_data for string_or_data in tuple((*to_update, *to_remove)) if isinstance(string_or_data, str))

    # Fetch the related records which are provided as strings
    for resource_uri in to_fetch: 
        fk_model, fk_id = strict_uri_to_model(resource_uri, rel_model.__name__)
        ids_to_fetch.append(fk_id)

    if fk_model is not None: 
        cached_objs = {item.id: obj_to_data(item) for item in get_model(fk_model).objects.filter(id__in=ids_to_fetch).select_for_update()}

    for raw_rel_data in to_update: 
        if isinstance(raw_rel_data, str): 
            fk_model, fk_id = strict_uri_to_model(raw_rel_data, rel_model.__name__)
            rel_data = cached_objs.get(fk_id)
            if rel_data is None: 
                raise Http404(f"{rel_model.specify_model.name} with id {fk_id} does not exist")
            if rel_data[field.field.name] == uri_for_model(obj.__class__, obj.id): 
                continue
        else: 
            rel_data = raw_rel_data

        rel_data[field.field.name] = obj
        rel_obj = update_or_create_resource(collection, agent, rel_model, rel_data, parent_obj=None)
        if rel_obj.pk not in current_ids:
            changed = True
            current_ids.add(rel_obj.pk)
    
    if len(to_remove) > 0:
        assert obj.pk is not None, f"Unable to remove {obj.__class__.__name__}.{field.field.name} resources from new {obj.__class__.__name__}"
        related_field = datamodel.reverse_relationship(obj.specify_model.get_field_strict(field.name))
        assert related_field is not None, f"no reverse relationship for {obj.__class__.__name__}.{field.field.name}" 
        for resource_uri in to_remove: 
            fk_model, fk_id = strict_uri_to_model(resource_uri, rel_model.__name__)
            rel_data = cached_objs.get(fk_id)
            if rel_data is None: 
                raise Http404(f"{rel_model.specify_model.name} with id {fk_id} does not exist")
            # The otherside could be dependent and thus not a uri
            if not is_dependent_field_collection(collection, rel_model, related_field.name):
                assert rel_data[field.field.name] == uri_for_model(obj.__class__, obj.pk), f"Related {related_field.relatedModelName} does not belong to {obj.__class__.__name__}.{field.field.name}: {resource_uri}"
            rel_data[field.field.name] = None
            update_obj(collection, agent, rel_model, rel_data["id"], rel_data["version"], rel_data)
            if fk_id in current_ids:
                changed = True
                current_ids.remove(fk_id)
    return changed


class RecordSetInfo(TypedDict):
    recordsetid: int
    total_count: int
    index: int
    previous: str | None
    next: str | None

def get_recordset_info(obj, recordsetid: int, *, actor=None) -> RecordSetInfo | None:
    from specifyweb.specify.api.serializers import uri_for_model
    from specifyweb.backend.permissions.permissions import _filter_readable_for_list

    """Return a dict of info about how the resource 'obj' is related to
    the recordset with id 'recordsetid'.
    """
    # Queryset of record set items in the given record set with
    # the additional condition that they match the resource's table.
    Recordsetitem = models.Recordsetitem
    rsis = Recordsetitem.objects.filter(
        recordset__id=recordsetid, recordset__dbtableid=obj.specify_model.tableId)
    if actor is not None:
        rsis = rsis.filter(recordid__in=_filter_readable_for_list(obj.__class__.objects.all(), actor).values('pk'))

    # Get the one which points to the resource 'obj'.
    try:
        rsi = rsis.get(recordid=obj.id)
    except Recordsetitem.DoesNotExist:
        return None

    # Querysets for the recordset items before and after the one in question.
    prev_rsis = rsis.filter(recordid__lt=obj.id).order_by('-recordid')
    next_rsis = rsis.filter(recordid__gt=obj.id).order_by('recordid')

    # Build URIs for the previous and the next recordsetitem, if present.
    try:
        prev: str | None = uri_for_model(obj.__class__, prev_rsis[0].recordid)
    except IndexError:
        prev = None

    try:
        next: str | None = uri_for_model(obj.__class__, next_rsis[0].recordid)
    except IndexError:
        next = None

    return {
        'recordsetid': rsi.recordset_id,
        'total_count': rsis.count(),
        'index': prev_rsis.count(),
        'previous': prev,
        'next': next
        }

import logging
from collections.abc import Callable
from django.http import Http404
from specifyweb.backend.permissions.permissions import check_table_permissions, table_permissions_checker
from specifyweb.specify import auditlog, models
from .datamodel import datamodel, Table, Relationship
from specifyweb.specify.api_utils import strict_uri_to_model
from specifyweb.specify.field_change_info import FieldChangeInfo
from specifyweb.specify.load_datamodel import Relationship, Table
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

def handle_fk_fields(collection, agent, obj, data: dict[str, Any]) -> tuple[list, list[FieldChangeInfo], Callable[[Any], None]]:
    from specifyweb.specify.crud import update_or_create_resource
    """Where 'obj' is a Django model instance and 'data' is a dict,
    set foreign key fields in the object from the provided data.
    """

    # This function looks at arbitrary related objects so it needs to be able to check read permissions
    read_checker = table_permissions_checker(collection, agent, "read")

    items = reorder_fields_for_embedding(obj.__class__, data)
    dependents_to_delete = []
    remote_to_ones = []
    dirty: list[FieldChangeInfo] = []
    for field_name, val in items:
        field = obj._meta.get_field(field_name)
        if not field.many_to_one and not field.one_to_one: continue

        if field.concrete: 
            some_remote_to_ones = []
            extra_data, some_dependents_to_delete, some_dirty = _handle_fk_field(collection, agent, obj, field, val, read_checker)
        else:
            extra_data = dict()
            some_dependents_to_delete, some_dirty, some_remote_to_ones = _handle_remote_fk_field(obj, field, val, read_checker)
        
        data.update(extra_data)
        dirty += some_dirty
        dependents_to_delete += some_dependents_to_delete
        remote_to_ones += some_remote_to_ones

    def _set_remote_to_ones(created_obj): 
        for field, related_data, is_dependent in remote_to_ones: 
            related_data[field.name] = created_obj
            rel_obj = update_or_create_resource(collection, agent, field.model, related_data, created_obj if is_dependent else None)
            setattr(obj, field.remote_field.name, rel_obj)

    return dependents_to_delete, dirty, _set_remote_to_ones

def _handle_fk_field(collection, agent, obj, field, value, read_checker): 
    from specifyweb.specify.crud import get_object_or_404, update_or_create_resource
    from specifyweb.specify.serializers import _obj_to_data

    field_name = field.name
    old_related = get_related_or_none(obj, field_name)
    dependent = is_dependent_field(obj, field_name)
    old_related_id = None if old_related is None else old_related.id
    new_related_id = None

    dependents_to_delete = []
    dirty: list[FieldChangeInfo] = []
    data = dict()

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
        fk_model, fk_id = strict_uri_to_model(value, field.related_model.__name__)
        rel_obj = get_object_or_404(fk_model, id=fk_id)
        setattr(obj, field_name, rel_obj)
        new_related_id = fk_id

    elif hasattr(value, 'items'):  # i.e. it's a dict of some sort
        # The related object is represented by a nested dict of data.
        rel_model = field.related_model
        datamodel_field = obj.specify_model.get_relationship(field_name)
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
    from specifyweb.specify.crud import get_object_or_404
    from specifyweb.specify.serializers import _obj_to_data

    field_name = field.name
    old_related = get_related_or_none(obj, field_name)
    dependent = is_dependent_field(obj, field_name)
    old_related_id = None if old_related is None else old_related.id
    new_related_id = None

    remote_to_ones = []
    dependents_to_delete = []
    dirty: list[FieldChangeInfo] = []

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
        if dependent and old_related and new_related_id and old_related.id != new_related_id:
            dependents_to_delete.append(old_related)
    else:
        raise Exception(f'bad foreign key field in data: {field_name}')

    if str(old_related_id) != str(new_related_id):
        dirty.append(FieldChangeInfo(field_name=field_name, old_value=old_related_id, new_value=new_related_id))

    if not rel_data is None: 
        remote_to_ones.append((field.remote_field, rel_data, dependent))
    return dependents_to_delete, dirty, remote_to_ones

def handle_to_many(collection, agent, obj, data: dict[str, Any]) -> None:
    """For every key in the dict 'data' which is a *-to-many field in the
    Django model instance 'obj', if nested data is provided, use it to
    update the set of related objects.

    The assumption is that provided data represents ALL related objects for
    'obj'. Any existing related objects not in the nested data will be deleted.
    Nested data items with ids will be updated. Those without ids will be
    created as new resources.
    """
    
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
            _handle_dependent_to_many(collection, agent, obj, field, val)
        else: 
            _handle_independent_to_many(collection, agent, obj, field, val)

def _handle_dependent_to_many(collection, agent, obj, field, value):
    from specifyweb.specify.crud import update_or_create_resource

    if not isinstance(value, list): 
        assert isinstance(value, list), f"didn't get inline data for dependent field {field.name} in {obj}: {value!r}"

    rel_model = field.related_model
    ids = [] # Ids not in this list will be deleted at the end.

    for rel_data in value:
        rel_data[field.field.name] = obj
        rel_obj = update_or_create_resource(collection, agent, rel_model, rel_data, parent_obj=obj)

        ids.append(rel_obj.id) # Record the id as one to keep.

    # Delete related objects not in the ids list.
    # TODO: Check versions for optimistic locking.
    to_remove = getattr(obj, field.name).exclude(id__in=ids).select_for_update()
    for rel_obj in to_remove:
        check_table_permissions(collection, agent, rel_obj, "delete")
        auditlog.remove(rel_obj, agent, obj)
    
    to_remove.delete()


class IndependentInline(TypedDict): 
    update: list[str | dict[str, Any]]
    remove: list[str]

def _handle_independent_to_many(collection, agent, obj, field, value: IndependentInline):
    from crud import get_model, update_or_create_resource, update_obj  
    from serializers import obj_to_data, uri_for_model

    logger.warning("Updating independent collections via the API is experimental and the structure may be changed in the future")
    
    rel_model = field.related_model

    to_update = value.get('update', [])
    to_remove = value.get('remove', [])

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
        update_or_create_resource(collection, agent, rel_model, rel_data, parent_obj=None)
    
    if len(to_remove) > 0:
        assert obj.pk is not None, f"Unable to remove {obj.__class__.__name__}.{field.field.name} resources from new {obj.__class__.__name__}"
        related_field = datamodel.reverse_relationship(obj.specify_model.get_field_strict(field.name))
        assert related_field is not None, f"no reverse relationship for {obj.__class__.__name__}.{field.field.name}" 
        for resource_uri in to_remove: 
            fk_model, fk_id = strict_uri_to_model(resource_uri, rel_model.__name__)
            rel_data = cached_objs.get(fk_id)
            if rel_data is None: 
                raise Http404(f"{rel_model.specify_model.name} with id {fk_id} does not exist")
            assert rel_data[field.field.name] == uri_for_model(obj.__class__, obj.pk), f"Related {related_field.relatedModelName} does not belong to {obj.__class__.__name__}.{field.field.name}: {resource_uri}"
            rel_data[field.field.name] = None
            update_obj(collection, agent, rel_model, rel_data["id"], rel_data["version"], rel_data)


class RecordSetInfo(TypedDict):
    recordsetid: int
    total_count: int
    index: int
    previous: str | None
    next: str | None

def get_recordset_info(obj, recordsetid: int) -> RecordSetInfo | None:
    from specifyweb.specify.serializers import uri_for_model

    """Return a dict of info about how the resource 'obj' is related to
    the recordset with id 'recordsetid'.
    """
    # Queryset of record set items in the given record set with
    # the additional condition that they match the resource's table.
    Recordsetitem = models.Recordsetitem
    rsis = Recordsetitem.objects.filter(
        recordset__id=recordsetid, recordset__dbtableid=obj.specify_model.tableId)

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
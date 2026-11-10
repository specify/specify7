import logging
from collections.abc import Callable
from contextlib import contextmanager, nullcontext
from django.http import Http404
from specifyweb.backend.permissions.permissions import (
    check_field_permissions, check_table_permissions, table_permissions_checker,
)
from specifyweb.specify import models
from ..datamodel import datamodel, Table, Relationship
from specifyweb.specify.api.api_utils import strict_uri_to_model
from specifyweb.specify.utils.field_change_info import FieldChangeInfo
from specifyweb.specify.utils.scoping import Scoping
from specifyweb.specify.models_utils.load_datamodel import Relationship, Table
from typing import Any, Iterable, TypedDict, cast
from django.core.exceptions import BadRequest, ObjectDoesNotExist

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

def handle_fk_fields(collection, agent, obj, data: dict[str, Any], *, parent_obj=None) -> tuple[list, list[FieldChangeInfo], Callable[[Any], None]]:
    """Where 'obj' is a Django model instance and 'data' is a dict,
    set foreign key fields in the object from the provided data.

    URI references require read permission in the target record's scope.
    Reverse unlinking preserves the parent being edited. Reverse one-to-one
    reassignment authorizes the original parent's relationship as well.
    """
    from specifyweb.specify.api.crud import get_object_or_404, update_or_create_resource

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
            extra_data, some_dependents_to_delete, some_dirty = _handle_fk_field(
                collection, agent, obj, field, val, read_checker, parent_obj=parent_obj,
            )
        else:
            extra_data = dict()
            some_dependents_to_delete, some_dirty, some_remote_to_ones = _handle_remote_fk_field(obj, field, val, read_checker)
        
        data.update(extra_data)
        dirty += some_dirty
        dependents_to_delete += some_dependents_to_delete
        remote_to_ones += some_remote_to_ones

    def _set_remote_to_ones(created_obj): 
        for field, related_data, is_dependent in remote_to_ones:
            related_obj = None
            if related_data.get('id') is not None:
                related_obj = get_object_or_404(
                    field.model.objects.select_for_update(), pk=related_data['id'],
                )
            related_data.setdefault(field.name, created_obj)
            authorization = (
                nullcontext() if related_obj is None else _authorize_related_update(
                    collection, agent, created_obj, field.remote_field, related_obj,
                )
            )
            with authorization:
                rel_obj = update_or_create_resource(
                    collection, agent, field.model, related_data,
                    created_obj if is_dependent else None,
                )
            setattr(obj, field.remote_field.name, None if related_data[field.name] is None else rel_obj)

    return dependents_to_delete, dirty, _set_remote_to_ones

def _handle_fk_field(collection, agent, obj, field, value, read_checker, *, parent_obj=None):
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

    if value is None:
        setattr(obj, field_name, None)
        rel_obj = None
        if dependent and old_related and old_related != parent_obj:
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
    from specifyweb.specify.api.validators import cleanData

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
        elif old_related:
            read_checker(old_related)
            rel_data = {
                'id': old_related.pk, 'version': old_related.version,
                field.field.name: None,
            }

    elif isinstance(value, field.related_model):
        # The related value was patched into the data by a parent object.
        rel_data = {'id': value.pk, 'version': value.version}
        new_related_id = value.id

    elif isinstance(value, str):
        # The related object is given by a URI reference.
        if dependent:
            raise BadRequest(f"Expected inline data for dependent field {field_name}")
        try:
            fk_model, fk_id = strict_uri_to_model(value, field.related_model.__name__)
        except (AssertionError, ValueError, TypeError) as error:
            raise BadRequest(f"Invalid resource URI for {field_name}") from error
        rel_obj = get_object_or_404(fk_model, id=fk_id)
        read_checker(rel_obj)
        rel_data = {'id': rel_obj.pk, 'version': rel_obj.version}
        new_related_id = rel_obj.pk

    elif hasattr(value, 'items'):  # i.e. it's a dict of some sort
        # The related object is represented by a nested dict of data.
        rel_data = cleanData(field.related_model, value)
        rel_data.pop(field.field.name, None)
        new_related_id = rel_data.get("id")
    else:
        raise BadRequest(f"Invalid related record data for {field_name}")

    if value is not None and dependent and old_related and str(old_related_id) != str(new_related_id):
        dependents_to_delete.append(old_related)

    if str(old_related_id) != str(new_related_id):
        dirty.append(FieldChangeInfo(field_name=field_name, old_value=old_related_id, new_value=new_related_id))

    if not rel_data is None: 
        remote_to_ones.append((field.remote_field, rel_data, dependent))
    return dependents_to_delete, dirty, remote_to_ones

def handle_to_many(collection, agent, obj, data: dict[str, Any]) -> None:
    """For every key in the dict 'data' which is a *-to-many field in the
    Django model instance 'obj', if nested data is provided, use it to
    update the set of related objects.

    Dependent lists replace the relationship; omitted children require delete
    permission, including their cascades. Independent dictionaries link or
    unlink only the specified children. Reparenting also requires permission
    to update the original parent's relationship.
    """
    
    for field_name, val in list(data.items()):
        field = obj._meta.get_field(field_name)
        if not field.is_relation or (field.many_to_one or field.one_to_one): continue # Skip *-to-one fields.
        dependent = is_dependent_field(obj, field_name)

        if not isinstance(val, (list, dict)):
            # The field contains something other than nested data. 
            # Probably the URI of the collection
            continue
        if not field.one_to_many:
            raise BadRequest(f"Inline mutation is not supported for {field_name}")
        if dependent or (isinstance(obj, models.Recordset) and field_name == 'recordsetitems'):
            if not isinstance(val, list):
                raise BadRequest(f"Expected a list for {field_name}")
            _handle_dependent_to_many(collection, agent, obj, field, val)
        else:
            if not isinstance(val, dict):
                raise BadRequest(f"Expected an update/remove dictionary for {field_name}")
            _handle_independent_to_many(collection, agent, obj, field, val)

@contextmanager
def _authorize_related_update(collection, agent, obj, field, related_obj):
    """Authorize the original parent and any inherited descendant scope changes."""
    original = get_related_or_none(related_obj, field.field.name)
    if original is not None and original != obj:
        check_table_permissions(collection, agent, original, "update")
        check_field_permissions(collection, agent, original, [field.name], "update")

    # Descendants can inherit scope through the moved record (e.g. notebook pages).
    states = []
    seen = {(type(related_obj), related_obj.pk)}

    def collect_dependents(parent):
        for relation in parent._meta.get_fields():
            if not relation.is_relation or not is_dependent_field(parent, relation.name):
                continue
            if relation.one_to_many:
                children = getattr(parent, relation.name).select_for_update()
            elif relation.many_to_one or relation.one_to_one:
                child = get_related_or_none(parent, relation.name)
                children = [] if child is None else [child]
            else:
                continue
            for child in children:
                key = (type(child), child.pk)
                if key in seen:
                    continue
                seen.add(key)
                states.append((child, Scoping.scope_for_record(child)))
                collect_dependents(child)

    collect_dependents(related_obj)
    yield
    for child, original_scope in states:
        current = type(child).objects.filter(pk=child.pk).first()
        if current is None:
            continue  # Explicit nested deletion was authorized by its own deleter.
        if Scoping.scope_for_record(current) != original_scope:
            check_table_permissions(collection, agent, child, "update")
            check_table_permissions(collection, agent, current, "update")

def _handle_dependent_to_many(collection, agent, obj, field, value):
    from specifyweb.specify.api.crud import (
        delete_obj, get_object_or_404, make_default_deleter, update_or_create_resource,
    )
    from specifyweb.specify.api.validators import cleanData

    rel_model = field.related_model
    ids = [] # Ids not in this list will be deleted at the end.

    for rel_data in value:
        if not isinstance(rel_data, dict):
            raise BadRequest(f"Expected child data for {field.name}")
        rel_data = cleanData(rel_model, rel_data)
        related_obj = None
        if rel_data.get('id') is not None:
            related_obj = get_object_or_404(
                rel_model.objects.select_for_update(), pk=rel_data['id'],
            )
        rel_data[field.field.name] = obj
        authorization = (
            nullcontext() if related_obj is None
            else _authorize_related_update(collection, agent, obj, field, related_obj)
        )
        with authorization:
            rel_obj = update_or_create_resource(collection, agent, rel_model, rel_data, parent_obj=obj)

        ids.append(rel_obj.id) # Record the id as one to keep.

    # Delete related objects not in the ids list.
    # TODO: Check versions for optimistic locking.
    to_remove = getattr(obj, field.name).exclude(id__in=ids).select_for_update()
    deleter = make_default_deleter(collection, agent)
    for rel_obj in to_remove:
        delete_obj(rel_obj, deleter, parent_obj=obj)


class IndependentInline(TypedDict): 
    update: list[str | dict[str, Any]]
    remove: list[str]

def _handle_independent_to_many(collection, agent, obj, field, value: IndependentInline):
    from ..api.crud import get_object_or_404, update_or_create_resource, update_obj
    from ..api.validators import cleanData

    logger.warning("Updating independent collections via the API is experimental and the structure may be changed in the future")
    
    rel_model = field.related_model

    to_update = value.get('update', [])
    to_remove = value.get('remove', [])
    if (
        not isinstance(to_update, list) or not isinstance(to_remove, list)
        or any(not isinstance(item, (str, dict)) for item in to_update)
        or any(not isinstance(item, str) for item in to_remove)
        or value.keys() - {'update', 'remove'}
    ):
        raise BadRequest(f"Invalid update/remove data for {field.name}")
    uri_ids = {}
    for resource_uri in (*to_update, *to_remove):
        if isinstance(resource_uri, str):
            try:
                _, related_id = strict_uri_to_model(resource_uri, rel_model.__name__)
            except (AssertionError, ValueError, TypeError) as error:
                raise BadRequest(f"Invalid resource URI for {field.name}") from error
            uri_ids[resource_uri] = related_id
    cached_objs = {
        item.pk: item for item in rel_model.objects.filter(
            pk__in=uri_ids.values(),
        ).select_for_update()
    }

    for raw_rel_data in to_update: 
        related_obj = None
        if isinstance(raw_rel_data, str): 
            related_id = uri_ids[raw_rel_data]
            related_obj = cached_objs.get(related_id)
            if related_obj is None:
                raise Http404(f"{rel_model.specify_model.name} with id {related_id} does not exist")
            related_obj.refresh_from_db()
            check_table_permissions(collection, agent, related_obj, "read")
            check_table_permissions(collection, agent, related_obj, "update")
            if getattr(related_obj, field.field.attname) == obj.pk:
                continue
            rel_data = {'id': related_obj.pk, 'version': related_obj.version}
        else: 
            rel_data = cleanData(rel_model, raw_rel_data)
            if rel_data.get('id') is not None:
                related_obj = get_object_or_404(
                    rel_model.objects.select_for_update(), pk=rel_data['id'],
                )

        rel_data[field.field.name] = obj
        authorization = (
            nullcontext() if related_obj is None
            else _authorize_related_update(collection, agent, obj, field, related_obj)
        )
        with authorization:
            update_or_create_resource(collection, agent, rel_model, rel_data, parent_obj=None)
    
    if len(to_remove) > 0:
        for resource_uri in to_remove: 
            related_id = uri_ids[resource_uri]
            related_obj = cached_objs.get(related_id)
            if related_obj is None:
                raise Http404(f"{rel_model.specify_model.name} with id {related_id} does not exist")
            related_obj.refresh_from_db()
            check_table_permissions(collection, agent, related_obj, "read")
            check_table_permissions(collection, agent, related_obj, "update")
            if getattr(related_obj, field.field.attname) != obj.pk:
                raise BadRequest(f"Related {rel_model.specify_model.name} does not belong to {field.name}")
            update_obj(
                collection, agent, rel_model, related_obj.pk, related_obj.version,
                {field.field.name: None}, parent_obj=obj,
            )


class RecordSetInfo(TypedDict):
    recordsetid: int
    total_count: int
    index: int
    previous: str | None
    next: str | None

def get_recordset_info(obj, recordsetid: int) -> RecordSetInfo | None:
    from specifyweb.specify.api.serializers import uri_for_model

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
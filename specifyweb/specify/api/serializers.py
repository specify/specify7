import json
from typing import Any
from specifyweb.specify import models
from specifyweb.specify.api.calculated_fields import calculate_extra_fields
from specifyweb.specify.api.crud import ReadPermChecker
from specifyweb.specify.models_utils.relationships import is_dependent_field
from sqlalchemy.engine import Row
from django.db.models.fields import DateTimeField
from urllib.parse import urlencode


class JsonEncoder(json.JSONEncoder):
    """Augmented JSON encoder that handles datetime and decimal objects."""
    def default(self, obj):
        from decimal import Decimal
        if isinstance(obj, Row):
            return [self.default(field) for field in obj._data]
        # if isinstance(obj, CallableBool):
        #     return obj()
        # JSON numbers are double precision floating point values, while Python
        # decimals are fixed precision. Thus, need to convert them to strings
        if isinstance(obj, Decimal):
            return str(obj)
        if hasattr(obj, 'isoformat'):
            return obj.isoformat()
        if isinstance(obj, bytes):
            # assume byte data is utf encoded text.
            # this works for things like app resources.
            return obj.decode()
        if isinstance(obj, int) or isinstance(obj, str):
            return obj
        if obj is None:
            return None
        if hasattr(obj, '__str__'):
            return str(obj)
        return json.JSONEncoder.default(self, obj)

def toJson(obj: Any) -> str:
    return json.dumps(obj, cls=JsonEncoder)

def prepare_value(field, val: Any) -> Any:
    if isinstance(field, DateTimeField) and isinstance(val, str):
        return val.replace('T', ' ')
    return val

def _obj_to_data(obj, perm_checker: ReadPermChecker) -> dict[str, Any]:
    """Return a (potentially nested) dictionary of the fields of the
    Django model instance 'obj'.
    """
    perm_checker(obj)

    # Get regular and *-to-one fields.
    fields = obj._meta.get_fields()
    if isinstance(obj, models.Specifyuser):
        # block out password field from users table
        fields = [f for f in fields if f.name != 'password']

    data = {field.name: field_to_val(obj, field, perm_checker)
                for field in fields
                # if not (field.auto_created or field.one_to_many or field.many_to_many))
                if not (field.one_to_many or field.many_to_many)}
    # Get *-to-many fields.
    data.update({ro.get_accessor_name(): to_many_to_data(obj, ro, perm_checker)
                     for ro in obj._meta.get_fields()
                     if ro.one_to_many
                     and obj.specify_model.get_field(ro.get_accessor_name()) is not None})
    # Add a meta data field with the resource's URI.
    data['resource_uri'] = uri_for_model(obj.__class__.__name__.lower(), obj.id)

    data.update(calculate_extra_fields(obj, data))
    return data


def obj_to_data(obj) -> dict[str, Any]:
    "Wrapper for backwards compat w/ other modules that use this function."
    # TODO: Such functions should be audited for whether they should apply
    # read permisions enforcement.
    return _obj_to_data(obj, lambda o: None)



def to_many_to_data(obj, rel, checker: ReadPermChecker) -> str | list[dict[str, Any]]:
    """Return the URI or nested data of the 'rel' collection
    depending on if the field is included in the 'inlined_fields' global.
    """
    parent_model = rel.model.specify_model
    field_name = rel.get_accessor_name()
    field = parent_model.get_field(field_name)
    if field is not None and field.dependent:
        objs = getattr(obj, field_name)
        return [_obj_to_data(o, checker) for o in objs.all()]

    collection_uri = uri_for_model(rel.related_model)
    return collection_uri + '?' + urlencode([(rel.field.name.lower(), str(obj.id))])


def field_to_val(obj, field, checker: ReadPermChecker) -> Any:
    """Return the value or nested data or URI for the given field which should
    be either a regular field or a *-to-one field.
    """
    if field.many_to_one or field.one_to_one:
        if is_dependent_field(obj, field.name):
            related_obj = getattr(obj, field.name, None)
            if related_obj is None: return None
            return _obj_to_data(related_obj, checker)
        
        # The FK can exist on the other side in the case of one_to_one 
        # relationships
        has_fk = hasattr(obj, field.name + '_id')
        if has_fk: 
            related_id = getattr(obj, field.name + '_id')
        else: 
            related_obj = getattr(obj, field.name, None)
            related_id = getattr(related_obj, 'id', None)

        if related_id is None: return None
        return uri_for_model(field.related_model, related_id)
    else:
        return getattr(obj, field.name, None)
    

def uri_for_model(model, id=None) -> str:
    """Given a Django model and optionally an id, return a URI
    for the collection or resource (if an id is given).
    """
    if not isinstance(model, str):
        model = model.__name__
    uri = '/api/specify/%s/' % model.lower()
    if id is not None:
        uri += '%d/' % int(id)
    return uri
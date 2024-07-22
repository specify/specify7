from django.utils import timezone
from django.db.models import Model

timestamp_fields = [('timestampmodified', True), ('timestampcreated', False)]

fields_to_skip = [field[0] for field in timestamp_fields if not field[1]]

def save_auto_timestamp_field_with_override(save_func, args, kwargs, obj):
    # If object already is present, reset timestamps to null.
    model: Model = obj.__class__
    is_forced_insert = kwargs.get('force_insert', False)
    fields_to_update = kwargs.get('update_fields', None)
    if fields_to_update is None:
        fields_to_update = [
            field.name for field in model._meta.get_fields(include_hidden=True) if field.concrete
            and not field.primary_key
            ]

    if obj.id is not None:
        fields_to_update = [
            field for field in fields_to_update
            if field not in fields_to_skip
            ]
        
    current = timezone.now()
    _set_if_empty(obj, timestamp_fields, current, obj.pk is not None)
    new_kwargs = {**kwargs, 'update_fields': fields_to_update} if obj.pk is not None and not is_forced_insert else kwargs
    return save_func(*args, **new_kwargs)

def _set_if_empty(obj, fields, default_value, override=False):
    for field, can_override in fields:
        if not hasattr(obj, field):
            continue
        if (override and can_override) or getattr(obj, field) is None:
            setattr(obj, field, default_value)
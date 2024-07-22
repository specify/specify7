from django.db import models
from django.utils import timezone
from django.conf import settings



timestamp_fields = {'timestampmodified', 'timestampcreated'}

def pre_save_auto_timestamp_field_with_override(obj):
    # If object already is present, reset timestamps to null.

    if obj.id is None:
        return
    
    for field in timestamp_fields:
        if not hasattr(obj, field):
            continue
        setattr(obj, field, None)
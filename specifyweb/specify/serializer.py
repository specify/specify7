"""Database-portable JSONL serializer for Specify data migrations."""

from django.core.serializers.jsonl import (
    Deserializer as JsonDeserializer,
    Serializer as JsonSerializer,
)

from .models import Spappresourcedata


_APP_RESOURCE_DATA_FIELD = Spappresourcedata._meta.get_field("data")


class Serializer(JsonSerializer):
    """Serialize UTF-8 app-resource data as text instead of binary bytes."""

    def _value_from_field(self, obj, field):
        if field is _APP_RESOURCE_DATA_FIELD:
            value = field.value_from_object(obj)
            return None if value is None else value.decode("utf-8")
        return super()._value_from_field(obj, field)


Deserializer = JsonDeserializer

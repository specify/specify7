
from django.core.serializers.json import (
    Serializer as JsonSerializer,
    Deserializer as JsonDeserializer
)

from .models import Spappresourcedata

data_field = Spappresourcedata._meta.get_field('data')

class Serializer(JsonSerializer):
    def _value_from_field(self, obj, field):
        if field is data_field:
            return field.value_from_object(obj).decode('utf8')
        return super()._value_from_field(obj, field)


Deserializer = JsonDeserializer


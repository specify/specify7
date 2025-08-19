# We want to import everything since we are basically subclassing the module.
from django.db.backends.mysql.base import *

django_conversions.update({
        FIELD_TYPE.BIT: lambda x: x != b'\x00',
})

DatabaseIntrospection.data_types_reverse.update({
        FIELD_TYPE.BIT: 'BooleanField',
})

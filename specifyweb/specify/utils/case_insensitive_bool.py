from django.db import models


class BooleanField(models.BooleanField):
    def to_python(self, value):
        if value == 'true':
            return True
        if value == 'false':
            return False
        return super().to_python(value)

class NullBooleanField(BooleanField):
    def __init__(self, *args, **kwargs):
        kwargs.setdefault('null', True)
        kwargs.setdefault('blank', True)
        super().__init__(*args, **kwargs)

    def to_python(self, value):
        if value == 'true':
            return True
        if value == 'false':
            return False
        return super().to_python(value)

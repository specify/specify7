from django.apps import AppConfig
from django.db.models import Transform, Field


class NotTransform(Transform):
    lookup_name = 'not'
    function = 'NOT'


class SpecifyConfig(AppConfig):
    name='specifyweb.specify'

    def ready(self):
        Field.register_lookup(NotTransform)

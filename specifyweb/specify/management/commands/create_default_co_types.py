from typing import Any, Optional
from django.core.management.base import BaseCommand
from specifyweb.specify.views import add_default_collection_object_types_func

class Command(BaseCommand):
    def handle(self, *args: Any, **options: Any) -> Optional[str]:
        help = "Add default collection object group types for each collection."
        add_default_collection_object_types_func()
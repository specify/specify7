from typing import Any, Optional
from django.core.management.base import BaseCommand
from specifyweb.specify.tree_views import add_geo_default_trees_func
from specifyweb.specify.models import Taxontreedef, Taxontreedefitem

class Command(BaseCommand):
    def handle(self, *args: Any, **options: Any) -> Optional[str]:
        help = "Add initial geology taxon tree definitions to the database."
        add_geo_default_trees_func()
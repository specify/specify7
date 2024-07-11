from typing import Any, Optional
from django.core.management.base import BaseCommand
from specifyweb.specify.tree_views import TAXON_TREES, TAXON_RANKS
from specifyweb.specify.models import Taxontreedef, Taxontreedefitem

class Command(BaseCommand):
    def handle(self, *args: Any, **options: Any) -> Optional[str]:
        help = "Add initial geology taxon tree definitions to the database."

        for tree in TAXON_TREES:
            if Taxontreedef.objects.filter(name=tree).exists():
                continue
            tree_name = f"{tree} Taxon"
            ttd = Taxontreedef.objects.create(name=tree_name)
            rank_id = -10
            ttdi = None
            for rank in TAXON_RANKS:
                name = f"{tree} {rank}"
                rank_id += 10
                ttdi = Taxontreedefitem.objects.create(
                    name=name,
                    title=name,
                    rankid=rank_id,
                    parent=ttdi,
                    treedef=ttd,
                )
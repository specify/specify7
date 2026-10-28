from specifyweb.backend.trees.extras import Tree, TreeRank

# REFACTOR: remove these in favor of just using Tree and TreeRank on the actual
# model definitions
class Taxon(Tree):
    class Meta:
        abstract = True

class Storage(Tree):
    class Meta:
        abstract = True

class Geography(Tree):
    class Meta:
        abstract = True

class Geologictimeperiod(Tree):
    class Meta:
        abstract = True

class Lithostrat(Tree):
    class Meta:
        abstract = True

class Tectonicunit(Tree):
    class Meta:
        abstract = True

class Geographytreedefitem(TreeRank):
    class Meta:
        abstract = True

class Geologictimeperiodtreedefitem(TreeRank):
    class Meta:
        abstract = True

class Lithostrattreedefitem(TreeRank):
    class Meta:
        abstract = True

class Storagetreedefitem(TreeRank):
    class Meta:
        abstract = True

class Taxontreedefitem(TreeRank):
    class Meta:
        abstract = True

class Tectonicunittreedefitem(TreeRank):
    class Meta:
        abstract = True
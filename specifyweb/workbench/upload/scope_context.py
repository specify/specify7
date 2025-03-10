from typing import Dict, Any, Optional, Tuple, TypedDict

from specifyweb.specify.uiformatters import UIFormatter

# This stores some info we can reuse for caching. If this is empty, logic doesn't change, just it is slower.
# IMPORTANT: In the current implementation, if there are no CRs or COTypes, it _automatically_ caches scoped upload plan
# just once, and is it reused for all. This makes it efficient for most of the workbench / batch-edit cases, which don't rely on those.
class ScopingCache(TypedDict):
    # This stores UIFormatters for a collection's cotypes. We support collection relationships so we cannot assume
    # that there's just one collection. This takes care of if because collection is used into the value dict.
    cotypes: Dict[Any, Dict[str, Optional[UIFormatter]]]
    # This stores UIFormatters for granular fields. This is used to handle the bad scenario where are in heavy-collection relationships
    # or cotypes but want to reuse as much as other field based info
    fields: Dict[Tuple[Any, str, str], Optional[UIFormatter]]
    date_format: Optional[str]

class ScopeContext(object):
    cache: ScopingCache
    _is_variable: bool = False

    def __init__(self):
        self.cache = {}
        self.cache['cotypes'] = {}
        self.cache['date_format'] = None
        self.cache['fields'] = {}
        
    def set_is_variable(self):
        # We "discover" whether the scoping is variable across the rows.
        # If it is not variable, we can just perform it once and reuse.
        # Otherwise, we'd need to apply again and again. Even in that case,
        # we still look at cache for more granular things cached. Look at "ScopingCache" typed dict
        # for more info. We don't bother calling this function when we know we aren't variable so we 
        # don't need any parameter to this function.
        self._is_variable = True

    @property
    def is_variable(self):
        return self._is_variable

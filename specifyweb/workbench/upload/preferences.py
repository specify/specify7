import re
from typing import Dict, Literal, TypedDict, Union
from specifyweb.context.remote_prefs import get_remote_prefs


DEFER_KEYS = Union[Literal['match'], Literal['null_check']]

class PrefItem(TypedDict):
    path: 'str'
    default: bool

DeferFieldPrefs: Dict[DEFER_KEYS, PrefItem] = {
    'match': PrefItem(path=r'sp7\.batchEdit.deferForMatch=(.+)', default=True),
    'null_check': PrefItem(path=r'sp7\.batchEdit.deferForNullCheck=(.+)', default=False)
}

# During testing, this is mocked, so we don't have touch app resource data. During real deal, it'd touch the db.
def should_defer_fields(for_type: DEFER_KEYS) -> bool:
    pref_item = DeferFieldPrefs[for_type]
    match = re.search(pref_item['path'], get_remote_prefs())
    if match is None:
        return pref_item['default']
    return match.group(1).strip().lower() == 'true'
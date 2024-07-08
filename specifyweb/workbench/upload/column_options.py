from typing import List, Dict, Any, NamedTuple, Union, Optional, Set
from typing_extensions import Literal

from specifyweb.specify.uiformatters import CustomRepr

MatchBehavior = Literal["ignoreWhenBlank", "ignoreAlways", "ignoreNever"]

class ColumnOptions(NamedTuple):
    column: str
    matchBehavior: MatchBehavior
    nullAllowed: bool
    default: Optional[str]

    def to_json(self) -> Union[Dict, str]:
        if self.matchBehavior == "ignoreNever" and self.nullAllowed and self.default is None:
            return self.column

        return dict(self._asdict())

class ExtendedColumnOptions(NamedTuple):
    column: str
    matchBehavior: MatchBehavior
    nullAllowed: bool
    default: Optional[str]
    uiformatter: Optional[CustomRepr]
    schemaitem: Any
    picklist: Any
    dateformat: Optional[str]

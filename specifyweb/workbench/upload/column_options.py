from typing import List, Dict, Any, NamedTuple, Union, Optional
from collections.abc import Callable
from typing import Literal

from specifyweb.specify.uiformatters import UIFormatter, ScopedFormatter

MatchBehavior = Literal["ignoreWhenBlank", "ignoreAlways", "ignoreNever"]

# A single row in the workbench. Maps column names to values in the row
Row = dict[str, str]

class ColumnOptions(NamedTuple):
    column: str
    matchBehavior: MatchBehavior
    nullAllowed: bool
    default: Optional[str]

    def to_json(self) -> dict | str:
        if self.matchBehavior == "ignoreNever" and self.nullAllowed and self.default is None:
            return self.column

        return dict(self._asdict())

class ExtendedColumnOptions(NamedTuple):
    column: str
    matchBehavior: MatchBehavior
    nullAllowed: bool
    default: Optional[str]
    uiformatter: ScopedFormatter | None
    schemaitem: Any
    picklist: Any
    dateformat: Optional[str]

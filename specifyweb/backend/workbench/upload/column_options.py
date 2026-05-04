
from typing import Any, NamedTuple
from typing import Literal

from specifyweb.specify.utils.uiformatters import ScopedFormatter

MatchBehavior = Literal["ignoreWhenBlank", "ignoreAlways", "ignoreNever"]
DisambiguationBehavior = Literal["ask", "pickFirst"]

# A single row in the workbench. Maps column names to values in the row
Row = dict[str, str]

class ColumnOptions(NamedTuple):
    column: str
    matchBehavior: MatchBehavior
    nullAllowed: bool
    default: str | None
    disambiguationBehavior: DisambiguationBehavior = "ask" # Default value is temporary while I update all the code

    def to_json(self) -> dict | str:
        if self.matchBehavior == "ignoreNever" and self.nullAllowed and self.default is None:
            return self.column

        return dict(self._asdict())

class ExtendedColumnOptions(NamedTuple):
    column: str
    matchBehavior: MatchBehavior
    nullAllowed: bool
    default: str | None
    DisambiguationBehavior: DisambiguationBehavior
    uiformatter: ScopedFormatter | None
    schemaitem: Any
    picklist: Any
    dateformat: str | None

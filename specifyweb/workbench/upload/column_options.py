from typing import List, Dict, Any, NamedTuple, Union, Optional, Callable
from typing_extensions import Literal

from specifyweb.specify.uiformatters import UIFormatter

MatchBehavior = Literal["ignoreWhenBlank", "ignoreAlways", "ignoreNever"]

# A single row in the workbench. Maps column names to values in the row
Row = Dict[str, str]

""" The field formatter (uiformatter) for the column is determined by one or 
more values for other columns in the WorkBench row. 

See https://github.com/specify/specify7/issues/5473 
"""
DeferredUIFormatter = Callable[[Row], Optional[UIFormatter]]

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
    uiformatter: Union[None, UIFormatter, DeferredUIFormatter]
    schemaitem: Any
    picklist: Any
    dateformat: Optional[str]

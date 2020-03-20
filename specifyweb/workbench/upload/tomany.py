import logging

from typing import Dict, Any, NamedTuple

from .data import Row, FilterPack, Exclude
from .parsing import parse_value

logger = logging.getLogger(__name__)

class ToManyRecord(NamedTuple):
    name: str
    wbcols: Dict[str, str]
    static: Dict[str, Any]
    toOne: Dict[str, Any]

    def filter_on(self, path: str, row: Row) -> FilterPack:
        filters = {
            (path + '__' + fieldname_): value
            for caption, fieldname in self.wbcols.items()
            for fieldname_, value in parse_value(self.name, fieldname, row[caption]).items()
        }

        for toOneField, toOneTable in self.toOne.items():
            fs, es = toOneTable.filter_on(path + '__' + toOneField, row)
            for f in fs:
                filters.update(f)

        if all(v is None for v in filters.values()):
            return FilterPack([], [Exclude(path + "__in", self.name, self.static)])

        filters.update({
            (path + '__' + fieldname): value
            for fieldname, value in self.static.items()
        })

        return FilterPack([filters], [])

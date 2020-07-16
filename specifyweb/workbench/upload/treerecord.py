"""
For uploading tree records.
"""

from itertools import dropwhile

import logging
from typing import List, Dict, Any, NamedTuple, Optional

from django.db import connection # type: ignore

from specifyweb.specify import models
from specifyweb.specify.tree_extras import parent_joins, definition_joins

from .data import Row, FilterPack, UploadResult, NullRecord, Matched, MatchedMultiple, Uploaded
from .parsing import parse_string

logger = logging.getLogger(__name__)

class TreeDefItemWithValue(NamedTuple):
    treedefitem: Any
    value: Optional[str]

class TreeMatchResult(NamedTuple):
    to_upload: List[TreeDefItemWithValue]
    matched: List[int]

class TreeRecord(NamedTuple):
    name: str
    ranks: Dict[str, str]
    treedefname: str
    treedefid: int

    def to_json(self) -> Dict:
        result = self._asdict()
        return { 'treeRecord': result }

    def filter_on(self, collection, path: str, row: Row) -> FilterPack:
        return FilterPack([], [])

    def upload_row(self, collection, row: Row) -> UploadResult:
        to_upload, matched = self.match(row)
        if not to_upload:
            if not matched:
                return UploadResult(NullRecord(), {}, {})
            elif len(matched) == 1:
                return UploadResult(Matched(matched[0]), {}, {})
            else:
                return UploadResult(MatchedMultiple(matched), {}, {})

        model = getattr(models, self.name)
        parent_id = matched[0] if matched else None

        for treedefitem, value in reversed(to_upload):
            uploaded = model.objects.create(
                name=value,
                definitionitem=treedefitem,
                definition_id=self.treedefid,
                parent_id=parent_id,
            )
            parent_id = uploaded.id

        return UploadResult(Uploaded(uploaded.id), {}, {})


    def match(self, row: Row) -> TreeMatchResult:
        model = getattr(models, self.name)
        tablename = model._meta.db_table
        treedef = getattr(models, self.treedefname).objects.get(id=self.treedefid)
        treedefitems = treedef.treedefitems.order_by("-rankid")
        depth = len(treedefitems)
        values = {
            rankname: parse_string(row[wbcol])
            for wbcol, rankname in self.ranks.items()
        }

        items_with_values = list(dropwhile(lambda p: p.value is None, (
            TreeDefItemWithValue(item, values.get(item.name, None))
            for item in treedefitems
        )))

        if not items_with_values:
            # no tree data for this row
            return TreeMatchResult([], [])

        if items_with_values[-1].value is None:
            # make sure there is a value for root of tree
            root = items_with_values.pop()
            items_with_values.append(root._replace(value="Uploaded"))

        items_with_values_enforced = [
            TreeDefItemWithValue(item, "Uploaded" if item.isenforced and value is None else value)
            for item, value in items_with_values
            if value is not None or item.isenforced
        ]

        cursor = connection.cursor()
        to_upload: List[TreeDefItemWithValue] = []
        while items_with_values_enforced:
            matchers = [
                "and d{}.rankid = %s and t{}.name = %s\n".format(i,i)
                for i, __ in enumerate(items_with_values_enforced)
            ]

            params = [
                p
                for rank, value in items_with_values_enforced
                for p in (rank.rankid, value)
            ]


            sql = (
                "select t0.{table}id \n"
                "from {table} t0\n"
                "{parent_joins}\n"
                "{definition_joins}\n"
                "where t{root}.parentid is null\n"
                "{matchers}\n"
            ).format(
                root=depth-1,
                table=tablename,
                parent_joins=parent_joins(tablename, depth),
                definition_joins=definition_joins(tablename, depth),
                matchers="\n".join(matchers)
            )
            cursor.execute(sql, params)
            result = list(r[0] for r in cursor.fetchall())
            if result:
                return TreeMatchResult(to_upload, result)
            else:
                to_upload.append(items_with_values_enforced.pop(0))

        return TreeMatchResult(to_upload, [])

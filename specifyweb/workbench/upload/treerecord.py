"""
For uploading tree records.
"""

from itertools import dropwhile

import logging
from typing import List, Dict, Any, Tuple, NamedTuple, Optional

from django.db import connection # type: ignore

from specifyweb.specify import models
from specifyweb.specify.tree_extras import parent_joins, definition_joins

from .uploadable import Row, FilterPack
from .upload_result import UploadResult, NullRecord, NoMatch, Matched, MatchedMultiple, Uploaded, ReportInfo, TreeInfo
from .parsing import parse_string

logger = logging.getLogger(__name__)

class TreeDefItemWithValue(NamedTuple):
    treedefitem: Any
    value: Optional[str]

class TreeMatchResult(NamedTuple):
    to_upload: List[TreeDefItemWithValue]
    matched: List[Tuple[int, str, str]]

class TreeRecord(NamedTuple):
    name: str
    ranks: Dict[str, str]

    def apply_scoping(self, collection) -> "ScopedTreeRecord":
        from .scoping import apply_scoping_to_treerecord as apply_scoping
        return apply_scoping(self, collection)

    def to_json(self) -> Dict:
        result = dict(ranks=self.ranks)
        return { 'treeRecord': result }

    def unparse(self) -> Dict:
        return { 'baseTableName': self.name, 'uploadble': self.to_json() }

class ScopedTreeRecord(NamedTuple):
    name: str
    ranks: Dict[str, str]
    treedefid: int

    def bind(self, collection, row: Row) -> "BoundTreeRecord":
        return BoundTreeRecord(self.name, self.ranks, self.treedefid, row)

class BoundTreeRecord(NamedTuple):
    name: str
    ranks: Dict[str, str]
    treedefid: int
    row: Row

    def is_one_to_one(self) -> bool:
        return False

    def must_match(self) -> bool:
        return False

    def filter_on(self, path: str) -> FilterPack:
        return FilterPack([], [])

    def match_row(self) -> UploadResult:
        return self._handle_row(must_match=True)

    def process_row(self) -> UploadResult:
        return self._handle_row(must_match=False)

    def _handle_row(self, must_match: bool) -> UploadResult:
        to_upload, matched = self._match()
        info = ReportInfo(tableName=self.name, columns=list(self.ranks.values()), treeInfo=None)
        if not to_upload:
            if not matched:
                return UploadResult(NullRecord(info), {}, {})
            elif len(matched) == 1:
                id, rank, name = matched[0]
                return UploadResult(Matched(id, info._replace(treeInfo=TreeInfo(rank, name))), {}, {})
            else:
                ids = [id for id, rank, name in matched]
                return UploadResult(MatchedMultiple(ids, info), {}, {})
        elif must_match:
            return UploadResult(NoMatch(info), {}, {})

        model = getattr(models, self.name)

        if not matched:
            parent_id = None
            parent_result = {}
        else:
            parent_id, parent_rank, parent_name = matched[0]
            parent_result = {'parent': UploadResult(Matched(parent_id, info._replace(treeInfo=TreeInfo(parent_rank, parent_name))), {}, {})}

        for treedefitem, value in reversed(to_upload):
            obj = model(
                name=value,
                definitionitem=treedefitem,
                rankid=treedefitem.rankid,
                definition_id=self.treedefid,
                parent_id=parent_id,
            )
            obj.save(skip_tree_extras=True)
            parent_id = obj.id
            parent_rank = treedefitem.name
            parent_name = obj.name
            result = UploadResult(Uploaded(obj.id, info._replace(treeInfo=TreeInfo(parent_rank, parent_name)), []), parent_result, {})
            parent_result = {'parent': result}

        return result

    def force_upload_row(self) -> UploadResult:
        raise NotImplementedError()

    def _match(self) -> TreeMatchResult:
        model = getattr(models, self.name)
        tablename = model._meta.db_table
        treedefname = tablename.capitalize() + 'treedef'
        treedef = getattr(models, treedefname).objects.get(id=self.treedefid)
        treedefitems = treedef.treedefitems.order_by("-rankid")
        depth = len(treedefitems)
        values = {
            rankname: parse_string(self.row[wbcol])
            for rankname, wbcol in self.ranks.items()
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
                "select t0.{table}id, d0.name, t0.name\n"
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
            result = list(cursor.fetchall())
            if result:
                return TreeMatchResult(to_upload, result)
            else:
                to_upload.append(items_with_values_enforced.pop(0))

        return TreeMatchResult(to_upload, [])

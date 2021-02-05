"""
For uploading tree records.
"""

from itertools import dropwhile

import logging
from typing import List, Dict, Any, Tuple, NamedTuple, Optional, Union

from django.db import connection # type: ignore

from specifyweb.specify import models
from specifyweb.specify.tree_extras import parent_joins, definition_joins

from .uploadable import Row, FilterPack
from .upload_result import UploadResult, NullRecord, NoMatch, Matched, MatchedMultiple, Uploaded, ParseFailures, ReportInfo, TreeInfo
from .parsing import ParseResult, ParseFailure, parse_many, filter_and_upload

logger = logging.getLogger(__name__)


class TreeDefItemWithParseResults(NamedTuple):
    treedefitem: Any
    results: List[ParseResult]

class TreeMatchResult(NamedTuple):
    to_upload: List[TreeDefItemWithParseResults]
    matched: List[Tuple[int, str, str]]


class TreeRecord(NamedTuple):
    name: str
    ranks: Dict[str, Dict[str, str]]

    def apply_scoping(self, collection) -> "ScopedTreeRecord":
        from .scoping import apply_scoping_to_treerecord as apply_scoping
        return apply_scoping(self, collection)

    def to_json(self) -> Dict:
        result = {
            'ranks': {
                rank: cols['name'] if len(cols) == 1 else dict(treeNodeCols=cols)
                for rank, cols in self.ranks.items()
            },
        }
        return { 'treeRecord': result }

    def unparse(self) -> Dict:
        return { 'baseTableName': self.name, 'uploadble': self.to_json() }

class ScopedTreeRecord(NamedTuple):
    name: str
    ranks: Dict[str, Dict[str, str]]
    treedefid: int

    def bind(self, collection, row: Row) -> Union["BoundTreeRecord", ParseFailures]:
        parsedFields: Dict[str, List[ParseResult]] = {}
        parseFails: List[ParseFailure] = []
        for rank, cols in self.ranks.items():
            nameColumn = cols['name']
            presults, pfails = parse_many(collection, self.name, cols, row)
            parsedFields[rank] = presults
            parseFails += pfails
            filters = {k: v for result in presults for k, v in result.filter_on.items()}
            if filters['name'] is None:
                parseFails += [
                    ParseFailure(f'this field must be empty if "{nameColumn}" is empty', result.caption)
                    for result in presults
                    if any(v is not None for v in result.filter_on.values())
                ]

        if parseFails:
            return ParseFailures(parseFails)

        return BoundTreeRecord(
            name=self.name,
            treedefid=self.treedefid,
            parsedFields=parsedFields,
        )

class BoundTreeRecord(NamedTuple):
    name: str
    treedefid: int
    parsedFields: Dict[str, List[ParseResult]]

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
        columns = [
            pr.caption
            for prs in self.parsedFields.values()
            for pr in prs
        ]
        info = ReportInfo(tableName=self.name, columns=columns, treeInfo=None)
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

        def to_db_col(field: str) -> str:
            field, col = model._meta.get_field(field).get_attname_column()
            return col

        for tdiwpr in reversed(to_upload):
            obj = model(
                definitionitem=tdiwpr.treedefitem,
                rankid=tdiwpr.treedefitem.rankid,
                definition_id=self.treedefid,
                parent_id=parent_id,
                **{to_db_col(c): v for r in tdiwpr.results for c, v in r.upload.items()}
            )
            obj.save(skip_tree_extras=True)
            parent_id = obj.id
            parent_rank = tdiwpr.treedefitem.name
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

        def no_restriction(t: TreeDefItemWithParseResults) -> bool:
            return all(v is None for r in t.results for v in r.filter_on.values())

        items_with_presults = list(dropwhile(no_restriction, (
            TreeDefItemWithParseResults(item, self.parsedFields.get(item.name, []))
            for item in treedefitems
        )))

        if not items_with_presults:
            # no tree data for this row
            return TreeMatchResult([], [])

        dummy: List[ParseResult] = [filter_and_upload({'name': "Uploaded"}, "")]

        if no_restriction(items_with_presults[-1]):
            # make sure there is a value for root of tree
            root = items_with_presults.pop()
            items_with_presults.append(root._replace(results=dummy))

        items_with_values_enforced = [
            tdiwpr._replace(results=dummy) if tdiwpr.treedefitem.isenforced and no_restriction(tdiwpr) else tdiwpr
            for tdiwpr in items_with_presults
            if not no_restriction(tdiwpr) or tdiwpr.treedefitem.isenforced
        ]

        cursor = connection.cursor()
        to_upload: List[TreeDefItemWithParseResults] = []
        while items_with_values_enforced:
            matchers = [
                f"and d{i}.rankid = %s and "
                + " and ".join([f"t{i}.{column} = %s" for r in tdiwpr.results for column, value in sorted(r.filter_on.items())])
                + "\n"
                for i, tdiwpr in enumerate(items_with_values_enforced)
            ]

            params = [
                p
                for tdiwpr in items_with_values_enforced
                for p in [tdiwpr.treedefitem.rankid] + [value for r in tdiwpr.results for column, value in sorted(r.filter_on.items())]
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


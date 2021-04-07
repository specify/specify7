"""
For uploading tree records.
"""

from itertools import dropwhile

import logging
from typing import List, Dict, Any, Tuple, NamedTuple, Optional, Union, Set
from typing_extensions import TypedDict

from django.db import connection # type: ignore

from specifyweb.specify import models
from specifyweb.specify.auditlog import auditlog
from specifyweb.specify.tree_extras import parent_joins, definition_joins

from .uploadable import Row, FilterPack
from .upload_result import UploadResult, NullRecord, NoMatch, Matched, MatchedMultiple, Uploaded, ParseFailures, ReportInfo, TreeInfo
from .parsing import ParseResult, ParseFailure, parse_many, filter_and_upload
from .column_options import ColumnOptions

logger = logging.getLogger(__name__)


class TreeRecord(NamedTuple):
    name: str
    ranks: Dict[str, Dict[str, ColumnOptions]]

    def apply_scoping(self, collection) -> "ScopedTreeRecord":
        from .scoping import apply_scoping_to_treerecord as apply_scoping
        return apply_scoping(self, collection)

    def get_cols(self) -> Set[str]:
        return set(col.column for r in self.ranks.values() for col in r.values())

    def to_json(self) -> Dict:
        result = {
            'ranks': {
                rank: cols['name'].to_json() if len(cols) == 1 else dict(treeNodeCols={k: v.to_json() for k, v in cols.items()})
                for rank, cols in self.ranks.items()
            },
        }
        return { 'treeRecord': result }

    def unparse(self) -> Dict:
        return { 'baseTableName': self.name, 'uploadble': self.to_json() }

class ScopedTreeRecord(NamedTuple):
    name: str
    ranks: Dict[str, Dict[str, ColumnOptions]]
    treedefid: int

    def bind(self, collection, row: Row, uploadingAgentId: Optional[int]) -> Union["BoundTreeRecord", ParseFailures]:
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
                    ParseFailure(f'this field must be empty if "{nameColumn.column}" is empty', result.column)
                    for result in presults
                    if any(v is not None for v in result.filter_on.values())
                ]

        if parseFails:
            return ParseFailures(parseFails)

        return BoundTreeRecord(
            name=self.name,
            treedefid=self.treedefid,
            parsedFields=parsedFields,
            uploadingAgentId=uploadingAgentId,
        )

class MustMatchTreeRecord(TreeRecord):
    def apply_scoping(self, collection) -> "ScopedMustMatchTreeRecord":
        s = super().apply_scoping(collection)
        return ScopedMustMatchTreeRecord(*s)

class ScopedMustMatchTreeRecord(ScopedTreeRecord):
    def bind(self, collection, row: Row, uploadingAgentId: Optional[int]) -> Union["BoundMustMatchTreeRecord", ParseFailures]:
        b = super().bind(collection, row, uploadingAgentId)
        return b if isinstance(b, ParseFailures) else BoundMustMatchTreeRecord(*b)

class TreeDefItemWithParseResults(NamedTuple):
    treedefitem: Any
    results: List[ParseResult]

MatchResult = Union[NoMatch, Matched, MatchedMultiple]

class BoundTreeRecord(NamedTuple):
    name: str
    treedefid: int
    parsedFields: Dict[str, List[ParseResult]]
    uploadingAgentId: Optional[int]

    def get_treedef(self):
        model = getattr(models, self.name)
        tablename = model._meta.db_table
        treedefname = tablename.capitalize() + 'treedef'
        return getattr(models, treedefname).objects.get(id=self.treedefid)

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
        tdiwprs = self._to_match()

        if not tdiwprs:
            columns = [pr.column for prs in self.parsedFields.values() for pr in prs]
            info = ReportInfo(tableName=self.name, columns=columns, treeInfo=None)
            return UploadResult(NullRecord(info), {}, {})

        unmatched, match_result = self._match(tdiwprs)
        if isinstance(match_result, MatchedMultiple):
            return UploadResult(match_result, {}, {})

        if unmatched: # incomplete match
            if must_match:
                info = ReportInfo(tableName=self.name, columns=[r.column for tdiwpr in unmatched for r in tdiwpr.results], treeInfo=None)
                return UploadResult(NoMatch(info), {}, {})
            else:
                return self._upload(unmatched, match_result)
        else:
            return UploadResult(match_result, {}, {})

    def _to_match(self) -> List[TreeDefItemWithParseResults]:
        treedef = self.get_treedef()

        return [
            TreeDefItemWithParseResults(tdi, self.parsedFields[tdi.name])
            for tdi in treedef.treedefitems.order_by('rankid')
            if tdi.name in self.parsedFields and any(v is not None for r in self.parsedFields[tdi.name] for v in r.filter_on.values())
        ]

    def _match(self, tdiwprs: List[TreeDefItemWithParseResults]) -> Tuple[List[TreeDefItemWithParseResults], MatchResult]:
        assert tdiwprs, "There has to be something to match."
        model = getattr(models, self.name)

        parent = None
        matched_cols: List[str] = []
        while True:
            to_match = tdiwprs[0]
            matches = self._find_matching_descendent(parent, to_match)
            if matches.count() != 1:
                # matching failed at to_match level
                break

            matched_cols += [r.column for r in to_match.results]
            tdiwprs = tdiwprs[1:]
            if not tdiwprs:
                # found a complete match
                matched = matches[0]
                info = ReportInfo(tableName=self.name, columns=matched_cols, treeInfo=TreeInfo(matched.definitionitem.name, matched.name))
                return [], Matched(matched.id, info)

            parent = matches[0]

        # only get here if matches.count() != 1
        n_matches = matches.count()
        if n_matches > 1:
            info = ReportInfo(
                tableName=self.name,
                columns=matched_cols + [r.column for r in to_match.results],
                treeInfo=TreeInfo(to_match.treedefitem.name, "")
            )
            ids = [m.id for m in matches]
            return tdiwprs, MatchedMultiple(ids, info)
        else:
            assert n_matches == 0
            if parent is not None:
                info = ReportInfo(tableName=self.name, columns=matched_cols, treeInfo=TreeInfo(parent.definitionitem.name, parent.name))
                return tdiwprs, Matched(parent.id, info) # partial match
            else:
                info = ReportInfo(tableName=self.name, columns=matched_cols + [r.column for r in to_match.results], treeInfo=None)
                return tdiwprs, NoMatch(info) # no levels matched at all

    def _find_matching_descendent(self, parent, to_match: TreeDefItemWithParseResults):
        model = getattr(models, self.name)
        treedef = self.get_treedef()
        steps = treedef.treedefitems.filter(rankid__gt=parent.definitionitem.rankid, rankid__lte=to_match.treedefitem.rankid).count() \
            if parent is not None else 1

        for d in range(steps):
            matches = model.objects.filter(
                definitionitem=to_match.treedefitem,
                **{field: value for r in to_match.results for field, value in r.filter_on.items()},
                **({'__'.join(["parent"]*(d+1)): parent} if parent is not None else {})
            )
            if matches.count() != 0:
                break
        return matches

    def _upload(self, to_upload: List[TreeDefItemWithParseResults], matched: Union[Matched, NoMatch], enforce_levels: bool=True) -> UploadResult:
        assert to_upload
        model = getattr(models, self.name)
        treedef = self.get_treedef()

        if isinstance(matched, Matched):
            parent = model.objects.get(id=matched.id)
            parent_result = {'parent': UploadResult(matched, {}, {})}
        else:
            parent = None
            parent_result = {}

        if enforce_levels:
            tdis = treedef.treedefitems.order_by('rankid').filter(
                **({'rankid__gt': parent.definitionitem.rankid} if parent else {}),
                **{'rankid__lte': to_upload[-1].treedefitem.rankid},
            )

            to_upload_by_rankid = {
                tdiwpr.treedefitem.rankid: tdiwpr
                for tdiwpr in to_upload
            }

            dummy: List[ParseResult] = [filter_and_upload({'name': "Uploaded"}, "")]

            with_enforced = [
                to_upload_by_rankid.get(tdi.rankid, TreeDefItemWithParseResults(tdi, dummy))
                for tdi in tdis
                if tdi.rankid == 0 or tdi.isenforced or tdi.rankid in to_upload_by_rankid
            ]

            if with_enforced[0] is not to_upload[0]:
                # dummy values were added above the nodes we want to upload
                # rerun the match in case those dummy values already exist
                unmatched, new_match_result = self._match(with_enforced)
                assert not isinstance(new_match_result, MatchedMultiple), "There are multiple 'Uploaded' placeholder values in the tree!"
                return self._upload(unmatched, new_match_result, False)
            else:
                to_upload = with_enforced

        def to_db_col(field: str) -> str:
            field, col = model._meta.get_field(field).get_attname_column()
            return col

        for tdiwpr in to_upload:
            obj = model(
                createdbyagent_id=self.uploadingAgentId,
                definitionitem=tdiwpr.treedefitem,
                rankid=tdiwpr.treedefitem.rankid,
                definition_id=self.treedefid,
                parent_id=(parent and parent.id),
                **{to_db_col(c): v for r in tdiwpr.results for c, v in r.upload.items()},
            )
            obj.save(skip_tree_extras=True)
            auditlog.insert(obj, self.uploadingAgentId and getattr(models, 'Agent').objects.get(id=self.uploadingAgentId), None)
            info = ReportInfo(tableName=self.name, columns=[pr.column for pr in tdiwpr.results], treeInfo=TreeInfo(tdiwpr.treedefitem.name, obj.name))
            result = UploadResult(Uploaded(obj.id, info, []), parent_result, {})

            parent = obj
            parent_result = {'parent': result}

        return result

    def force_upload_row(self) -> UploadResult:
        raise NotImplementedError()



class BoundMustMatchTreeRecord(BoundTreeRecord):
    def must_match(self) -> bool:
        return True

    def force_upload_row(self) -> UploadResult:
        raise Exception('trying to force upload of must-match table')

    def process_row(self) -> UploadResult:
        return self._handle_row(must_match=True)

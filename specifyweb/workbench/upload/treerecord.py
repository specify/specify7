"""
For uploading tree records.
"""

import logging
from typing import List, Dict, Any, Tuple, NamedTuple, Optional, Union, Set

from django.db import transaction, IntegrityError
from typing_extensions import TypedDict

from specifyweb.businessrules.exceptions import BusinessRuleException
from specifyweb.specify import models
from .column_options import ColumnOptions, ExtendedColumnOptions
from .parsing import ParseResult, ParseFailure, parse_many, filter_and_upload
from .upload_result import UploadResult, NullRecord, NoMatch, Matched, \
    MatchedMultiple, Uploaded, ParseFailures, FailedBusinessRule, ReportInfo, \
    TreeInfo
from .uploadable import Row, FilterPack, Disambiguation as DA, Auditor

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
    ranks: Dict[str, Dict[str, ExtendedColumnOptions]]
    treedef: Any
    treedefitems: List
    root: Optional[Any]
    disambiguation: Dict[str, int]

    def disambiguate(self, disambiguation: DA) -> "ScopedTreeRecord":
        return self._replace(disambiguation=disambiguation.disambiguate_tree()) if disambiguation is not None else self

    def get_treedefs(self) -> Set:
        return set([self.treedef])

    def bind(self, collection, row: Row, uploadingAgentId: Optional[int], auditor: Auditor, cache: Optional[Dict]=None) -> Union["BoundTreeRecord", ParseFailures]:
        parsedFields: Dict[str, List[ParseResult]] = {}
        parseFails: List[ParseFailure] = []
        for rank, cols in self.ranks.items():
            nameColumn = cols['name']
            presults, pfails = parse_many(collection, self.name, cols, row)
            parsedFields[rank] = presults
            parseFails += pfails
            filters = {k: v for result in presults for k, v in result.filter_on.items()}
            if filters.get('name', None) is None:
                parseFails += [
                    ParseFailure('invalidPartialRecord',{'column':nameColumn.column}, result.column)
                    for result in presults
                    if any(v is not None for v in result.filter_on.values())
                ]

        if parseFails:
            return ParseFailures(parseFails)

        return BoundTreeRecord(
            name=self.name,
            treedef=self.treedef,
            treedefitems=self.treedefitems,
            root=self.root,
            disambiguation=self.disambiguation,
            parsedFields=parsedFields,
            uploadingAgentId=uploadingAgentId,
            auditor=auditor,
            cache=cache,
        )

class MustMatchTreeRecord(TreeRecord):
    def apply_scoping(self, collection) -> "ScopedMustMatchTreeRecord":
        s = super().apply_scoping(collection)
        return ScopedMustMatchTreeRecord(*s)

class ScopedMustMatchTreeRecord(ScopedTreeRecord):
    def bind(self, collection, row: Row, uploadingAgentId: Optional[int], auditor: Auditor, cache: Optional[Dict]=None) -> Union["BoundMustMatchTreeRecord", ParseFailures]:
        b = super().bind(collection, row, uploadingAgentId, auditor, cache)
        return b if isinstance(b, ParseFailures) else BoundMustMatchTreeRecord(*b)

class TreeDefItemWithParseResults(NamedTuple):
    treedefitem: Any
    results: List[ParseResult]

    def match_key(self) -> str:
        return repr((self.treedefitem.id, sorted(pr.match_key() for pr in self.results)))

MatchResult = Union[NoMatch, Matched, MatchedMultiple]

MatchInfo = TypedDict('MatchInfo', {'id': int, 'name': str, 'definitionitem__name': str, 'definitionitem__rankid': int})

class BoundTreeRecord(NamedTuple):
    name: str
    treedef: Any
    treedefitems: List
    root: Optional[Any]
    parsedFields: Dict[str, List[ParseResult]]
    uploadingAgentId: Optional[int]
    auditor: Auditor
    cache: Optional[Dict]
    disambiguation: Dict[str, int]

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
        return [
            TreeDefItemWithParseResults(tdi, self.parsedFields[tdi.name])
            for tdi in self.treedefitems
            if tdi.name in self.parsedFields and any(v is not None for r in self.parsedFields[tdi.name] for v in r.filter_on.values())
        ]

    def _match(self, tdiwprs: List[TreeDefItemWithParseResults]) -> Tuple[List[TreeDefItemWithParseResults], MatchResult]:
        assert tdiwprs, "There has to be something to match."
        model = getattr(models, self.name)

        parent = None
        matched_cols: List[str] = []
        tried_to_match: List[TreeDefItemWithParseResults] = []
        while True:
            to_match = tdiwprs[0]
            tried_to_match.append(to_match)
            da = self.disambiguation.get(to_match.treedefitem.name, None)

            if da is not None:
                matches = list(model.objects.filter(id=da).values('id', 'name', 'definitionitem__name', 'definitionitem__rankid')[:10])
                if not matches:
                    # disambigation target was deleted or something
                    # revert to regular matching mechanism
                    matches = self._find_matching_descendent(parent, to_match)
            else:
                matches = self._find_matching_descendent(parent, to_match)

            if len(matches) != 1:
                # matching failed at to_match level
                break

            matched_cols += [r.column for r in to_match.results]
            tdiwprs = tdiwprs[1:]
            if not tdiwprs:
                # found a complete match
                matched = matches[0]
                info = ReportInfo(tableName=self.name, columns=matched_cols, treeInfo=TreeInfo(matched['definitionitem__name'], matched['name']))
                return [], Matched(matched['id'], info)

            parent = matches[0]

        # only get here if matches.count() != 1
        n_matches = len(matches)
        if n_matches > 1:
            info = ReportInfo(
                tableName=self.name,
                columns=[r.column for r in to_match.results],
                treeInfo=TreeInfo(to_match.treedefitem.name, "")
            )
            ids = [m['id'] for m in matches]
            key = repr(sorted(tdiwpr.match_key() for tdiwpr in tried_to_match))
            return tdiwprs, MatchedMultiple(ids, key, info)
        else:
            assert n_matches == 0, f"More than one match found when matching '{tdiwprs}' in '{model}'"
            if parent is not None:
                info = ReportInfo(tableName=self.name, columns=matched_cols, treeInfo=TreeInfo(parent['definitionitem__name'], parent['name']))
                return tdiwprs, Matched(parent['id'], info) # partial match
            else:
                info = ReportInfo(tableName=self.name, columns=matched_cols + [r.column for r in to_match.results], treeInfo=None)
                return tdiwprs, NoMatch(info) # no levels matched at all

    def _find_matching_descendent(self, parent: Optional[MatchInfo], to_match: TreeDefItemWithParseResults) -> List[MatchInfo]:
        steps = sum(1 for tdi in self.treedefitems if parent['definitionitem__rankid'] < tdi.rankid <= to_match.treedefitem.rankid) \
            if parent is not None else 1

        assert steps > 0, (parent, to_match)

        filters = {field: value for r in to_match.results for field, value in r.filter_on.items()}

        cache_key = (self.name, steps, parent and parent['id'], to_match.treedefitem.id, tuple(sorted(filters.items())))
        cached: Optional[List[MatchInfo]] = self.cache.get(cache_key, None) if self.cache is not None else None
        if cached is not None:
            return cached

        model = getattr(models, self.name)

        for d in range(steps):
            matches = list(model.objects.filter(
                definitionitem_id=to_match.treedefitem.id,
                **filters,
                **({'__'.join(["parent_id"]*(d+1)): parent['id']} if parent is not None else {})
            ).values('id', 'name', 'definitionitem__name', 'definitionitem__rankid')[:10])
            if matches:
                if self.cache is not None:
                    self.cache[cache_key] = matches
                break

        return matches

    def _upload(self, to_upload: List[TreeDefItemWithParseResults], matched: Union[Matched, NoMatch]) -> UploadResult:
        assert to_upload, f"Invalid Error: {to_upload}, can not upload matched resluts: {matched}"
        model = getattr(models, self.name)

        parent_info: Optional[Dict]
        if isinstance(matched, Matched):
            parent_info = model.objects.values('id', 'name', 'definitionitem__rankid', 'definitionitem__name').get(id=matched.id)
            parent_result = {'parent': UploadResult(matched, {}, {})}
        else:
            parent_info = None
            parent_result = {}
            root_name = self.root.name if self.root else "Uploaded"

            placeholders = [
                TreeDefItemWithParseResults(tdi, [filter_and_upload({'name': root_name if tdi.rankid == 0 else "Uploaded"}, "")])
                for tdi in self.treedefitems
                if  tdi.rankid < to_upload[0].treedefitem.rankid
                and (tdi.rankid == 0 or tdi.isenforced)
            ]

            if placeholders:
                # dummy values were added above the nodes we want to upload
                # rerun the match in case those dummy values already exist
                unmatched, new_match_result = self._match(placeholders + to_upload)
                if isinstance(new_match_result, MatchedMultiple):
                    return UploadResult(
                        FailedBusinessRule('invalidTreeStructure', {}, new_match_result.info),
                        {}, {}
                    )
                return self._upload(unmatched, new_match_result)

        uploading_rankids = [u.treedefitem.rankid for u in to_upload]
        skipped_enforced = [
            tdi
            for tdi in self.treedefitems
            if tdi.isenforced
            and tdi.rankid > (parent_info['definitionitem__rankid'] if parent_info else 0)
            and tdi.rankid < uploading_rankids[-1]
            and tdi.rankid not in uploading_rankids
        ]

        if skipped_enforced:
            names = [tdi.title if tdi.title else tdi.name for tdi in skipped_enforced]
            after_skipped = [u for u in to_upload if u.treedefitem.rankid > skipped_enforced[-1].rankid]
            info = ReportInfo(tableName=self.name, columns=[r.column for r in after_skipped[0].results], treeInfo=None)
            return UploadResult(
                FailedBusinessRule(
                    'missingRequiredTreeParent',
                    {'names':names}, # {'names':repr(names)},
                    info
                ),
                {}, {}
            )

        missing_requireds = [
            # TODO: there should probably be a different structure for
            # missing required fields than ParseFailure
            ParseFailure(r.missing_required, {}, r.column)
            for tdiwpr in to_upload
            for r in tdiwpr.results
            if r.missing_required is not None
        ]

        if missing_requireds:
            return UploadResult(ParseFailures(missing_requireds), {}, {})

        for tdiwpr in to_upload:
            attrs = {c: v for r in tdiwpr.results for c, v in r.upload.items()}
            info = ReportInfo(
                tableName=self.name,
                columns=[pr.column for pr in tdiwpr.results],
                treeInfo=TreeInfo(tdiwpr.treedefitem.name, attrs.get('name', ""))
            )

            with transaction.atomic():
                try:
                    obj = self._do_insert(
                        model,
                        createdbyagent_id=self.uploadingAgentId,
                        definitionitem=tdiwpr.treedefitem,
                        rankid=tdiwpr.treedefitem.rankid,
                        definition=self.treedef,
                        parent_id=parent_info and parent_info['id'],
                        **attrs,
                    )
                except (BusinessRuleException, IntegrityError) as e:
                    return UploadResult(FailedBusinessRule(str(e), {}, info), parent_result, {})

            self.auditor.insert(obj, self.uploadingAgentId, None)
            result = UploadResult(Uploaded(obj.id, info, []), parent_result, {})

            parent_info = {'id': obj.id, 'definitionitem__rankid': obj.definitionitem.rankid}
            parent_result = {'parent': result}

        return result

    def _do_insert(self, model, **kwargs):
        obj = model(**kwargs)
        obj.save(skip_tree_extras=True)
        return obj

    def force_upload_row(self) -> UploadResult:
        raise NotImplementedError()


class BoundMustMatchTreeRecord(BoundTreeRecord):
    def must_match(self) -> bool:
        return True

    def force_upload_row(self) -> UploadResult:
        raise Exception('trying to force upload of must-match table')

    def process_row(self) -> UploadResult:
        return self._handle_row(must_match=True)

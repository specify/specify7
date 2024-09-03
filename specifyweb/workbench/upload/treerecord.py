"""
For uploading tree records.
"""

import logging
from typing import List, Dict, Any, Tuple, NamedTuple, Optional, Union, Set

from django.db import transaction, IntegrityError
from typing_extensions import TypedDict

from specifyweb.businessrules.exceptions import BusinessRuleException
from specifyweb.specify import models
from specifyweb.specify.tree_utils import SPECIFY_TREES
from .column_options import ColumnOptions, ExtendedColumnOptions
from .parsing import ParseResult, WorkBenchParseFailure, parse_many, filter_and_upload
from .upload_result import UploadResult, NullRecord, NoMatch, Matched, \
    MatchedMultiple, Uploaded, ParseFailures, FailedBusinessRule, ReportInfo, \
    TreeInfo
from .uploadable import Row, FilterPack, Disambiguation as DA, Auditor

logger = logging.getLogger(__name__)

class TreeRank(NamedTuple):
    rank_name: str
    treedef_id: int
    tree: str

    @staticmethod
    def create(
        rank_name: str,
        tree: str,
        treedef_id: Optional[int] = None,
        base_treedef_id: Optional[int] = None,
    ) -> 'TreeRank':
        tree_model = get_treedefitem_model(tree)
        tree_lower = tree.lower()

        def _build_filter_kwargs(rank_name: str, treedef_id: Optional[int] = None) -> Dict[str, Any]:
            filter_kwargs = {'name': rank_name}
            if treedef_id is not None:
                filter_kwargs['treedef_id'] = treedef_id # type: ignore
            return filter_kwargs

        def _filter_by_base_treedef_id(treedefitems, rank_name: str, base_treedef_id: Optional[int]):
            if base_treedef_id is None:
                raise ValueError(f"Multiple treedefitems found for rank {rank_name}")
            treedefitems = treedefitems.filter(treedef_id=base_treedef_id)
            if not treedefitems.exists():
                raise ValueError(f"No treedefitems found for rank {rank_name} and base treedef {base_treedef_id}")
            if treedefitems.count() > 1:
                raise ValueError(f"Multiple treedefitems found for rank {rank_name} and base treedef {base_treedef_id}")
            return treedefitems

        def _get_treedef_id(
            rank_name: str,
            tree: str,
            treedef_id: Optional[int],
            base_treedef_id: Optional[int],
        ) -> int:
            filter_kwargs = _build_filter_kwargs(rank_name, treedef_id)
            treedefitems = tree_model.objects.filter(**filter_kwargs)
            
            if not treedefitems.exists() and treedef_id is not None:
                filter_kwargs = _build_filter_kwargs(rank_name)
                treedefitems = tree_model.objects.filter(**filter_kwargs)

            if treedefitems.count() > 1:
                treedefitems = _filter_by_base_treedef_id(treedefitems, rank_name, base_treedef_id)

            first_item = treedefitems.first()
            if first_item is None:
                raise ValueError(f"No treedefitems found for rank {rank_name}")

            return first_item.treedef_id

        treedef_id = _get_treedef_id(rank_name, tree, treedef_id, base_treedef_id)
        return TreeRank(rank_name, treedef_id, tree_lower)

    def check_rank(self) -> bool:
        tree_model = get_treedefitem_model(self.tree)
        rank = tree_model.objects.filter(name=self.rank_name, treedef_id=self.treedef_id)
        return rank.exists() and rank.count() == 1

    def validate_rank(self) -> None:
        if not self.check_rank():
            raise ValueError(f"Invalid rank {self.rank_name} for treedef {self.treedef_id}")

    def tree_rank_record(self) -> 'TreeRankRecord':
        assert self.rank_name is not None, "Rank name is required"
        assert self.treedef_id is not None, "Treedef ID is required"
        assert self.tree is not None and self.tree.lower() in SPECIFY_TREES, "Tree is required"
        return TreeRankRecord(self.rank_name, self.treedef_id)

def get_treedefitem_model(tree: str):
    return getattr(models, tree.lower().title() + 'treedefitem')

class TreeRankRecord(NamedTuple):
    rank_name: str
    treedef_id: int

    def to_json(self) -> Dict:
        return {
            "rank": self.rank_name,
            "treedefId": self.treedef_id,
        }

    def to_key(self) -> Tuple[str, int]:
        return (self.rank_name, self.treedef_id)

    def check_rank(self, tree: str) -> bool:
        return TreeRank.create(self.rank_name, tree, self.treedef_id).check_rank()
    
    def validate_rank(self, tree) -> None:
        TreeRank.create(self.rank_name, tree, self.treedef_id).validate_rank()

class TreeRecord(NamedTuple):
    name: str
    ranks: Dict[Union[str, TreeRankRecord], Dict[str, ColumnOptions]]
    base_treedef_id: Optional[int] = None

    def apply_scoping(self, collection) -> "ScopedTreeRecord":
        from .scoping import apply_scoping_to_treerecord as apply_scoping
        return apply_scoping(self, collection)

    def get_cols(self) -> Set[str]:
        return {col.column for r in self.ranks.values() for col in r.values() if hasattr(col, 'column')}

    def to_json(self) -> Dict:
        result = {"ranks": {}} # type: ignore
        
        for rank, cols in self.ranks.items():
            rank_key = rank.rank_name if isinstance(rank, TreeRankRecord) else rank
            treeNodeCols = {k: v.to_json() if hasattr(v, "to_json") else v for k, v in cols.items()}
            
            if len(cols) == 1:
                result["ranks"][rank_key] = treeNodeCols["name"]
            else:
                rank_data = {"treeNodeCols": treeNodeCols}
                if isinstance(rank, TreeRankRecord):
                    rank_data["treeId"] = rank.treedef_id # type: ignore
                result["ranks"][rank_key] = rank_data
        
        return {'treeRecord': result}

    def unparse(self) -> Dict:
        return { 'baseTableName': self.name, 'uploadble': self.to_json() }

class ScopedTreeRecord(NamedTuple):
    name: str
    ranks: Dict[TreeRankRecord, Dict[str, ExtendedColumnOptions]]
    treedef: Any
    treedefitems: List
    root: Optional[Any]
    disambiguation: Dict[str, int]

    def disambiguate(self, disambiguation: DA) -> "ScopedTreeRecord":
        return self._replace(disambiguation=disambiguation.disambiguate_tree()) if disambiguation is not None else self

    def get_treedefs(self) -> Set:
        return set([self.treedef])

    def rescope_tree_from_row(self, row: Row) -> Tuple["ScopedTreeRecord", Optional["WorkBenchParseFailure"]]:
        def fetch_tree_node_model(name: str):
            return getattr(models, name.lower().title())

        def fetch_treedefitem_model(name: str):
            return get_treedefitem_model(name)

        def get_ranks_mapping(ranks):
            return {rank.rank_name: rank.treedef_id for rank in ranks.keys()}

        def find_non_null_ranks_in_row(row, rank_names):
            return {
                col
                for col, value in row.items()
                if value is not None and value != "" and col in rank_names
            }

        def handle_no_ranks_in_row():
            if self.treedef is not None:
                return self, None
            else:
                first_rank = next(iter(self.ranks.keys()))
                target_rank_treedef_id = first_rank.treedef_id
                target_rank_treedef = tree_node_model.objects.filter(
                    definition_id=target_rank_treedef_id, parent=None
                ).first()
                treedefitems = list(
                    tree_rank_model.objects.filter(
                        treedef_id=target_rank_treedef_id
                    ).order_by("rankid")
                )
                root = tree_node_model.objects.filter(definition_id=target_rank_treedef_id, parent=None).first()
                return self._replace(treedef=target_rank_treedef, treedefitems=treedefitems, root=root), None

        def handle_multiple_ranks_in_row(ranks_in_row_not_null):
            return self, WorkBenchParseFailure('multipleRanksInRow', {}, list(ranks_in_row_not_null)[0])

        def handle_invalid_rank(target_rank_name):
            return self, WorkBenchParseFailure('invalidRank', {'rank': target_rank_name}, target_rank_name)

        tree_rank_model = fetch_treedefitem_model(self.name)
        tree_node_model = fetch_tree_node_model(self.name)

        if len(set(tr.treedef_id for tr in self.ranks.keys())) == 1:
            return self, None

        ranks = get_ranks_mapping(self.ranks)
        rank_names = set(ranks.keys())
        ranks_in_row_not_null = find_non_null_ranks_in_row(row, rank_names)

        if len(ranks_in_row_not_null) > 1:
            return handle_multiple_ranks_in_row(ranks_in_row_not_null)
        if not ranks_in_row_not_null:
            return handle_no_ranks_in_row()

        target_rank_name = ranks_in_row_not_null.pop()
        target_rank_treedef_id = ranks[target_rank_name]
        treedefitem_query = tree_rank_model.objects.filter(
            name=target_rank_name, treedef_id=target_rank_treedef_id
        ).order_by("rankid")

        if not treedefitem_query.exists() or treedefitem_query.count() != 1:
            return handle_invalid_rank(target_rank_name)

        treedefitems = list(tree_rank_model.objects.filter(treedef_id=target_rank_treedef_id).order_by("rankid"))
        root = tree_node_model.objects.filter(definition_id=target_rank_treedef_id, parent=None).first()
        target_rank_treedef = treedefitem_query.first().treedef

        return self._replace(treedef=target_rank_treedef, treedefitems=treedefitems, root=root), None

    def bind(
        self,
        collection,
        row: Row,
        uploadingAgentId: Optional[int],
        auditor: Auditor,
        cache: Optional[Dict] = None,
        row_index: Optional[int] = None,
    ) -> Union["BoundTreeRecord", ParseFailures]:
        parsedFields: Dict[str, List[ParseResult]] = {}
        parseFails: List[WorkBenchParseFailure] = []

        rescoped_tree_record, parse_fail = self.rescope_tree_from_row(row)
        if parse_fail:
            parseFails.append(parse_fail)

        for tree_rank_record, cols in self.ranks.items():
            nameColumn = cols['name']
            presults, pfails = parse_many(collection, self.name, cols, row)
            parsedFields[tree_rank_record.rank_name] = presults
            parseFails += pfails
            filters = {k: v for result in presults for k, v in result.filter_on.items()}
            if filters.get('name', None) is None:
                parseFails += [
                    WorkBenchParseFailure('invalidPartialRecord', {'column': nameColumn.column}, result.column)
                    for result in presults
                    if any(v is not None for v in result.filter_on.values())
                ]

        if parseFails:
            return ParseFailures(parseFails)

        return BoundTreeRecord(
            name=self.name,
            treedef=rescoped_tree_record.treedef,
            treedefitems=rescoped_tree_record.treedefitems,
            root=rescoped_tree_record.root,
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
    def bind(self, collection, row: Row, uploadingAgentId: Optional[int], auditor: Auditor, cache: Optional[Dict]=None, row_index: Optional[int] = None) -> Union["BoundMustMatchTreeRecord", ParseFailures]:
        b = super().bind(collection, row, uploadingAgentId, auditor, cache, row_index)
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
            WorkBenchParseFailure(r.missing_required, {}, r.column)
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
        if hasattr(obj, 'fullname') and obj.fullname is None:
            obj.fullname = obj.name
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

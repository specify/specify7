"""
For uploading tree records.
"""

import logging
from typing import Generator, List, Dict, Any, Tuple, NamedTuple, Optional, Union, Set

from django.db import transaction, IntegrityError
from typing_extensions import TypedDict

from specifyweb.businessrules.exceptions import BusinessRuleException
from specifyweb.specify import models
from specifyweb.workbench.upload.clone import clone_record
from specifyweb.workbench.upload.predicates import ContetRef, DjangoPredicates, SkippablePredicate, ToRemove, resolve_reference_attributes, safe_fetch
import specifyweb.workbench.upload.preferences as defer_preference
from .column_options import ColumnOptions, ExtendedColumnOptions

from .parsing import ParseResult, WorkBenchParseFailure, parse_many, filter_and_upload, Filter
from .upload_result import UploadResult, NullRecord, NoMatch, Matched, \
    MatchedMultiple, Uploaded, ParseFailures, FailedBusinessRule, ReportInfo, \
    TreeInfo
from .uploadable import Row, Disambiguation as DA, Auditor, ScopeGenerator

logger = logging.getLogger(__name__)


class TreeRecord(NamedTuple):
    name: str
    ranks: Dict[str, Dict[str, ColumnOptions]]

    def apply_scoping(self, collection, generator: ScopeGenerator = None, row=None) -> "ScopedTreeRecord":
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
        return { 'baseTableName': self.name, 'uploadable': self.to_json() }

class ScopedTreeRecord(NamedTuple):
    name: str
    ranks: Dict[str, Dict[str, ExtendedColumnOptions]]
    treedef: Any
    treedefitems: List
    root: Optional[Any]
    disambiguation: Dict[str, int]
    batch_edit_pack: Optional[Dict[str, Any]]

    def disambiguate(self, disambiguation: DA) -> "ScopedTreeRecord":
        return self._replace(disambiguation=disambiguation.disambiguate_tree()) if disambiguation is not None else self

    def apply_batch_edit_pack(self, batch_edit_pack: Optional[Dict[str, Any]]) -> "ScopedTreeRecord":
        if batch_edit_pack is None:
            return self
        # batch-edit considers ranks as self-relationships, and are trivially stored in to-one
        rank_from_pack = batch_edit_pack.get('to_one', {})
        return self._replace(batch_edit_pack={rank: pack['self'] for (rank, pack) in rank_from_pack.items()})

    def get_treedefs(self) -> Set:
        return {self.treedef}

    def bind(self, row: Row, uploadingAgentId: Optional[int], auditor: Auditor, cache: Optional[Dict]=None) -> Union["BoundTreeRecord", ParseFailures]:
        parsedFields: Dict[str, List[ParseResult]] = {}
        parseFails: List[WorkBenchParseFailure] = []
        for rank, cols in self.ranks.items():
            nameColumn = cols['name']
            presults, pfails = parse_many(self.name, cols, row)
            parsedFields[rank] = presults
            parseFails += pfails
            filters = {k: v for result in presults for k, v in result.filter_on.items()}
            if filters.get('name', None) is None:
                parseFails += [
                    WorkBenchParseFailure('invalidPartialRecord',{'column':nameColumn.column}, result.column)
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
            batch_edit_pack=self.batch_edit_pack
        )

class MustMatchTreeRecord(TreeRecord):
    def apply_scoping(self, collection, generator: ScopeGenerator=None, row=None) -> "ScopedMustMatchTreeRecord":
       s = super().apply_scoping(collection)
       return ScopedMustMatchTreeRecord(*s)

class ScopedMustMatchTreeRecord(ScopedTreeRecord):
    def bind(self, row: Row, uploadingAgentId: Optional[int], auditor: Auditor, cache: Optional[Dict]=None) -> Union["BoundMustMatchTreeRecord", ParseFailures]:
        b = super().bind(row, uploadingAgentId, auditor, cache)
        return b if isinstance(b, ParseFailures) else BoundMustMatchTreeRecord(*b)

class TreeDefItemWithParseResults(NamedTuple):
    treedefitem: Any
    results: List[ParseResult]

    def match_key(self) -> str:
        return repr((self.treedefitem.id, sorted(pr.match_key() for pr in self.results)))

MatchResult = Union[NoMatch, Matched, MatchedMultiple]

MatchInfo = TypedDict('MatchInfo', {'id': int, 'name': str, 'definitionitem__name': str, 'definitionitem__rankid': int})

FETCHED_ATTRS = ['id', 'name', 'definitionitem__name', 'definitionitem__rankid']

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
    batch_edit_pack: Optional[Dict[str, Any]]

    def is_one_to_one(self) -> bool:
        return False

    def must_match(self) -> bool:
        return False

    def get_django_predicates(self, should_defer_match: bool, to_one_override: Dict[str, UploadResult]={}) -> DjangoPredicates:
        return SkippablePredicate()
    
    def can_save(self) -> bool:
        return False

    def delete_row(self, info, parent_obj=None) -> UploadResult:
        raise NotImplementedError()

    def match_row(self) -> UploadResult:
        return self._handle_row(must_match=True)

    def process_row(self) -> UploadResult:
        return self._handle_row(must_match=False)

    def save_row(self, force=False) -> UploadResult:
        raise NotImplementedError()
    
    def get_to_remove(self) -> ToRemove:
        raise NotImplementedError()
    
    def _handle_row(self, must_match: bool) -> UploadResult:
        references = self._get_reference()
        tdiwprs = self._to_match(references)

        if not tdiwprs:
            columns = [pr.column for prs in self.parsedFields.values() for pr in prs]
            info = ReportInfo(tableName=self.name, columns=columns, treeInfo=None)
            return UploadResult(NullRecord(info), {}, {})

        unmatched, match_result = self._match(tdiwprs, references)
        if isinstance(match_result, MatchedMultiple):
            return UploadResult(match_result, {}, {})

        if unmatched: # incomplete match
            if must_match:
                info = ReportInfo(tableName=self.name, columns=[r.column for tdiwpr in unmatched for r in tdiwpr.results], treeInfo=None)
                return UploadResult(NoMatch(info), {}, {})
            else:
                return self._upload(unmatched, match_result, references)
        else:
            return UploadResult(match_result, {}, {})

    def _to_match(self, references=None) -> List[TreeDefItemWithParseResults]:
        print(references)
        return [
            TreeDefItemWithParseResults(tdi, self.parsedFields[tdi.name])
            for tdi in self.treedefitems
            if tdi.name in self.parsedFields 
            and (any(v is not None for r in self.parsedFields[tdi.name] for v in r.filter_on.values())
                and ((references is None) or (tdi.name not in references) or (references[tdi.name] is None) or (any(v is not None for v in references[tdi.name]['attrs']))))
        ]

    def _match(self, tdiwprs: List[TreeDefItemWithParseResults], references=None) -> Tuple[List[TreeDefItemWithParseResults], MatchResult]:
        assert tdiwprs, "There has to be something to match."
        model = getattr(models, self.name)

        parent = None
        matched_cols: List[str] = []
        tried_to_match: List[TreeDefItemWithParseResults] = []
        while True:
            to_match = tdiwprs[0]
            tried_to_match.append(to_match)
            da = self.disambiguation.get(to_match.treedefitem.name, None)

            matches = None

            if da is not None:
                matches = list(model.objects.filter(id=da).values(*FETCHED_ATTRS)[:10])

            if not matches:
                matches = self._find_matching_descendent(parent, to_match, None if references is None else references.get(to_match.treedefitem.name))

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

    def _find_matching_descendent(self, parent: Optional[MatchInfo], to_match: TreeDefItemWithParseResults, reference=None) -> List[MatchInfo]:
        steps = sum(1 for tdi in self.treedefitems if parent['definitionitem__rankid'] < tdi.rankid <= to_match.treedefitem.rankid) \
            if parent is not None else 1

        assert steps > 0, (parent, to_match)

        filters = {field: value for r in to_match.results for field, value in r.filter_on.items()}

        reference_id = None if reference is None else reference['ref'].pk
        # Just adding the id of the reference is enough here
        cache_key = (self.name, steps, parent and parent['id'], to_match.treedefitem.id, tuple(sorted(filters.items())), reference_id)

        cached: Optional[List[MatchInfo]] = self.cache.get(cache_key, None) if self.cache is not None else None
        if cached is not None:
            return cached

        model = getattr(models, self.name)

        for d in range(steps):
            _filter = {
                **(reference['attrs'] if reference is not None else {}), 
                **filters, 
                **({'__'.join(["parent_id"]*(d+1)): parent['id']} if parent is not None else {}),
                **{'definitionitem_id': to_match.treedefitem.id}
                }
            
            query = model.objects.filter(**_filter).values(*FETCHED_ATTRS)

            matches: List[MatchInfo] = []

            if reference_id is not None:
                query_with_id = query.filter(id=reference_id)
                matches = list(query_with_id[:10])
            
            if not matches:
                matches = list(query[:10])

            if matches:
                if self.cache is not None:
                    self.cache[cache_key] = matches
                break

        return matches

    def _upload(self, to_upload: List[TreeDefItemWithParseResults], matched: Union[Matched, NoMatch], references=None) -> UploadResult:
        assert to_upload, f"Invalid Error: {to_upload}, can not upload matched resluts: {matched}"
        model = getattr(models, self.name)

        parent_info: Optional[Dict]
        if isinstance(matched, Matched):
            parent_info = model.objects.values(*FETCHED_ATTRS).get(id=matched.id)
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
                unmatched, new_match_result = self._match(placeholders + to_upload, references)
                if isinstance(new_match_result, MatchedMultiple):
                    return UploadResult(
                        FailedBusinessRule('invalidTreeStructure', {}, new_match_result.info),
                        {}, {}
                    )
                return self._upload(unmatched, new_match_result, references)

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

            new_attrs = dict(
                        createdbyagent_id=self.uploadingAgentId,
                        definitionitem=tdiwpr.treedefitem,
                        rankid=tdiwpr.treedefitem.rankid,
                        definition=self.treedef,
                        parent_id=parent_info and parent_info['id'],
                        )
            
            reference_payload = None if references is None else references.get(tdiwpr.treedefitem.name, None)
            
            new_attrs = {
                **(reference_payload['attrs'] if reference_payload is not None else {}),
                **attrs,
                **new_attrs,
            }

            ref = None if reference_payload is None else reference_payload['ref']

            with transaction.atomic():
                try:
                    if ref is not None:
                        obj = self._do_clone(ref, new_attrs)
                    else:
                        obj = self._do_insert(model, **new_attrs)
                except (BusinessRuleException, IntegrityError) as e:
                    return UploadResult(FailedBusinessRule(str(e), {}, info), parent_result, {})

            result = UploadResult(Uploaded(obj.id, info, []), parent_result, {})

            parent_info = {'id': obj.id, 'definitionitem__rankid': obj.definitionitem.rankid}
            parent_result = {'parent': result}

        return result

    def _do_insert(self, model, **kwargs):
        _inserter = self._get_inserter()
        return _inserter(model, kwargs)
    
    def _get_inserter(self):
        def _inserter(model, attrs):
            obj = model(**attrs)
            if model.specify_model.get_field('nodenumber'):
                obj.save(skip_tree_extras=True)
            else:
                obj.save(force_insert=True)
            self.auditor.insert(obj,  None)
            return obj
        return _inserter
        
    def _do_clone(self, ref, attrs):
        _inserter = self._get_inserter()
        return clone_record(ref, _inserter, {}, [], attrs)
        
    def force_upload_row(self) -> UploadResult:
        raise NotImplementedError()

    def _get_reference(self) -> Optional[Dict[str, Any]]:
        
        FIELDS_TO_SKIP = ['nodenumber', 'highestchildnodenumber', 'parent_id']

        # Much simpler than uploadTable. Just fetch all rank's references. Since we also require name to be not null, 
        # the "deferForNull" is redundant. We, do, however need to look at deferForMatch, and we are done.

        if self.batch_edit_pack is None:
            return None
        
        model = getattr(models, self.name)

        should_defer = defer_preference.should_defer_fields('match')

        references = {}

        previous_parent_id = None
        for tdi in self.treedefitems:
            if tdi.name not in self.batch_edit_pack:
                continue
            columns = [pr.column for pr in self.parsedFields[tdi.name]]
            info = ReportInfo(tableName=self.name, columns=columns, treeInfo=None)
            pack = self.batch_edit_pack[tdi.name]
            try:
                reference = safe_fetch(model, {'id': pack['id']}, pack.get('version', None))
                if previous_parent_id is not None and previous_parent_id != reference.pk:
                    raise BusinessRuleException("Tree structure changed, please re-run the query")
            except (ContetRef, BusinessRuleException) as e:
                raise BusinessRuleException(str(e), {}, info)
                                        
            previous_parent_id = reference.parent_id
            references[tdi.name] = None if should_defer else {'ref': reference, 'attrs': resolve_reference_attributes(FIELDS_TO_SKIP, model, reference)}

        return references

class BoundMustMatchTreeRecord(BoundTreeRecord):
    def must_match(self) -> bool:
        return True

    def force_upload_row(self) -> UploadResult:
        raise Exception('trying to force upload of must-match table')

    def process_row(self) -> UploadResult:
        return self._handle_row(must_match=True)

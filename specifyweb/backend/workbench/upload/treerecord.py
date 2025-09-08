"""
For uploading tree records.
"""

import logging
from typing import Any, NamedTuple, Union, Optional

from django.db import transaction, IntegrityError
from typing_extensions import TypedDict

from specifyweb.backend.businessrules.exceptions import BusinessRuleException
from specifyweb.specify import models
from specifyweb.backend.workbench.upload.clone import clone_record
from specifyweb.backend.workbench.upload.predicates import (
    SPECIAL_TREE_FIELDS_TO_SKIP,
    ContetRef,
    DjangoPredicates,
    SkippablePredicate,
    ToRemove,
    resolve_reference_attributes,
    safe_fetch,
)
from specifyweb.backend.trees.utils import (
    SPECIFY_TREES,
    get_treedef_model,
    get_models,
    get_treedefitem_model,
)
from specifyweb.backend.workbench.upload.scope_context import ScopeContext
from .column_options import ColumnOptions, ExtendedColumnOptions

from .parsing import (
    ParseResult,
    WorkBenchParseFailure,
    parse_many,
    filter_and_upload,
)
from .upload_result import (
    UploadResult,
    NullRecord,
    NoMatch,
    Matched,
    MatchedMultiple,
    Uploaded,
    ParseFailures,
    FailedBusinessRule,
    ReportInfo,
    TreeInfo,
)
from .uploadable import (
    Row,
    Disambiguation as DA,
    Auditor,
    BatchEditJson,
)

logger = logging.getLogger(__name__)

# Rank keys in the upload plan have the format: <treename>~><rankname>
RANK_KEY_DELIMITER = "~>"


class TreeRankCell(NamedTuple):
    treedef_id: int
    treedefitem_name: str
    tree_node_attribute: str
    upload_value: str
    column_fullname: str = ""


# REFACTOR: The create step can be added to TreeRankRecord directly to simplify things further
class TreeRank(NamedTuple):
    rank_name: str
    treedef_id: int | None  # Allow NULL for legacy datasets (before MOTs)
    tree: str

    @staticmethod
    def create(
        rank_name: str,
        tree: str,
        treedef_id: int | None = None,
    ) -> "TreeRank":
        """
        Create a TreeRank instance with the given rank name, tree, and optional treedef IDs.
        """

        def extract_treedef_name(rank_name: str) -> tuple[str, str | None]:
            """
            Extract treedef_name from rank_name if it exists in the format 'treedef_name~>rank_name'.
            """
            parts = rank_name.split(RANK_KEY_DELIMITER, 1)
            if len(parts) == 2:
                treedef_name = parts[0]
                rank_name = parts[1]
                return rank_name, treedef_name

            return rank_name, None

        rank_name, extracted_treedef_name = extract_treedef_name(rank_name)

        return TreeRank(rank_name, treedef_id, tree.lower())

    def tree_rank_record(self) -> "TreeRankRecord":
        """
        Create a TreeRankRecord instance.
        """

        assert self.rank_name is not None, "Rank name is required"
        assert self.tree is not None and self.tree.lower() in SPECIFY_TREES, (
            "Tree is required"
        )

        if self.treedef_id is None:
            logger.info(
                "No treedef id found yet, scope will be deferred to default tree in collection"
            )

        return TreeRankRecord(self.rank_name, self.treedef_id)


class TreeRankRecord(NamedTuple):
    rank_name: str
    treedef_id: int | None  # Allow NULL for legacy datasets (before MOTs)

    # Create a TreeRankRecord instance
    def to_json(self) -> dict:
        return {
            "rank": self.rank_name,
            "treedefId": self.treedef_id,
        }

    # Get the key for the TreeRankRecord instance
    def to_key(self) -> tuple[str, int | None]:
        return (self.rank_name, self.treedef_id)

    def validate_rank(self, tableName: str) -> bool:
        if self.treedef_id is None:
            return True  # assume valid until scope is determined

        treedefitem_model = get_treedefitem_model(tableName)

        return treedefitem_model.objects.filter(
            name=self.rank_name, treedef_id=self.treedef_id
        ).exists()


class TreeRecord(NamedTuple):
    name: str
    ranks: dict[str | TreeRankRecord, dict[str, ColumnOptions]]

    def apply_scoping(
        self, collection, context: ScopeContext | None = None, row=None
    ) -> "ScopedTreeRecord":
        from .scoping import apply_scoping_to_treerecord as apply_scoping

        return apply_scoping(self, collection, context)

    def get_cols(self) -> set[str]:
        return {
            col.column
            for r in self.ranks.values()
            for col in r.values()
            if hasattr(col, "column")
        }

    def to_json(self) -> dict:
        result = {"ranks": {}}  # type: ignore

        for rank, cols in self.ranks.items():
            rank_key = rank.rank_name if isinstance(rank, TreeRankRecord) else rank
            treeNodeCols = {
                k: v.to_json() if hasattr(v, "to_json") else v for k, v in cols.items()
            }

            if len(cols) == 1 and not isinstance(rank, TreeRankRecord):
                result["ranks"][rank_key] = treeNodeCols["name"]
            else:
                rank_data = {"treeNodeCols": treeNodeCols}
                if isinstance(rank, TreeRankRecord):
                    rank_data["treeId"] = rank.treedef_id  # type: ignore
                result["ranks"][rank_key] = rank_data

        return {"treeRecord": result}

    def unparse(self) -> dict:
        return {"baseTableName": self.name, "uploadable": self.to_json()}


class ScopedTreeRecord(NamedTuple):
    name: str
    ranks: dict[TreeRankRecord, dict[str, ExtendedColumnOptions]]
    treedef: Any
    treedefitems: list
    root: Any | None
    disambiguation: dict[str, int]
    batch_edit_pack: dict[str, Any] | None
    scoped_cotypes: Any
    cotype_column: str | None

    def disambiguate(self, disambiguation: DA) -> "ScopedTreeRecord":
        return (
            self._replace(disambiguation=disambiguation.disambiguate_tree())
            if disambiguation is not None
            else self
        )

    def apply_batch_edit_pack(
        self, batch_edit_pack: BatchEditJson | None
    ) -> "ScopedTreeRecord":
        if batch_edit_pack is None:
            return self
        # batch-edit considers ranks as self-relationships, and are trivially stored in to-one
        rank_from_pack = batch_edit_pack.get("to_one", {})
        if rank_from_pack is None:
            rank_from_pack = {}
        return self._replace(
            batch_edit_pack={
                rank: pack["self"] for (rank, pack) in rank_from_pack.items()
            }
        )

    # Used when scoping UploadTable
    def get_treedefs(self) -> set:
        # return set([self.treedef]) # old way
        tree_def_model = get_treedef_model(self.name)
        treedefids = {
            tree_rank_record.treedef_id for tree_rank_record in self.ranks.keys()
        }

        return set(tree_def_model.objects.filter(id__in=treedefids))

    def _get_not_null_ranks_columns_in_row(self, row: Row) -> list[TreeRankCell]:
        """
        Get rank columns that are not null in the row.
        """

        # Check if the value is not null
        def is_not_null(value: Any) -> bool:
            return bool(value)

        # Format the column name
        def format_column(col_name: str, col_opts: Any) -> str:
            return (
                f"{col_opts.column} - {col_name}"
                if col_name != "name"
                else col_opts.column
            )

        # Match the column
        def match_column(row_key: str, formatted_column: str) -> bool:
            return formatted_column == row_key

        # Create a TreeRankCell instance
        def create_tree_rank_cell(
            tree_rank_record: Any, col_name: str, row_value: Any, row_key: Any
        ) -> TreeRankCell:
            return TreeRankCell(
                tree_rank_record.treedef_id,  # treedefid
                tree_rank_record.rank_name,  # treedefitem_name
                col_name,  # tree_node_attribute
                row_value,  # upload_value
                row_key,  # column_fullname
            )

        # Process the row item
        def process_row_item(row_key: str, row_value: Any) -> list[TreeRankCell]:
            if not is_not_null(row_value):
                return []
            return [
                create_tree_rank_cell(tree_rank_record, col_name, row_value, row_key)
                for tree_rank_record, cols in self.ranks.items()
                for col_name, col_opts in cols.items()
                if match_column(row_key, format_column(col_name, col_opts))
            ]

        return [
            cell
            for row_key, row_value in row.items()
            for cell in process_row_item(row_key, row_value)
        ]

    def rescope_tree_from_row(
        self, row: Row
    ) -> tuple["ScopedTreeRecord", Optional["WorkBenchParseFailure"]]:
        """Rescope tree from row data."""

        # Determine the target treedef based on the columns that are not null
        def get_targeted_treedefids(ranks_columns: list[TreeRankCell]) -> set[int]:
            return {rank_column.treedef_id for rank_column in ranks_columns}

        # Retrieve the target rank treedef
        def get_target_rank_treedef(tree_def_model, target_rank_treedef_id: int):
            return tree_def_model.objects.get(id=target_rank_treedef_id)

        tree_def_model, tree_rank_model, tree_node_model = get_models(self.name)

        # Adjust scope if needed for old datasets
        self = self._adjust_tree_scope()

        ranks_columns_in_row_not_null = self._get_not_null_ranks_columns_in_row(row)
        targeted_treedef_ids = get_targeted_treedefids(ranks_columns_in_row_not_null)

        validation_result = self._run_validation_checks(
            targeted_treedef_ids, ranks_columns_in_row_not_null, row
        )
        if validation_result:
            return validation_result

        target_rank_treedef_id = targeted_treedef_ids.pop()
        target_rank_treedef = get_target_rank_treedef(
            tree_def_model, target_rank_treedef_id
        )

        # Based on the target treedef, get the treedefitems and root for the tree
        treedefitems = list(
            tree_rank_model.objects.filter(treedef_id=target_rank_treedef_id).order_by(
                "rankid"
            )
        )
        root = tree_node_model.objects.filter(
            definition_id=target_rank_treedef_id, parent=None
        ).first()

        return self._replace(
            treedef=target_rank_treedef, treedefitems=treedefitems, root=root
        ), None

    """
        Adjusts tree scope for TreeRankRecords with NULL treedef_ids.
        Used mainly for legacy (pre-MOTs) datasets.
        Newer datasets will have treeIds specified in the upload plan by the frontend
    """

    def _adjust_tree_scope(self):
        adjusted_ranks = {}
        for trr in self.ranks.keys():
            adjusted_trr = trr
            if trr.treedef_id is None:
                adjusted_trr = trr._replace(treedef_id=self.treedef.id)

            adjusted_ranks[adjusted_trr] = self.ranks[trr]

        return self._replace(ranks=adjusted_ranks)

    def _run_validation_checks(
        self,
        targeted_treedef_ids: set[int],
        ranks_columns_in_row_not_null: list[TreeRankCell],
        row: Row,
    ):
        unique_treedef_ids = {tr.treedef_id for tr in self.ranks.keys()}

        result = self._handle_multiple_or_no_treedefs(
            unique_treedef_ids, targeted_treedef_ids, ranks_columns_in_row_not_null
        )
        if result:
            return result

        result = self._validate_trees_with_cotype(row, targeted_treedef_ids)
        if result:
            return result

        return None

    # Handle cases where there are multiple or no treedefs
    def _handle_multiple_or_no_treedefs(
        self,
        unique_treedef_ids: set[int | None],
        targeted_treedefids: set[int],
        ranks_columns: list[TreeRankCell],
    ) -> tuple["ScopedTreeRecord", Optional["WorkBenchParseFailure"]] | None:
        if not targeted_treedefids:
            return self, None
        elif len(targeted_treedefids) > 1 and len(unique_treedef_ids) > 1:
            logger.warning(f"Multiple treedefs found in row: {targeted_treedefids}")
            error_col_name = ranks_columns[0].column_fullname

            return self, WorkBenchParseFailure(
                "multipleTreeDefsInRow", {}, error_col_name
            )

        return None

    # Ensure cotype has same taxontreedef for ranks in row
    def _validate_trees_with_cotype(self, row: Row, treedefs_in_row: set[int]):
        if self.name.lower() != "taxon" or self.cotype_column is None:
            return None

        def find_cotype_in_row(row: Row):
            if isinstance(self.cotype_column, str) and self.cotype_column in row:
                return row[self.cotype_column]

            return None

        def get_cotype_tree_def(cotype_name: str):
            cotypes = self.scoped_cotypes.filter(name=cotype_name)
            return cotypes[0].taxontreedef.id if len(cotypes) > 0 else None

        cotype_value = find_cotype_in_row(row)
        if not cotype_value:
            return None

        cotype_treedef_id = get_cotype_tree_def(cotype_value)
        if not cotype_treedef_id:
            return None

        # Check only the first treedef assuming all ranks belong to same tree
        # Validation for multiple ranks is done before this in _handle_multiple_or_no_treedefs
        if len(treedefs_in_row) > 0 and cotype_treedef_id == list(treedefs_in_row)[0]:
            return None

        return self, WorkBenchParseFailure("invalidCotype", {}, self.cotype_column)

    def bind(
        self,
        row: Row,
        uploadingAgentId: int | None,
        auditor: Auditor,
        cache: dict | None = None,
    ) -> Union["BoundTreeRecord", ParseFailures]:
        parsedFields: dict[TreeRankRecord, list[ParseResult]] = {}
        parseFails: list[WorkBenchParseFailure] = []

        rescoped_tree_record, parse_fail = self.rescope_tree_from_row(row)
        if parse_fail:
            parseFails.append(parse_fail)

        for tree_rank_record, cols in rescoped_tree_record.ranks.items():
            nameColumn = cols["name"]
            presults, pfails = parse_many(self.name, cols, row)
            parsedFields[tree_rank_record] = presults
            parseFails += pfails
            filters = {k: v for result in presults for k, v in result.filter_on.items()}
            if filters.get("name", None) is None:
                parseFails += [
                    WorkBenchParseFailure(
                        "invalidPartialRecord",
                        {"column": nameColumn.column},
                        result.column,
                    )
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
            batch_edit_pack=self.batch_edit_pack,
        )


class MustMatchTreeRecord(TreeRecord):
    def apply_scoping(
        self, collection, context: ScopeContext | None = None, row=None
    ) -> "ScopedMustMatchTreeRecord":
        s = super().apply_scoping(collection, context, row)
        return ScopedMustMatchTreeRecord(*s)


class ScopedMustMatchTreeRecord(ScopedTreeRecord):
    def bind(
        self,
        row: Row,
        uploadingAgentId: int | None,
        auditor: Auditor,
        cache: dict | None = None,
    ) -> Union["BoundMustMatchTreeRecord", ParseFailures]:
        b = super().bind(row, uploadingAgentId, auditor, cache)
        return b if isinstance(b, ParseFailures) else BoundMustMatchTreeRecord(*b)


class TreeDefItemWithParseResults(NamedTuple):
    treedefitem: Any
    results: list[ParseResult]

    def match_key(self) -> str:
        return repr(
            (self.treedefitem.id, sorted(pr.match_key() for pr in self.results))
        )


MatchResult = NoMatch | Matched | MatchedMultiple


class MatchInfo(TypedDict):
    id: int
    name: str
    definitionitem__name: str
    definitionitem__rankid: int


FETCHED_ATTRS = ["id", "name", "definitionitem__name", "definitionitem__rankid"]


class BoundTreeRecord(NamedTuple):
    name: str
    treedef: Any
    treedefitems: list
    root: Any | None
    parsedFields: dict[TreeRankRecord, list[ParseResult]]
    uploadingAgentId: int | None
    auditor: Auditor
    cache: dict | None
    disambiguation: dict[str, int]
    batch_edit_pack: dict[str, Any] | None

    def is_one_to_one(self) -> bool:
        return False

    def must_match(self) -> bool:
        return False

    def get_django_predicates(
        self,
        should_defer_match: bool,
        to_one_override: dict[str, UploadResult] = {},
        consider_dependents=False,
        is_origin=False,
        origin_is_editable=False,
    ) -> DjangoPredicates:
        # Everything is so complicated around here. In an initial implementation, I naively returned SkippablePredicates,
        # but that'll potentially cause null records to be actually processed. (although, there doesn't seem to be a realizable user mapping to do it)
        # So, the best we can really do, is to check if this entire tree record is null or not.
        # It it is, we return a null django predicate (which will correctly get processed for to-one).
        # Otherwise, we simply return a SkippablePredicate which will then correctly be handled (by not matching on it)
        (is_null, _, __) = self._is_null()
        if is_null:
            return DjangoPredicates()
        return SkippablePredicate()

    def can_save(self) -> bool:
        return False

    def delete_row(self, parent_obj=None) -> UploadResult:
        raise NotImplementedError()

    def match_row(self) -> UploadResult:
        return self._handle_row(must_match=True)

    def process_row(self) -> UploadResult:
        return self._handle_row(must_match=False)

    def save_row(self, force=False) -> UploadResult:
        raise NotImplementedError()

    def get_to_remove(self) -> ToRemove:
        raise NotImplementedError()

    def _is_null(
        self,
    ) -> tuple[
        UploadResult | None,
        list[TreeDefItemWithParseResults],
        dict[str, Any] | None,
    ]:
        references = self._get_reference()
        tdiwprs = self._to_match(references)

        if not tdiwprs:
            columns = [pr.column for prs in self.parsedFields.values() for pr in prs]
            info = ReportInfo(tableName=self.name, columns=columns, treeInfo=None)
            return (UploadResult(NullRecord(info), {}, {}), [], {})

        return (None, tdiwprs, references)

    def _handle_row(self, must_match: bool) -> UploadResult:
        is_null, tdiwprs, references = self._is_null()
        if is_null:
            return is_null

        unmatched, match_result = self._match(tdiwprs, references)
        if isinstance(match_result, MatchedMultiple):
            return UploadResult(match_result, {}, {})

        if unmatched:  # incomplete match
            if must_match:
                info = ReportInfo(
                    tableName=self.name,
                    columns=[r.column for tdiwpr in unmatched for r in tdiwpr.results],
                    treeInfo=None,
                )
                return UploadResult(NoMatch(info), {}, {})
            else:
                return self._upload(unmatched, match_result, references)
        else:
            return UploadResult(match_result, {}, {})

    def _to_match(self, references=None) -> list[TreeDefItemWithParseResults]:
        # Check if the parse results have non-null values
        def has_non_null_values(parse_results):
            return any(
                value is not None
                for result in parse_results
                for value in result.filter_on.values()
            )

        # Get parse results for a TDI
        def get_parse_results(tdi):
            tree_rank_record = TreeRankRecord(tdi.name, tdi.treedef_id)
            return self.parsedFields.get(tree_rank_record, [])

        # Check if the TDI is valid
        def is_valid_tdi(tdi):
            tree_rank_names = {trr.rank_name for trr in self.parsedFields.keys()}
            return tdi.name in tree_rank_names and has_non_null_values(
                get_parse_results(tdi)
            )

        # Create a TreeDefItemWithParseResults instance
        return [
            TreeDefItemWithParseResults(tdi, get_parse_results(tdi))
            for tdi in self.treedefitems
            if is_valid_tdi(tdi)
            and (
                (references is None)
                or (tdi.name not in references)
                or (references[tdi.name] is None)
                or (any(v is not None for v in references[tdi.name]["attrs"]))
            )
        ]

    def _match(
        self, tdiwprs: list[TreeDefItemWithParseResults], references=None
    ) -> tuple[list[TreeDefItemWithParseResults], MatchResult]:
        assert tdiwprs, "There has to be something to match."
        model = getattr(models, self.name)

        parent = None
        matched_cols: list[str] = []
        tried_to_match: list[TreeDefItemWithParseResults] = []
        while True:
            to_match = tdiwprs[0]
            tried_to_match.append(to_match)
            da = self.disambiguation.get(to_match.treedefitem.name, None)

            matches = None

            if da is not None:
                matches = list(model.objects.filter(id=da).values(*FETCHED_ATTRS))

            if not matches:
                matches = self._find_matching_descendent(
                    parent,
                    to_match,
                    (
                        None
                        if references is None
                        else references.get(to_match.treedefitem.name)
                    ),
                )

            if len(matches) != 1:
                # matching failed at to_match level
                break

            matched_cols += [r.column for r in to_match.results]
            tdiwprs = tdiwprs[1:]
            if not tdiwprs:
                # found a complete match
                matched = matches[0]
                info = ReportInfo(
                    tableName=self.name,
                    columns=matched_cols,
                    treeInfo=TreeInfo(matched["definitionitem__name"], matched["name"]),
                )
                return [], Matched(matched["id"], info)

            parent = matches[0]

        # only get here if matches.count() != 1
        n_matches = len(matches)
        if n_matches > 1:
            info = ReportInfo(
                tableName=self.name,
                columns=[r.column for r in to_match.results],
                treeInfo=TreeInfo(to_match.treedefitem.name, ""),
            )
            ids = [m["id"] for m in matches]
            key = repr(sorted(tdiwpr.match_key() for tdiwpr in tried_to_match))
            return tdiwprs, MatchedMultiple(ids, key, info)
        else:
            assert n_matches == 0, (
                f"More than one match found when matching '{tdiwprs}' in '{model}'"
            )
            if parent is not None:
                info = ReportInfo(
                    tableName=self.name,
                    columns=matched_cols,
                    treeInfo=TreeInfo(parent["definitionitem__name"], parent["name"]),
                )
                return tdiwprs, Matched(parent["id"], info)  # partial match
            else:
                info = ReportInfo(
                    tableName=self.name,
                    columns=matched_cols + [r.column for r in to_match.results],
                    treeInfo=None,
                )
                return tdiwprs, NoMatch(info)  # no levels matched at all

    def _find_matching_descendent(
        self,
        parent: MatchInfo | None,
        to_match: TreeDefItemWithParseResults,
        reference=None,
    ) -> list[MatchInfo]:
        steps = (
            sum(
                1
                for tdi in self.treedefitems
                if parent["definitionitem__rankid"]
                < tdi.rankid
                <= to_match.treedefitem.rankid
            )
            if parent is not None
            else 1
        )

        assert steps > 0, (parent, to_match)

        filters = {
            field: value
            for r in to_match.results
            for field, value in r.filter_on.items()
        }

        reference_id = None if reference is None else reference["ref"].pk
        # Just adding the id of the reference is enough here
        cache_key = (
            self.name,
            steps,
            parent and parent["id"],
            to_match.treedefitem.id,
            tuple(sorted(filters.items())),
            reference_id,
        )

        cached: list[MatchInfo] | None = (
            self.cache.get(cache_key, None) if self.cache is not None else None
        )
        if cached is not None:
            return cached

        model = getattr(models, self.name)

        for d in range(steps):
            _filter = {
                **(reference["attrs"] if reference is not None else {}),
                **filters,
                **(
                    {"__".join(["parent_id"] * (d + 1)): parent["id"]}
                    if parent is not None
                    else {}
                ),
                **{"definitionitem_id": to_match.treedefitem.id},
            }

            query = model.objects.filter(**_filter).values(*FETCHED_ATTRS)

            matches: list[MatchInfo] = []

            if reference_id is not None:
                query_with_id = query.filter(id=reference_id)
                matches = list(query_with_id)

            if not matches:
                matches = list(query)

            if matches:
                if self.cache is not None:
                    self.cache[cache_key] = matches
                break

        return matches

    def _upload(
        self,
        to_upload: list[TreeDefItemWithParseResults],
        matched: Matched | NoMatch,
        references=None,
    ) -> UploadResult:
        assert to_upload, (
            f"Invalid Error: {to_upload}, can not upload matched results: {matched}"
        )
        model = getattr(models, self.name)

        parent_info: dict | None
        if isinstance(matched, Matched):
            parent_info = model.objects.values(*FETCHED_ATTRS).get(id=matched.id)
            parent_result = {"parent": UploadResult(matched, {}, {})}
        else:
            parent_info = None
            parent_result = {}
            root_name = self.root.name if self.root else "Uploaded"

            placeholders = [
                TreeDefItemWithParseResults(
                    tdi,
                    [
                        filter_and_upload(
                            {"name": root_name if tdi.rankid == 0 else "Uploaded"}, ""
                        )
                    ],
                )
                for tdi in self.treedefitems
                if tdi.rankid < to_upload[0].treedefitem.rankid
                and (tdi.rankid == 0 or tdi.isenforced)
            ]

            if placeholders:
                # dummy values were added above the nodes we want to upload
                # rerun the match in case those dummy values already exist
                unmatched, new_match_result = self._match(
                    placeholders + to_upload, references
                )
                if isinstance(new_match_result, MatchedMultiple):
                    return UploadResult(
                        FailedBusinessRule(
                            "invalidTreeStructure", {}, new_match_result.info
                        ),
                        {},
                        {},
                    )
                return self._upload(unmatched, new_match_result, references)

        uploading_rankids = [u.treedefitem.rankid for u in to_upload]
        skipped_enforced = [
            tdi
            for tdi in self.treedefitems
            if tdi.isenforced
            and tdi.rankid
            > (parent_info["definitionitem__rankid"] if parent_info else 0)
            and tdi.rankid < uploading_rankids[-1]
            and tdi.rankid not in uploading_rankids
        ]

        if skipped_enforced:
            names = [tdi.title if tdi.title else tdi.name for tdi in skipped_enforced]
            after_skipped = [
                u
                for u in to_upload
                if u.treedefitem.rankid > skipped_enforced[-1].rankid
            ]
            info = ReportInfo(
                tableName=self.name,
                columns=[r.column for r in after_skipped[0].results],
                treeInfo=None,
            )
            return UploadResult(
                FailedBusinessRule(
                    "missingRequiredTreeParent",
                    {"names": names},  # {'names':repr(names)},
                    info,
                ),
                {},
                {},
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
                treeInfo=TreeInfo(tdiwpr.treedefitem.name, attrs.get("name", "")),
            )

            new_attrs = dict(
                createdbyagent_id=self.uploadingAgentId,
                definitionitem=tdiwpr.treedefitem,
                rankid=tdiwpr.treedefitem.rankid,
                definition=self.treedef,
                parent_id=parent_info and parent_info["id"],
            )

            reference_payload = (
                None
                if references is None
                else references.get(tdiwpr.treedefitem.name, None)
            )

            new_attrs = {
                **(reference_payload["attrs"] if reference_payload is not None else {}),
                **attrs,
                **new_attrs,
            }

            ref = None if reference_payload is None else reference_payload["ref"]

            with transaction.atomic():
                try:
                    if ref is not None:
                        obj = self._do_clone(ref, new_attrs)
                    else:
                        obj = self._do_insert(model, **new_attrs)
                except (BusinessRuleException, IntegrityError) as e:
                    return UploadResult(
                        FailedBusinessRule(str(e), {}, info), parent_result, {}
                    )

            result = UploadResult(Uploaded(obj.id, info, []), parent_result, {})

            parent_info = {
                "id": obj.id,
                "definitionitem__rankid": obj.definitionitem.rankid,
            }
            parent_result = {"parent": result}

        return result

    def _do_insert(self, model, **kwargs):
        _inserter = self._get_inserter()
        return _inserter(model, kwargs)

    def _get_inserter(self):
        def _inserter(model, attrs):
            obj = model(**attrs)
            # TODO: Refactor after merge with production, directly check if table is tree or not.
            if model.specify_model.get_field("nodenumber"):
                obj.save(skip_tree_extras=True)
            else:
                obj.save(force_insert=True)
            self.auditor.insert(obj, None)
            return obj

        return _inserter

    def _do_clone(self, ref, attrs):
        _inserter = self._get_inserter()
        return clone_record(ref, _inserter, {}, [], attrs)

    def force_upload_row(self) -> UploadResult:
        raise NotImplementedError()

    def _get_reference(self) -> dict[str, Any] | None:
        # Much simpler than uploadTable. Just fetch all rank's references. Since we also require name to be not null,
        # the "deferForNull" mess is not needed (that's redundant now). We, do, however need to look at deferForMatch, and we are done.

        if self.batch_edit_pack is None:
            return None

        model = getattr(models, self.name)

        should_defer = self.auditor.props.batch_edit_prefs["deferForMatch"]

        references = {}

        previous_parent_id = None
        for tdi in self.treedefitems[::-1]:
            ref_key = f"{tdi.treedef.name}{RANK_KEY_DELIMITER}{tdi.name}{RANK_KEY_DELIMITER}{tdi.treedef.id}"
            tree_rank_record = TreeRankRecord(tdi.name, tdi.treedef.id)
            if ref_key not in self.batch_edit_pack:
                continue
            columns = [pr.column for pr in self.parsedFields[tree_rank_record]]
            info = ReportInfo(tableName=self.name, columns=columns, treeInfo=None)
            pack = self.batch_edit_pack[ref_key]
            try:
                reference = safe_fetch(
                    model, {"id": pack["id"]}, pack.get("version", None)
                )
                if (
                    previous_parent_id is not None
                    and previous_parent_id != reference.pk
                ):
                    raise BusinessRuleException(
                        f"Tree structure changed, please re-run the query. Expected: {previous_parent_id}, got {reference}"
                    )
            except (ContetRef, BusinessRuleException) as e:
                raise BusinessRuleException(str(e), {}, info)

            previous_parent_id = reference.parent_id
            references[tdi.name] = (
                None
                if should_defer
                else {
                    "ref": reference,
                    "attrs": resolve_reference_attributes(
                        SPECIAL_TREE_FIELDS_TO_SKIP, model, reference
                    ),
                }
            )

        return references


class BoundMustMatchTreeRecord(BoundTreeRecord):
    def must_match(self) -> bool:
        return True

    def force_upload_row(self) -> UploadResult:
        raise Exception("trying to force upload of must-match table")

    def process_row(self) -> UploadResult:
        return self._handle_row(must_match=True)

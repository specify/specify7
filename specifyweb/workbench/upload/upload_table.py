import logging
from typing import List, Dict, Any, NamedTuple, Union, Optional, Set, Literal, Tuple

from django.db import transaction, IntegrityError

from specifyweb.businessrules.exceptions import BusinessRuleException
from specifyweb.specify import models
from specifyweb.specify.func import Func
from specifyweb.specify.field_change_info import FieldChangeInfo
from specifyweb.workbench.upload.clone import clone_record
from specifyweb.workbench.upload.predicates import (
    ContetRef,
    DjangoPredicates,
    SkippablePredicate,
    ToRemove,
    resolve_reference_attributes,
    safe_fetch,
)
import specifyweb.workbench.upload.preferences as defer_preference
from .column_options import ColumnOptions, ExtendedColumnOptions
from .parsing import parse_many, ParseResult, WorkBenchParseFailure

from .upload_result import (
    Deleted,
    MatchedAndChanged,
    NoChange,
    Updated,
    UploadResult,
    Uploaded,
    NoMatch,
    Matched,
    MatchedMultiple,
    NullRecord,
    FailedBusinessRule,
    ReportInfo,
    PicklistAddition,
    ParseFailures,
    PropagatedFailure,
)
from .uploadable import (
    NULL_RECORD,
    Row,
    ScopeGenerator,
    Uploadable,
    ScopedUploadable,
    BoundUploadable,
    Disambiguation,
    Auditor,
    BatchEditJson,
    BatchEditSelf,
)


logger = logging.getLogger(__name__)

# This doesn't cause race conditions, since the cache itself is local to a dataset.
# Even if you've another validation on the same thread, this won't cause an issue
REFERENCE_KEY = object()


class UploadTable(NamedTuple):
    name: str
    wbcols: Dict[str, ColumnOptions]
    static: Dict[str, Any]
    toOne: Dict[str, Uploadable]
    toMany: Dict[str, List[Uploadable]]

    overrideScope: Optional[Dict[Literal["collection"], Optional[int]]] = None

    def apply_scoping(
        self, collection, generator: ScopeGenerator = None, row=None
    ) -> "ScopedUploadTable":
        from .scoping import apply_scoping_to_uploadtable

        return apply_scoping_to_uploadtable(self, collection, generator, row)

    def get_cols(self) -> Set[str]:
        return (
            set(cd.column for cd in self.wbcols.values())
            | set(col for u in self.toOne.values() for col in u.get_cols())
            | set(
                col for rs in self.toMany.values() for r in rs for col in r.get_cols()
            )
        )

    def _to_json(self) -> Dict:
        result = dict(
            wbcols={k: v.to_json() for k, v in self.wbcols.items()}, static=self.static
        )
        result["toOne"] = {
            key: uploadable.to_json() for key, uploadable in self.toOne.items()
        }
        result["toMany"] = {
            # legacy behaviour, don't know a better way without migrations
            key: [to_many.to_json()["uploadTable"] for to_many in to_manys]
            for key, to_manys in self.toMany.items()
        }
        return result

    def to_json(self) -> Dict:
        return {"uploadTable": self._to_json()}

    def unparse(self) -> Dict:
        return {"baseTableName": self.name, "uploadable": self.to_json()}


def static_adjustments(
    table: str, wbcols: Dict[str, ExtendedColumnOptions], static: Dict[str, Any]
) -> Dict[str, Any]:
    if (
        table.lower() == "agent"
        and "agenttype" not in wbcols
        and "agenttype" not in static
    ):
        static = {"agenttype": 1, **static}
    elif (
        table.lower() == "determination"
        and "iscurrent" not in wbcols
        and "iscurrent" not in static
    ):
        static = {"iscurrent": True, **static}
    else:
        static = static
    return static


class ScopedUploadTable(NamedTuple):
    name: str
    wbcols: Dict[str, ExtendedColumnOptions]
    static: Dict[str, Any]
    toOne: Dict[str, ScopedUploadable]
    toMany: Dict[str, List["ScopedUploadable"]]  # type: ignore
    scopingAttrs: Dict[str, int]
    disambiguation: Optional[int]
    to_one_fields: Dict[str, List[str]]  # TODO: Consider making this a payload..
    match_payload: Optional[BatchEditSelf]
    strong_ignore: List[str]

    def disambiguate(self, disambiguation: Disambiguation) -> "ScopedUploadable":
        if disambiguation is None:
            return self

        return self._replace(
            disambiguation=disambiguation.disambiguate(),
            toOne={
                fieldname: uploadable.disambiguate(
                    disambiguation.disambiguate_to_one(fieldname)
                )
                for fieldname, uploadable in self.toOne.items()
            },
            toMany={
                fieldname: [
                    record.disambiguate(
                        disambiguation.disambiguate_to_many(fieldname, i)
                    )
                    for i, record in enumerate(records)
                ]
                for fieldname, records in self.toMany.items()
            },
        )

    def apply_batch_edit_pack(
        self, batch_edit_pack: Optional[BatchEditJson]
    ) -> "ScopedUploadable":
        if batch_edit_pack is None:
            return self

        return self._replace(
            match_payload=batch_edit_pack["self"],
            toOne={
                fieldname: uploadable.apply_batch_edit_pack(
                    # The batch-edit pack is very compressed, and contains only necessary data.
                    # It may not have to-one. It may not have the necessary field too if it is redundant
                    Func.maybe(
                        batch_edit_pack.get("to_one", None),
                        lambda pack: pack.get(fieldname, None),
                    )
                )
                for fieldname, uploadable in self.toOne.items()
            },
            toMany={
                fieldname: [
                    record.apply_batch_edit_pack(
                        Func.maybe(
                            batch_edit_pack.get("to_many", None),
                            lambda pack: (
                                pack[fieldname][_id] if fieldname in pack else None
                            ),
                        )
                    )
                    for (_id, record) in enumerate(records)
                ]
                for fieldname, records in self.toMany.items()
            },
        )

    def get_treedefs(self) -> Set:
        return set(
            td for toOne in self.toOne.values() for td in toOne.get_treedefs()
        ) | set(
            td
            for toMany in self.toMany.values()
            for tmr in toMany
            for td in tmr.get_treedefs()
        )

    def bind(
        self,
        row: Row,
        uploadingAgentId: int,
        auditor: Auditor,
        cache: Optional[Dict] = None,
    ) -> Union["BoundUploadTable", ParseFailures]:

        current_id = (
            None if self.match_payload is None else self.match_payload.get("id")
        )

        if current_id == NULL_RECORD:
            parsedFields: List[ParseResult] = []
            parseFails: List[WorkBenchParseFailure] = []
            current_id = None
        else:
            parsedFields, parseFails = parse_many(self.name, self.wbcols, row)

        toOne: Dict[str, BoundUploadable] = {}
        for fieldname, uploadable in self.toOne.items():
            result = uploadable.bind(row, uploadingAgentId, auditor, cache)
            if isinstance(result, ParseFailures):
                parseFails += result.failures
            else:
                toOne[fieldname] = result

        toMany: Dict[str, List[BoundUploadable]] = {}
        for fieldname, records in self.toMany.items():
            boundRecords: List[BoundUploadable] = []
            for record in records:
                result_ = record.bind(row, uploadingAgentId, auditor, cache)
                if isinstance(result_, ParseFailures):
                    parseFails += result_.failures
                else:
                    boundRecords.append(result_)
            toMany[fieldname] = boundRecords

        if parseFails:
            return ParseFailures(parseFails)

        return BoundUploadTable(
            name=self.name,
            # Static adjustments should not happen for records selected for batch-edit. Handling it here makes things simple: it'll be even added for records
            # that we may potentially create.
            static=(
                static_adjustments(self.name, self.wbcols, self.static)
                if self.match_payload is None
                else self.static
            ),
            scopingAttrs=self.scopingAttrs,
            disambiguation=self.disambiguation,
            parsedFields=parsedFields,
            toOne=toOne,
            toMany=toMany,
            uploadingAgentId=uploadingAgentId,
            auditor=auditor,
            cache=cache,
            to_one_fields=self.to_one_fields,
            match_payload=self.match_payload,
            strong_ignore=self.strong_ignore,
        )


class OneToOneTable(UploadTable):
    def apply_scoping(
        self, collection, generator: ScopeGenerator = None, row=None
    ) -> "ScopedOneToOneTable":
        s = super().apply_scoping(collection, generator, row)
        return ScopedOneToOneTable(*s)

    def to_json(self) -> Dict:
        return {"oneToOneTable": self._to_json()}


class ScopedOneToOneTable(ScopedUploadTable):
    def bind(
        self,
        row: Row,
        uploadingAgentId: int,
        auditor: Auditor,
        cache: Optional[Dict] = None,
    ) -> Union["BoundOneToOneTable", ParseFailures]:
        b = super().bind(row, uploadingAgentId, auditor, cache)
        return BoundOneToOneTable(*b) if isinstance(b, BoundUploadTable) else b


class MustMatchTable(UploadTable):
    def apply_scoping(
        self, collection, generator: ScopeGenerator = None, row=None
    ) -> "ScopedMustMatchTable":
        s = super().apply_scoping(collection, generator, row)
        return ScopedMustMatchTable(*s)

    def to_json(self) -> Dict:
        return {"mustMatchTable": self._to_json()}


class ScopedMustMatchTable(ScopedUploadTable):
    def bind(
        self,
        row: Row,
        uploadingAgentId: int,
        auditor: Auditor,
        cache: Optional[Dict] = None,
    ) -> Union["BoundMustMatchTable", ParseFailures]:
        b = super().bind(row, uploadingAgentId, auditor, cache)
        return BoundMustMatchTable(*b) if isinstance(b, BoundUploadTable) else b


class BoundUploadTable(NamedTuple):
    name: str
    static: Dict[str, Any]
    parsedFields: List[ParseResult]
    toOne: Dict[str, BoundUploadable]
    toMany: Dict[str, List[BoundUploadable]]
    scopingAttrs: Dict[str, int]
    disambiguation: Optional[int]
    uploadingAgentId: Optional[int]
    auditor: Auditor
    cache: Optional[Dict]
    to_one_fields: Dict[str, List[str]]
    match_payload: Optional[BatchEditSelf]
    strong_ignore: List[
        str
    ]  # fields to stricly ignore for anything. unfortunately, depends needs parent-backref. See comment in "test_batch_edit_table.py/test_to_many_match_is_possible"

    @property
    def current_id(self):
        return None if self.match_payload is None else self.match_payload.get("id")

    @property
    def current_version(self):
        return (
            None
            if self.match_payload is None
            else self.match_payload.get("version", None)
        )

    def is_one_to_one(self) -> bool:
        return False

    def must_match(self) -> bool:
        return False

    def can_save(self) -> bool:
        return isinstance(self.current_id, int)

    @property
    def django_model(self) -> models.ModelWithTable:
        return getattr(models, self.name.capitalize())

    @property
    def _reference_cache_key(self):
        # Caching NEVER changes the logic of the uploads. Only makes things faster.
        current_id = self.current_id
        assert isinstance(
            current_id, int
        ), "Attempting to lookup a null record in cache!"
        return (REFERENCE_KEY, self.name, current_id)

    @property
    def _should_defer_match(self):
        return defer_preference.should_defer_fields("match")

    def get_django_predicates(
        self,
        should_defer_match: bool,
        to_one_override: Dict[str, UploadResult] = {},
        consider_dependents=False,
    ) -> DjangoPredicates:

        model = self.django_model

        if self.disambiguation is not None:
            if model.objects.filter(id=self.disambiguation).exists():
                return DjangoPredicates(filters={"id": self.disambiguation})

        # here's why the line below matters: If some records were added during record epansion, we cannot _filter_ or _eclude_ on them.
        # Yes, this also means it will ONLY happen if there is a filter on that side. Something like CO (base) -> Cataloger -> Addresses.
        # If there's no filter on addresses, below line wouldn't matter (bc presense of no record actually means there is none). If there's a filter,
        # there could be a hidden record. This is because all we know is that we didnt "see" it, doesn't mean it's actually not there.
        # See unittest, which covers both branches of this.
        if self.current_id == NULL_RECORD:
            return SkippablePredicate()

        # This is always the first hit, for both the updates/deletes and uploads.
        record_ref = self._get_reference()
        attrs = (
            {}
            if (record_ref is None or should_defer_match)
            else self._resolve_reference_attributes(model, record_ref)
        )

        direct_filters = {
            fieldname: value
            for parsedField in self.parsedFields
            for fieldname, value in parsedField.filter_on.items()
        }

        to_ones = {
            key: (
                to_one_override[key].get_id()
                if key in to_one_override
                # For simplicity in typing, to-ones are also considered as a list
                else value.get_django_predicates(
                    should_defer_match=should_defer_match,
                    consider_dependents=consider_dependents,
                ).reduce_for_to_one()
            )
            for key, value in self.toOne.items()
        }

        to_many = {
            key: [
                value.get_django_predicates(
                    should_defer_match=should_defer_match,
                    consider_dependents=consider_dependents,
                ).reduce_for_to_many(value)
                for value in values
            ]
            for key, values in self.toMany.items()
        }

        combined_filters = DjangoPredicates(
            filters={**attrs, **direct_filters, **to_ones, **to_many}
        )

        if combined_filters.is_reducible():
            # This is a very hot path, being called for every object on a row. We'd need to be very minimal in what we consider when considering dependents.
            # So, we:
            # 1. ^ all other attrs are null (otherwise, we won't delete this obj anyways, don't need to waste time looking at deps)
            # 2. only look at unmapped dependents, otherwise, it is redundant again.
            # 3. just make sure it is present
            if consider_dependents and record_ref is not None:
                current_rels = [*self.toOne.keys(), *self.toMany.keys()]
                for field in record_ref._meta.get_fields():
                    if field in current_rels or not (
                        field.is_relation
                        and self._relationship_is_dependent(field.name)
                    ):
                        continue
                    if field.many_to_one or field.one_to_one:
                        attname: str = field.attname  # type: ignore
                        hit = getattr(record_ref, attname) != None
                    else:
                        hit = getattr(record_ref, field.name).exists()
                    if hit:
                        # returning this makes this agnostic to implementation above, it really shouldn't be used for matching or anything
                        return DjangoPredicates(
                            filters={field.name: [SkippablePredicate()]}
                        )
            return DjangoPredicates()

        combined_filters = combined_filters._replace(
            filters={**combined_filters.filters, **self.scopingAttrs, **self.static}
        )

        return combined_filters

    def get_to_remove(self) -> ToRemove:
        return ToRemove(
            model_name=self.name, filter_on={**self.scopingAttrs, **self.static}
        )

    def process_row(self) -> UploadResult:
        return self._handle_row(skip_match=False, allow_null=True)

    def force_upload_row(self) -> UploadResult:
        return self._handle_row(skip_match=True, allow_null=True)

    def match_row(self) -> UploadResult:
        return BoundMustMatchTable(*self).process_row()

    def save_row(self, force=False) -> UploadResult:
        current_id = self.current_id
        if current_id is None:
            return self.force_upload_row()
        update_table = BoundUpdateTable(*self)
        return (
            update_table.process_row()
            if force
            else update_table.process_row_with_null()
        )

    def _get_reference(self, should_cache=True) -> Optional[models.ModelWithTable]:
        model: models.ModelWithTable = self.django_model
        current_id = self.current_id

        if current_id is None:
            return None

        cache_key = self._reference_cache_key
        cache_hit = None if self.cache is None else self.cache.get(cache_key, None)

        if cache_hit is not None:
            if not should_cache:
                # As an optimization, for the first update, return the cached one, but immediately evict it.
                # Currently, it is not possible for more than 1 successive write-intent access to _get_reference so this is very good for it.
                # If somewhere, somehow, we do have more than that, this algorithm still works, since the read/write table evicts it.
                # Eample: If we do have more than 1, the first one will evict it, and then the second one will refetch it (won't get a cache hit) -- cache coherency not broken
                # Using pop as a _different_ memory optimization.
                assert self.cache is not None
                self.cache.pop(cache_key)
            return cache_hit

        reference_record = safe_fetch(model, {"id": current_id}, self.current_version)

        if should_cache and self.cache is not None:
            self.cache[cache_key] = reference_record

        return reference_record

    def _resolve_reference_attributes(self, model, reference_record) -> Dict[str, Any]:

        return resolve_reference_attributes(
            [
                *self.scopingAttrs.keys(),
                *self.strong_ignore,
                *self.toOne.keys(),
                *self.toMany.keys(),
            ],
            model,
            reference_record,
        )

    def _handle_row(self, skip_match: bool, allow_null: bool) -> UploadResult:
        model = self.django_model
        if self.disambiguation is not None:
            if model.objects.filter(id=self.disambiguation).exists():
                return UploadResult(
                    Matched(
                        id=self.disambiguation, info=ReportInfo(self.name, [], None)
                    ),
                    {},
                    {},
                )

        info = ReportInfo(
            tableName=self.name,
            columns=[pr.column for pr in self.parsedFields],
            treeInfo=None,
        )

        current_id = self.current_id

        assert current_id != NULL_RECORD, "found handling a NULL record!"

        to_one_results = self._process_to_ones()

        if any(result.get_id() == "Failure" for result in to_one_results.values()):
            return UploadResult(PropagatedFailure(), to_one_results, {})

        attrs = {
            fieldname_: value
            for parsedField in self.parsedFields
            for fieldname_, value in parsedField.upload.items()
        }

        # This is very handy to check for whether the entire record needs to be skipped or not.
        # This also returns predicates for to-many, we if this is empty, we really are a null record
        try:
            filter_predicate = self.get_django_predicates(
                should_defer_match=self._should_defer_match,
                to_one_override=to_one_results,
                consider_dependents=isinstance(self, BoundUpdateTable),
            )
        except ContetRef as e:
            # Not sure if there is a better way for this. Consider moving this to binding.
            return UploadResult(
                FailedBusinessRule(str(e), {}, info), to_one_results, {}
            )

        attrs = {
            **(
                {}
                if defer_preference.should_defer_fields("null_check")
                else self._resolve_reference_attributes(model, self._get_reference())
            ),
            **attrs,
        }

        if (
            all(v is None for v in attrs.values()) and not filter_predicate.filters
        ) and allow_null:
            # nothing to upload
            return UploadResult(NullRecord(info), to_one_results, {})
        if not skip_match:
            match = self._match(filter_predicate, info)
            if match:
                return UploadResult(match, to_one_results, {})

        return self._do_upload(model, to_one_results, info)

    def _process_to_ones(self) -> Dict[str, UploadResult]:
        return {
            fieldname: to_one_def.process_row()
            for fieldname, to_one_def in Func.sort_by_key(
                self.toOne
            )  # make the upload order deterministic
            # we don't care about being able to process one-to-one. Instead, we include them in the matching predicates.
            # this allows handing "MatchedMultiple" case of one-to-ones more gracefully, while allowing us to include them
            # in the matching. See "test_ambiguous_one_to_one_match" in testuploading.py.
            if not to_one_def.is_one_to_one()
        }

    def _match(
        self, predicates: DjangoPredicates, info: ReportInfo
    ) -> Union[Matched, MatchedMultiple, None]:

        cache_key = predicates.get_cache_key(self.name)

        cache_hit: Optional[List[int]] = (
            self.cache.get(cache_key, None) if self.cache is not None else None
        )
        if cache_hit is not None:
            ids = cache_hit
        else:
            query = predicates.apply_to_query(self.name).values_list("id", flat=True)
            current_id = self.current_id
            ids = []
            if current_id is not None:
                # Consider user added a column in query which is not unique. We'll always get more than one match in that case. That is, very likely, not the intended
                # behaviour is. To handle that case, run the query twice. First, using the id we have, then without it, if we don't find a match.
                # I don't want to cache this, since we got lucky. we can't naively compare the attributes though, we'll incorrectly ignore
                # filters on to-many in that case. can't get more than one match though. I guess we could cache this if we add id to predicates...
                query_with_self = query.filter(id=current_id)
                ids = list(query_with_self)
            if not ids:
                query = query[:10]
                ids = list(query.values_list("id", flat=True))
                if self.cache is not None and ids:
                    self.cache[cache_key] = ids

        n_matched = len(ids)
        if n_matched > 1:
            return MatchedMultiple(ids=ids, key=repr(cache_key), info=info)
        elif n_matched == 1:
            return Matched(id=ids[0], info=info)
        else:
            return None

    def _check_missing_required(self) -> Optional[ParseFailures]:
        missing_requireds = [
            # TODO: there should probably be a different structure for
            # missing required fields than ParseFailure
            WorkBenchParseFailure(parsedField.missing_required, {}, parsedField.column)
            for parsedField in self.parsedFields
            if parsedField.missing_required is not None
        ]

        if missing_requireds:
            return ParseFailures(missing_requireds)

        return None

    def _do_upload(
        self,
        model: models.ModelWithTable,
        to_one_results: Dict[str, UploadResult],
        info: ReportInfo,
    ) -> UploadResult:

        missing_required = self._check_missing_required()

        if missing_required is not None:
            return UploadResult(missing_required, to_one_results, {})

        attrs = {
            fieldname_: value
            for parsedField in self.parsedFields
            for fieldname_, value in parsedField.upload.items()
        }

        # by the time we get here, we know we need to so something.
        to_one_results = {
            **to_one_results,
            **{
                fieldname: to_one_def.force_upload_row()
                for fieldname, to_one_def in
                # Make the upload order deterministic (maybe? depends on if it matched I guess)
                # But because the records can't be shared, the unupload order shouldn't matter anyways...
                Func.sort_by_key(self.toOne)
                if to_one_def.is_one_to_one()
            },
        }

        to_one_ids: Dict[str, Optional[int]] = {}
        for field, result in to_one_results.items():
            id = result.get_id()
            if id == "Failure":
                return UploadResult(PropagatedFailure(), to_one_results, {})
            to_one_ids[field] = id

        new_attrs = {
            **attrs,
            **self.scopingAttrs,
            **self.static,
            **{
                model._meta.get_field(fieldname).attname: id  # type: ignore
                for fieldname, id in to_one_ids.items()
            },
            **(
                {"createdbyagent_id": self.uploadingAgentId}
                if model.specify_model.get_field("createdbyagent")
                else {}
            ),
        }

        with transaction.atomic():
            try:
                if self.current_id is None:
                    uploaded = self._do_insert(model, new_attrs)
                else:
                    uploaded = self._do_clone(new_attrs)
                picklist_additions = self._do_picklist_additions()
            except (BusinessRuleException, IntegrityError) as e:
                return UploadResult(
                    FailedBusinessRule(str(e), {}, info), to_one_results, {}
                )

        record = Uploaded(uploaded.id, info, picklist_additions)

        to_many_results = self._handle_to_many(False, record.get_id(), model)

        return UploadResult(record, to_one_results, to_many_results)

    def _handle_to_many(
        self, update: bool, parent_id: int, model: models.ModelWithTable
    ):
        return {
            fieldname: _upload_to_manys(
                model,
                parent_id,
                fieldname,
                update,
                records,
                # we don't care about checking for dependents if we aren't going to delete them!
                self.auditor.props.allow_delete_dependents and self._relationship_is_dependent(fieldname),
            )
            for fieldname, records in Func.sort_by_key(self.toMany)
        }

    def _do_insert(self, model, attrs) -> Any:
        inserter = self._get_inserter()
        return inserter(model, attrs)

    def _do_clone(self, attrs) -> Any:
        inserter = self._get_inserter()
        to_ignore = [
            *self.toOne.keys(),  # Don't touch mapped to-ones
            *self.toMany.keys(),  # Don't touch mapped to-manys
        ]
        return clone_record(
            self._get_reference(), inserter, self.to_one_fields, to_ignore, attrs
        )

    def _get_inserter(self):
        def _inserter(model, attrs):
            uploaded = model.objects.create(**attrs)
            self.auditor.insert(uploaded, None)
            return uploaded

        return _inserter

    def _do_picklist_additions(self) -> List[PicklistAddition]:
        added_picklist_items = []
        for parsedField in self.parsedFields:
            if parsedField.add_to_picklist is not None:
                a = parsedField.add_to_picklist
                pli = a.picklist.picklistitems.create(
                    value=a.value,
                    title=a.value,
                    createdbyagent_id=self.uploadingAgentId,
                )
                self.auditor.insert(pli, None)
                added_picklist_items.append(
                    PicklistAddition(
                        name=a.picklist.name, caption=a.column, value=a.value, id=pli.id
                    )
                )
        return added_picklist_items

    def delete_row(self, parent_obj=None) -> UploadResult:

        info = ReportInfo(
            tableName=self.name,
            columns=[pr.column for pr in self.parsedFields],
            treeInfo=None,
        )

        if self.current_id is None:
            return UploadResult(NullRecord(info), {}, {})
        # By the time we are here, we know if we can't have a not null to-one or to-many mapping.
        # So, we can just go ahead and follow the general delete protocol. Don't need version-control here.
        # Also caching still works (we'll, always, get a hit) because updates and deletes are independent (update wouldn't have been called).
        reference_record = self._get_reference(
            should_cache=False  # Need to evict the last copy, in case someone tries accessing it, we'll then get a stale record
        )

        assert reference_record is not None

        result: Optional[Union[Deleted, FailedBusinessRule]] = None

        to_many_deleted: Dict[str, List[UploadResult]] = {
            key: [record.delete_row() for record in records]
            for (key, records) in self.toMany.items()
            if self._relationship_is_dependent(key)
        }
        if any(
            isinstance(result.record_result, Deleted)
            for (results_per_key) in to_many_deleted.values()
            for result in results_per_key
        ):
            return UploadResult(PropagatedFailure(), {}, to_many_deleted)

        with transaction.atomic():
            try:
                # we don't care about deleting dependents, because if we get here, we either don't have any dependents OR we mapped all of them
                self.auditor.delete(reference_record, parent_obj)
                reference_record.delete()
                result = Deleted(self.current_id, info)
            except (BusinessRuleException, IntegrityError) as e:
                result = FailedBusinessRule(str(e), {}, info)

        to_one_deleted: Dict[str, UploadResult] = {
            key: value.delete_row()
            for (key, value) in self.toOne.items()
            if self._relationship_is_dependent(key)
        }
        assert result is not None
        return UploadResult(result, to_one_deleted, to_many_deleted)

    def _relationship_is_dependent(self, field_name) -> bool:
        django_model = self.django_model
        # We could check to_one_fields, but we are not going to, because that is just redundant with is_one_to_one.
        if field_name in self.toOne:
            return self.toOne[field_name].is_one_to_one()
        return django_model.specify_model.get_relationship(field_name).dependent


class BoundOneToOneTable(BoundUploadTable):
    def is_one_to_one(self) -> bool:
        return True


class BoundMustMatchTable(BoundUploadTable):
    def must_match(self) -> bool:
        return True

    def force_upload_row(self) -> UploadResult:
        raise Exception("trying to force upload of must-match table")

    def _process_to_ones(self) -> Dict[str, UploadResult]:
        return {
            fieldname: to_one_def.match_row()
            for fieldname, to_one_def in self.toOne.items()
            if not to_one_def.is_one_to_one()
        }

    def _do_upload(
        self, model, toOneResults: Dict[str, UploadResult], info: ReportInfo
    ) -> UploadResult:
        return UploadResult(NoMatch(info), toOneResults, {})


def _upload_to_manys(
    parent_model, parent_id, parent_field, is_update, records, is_dependent
) -> List[UploadResult]:
    fk_field = parent_model._meta.get_field(parent_field).remote_field.attname
    bound_tables = [
        record._replace(
            disambiguation=None, static={**record.static, fk_field: parent_id}
        )
        for record in records
    ]
    return [
        (
            record.force_upload_row()
            if not is_update
            else record.save_row(force=(not is_dependent))
        )
        for record in bound_tables
    ]


class BoundUpdateTable(BoundUploadTable):

    def process_row(self):
        return self._handle_row(skip_match=True, allow_null=False)

    def process_row_with_null(self):
        return self._handle_row(skip_match=True, allow_null=True)

    @property
    def _should_defer_match(self):
        # Complicated. consider the case where deferForMatch is true. In that case, we can't always just defer fields,
        # because during updates, we'd wrongly skip to-manys -- and possibly delete them -- if they contain field values (not visible) BUT get skipped due to above.
        # So, we handle it by always going by null_check ONLY IF we know we are doing an update, which we know at this point.
        return defer_preference.should_defer_fields("null_check")

    def _handle_row(self, skip_match: bool, allow_null: bool):
        assert (
            self.disambiguation is None
        ), "Did not epect disambigution for update tables!"
        assert (
            self.match_payload is not None
        ), "Trying to perform a save on unhandled type of payload!"
        assert (
            self.current_id is not None
        ), "Did not find any identifier to go by. You likely meant to upload instead of save"

        current_id = self.current_id

        info = ReportInfo(
            tableName=self.name,
            columns=[pr.column for pr in self.parsedFields],
            treeInfo=None,
        )

        if current_id == NULL_RECORD:
            return UploadResult(NoChange(current_id, info), {}, {})

        return super()._handle_row(skip_match=True, allow_null=allow_null)

    def _process_to_ones(self) -> Dict[str, UploadResult]:
        return {
            field_name: (
                to_one_def.save_row(force=(not self.auditor.props.allow_delete_dependents))
                if to_one_def.is_one_to_one()
                else to_one_def.process_row()
            )
            for field_name, to_one_def in Func.sort_by_key(self.toOne)
        }

    def _do_upload(
        self, model, to_one_results: Dict[str, UploadResult], info: ReportInfo
    ) -> UploadResult:

        missing_required = self._check_missing_required()

        if missing_required is not None:
            return UploadResult(missing_required, to_one_results, {})

        attrs = {
            **{
                fieldname_: value
                for parsedField in self.parsedFields
                for fieldname_, value in parsedField.upload.items()
            },
            **self.scopingAttrs,
            **self.static,
        }

        to_one_ids = {
            model._meta.get_field(fieldname).attname: result.get_id()
            for fieldname, result in to_one_results.items()
        }

        # Should also always get a cache hit at this point, evict the hit.
        reference_record = self._get_reference(should_cache=False)

        assert reference_record is not None

        concrete_field_changes = BoundUpdateTable._field_changed(
            reference_record, attrs
        )
        if any(
            scoping_attr in concrete_field_changes
            for scoping_attr in self.scopingAttrs.keys()
        ):
            # I don't know what else to do. I don't think this will ever get raised. I don't know what I'll need to debug this, so showing everything.
            raise Exception(
                f"Attempting to change the scope of the record: {reference_record} at {self}. \n\n Diff: {concrete_field_changes}"
            )

        to_one_changes = BoundUpdateTable._field_changed(reference_record, to_one_ids)

        to_one_matched_and_changed = {
            related: result._replace(
                record_result=MatchedAndChanged(*result.record_result)
            )
            for related, result in to_one_results.items()
            if isinstance(result.record_result, Matched)
            and model._meta.get_field(related).attname in to_one_changes
        }

        to_one_results = {**to_one_results, **to_one_matched_and_changed}

        changed = len(concrete_field_changes) != 0

        if changed:
            modified_columns = [
                parsed.column
                for parsed in self.parsedFields
                if (
                    any(
                        fieldname in concrete_field_changes
                        for fieldname in parsed.upload.keys()
                    )
                )
            ]
            info = info._replace(columns=modified_columns)

        # Changed is just concrete field changes. We might have changed a to-one too.
        # This is done like this to avoid an unecessary save when we know there is no
        if changed or to_one_changes:
            attrs = {
                **attrs,
                **to_one_ids,
                **(
                    {"modifiedbyagent_id": self.uploadingAgentId}
                    if hasattr(reference_record, "modifiedbyagent_id")
                    else {}
                ),
            }

            with transaction.atomic():
                try:
                    updated = self._do_update(
                        reference_record,
                        [*to_one_changes.values(), *concrete_field_changes.values()],
                        **attrs,
                    )
                    picklist_additions = self._do_picklist_additions()
                except (BusinessRuleException, IntegrityError) as e:
                    return UploadResult(
                        FailedBusinessRule(str(e), {}, info), to_one_results, {}
                    )

        record: Union[Updated, NoChange] = (
            Updated(updated.pk, info, picklist_additions)
            if changed
            else NoChange(reference_record.pk, info)
        )
        to_many_results = self._handle_to_many(True, record.get_id(), model)

        to_one_adjusted, to_many_adjusted = self._clean_up_fks(
            to_one_results, to_many_results
        )

        return UploadResult(record, to_one_adjusted, to_many_adjusted)

    def _do_update(self, reference_obj, dirty_fields, **attrs):
        # TODO: Try handling parent_obj. Quite complicated and ugly.
        self.auditor.update(reference_obj, None, dirty_fields)
        for key, value in attrs.items():
            setattr(reference_obj, key, value)
        if hasattr(reference_obj, "version"):
            # Consider using bump_version here.
            # I'm not doing it for performance reasons -- we already checked our version at this point, and have a lock, so can just increment the version.
            setattr(reference_obj, "version", getattr(reference_obj, "version") + 1)
        reference_obj.save()
        return reference_obj

    def _do_insert(self):
        raise Exception("Attempting to insert into a save table directly!")

    def force_upload_row(self) -> UploadResult:
        raise Exception(
            "Attempting to force upload! Can't force upload to a save table"
        )

    def _clean_up_fks(
        self,
        to_one_results: Dict[str, UploadResult],
        to_many_results: Dict[str, List[UploadResult]],
    ) -> Tuple[Dict[str, UploadResult], Dict[str, List[UploadResult]]]:

        to_one_deleted = {
            key: uploadable.delete_row()  # type: ignore
            for (key, uploadable) in self.toOne.items()
            if self._relationship_is_dependent(key)
            and isinstance(to_one_results[key].record_result, NullRecord)
        }

        to_many_deleted = {
            key: [
                (
                    uploadable.delete_row()
                    if isinstance(result.record_result, NullRecord)
                    else result
                )
                for (result, uploadable) in zip(to_many_results[key], uploadables)
            ]
            for (key, uploadables) in self.toMany.items()
            if self._relationship_is_dependent(key)
        }

        return {**to_one_results, **to_one_deleted}, {
            **to_many_results,
            **to_many_deleted,
        }

    @staticmethod
    def _field_changed(reference_record, attrs: Dict[str, Any]):
        return {
            key: FieldChangeInfo(field_name=key, old_value=getattr(reference_record, key), new_value=new_value)  # type: ignore
            for (key, new_value) in attrs.items()
            if getattr(reference_record, key) != new_value
        }

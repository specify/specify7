import logging
from functools import reduce
from typing import List, Dict, Any, NamedTuple, Union, Optional, Set, Callable, Literal, cast, Tuple

from django.db import transaction, IntegrityError

from specifyweb.businessrules.exceptions import BusinessRuleException
from specifyweb.specify import models
from specifyweb.specify.datamodel import datamodel
from specifyweb.specify.load_datamodel import Field, Relationship
import specifyweb.stored_queries.models as sql_models
from .column_options import ColumnOptions, ExtendedColumnOptions
from .parsing import parse_many, ParseResult, WorkBenchParseFailure

from .upload_result import UploadResult, Uploaded, NoMatch, Matched, \
    MatchedMultiple, NullRecord, FailedBusinessRule, ReportInfo, \
    PicklistAddition, ParseFailures, PropagatedFailure
from .uploadable import FilterPredicate, Predicate, PredicateWithQuery, Row, Uploadable, ScopedUploadable, \
    BoundUploadable, Disambiguation, Auditor, Filter

from sqlalchemy.orm import Query, aliased, Session # type: ignore
from sqlalchemy import sql, Table as SQLTable # type: ignore
from sqlalchemy.sql.expression import ColumnElement # type: ignore
from sqlalchemy.exc import OperationalError # type: ignore

logger = logging.getLogger(__name__)

class UploadTable(NamedTuple):
    name: str
    wbcols: Dict[str, ColumnOptions]
    static: Dict[str, Any]
    toOne: Dict[str, Uploadable]
    toMany: Dict[str, List[Uploadable]]

    overrideScope: Optional[Dict[Literal['collection'], Optional[int]]] = None

    def apply_scoping(self, collection, row=None) -> Tuple[bool, "ScopedUploadTable"]:
        from .scoping import apply_scoping_to_uploadtable
        return apply_scoping_to_uploadtable(self, collection, row)

    def get_cols(self) -> Set[str]:
        return set(cd.column for cd in self.wbcols.values()) \
            | set(col for u in self.toOne.values() for col in u.get_cols()) \
            | set(col for rs in self.toMany.values() for r in rs for col in r.get_cols())

    def _to_json(self) -> Dict:
        result = dict(
            wbcols={k: v.to_json() for k,v in self.wbcols.items()},
            static=self.static
        )
        result['toOne'] = {
            key: uploadable.to_json()
            for key, uploadable in self.toOne.items()
        }
        result['toMany'] = {
            # legacy behaviour      
            key: [to_many.to_json()['uploadTable'] for to_many in to_manys]
            for key, to_manys in self.toMany.items()
        }
        return result

    def to_json(self) -> Dict:
        return { 'uploadTable': self._to_json() }

    def unparse(self) -> Dict:
        return { 'baseTableName': self.name, 'uploadable': self.to_json() }

class ScopedUploadTable(NamedTuple):
    name: str
    wbcols: Dict[str, ExtendedColumnOptions]
    static: Dict[str, Any]
    toOne: Dict[str, ScopedUploadable]
    toMany: Dict[str, List['ScopedUploadable']] # type: ignore
    scopingAttrs: Dict[str, int]
    disambiguation: Optional[int]

    def disambiguate(self, disambiguation: Disambiguation) -> "ScopedUploadable":
        if disambiguation is None:
            return self

        return self._replace(
            disambiguation = disambiguation.disambiguate(),
            toOne={
                fieldname: uploadable.disambiguate(disambiguation.disambiguate_to_one(fieldname))
                for fieldname, uploadable in self.toOne.items()
            },
            toMany={
                fieldname: [
                    record.disambiguate(disambiguation.disambiguate_to_many(fieldname, i))
                    for i, record in enumerate(records)
                ]
                for fieldname, records in self.toMany.items()
            }
        )

    def get_treedefs(self) -> Set:
        return (
            set(td for toOne in self.toOne.values() for td in toOne.get_treedefs()) |
            set(td for toMany in self.toMany.values() for tmr in toMany for td in tmr.get_treedefs())
        )


    def bind(self, row: Row, uploadingAgentId: int, auditor: Auditor, sql_alchemy_session, cache: Optional[Dict]=None
             ) -> Union["BoundUploadTable", ParseFailures]:
        parsedFields, parseFails = parse_many(self.name, self.wbcols, row)

        toOne: Dict[str, BoundUploadable] = {}
        for fieldname, uploadable in self.toOne.items():
            result = uploadable.bind(row, uploadingAgentId, auditor, sql_alchemy_session, cache)
            if isinstance(result, ParseFailures):
                parseFails += result.failures
            else:
                toOne[fieldname] = result

        toMany: Dict[str, List[BoundUploadable]] = {}
        for fieldname, records in self.toMany.items():
            boundRecords: List[BoundUploadable] = []
            for record in records:
                result_ = record.bind(row, uploadingAgentId, auditor, sql_alchemy_session, cache)
                if isinstance(result_, ParseFailures):
                    parseFails += result_.failures
                else:
                    boundRecords.append(result_)
            toMany[fieldname] = boundRecords

        if parseFails:
            return ParseFailures(parseFails)

        return BoundUploadTable(
            name=self.name,
            static=self.static,
            scopingAttrs=self.scopingAttrs,
            disambiguation=self.disambiguation,
            parsedFields=parsedFields,
            toOne=toOne,
            toMany=toMany,
            uploadingAgentId=uploadingAgentId,
            auditor=auditor,
            cache=cache,
            session=sql_alchemy_session
        )

class OneToOneTable(UploadTable):
    def apply_scoping(self, collection, row=None) -> Tuple[bool, "ScopedOneToOneTable"]:
        cache, s = super().apply_scoping(collection, row)
        return cache, ScopedOneToOneTable(*s)

    def to_json(self) -> Dict:
        return { 'oneToOneTable': self._to_json() }

class ScopedOneToOneTable(ScopedUploadTable):
    def bind(self, row: Row, uploadingAgentId: int, auditor: Auditor, sql_alchemy_session, cache: Optional[Dict]=None
             ) -> Union["BoundOneToOneTable", ParseFailures]:
        b = super().bind(row, uploadingAgentId, auditor, sql_alchemy_session, cache)
        return BoundOneToOneTable(*b) if isinstance(b, BoundUploadTable) else b

class MustMatchTable(UploadTable):
    def apply_scoping(self, collection, row=None) -> Tuple[bool, "ScopedMustMatchTable"]:
        cache, s = super().apply_scoping(collection, row)
        return cache, ScopedMustMatchTable(*s)

    def to_json(self) -> Dict:
        return { 'mustMatchTable': self._to_json() }

class ScopedMustMatchTable(ScopedUploadTable):
    def bind(self,row: Row, uploadingAgentId: int, auditor: Auditor, sql_alchemy_session, cache: Optional[Dict]=None
             ) -> Union["BoundMustMatchTable", ParseFailures]:
        b = super().bind(row, uploadingAgentId, auditor, sql_alchemy_session, cache)
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
    session: Any # TODO: Improve typing

    def is_one_to_one(self) -> bool:
        return False

    def must_match(self) -> bool:
        return False

    def get_predicates(self, query: Query, sql_table: SQLTable, to_one_override: Dict[str, UploadResult] = {}, path: List[str] = []) -> PredicateWithQuery:
        if self.disambiguation is not None:
            if getattr(models, self.name.capitalize()).objects.filter(id=self.disambiguation).exists():
                return query, FilterPredicate([Predicate(getattr(sql_table, sql_table._id), self.disambiguation)])
        
        specify_table = datamodel.get_table_strict(self.name)

        direct_field_pack = FilterPredicate.from_simple_dict(
            sql_table,
            ((specify_table.get_field_strict(fieldname).name, value)
            for parsedField in self.parsedFields
            for fieldname, value in parsedField.filter_on.items()),
            path=path
            )
        
        def _reduce(
                accumulated: PredicateWithQuery, 
                # to-ones are converted to a list of one element to simplify handling to-manys
                current: Tuple[str, Union[List[BoundUploadable], BoundUploadable]], 
                # to-one and to-many handle return filter packs differently
                specialize_callback: Callable[[FilterPredicate, BoundUploadable, Relationship, SQLTable, List[str]], Optional[FilterPredicate]]
                ) -> PredicateWithQuery:
            current_query, current_predicates = accumulated
            relationship_name, upload_tables = current
            if not isinstance(upload_tables, list):
                upload_tables = [upload_tables]
            relationship = specify_table.get_relationship(relationship_name)
            related_model_name = relationship.relatedModelName

            def _uploadables_reduce(accum: Tuple[PredicateWithQuery, List[ColumnElement], int], uploadable: BoundUploadable) -> Tuple[PredicateWithQuery, List[ColumnElement], int]:
                next_sql_model: SQLTable = aliased(getattr(sql_models, related_model_name))
                (query, previous_predicate), to_ignore, index = accum
                _id = getattr(next_sql_model, next_sql_model._id)
                extended_criterions = [_id != previous_id for previous_id in to_ignore]
                criterion = sql.and_(*extended_criterions)

                joined = query.join(
                    next_sql_model,
                    getattr(sql_table, relationship.name),
                )
                if len(extended_criterions):
                    # to make sure matches are record-aligned
                    # disable this, and see what unit test fails to figure out what it does
                    joined = joined.filter(criterion)
                next_query, _raw_field_pack = uploadable.get_predicates(joined, next_sql_model, path=[*path, repr((index, relationship_name))])
                to_merge = specialize_callback(_raw_field_pack, uploadable, relationship, sql_table, path)
                if to_merge is not None:
                    next_query = query
                else:
                    to_ignore = [*to_ignore, _id]
                    to_merge = _raw_field_pack
                return (next_query, previous_predicate.merge(to_merge)), to_ignore, index + 1
            
            reduced, _, __ = reduce(_uploadables_reduce, upload_tables, ((current_query, current_predicates), [], 0))
            return reduced
        
        to_one_reduce = lambda accum, curr: _reduce(accum, curr, FilterPredicate.to_one_augment)
        to_many_reduce = lambda accum, curr: _reduce(accum, curr, FilterPredicate.to_many_augment)

        # this is handled here to make the matching query simple for the root table
        if to_one_override:
            to_one_override_pack = FilterPredicate.from_simple_dict(
                sql_table, 
                ((FilterPredicate.rel_to_fk(specify_table.get_relationship(rel)), value.get_id()) for (rel, value) in to_one_override.items()),
                path
                )
        else:
            to_one_override_pack = FilterPredicate()

        query, to_one_pack = reduce(
            to_one_reduce,
            # useful for one-to-ones
            [(key, value) for (key, value) in self.toOne.items() if key not in to_one_override],
            (query, to_one_override_pack)
        )

        query, to_many_pack = reduce(to_many_reduce, self.toMany.items(), (query, FilterPredicate()))
        accumulated_pack = direct_field_pack.merge(to_many_pack).merge(to_one_pack)

        is_reducible = not (any(value[1] is not None for value in accumulated_pack.filter))
        if is_reducible:
            # don't care about excludes anymore
            return query, FilterPredicate()

        static_predicate = FilterPredicate.from_simple_dict(sql_table, iter(self.map_static_to_db().items()), path)

        return query, static_predicate.merge(accumulated_pack)
        
    def map_static_to_db(self) -> Filter:
        model = getattr(models, self.name.capitalize())
        table = datamodel.get_table_strict(self.name)
        raw_attrs = {**self.scopingAttrs, **self.static}
        
        return {
            FilterPredicate.rel_to_fk(table.get_field_strict(model._meta.get_field(direct_field).name)): value 
            for (direct_field, value) in raw_attrs.items()
            }
        

    def process_row(self) -> UploadResult:
        return self._handle_row(force_upload=False)

    def force_upload_row(self) -> UploadResult:
        return self._handle_row(force_upload=True)

    def match_row(self) -> UploadResult:
        return BoundMustMatchTable(*self).process_row()

    def _handle_row(self, force_upload: bool) -> UploadResult:
        model = getattr(models, self.name.capitalize())
        if self.disambiguation is not None:
            if model.objects.filter(id=self.disambiguation).exists():
                return UploadResult(Matched(id=self.disambiguation, info=ReportInfo(self.name, [], None)), {}, {})

        info = ReportInfo(tableName=self.name, columns=[pr.column for pr in self.parsedFields], treeInfo=None)

        toOneResults_ = self._process_to_ones()

        toOneResults = {
            field: result
            for field, result in toOneResults_.items()
        }

        if any(result.get_id() == "Failure" for result in toOneResults.values()):
            return UploadResult(PropagatedFailure(), toOneResults, {})

        attrs = {
            fieldname_: value
            for parsedField in self.parsedFields
            for fieldname_, value in parsedField.upload.items()
        }

        base_sql_table = getattr(sql_models, datamodel.get_table_strict(self.name).name)
        query, filter_predicate = self.get_predicates(self.session.query(getattr(base_sql_table, base_sql_table._id)), base_sql_table, toOneResults)
        
        if all(v is None for v in attrs.values()) and not filter_predicate.filter:
            # nothing to upload
            return UploadResult(NullRecord(info), toOneResults, {})

        if not force_upload:
            match = self._match(query, filter_predicate, info)
            if match:
                return UploadResult(match, toOneResults, {})

        return self._do_upload(model, toOneResults, info)

    def _process_to_ones(self) -> Dict[str, UploadResult]:
        return {
            fieldname: to_one_def.process_row()
            for fieldname, to_one_def in
            sorted(self.toOne.items(), key=lambda kv: kv[0]) # make the upload order deterministic
            # we don't care about being able to process one-to-one. Instead, we include them in the matching predicates.
            # this allows handing "MatchedMultiple" case of one-to-ones more gracefully, while allowing us to include them
            # in the matching. See "test_ambiguous_one_to_one_match" in testuploading.py
            if not to_one_def.is_one_to_one()
        }

    def _match(self, query: Query, predicate: FilterPredicate, info: ReportInfo) -> Union[Matched, MatchedMultiple, None]:
        assert predicate.filter or predicate.exclude, "Attempting to match a null record!"
        cache_key = predicate.cache_key()

        cache_hit: Optional[List[int]] = self.cache.get(cache_key, None) if self.cache is not None else None
        if cache_hit is not None:
            ids = cache_hit
        else:
            query = predicate.apply_to_query(query)
            try:
                query = query.distinct().limit(10)
                raw_ids: List[Tuple[int, Any]] = list(query)
                ids = [_id[0] for _id in raw_ids]
            except OperationalError as e:
                if e.args[0] == "(MySQLdb.OperationalError) (1065, 'Query was empty')":
                    ids = []
                else:
                    raise
            if self.cache is not None and ids:
                self.cache[cache_key] = ids

        n_matched = len(ids)
        if n_matched > 1:
            return MatchedMultiple(ids=ids, key=repr(cache_key), info=info)
        elif n_matched == 1:
            return Matched(id=ids[0], info=info)
        else:
            return None

    def _do_upload(self, model, toOneResults: Dict[str, UploadResult], info: ReportInfo) -> UploadResult:
        missing_requireds = [
            # TODO: there should probably be a different structure for
            # missing required fields than ParseFailure
            WorkBenchParseFailure(parsedField.missing_required, {}, parsedField.column)
            for parsedField in self.parsedFields
            if parsedField.missing_required is not None
        ]

        if missing_requireds:
            return UploadResult(ParseFailures(missing_requireds), toOneResults, {})

        attrs = {
            fieldname_: value
            for parsedField in self.parsedFields
            for fieldname_, value in parsedField.upload.items()
        }

        # replace any one-to-one records that matched with forced uploads
        toOneResults = {**toOneResults, **{
            fieldname: to_one_def.force_upload_row()
            for fieldname, to_one_def in
            # Make the upload order deterministic (maybe? depends on if it matched I guess)
            # But because the records can't be shared, the unupload order shouldn't matter anyways...
            sorted(self.toOne.items(), key=lambda kv: kv[0])
            if to_one_def.is_one_to_one()
        }}

        toOneIds: Dict[str, Optional[int]] = {}
        for field, result in toOneResults.items():
            id = result.get_id()
            if id == "Failure":
                return UploadResult(PropagatedFailure(), toOneResults, {})
            toOneIds[field] = id

        with transaction.atomic():
            try:
                uploaded = self._do_insert(model, **{
                    **({'createdbyagent_id': self.uploadingAgentId} if model.specify_model.get_field('createdbyagent') else {}),
                    **attrs,
                    **self.scopingAttrs,
                    **self.static,
                    **{ model._meta.get_field(fieldname).attname: id for fieldname, id in toOneIds.items() },
                })
                picklist_additions = self._do_picklist_additions()
            except (BusinessRuleException, IntegrityError) as e:
                return UploadResult(FailedBusinessRule(str(e), {}, info), toOneResults, {})

        self.auditor.insert(uploaded, self.uploadingAgentId, None)

        toManyResults = {
            fieldname: _upload_to_manys(model, uploaded.id, fieldname, self.uploadingAgentId, self.auditor, self.cache, records, self.session)
            for fieldname, records in
            sorted(self.toMany.items(), key=lambda kv: kv[0]) # make the upload order deterministic
        }
        return UploadResult(Uploaded(uploaded.id, info, picklist_additions), toOneResults, toManyResults)

    def _do_insert(self, model, **attrs) -> Any:
        return model.objects.create(**attrs)

    def _do_picklist_additions(self) -> List[PicklistAddition]:
        added_picklist_items = []
        for parsedField in self.parsedFields:
            if parsedField.add_to_picklist is not None:
                a = parsedField.add_to_picklist
                pli = a.picklist.picklistitems.create(value=a.value, title=a.value, createdbyagent_id=self.uploadingAgentId)
                self.auditor.insert(pli, self.uploadingAgentId, None)
                added_picklist_items.append(PicklistAddition(name=a.picklist.name, caption=a.column, value=a.value, id=pli.id))
        return added_picklist_items

class BoundOneToOneTable(BoundUploadTable):
    def is_one_to_one(self) -> bool:
        return True

class BoundMustMatchTable(BoundUploadTable):
    def must_match(self) -> bool:
        return True

    def force_upload_row(self) -> UploadResult:
        raise Exception('trying to force upload of must-match table')

    def _process_to_ones(self) -> Dict[str, UploadResult]:
        return {
            fieldname: to_one_def.match_row()
            for fieldname, to_one_def in self.toOne.items()
            if not to_one_def.is_one_to_one()
        }

    def _do_upload(self, model, toOneResults: Dict[str, UploadResult], info: ReportInfo) -> UploadResult:
        return UploadResult(NoMatch(info), toOneResults, {})


def _upload_to_manys(parent_model, parent_id, parent_field, uploadingAgentId: Optional[int], auditor: Auditor, cache: Optional[Dict], records, session) -> List[UploadResult]:
    fk_field = parent_model._meta.get_field(parent_field).remote_field.attname

    return [
        BoundUploadTable(
            name=record.name,
            scopingAttrs=record.scopingAttrs,
            disambiguation=None,
            parsedFields=record.parsedFields,
            toOne=record.toOne,
            static={**record.static, fk_field: parent_id},
            toMany=record.toMany,
            uploadingAgentId=uploadingAgentId,
            auditor=auditor,
            cache=cache,
            session=session
        ).force_upload_row()
        for record in records
    ]
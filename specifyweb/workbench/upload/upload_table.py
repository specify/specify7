
import logging
from functools import reduce
from typing import List, Dict, Any, NamedTuple, Union, Optional, Set

from django.db import transaction, IntegrityError

from specifyweb.businessrules.exceptions import BusinessRuleException
from specifyweb.specify import models
from .column_options import ColumnOptions, ExtendedColumnOptions
from .parsing import parse_many, ParseResult, ParseFailure
from .tomany import ToManyRecord, ScopedToManyRecord, BoundToManyRecord
from .upload_result import UploadResult, Uploaded, NoMatch, Matched, \
    MatchedMultiple, NullRecord, FailedBusinessRule, ReportInfo, \
    PicklistAddition, ParseFailures, PropagatedFailure
from .uploadable import FilterPack, Exclude, Row, Uploadable, ScopedUploadable, \
    BoundUploadable, Disambiguation, Auditor

logger = logging.getLogger(__name__)


class UploadTable(NamedTuple):
    name: str
    wbcols: Dict[str, ColumnOptions]
    static: Dict[str, Any]
    toOne: Dict[str, Uploadable]
    toMany: Dict[str, List[ToManyRecord]]

    def apply_scoping(self, collection) -> "ScopedUploadTable":
        from .scoping import apply_scoping_to_uploadtable as apply_scoping
        return apply_scoping(self, collection)

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
            key: [to_many.to_json() for to_many in to_manys]
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
    toMany: Dict[str, List[ScopedToManyRecord]]
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


    def bind(self, collection, row: Row, uploadingAgentId: int, auditor: Auditor, cache: Optional[Dict]=None) -> Union["BoundUploadTable", ParseFailures]:
        parsedFields, parseFails = parse_many(collection, self.name, self.wbcols, row)

        toOne: Dict[str, BoundUploadable] = {}
        for fieldname, uploadable in self.toOne.items():
            result = uploadable.bind(collection, row, uploadingAgentId, auditor, cache)
            if isinstance(result, ParseFailures):
                parseFails += result.failures
            else:
                toOne[fieldname] = result

        toMany: Dict[str, List[BoundToManyRecord]] = {}
        for fieldname, records in self.toMany.items():
            boundRecords: List[BoundToManyRecord] = []
            for record in records:
                result_ = record.bind(collection, row, uploadingAgentId, auditor, cache)
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
        )

class OneToOneTable(UploadTable):
    def apply_scoping(self, collection) -> "ScopedOneToOneTable":
        s = super().apply_scoping(collection)
        return ScopedOneToOneTable(*s)

    def to_json(self) -> Dict:
        return { 'oneToOneTable': self._to_json() }

class ScopedOneToOneTable(ScopedUploadTable):
    def bind(self, collection, row: Row, uploadingAgentId: int, auditor: Auditor, cache: Optional[Dict]=None) -> Union["BoundOneToOneTable", ParseFailures]:
        b = super().bind(collection, row, uploadingAgentId, auditor, cache)
        return BoundOneToOneTable(*b) if isinstance(b, BoundUploadTable) else b

class MustMatchTable(UploadTable):
    def apply_scoping(self, collection) -> "ScopedMustMatchTable":
        s = super().apply_scoping(collection)
        return ScopedMustMatchTable(*s)

    def to_json(self) -> Dict:
        return { 'mustMatchTable': self._to_json() }

class ScopedMustMatchTable(ScopedUploadTable):
    def bind(self, collection, row: Row, uploadingAgentId: int, auditor: Auditor, cache: Optional[Dict]=None) -> Union["BoundMustMatchTable", ParseFailures]:
        b = super().bind(collection, row, uploadingAgentId, auditor, cache)
        return BoundMustMatchTable(*b) if isinstance(b, BoundUploadTable) else b


class BoundUploadTable(NamedTuple):
    name: str
    static: Dict[str, Any]
    parsedFields: List[ParseResult]
    toOne: Dict[str, BoundUploadable]
    toMany: Dict[str, List[BoundToManyRecord]]
    scopingAttrs: Dict[str, int]
    disambiguation: Optional[int]
    uploadingAgentId: Optional[int]
    auditor: Auditor
    cache: Optional[Dict]

    def is_one_to_one(self) -> bool:
        return False

    def must_match(self) -> bool:
        return False

    def filter_on(self, path: str) -> FilterPack:
        if self.disambiguation is not None:
            if getattr(models, self.name.capitalize()).objects.filter(id=self.disambiguation).exists():
                return FilterPack([{f'{path}__id': self.disambiguation}], [])

        filters = {
            (path + '__' + fieldname_): value
            for parsedField in self.parsedFields
            for fieldname_, value in parsedField.filter_on.items()
        }

        for toOneField, toOneTable in self.toOne.items():
            fs, es = toOneTable.filter_on(path + '__' + toOneField)
            for f in fs:
                filters.update(f)

        if all(v is None for v in filters.values()):
            return FilterPack([], [Exclude(path + "__in", self.name, {**self.scopingAttrs, **self.static})])

        filters.update({
            (path + '__' + fieldname): value
            for fieldname, value in {**self.scopingAttrs, **self.static}.items()
        })

        return FilterPack([filters], [])

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

        multi_one_to_one = lambda field, result: self.toOne[field].is_one_to_one() and isinstance(result.record_result, MatchedMultiple)

        multipleOneToOneMatch = any(
            # If a one-to-one related object matched multiple
            # records, we won't be able to use it for matching
            # this object, but we need to remember that there was
            # data here.
            multi_one_to_one(field, result)
            for field, result in toOneResults_.items()
        )

        toOneResults = {
            # Filter out the one-to-ones that matched multiple
            # b/c they aren't errors nor can be used for matching.
            field: result
            for field, result in toOneResults_.items()
            if not multi_one_to_one(field, result)
        }

        if any(result.get_id() == "Failure" for result in toOneResults.values()):
            return UploadResult(PropagatedFailure(), toOneResults, {})

        toManyFilters = _to_many_filters_and_excludes(self.toMany)

        attrs = {
            fieldname_: value
            for parsedField in self.parsedFields
            for fieldname_, value in parsedField.upload.items()
        }

        attrs.update({ model._meta.get_field(fieldname).attname: r.get_id() for fieldname, r in toOneResults.items() })

        to_many_filters, to_many_excludes = toManyFilters

        if all(v is None for v in attrs.values()) and not to_many_filters and not multipleOneToOneMatch:
            # nothing to upload
            return UploadResult(NullRecord(info), toOneResults, {})

        if not force_upload:
            match = self._match(model, toOneResults, toManyFilters, info)
            if match:
                return UploadResult(match, toOneResults, {})

        return self._do_upload(model, toOneResults, info)

    def _process_to_ones(self) -> Dict[str, UploadResult]:
        return {
            fieldname: to_one_def.process_row()
            for fieldname, to_one_def in
            sorted(self.toOne.items(), key=lambda kv: kv[0]) # make the upload order deterministic
        }

    def _match(self, model, toOneResults: Dict[str, UploadResult], toManyFilters: FilterPack, info: ReportInfo) -> Union[Matched, MatchedMultiple, None]:
        filters = {
            fieldname_: value
            for parsedField in self.parsedFields
            for fieldname_, value in parsedField.filter_on.items()
        }

        filters.update({ model._meta.get_field(fieldname).attname: r.get_id() for fieldname, r in toOneResults.items() })

        cache_key = (
            self.name,
            tuple(sorted(filters.items())),
            toManyFilters.match_key(),
            tuple(sorted(self.scopingAttrs.items())),
            tuple(sorted(self.static.items())),
        )

        cache_hit: Optional[List[int]] = self.cache.get(cache_key, None) if self.cache is not None else None
        if cache_hit is not None:
            ids = cache_hit
        else:
            to_many_filters, to_many_excludes = toManyFilters

            qs = reduce(lambda q, e: q.exclude(**{e.lookup: getattr(models, e.table).objects.filter(**e.filter)}),
                        to_many_excludes,
                        reduce(lambda q, f: q.filter(**f),
                               to_many_filters,
                               model.objects.filter(**filters, **self.scopingAttrs, **self.static)))

            ids = list(qs.values_list('id', flat=True)[:10])

            if self.cache and ids:
                self.cache[cache_key] = ids

        n_matched = len(ids)
        if n_matched > 1:
            if self.name == 'Agent':
                return Matched(id=ids[0], info=info)
            return MatchedMultiple(ids=ids, key=repr(cache_key), info=info)
        elif n_matched == 1:
            return Matched(id=ids[0], info=info)
        else:
            return None

    def _do_upload(self, model, toOneResults: Dict[str, UploadResult], info: ReportInfo) -> UploadResult:
        missing_requireds = [
            # TODO: there should probably be a different structure for
            # missing required fields than ParseFailure
            ParseFailure(parsedField.missing_required, {}, parsedField.column)
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
            if fieldname not in toOneResults # the field was removed b/c there were multiple matches
            or isinstance(toOneResults[fieldname].record_result, Matched) # this stops the record from being shared
            or isinstance(toOneResults[fieldname].record_result, MatchedMultiple) # this shouldn't ever be the case
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
            fieldname: _upload_to_manys(model, uploaded.id, fieldname, self.uploadingAgentId, self.auditor, self.cache, records)
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
        }

    def _do_upload(self, model, toOneResults: Dict[str, UploadResult], info: ReportInfo) -> UploadResult:
        return UploadResult(NoMatch(info), toOneResults, {})


def _to_many_filters_and_excludes(to_manys: Dict[str, List[BoundToManyRecord]]) -> FilterPack:
    filters: List[Dict] = []
    excludes: List[Exclude] = []

    for toManyField, records in to_manys.items():
        for record in records:
            fs, es = record.filter_on(toManyField)
            filters += fs
            excludes += [e for e in es if e.filter]

    return FilterPack(filters, excludes)


def _upload_to_manys(parent_model, parent_id, parent_field, uploadingAgentId: Optional[int], auditor: Auditor, cache: Optional[Dict], records) -> List[UploadResult]:
    fk_field = parent_model._meta.get_field(parent_field).remote_field.attname

    return [
        BoundUploadTable(
            name=record.name,
            scopingAttrs=record.scopingAttrs,
            disambiguation=None,
            parsedFields=record.parsedFields,
            toOne=record.toOne,
            static={**record.static, fk_field: parent_id},
            toMany={},
            uploadingAgentId=uploadingAgentId,
            auditor=auditor,
            cache=cache,
        ).force_upload_row()
        for record in records
    ]

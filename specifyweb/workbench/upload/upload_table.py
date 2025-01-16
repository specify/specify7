
import logging
from functools import reduce
from typing import List, Dict, Any, NamedTuple, Union, Optional, Set, Callable, Literal, Tuple, cast

from django.db import transaction, IntegrityError

from specifyweb.businessrules.exceptions import BusinessRuleException
from specifyweb.specify import models
from .column_options import ColumnOptions, ExtendedColumnOptions
from .parsing import parse_many, ParseResult, WorkBenchParseFailure
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

    overrideScope: Optional[Dict[Literal['collection'], Optional[int]]] = None

    def apply_scoping(self, collection) -> "ScopedUploadTable":
        from .scoping import apply_scoping_to_uploadtable
        return apply_scoping_to_uploadtable(self, collection)

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
    
class DeferredScopeUploadTable(NamedTuple):
    ''' In the case that the scoping of a record in a WorkBench upload can not be known 
    until the values of the rows are known, the scope of the record should be deferred until 
    the row is being processed. 

    When the upload table is parsed in .upload_plan_schema.py, if a table contains a field which scoping 
    is unknown, a DeferredScope UploadTable is created. 

    As suggested by the name, the DeferredScope UploadTable is not scoped or disambiguated until its bind()
    method is called. In which case, the rows of the dataset are known and the scoping can be deduced  
    '''
    name: str
    wbcols: Dict[str, ColumnOptions]
    static: Dict[str, Any]
    toOne: Dict[str, Uploadable]
    toMany: Dict[str, List[ToManyRecord]]

    related_key: str
    relationship_name: str
    filter_field: str

    disambiguation: Disambiguation = None

    """ In a DeferredScopeUploadTable, the overrideScope value can be either an integer 
    (which follows the same logic as in UploadTable), or a function which has the parameter
    signature: (deferred_upload_plan: DeferredScopeUploadTable, row_index: int) -> models.Collection
    (see apply_deferred_scopes in .upload.py)

    overrideScope should be of type 
        Optional[Dict[Literal["collection"], Union[int, Callable[["DeferredScopeUploadTable", int], Any]]]]
    
    But recursively using the type within the class definition of a NamedTuple is not supported in our version 
    of mypy
    See https://github.com/python/mypy/issues/8695
    """
    overrideScope: Optional[Dict[Literal["collection"], Union[int, Callable[[Any, int], Any]]]] = None

    
    # Typehint for return type should be:  Union["ScopedUploadTable", "DeferredScopeUploadTable"]
    def apply_scoping(self, collection, defer: bool = True) -> Union["ScopedUploadTable", Any]:
        if not defer:
            from .scoping import apply_scoping_to_uploadtable
            return apply_scoping_to_uploadtable(self, collection)
        else: return self

    def get_cols(self) -> Set[str]:
        return set(cd.column for cd in self.wbcols.values()) \
            | set(col for u in self.toOne.values() for col in u.get_cols()) \
            | set(col for rs in self.toMany.values() for r in rs for col in r.get_cols())


    """
        The Typehint for parameter collection should be: Union[int, Callable[["DeferredScopeUploadTable", int], Any]]
        The Typehint for return type should be: "DeferredScopeUploadTable"
    """
    def add_colleciton_override(self, collection: Union[int, Callable[[Any, int], Any]]) -> Any:
        ''' To modify the overrideScope after the DeferredScope UploadTable is created, use add_colleciton_override
        To properly apply scoping (see self.bind()), the <collection> should either be a collection's id, or a callable (function), 
        which has paramaters that accept: this DeferredScope UploadTable, and an integer representing the current row_index.
        
        Note that _replace(**kwargs) does not modify the original object. It insteads creates a new object with the same attributes except for
        those added/changed in the paramater kwargs. 
        
        '''
        return self._replace(overrideScope = {"collection": collection})
    
    def disambiguate(self, da: Disambiguation):
        '''Disambiguation should only be used when the UploadTable is completely Scoped. 
        
        When a caller attempts to disambiguate a DeferredScope UploadTable, create and return
        a copy of the DeferredScope Upload Table with the Disambiguation stored in a 
        'disambiguation' attribute.

        If this attribute exists when the DeferredScoped UploadTable is scoped, 
        then disambiguate the new Scoped UploadTable using the stored Disambiguation
        '''
        return self._replace(disambiguation = da)

    def get_treedefs(self) -> Set:
        """ This method is needed because a ScopedUploadTable may call this when calling its own get_treedefs()
        This returns an empty set unless the toOne or toMany Uploadable is a TreeRecord
        """
        return (
            set(td for toOne in self.toOne.values() for td in toOne.get_treedefs()) | # type: ignore
            set(td for toMany in self.toMany.values() for tmr in toMany for td in tmr.get_treedefs()) # type: ignore
        )

    def bind(self, default_collection, row: Row, uploadingAgentId: int, auditor: Auditor, cache: Optional[Dict]=None, row_index: Optional[int] = None
             ) -> Union["BoundUploadTable", ParseFailures]:
        
        scoped = None
        
        ''' If the collection should be overridden and an integer (collection id) is provided, 
        then get the collection with that id and apply the proper scoping.

        Otherwise, if a funciton is provided (see apply_deferred_scopes in .upload.py), then call the function 
        with the row and row_index to get the needed collection
        '''
        if  self.overrideScope is not None and'collection' in self.overrideScope.keys():
            if isinstance(self.overrideScope['collection'], int):
                collection_id = self.overrideScope['collection']
                collection = models.Collection.objects.get(id=collection_id)
                scoped = self.apply_scoping(collection, defer=False)
            elif callable(self.overrideScope['collection']):
                collection = self.overrideScope['collection'](self, row_index) if row_index is not None else default_collection
                scoped = self.apply_scoping(collection, defer=False)
        
        # If the collection/scope should not be overriden, defer to the default behavior and assume 
        # the record should be uploaded in the logged-in collection
        if scoped is None: scoped = self.apply_scoping(default_collection, defer=False)

        # self.apply_scoping is annotated to Union["ScopedUploadTable", Any]
        # But at this point we know the variable scoped will always be a ScopedUploadTable
        # We tell typing the type of the variable scoped will be ScopedUploadTable with the cast() function
        scoped = cast(ScopedUploadTable, scoped)

        # If the DeferredScope UploadTable contained any disambiguation data, then apply the disambiguation to the new
        # ScopedUploadTable
        # Because ScopedUploadTable.disambiguate() has return type of ScopedUploadable, we must specify the type as ScopedUploadTable
        scoped_disambiguated = cast(ScopedUploadTable, scoped.disambiguate(self.disambiguation)) if self.disambiguation is not None else scoped
        # Finally bind the ScopedUploadTable and return the BoundUploadTable or ParseFailures 
        return scoped_disambiguated.bind(default_collection, row, uploadingAgentId, auditor, cache, row_index)
    
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


    def bind(self, collection, row: Row, uploadingAgentId: int, auditor: Auditor, cache: Optional[Dict]=None, row_index: Optional[int] = None
             ) -> Union["BoundUploadTable", ParseFailures]:
        parsedFields, parseFails = parse_many(collection, self.name, self.wbcols, row)

        toOne: Dict[str, BoundUploadable] = {}
        for fieldname, uploadable in self.toOne.items():
            result = uploadable.bind(collection, row, uploadingAgentId, auditor, cache, row_index)
            if isinstance(result, ParseFailures):
                parseFails += result.failures
            else:
                toOne[fieldname] = result

        toMany: Dict[str, List[BoundToManyRecord]] = {}
        for fieldname, records in self.toMany.items():
            boundRecords: List[BoundToManyRecord] = []
            for record in records:
                result_ = record.bind(collection, row, uploadingAgentId, auditor, cache, row_index)
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
    def bind(self, collection, row: Row, uploadingAgentId: int, auditor: Auditor, cache: Optional[Dict]=None, row_index: Optional[int] = None
             ) -> Union["BoundOneToOneTable", ParseFailures]:
        b = super().bind(collection, row, uploadingAgentId, auditor, cache, row_index)
        return BoundOneToOneTable(*b) if isinstance(b, BoundUploadTable) else b

class MustMatchTable(UploadTable):
    def apply_scoping(self, collection) -> "ScopedMustMatchTable":
        s = super().apply_scoping(collection)
        return ScopedMustMatchTable(*s)

    def to_json(self) -> Dict:
        return { 'mustMatchTable': self._to_json() }

class ScopedMustMatchTable(ScopedUploadTable):
    def bind(self, collection, row: Row, uploadingAgentId: int, auditor: Auditor, cache: Optional[Dict]=None, row_index: Optional[int] = None
             ) -> Union["BoundMustMatchTable", ParseFailures]:
        b = super().bind(collection, row, uploadingAgentId, auditor, cache, row_index)
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

        local_to_ones, remote_to_ones = separate_to_ones(model, self.toOne)

        toOneResults_ = self._process_to_ones(local_to_ones)

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

        return self._do_upload(model, toOneResults, remote_to_ones, info)

    def _process_to_ones(self, toOnes: Dict[str, BoundUploadable]) -> Dict[str, UploadResult]:
        return {
            fieldname: to_one_def.process_row()
            for fieldname, to_one_def in
            sorted(toOnes.items(), key=lambda kv: kv[0]) # make the upload order deterministic
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
            return MatchedMultiple(ids=ids, key=repr(cache_key), info=info)
        elif n_matched == 1:
            return Matched(id=ids[0], info=info)
        else:
            return None

    def _do_upload(self, model, toOneResults: Dict[str, UploadResult], remoteToOnes: Dict[str, BoundUploadable], info: ReportInfo) -> UploadResult:
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

        # Like to-many relationships, remote to-one relationships can not be 
        # directly inserted with the main base record, and instead are 
        # uploaded with a reference to the base record 
        remoteToOneResults = {
            fieldname: _upload_to_manys(model, uploaded.id, fieldname, self.uploadingAgentId, self.auditor, self.cache, [upload_table])[0]
            for fieldname, upload_table in 
            sorted(remoteToOnes.items(), key=lambda kv: kv[0])
        }

        toManyResults = {
            fieldname: _upload_to_manys(model, uploaded.id, fieldname, self.uploadingAgentId, self.auditor, self.cache, records)
            for fieldname, records in
            sorted(self.toMany.items(), key=lambda kv: kv[0]) # make the upload order deterministic
        }
        return UploadResult(Uploaded(uploaded.id, info, picklist_additions), {**toOneResults, **remoteToOneResults}, toManyResults)

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

    def _process_to_ones(self, toOnes: Dict[str, BoundUploadable]) -> Dict[str, UploadResult]:
        return {
            fieldname: to_one_def.match_row()
            for fieldname, to_one_def in toOnes.items()
        }

    def _do_upload(self, model, toOneResults: Dict[str, UploadResult], remoteToOnes: Dict[str, BoundUploadable], info: ReportInfo) -> UploadResult:
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

def separate_to_ones(parent_model, toOnes: Dict[str, BoundUploadable]) -> Tuple[Dict[str, BoundUploadable], Dict[str, BoundUploadable]]: 
    remote_to_ones = dict()
    local_to_ones = dict()

    for field_name, uploadable in toOnes.items(): 
        field = parent_model._meta.get_field(field_name)
        if field.concrete: 
            local_to_ones[field_name] = uploadable
        else: 
            remote_to_ones[field_name] = uploadable
    return local_to_ones, remote_to_ones

from typing import Iterator, List, Dict, Tuple, Any, NamedTuple, Optional, TypedDict, Union, Set
from typing_extensions import Protocol

from functools import reduce

from sqlalchemy import Table as SQLTable # type: ignore
import sqlalchemy as db # type: ignore
from sqlalchemy.orm import Query # type: ignore
from sqlalchemy.sql.expression import ColumnElement # type: ignore

from specifyweb.specify.load_datamodel import Field, Relationship
from specifyweb.specify.models import datamodel

from .upload_result import UploadResult, ParseFailures
from .auditor import Auditor
import specifyweb.stored_queries.models as sql_models

class Uploadable(Protocol):
    # also returns if the scoped table returned can be cached or not.
    # depends on whether scope depends on other columns. if any definition is found,
    # we cannot cache. well, we can make this more complicated by recursviely caching
    # static parts of even a non-entirely-cachable uploadable.
    def apply_scoping(self, collection, row=None) -> Tuple[bool, "ScopedUploadable"]:
        ...

    def get_cols(self) -> Set[str]:
        ...

    def to_json(self) -> Dict:
        ...

    def unparse(self) -> Dict:
        ...

Row = Dict[str, str]

class DisambiguationInfo(Protocol):
    def disambiguate(self) -> Optional[int]:
        ...

    def disambiguate_tree(self) -> Dict[str, int]:
        ...

    def disambiguate_to_one(self, to_one: str) -> "Disambiguation":
        ...

    def disambiguate_to_many(self, to_many: str, record_index: int) -> "Disambiguation":
        ...

Disambiguation = Optional[DisambiguationInfo]


class ScopedUploadable(Protocol):
    def disambiguate(self, disambiguation: Disambiguation) -> "ScopedUploadable":
        ...

    def bind(self, collection, row: Row, uploadingAgentId: int, auditor: Auditor, sql_alchemy_session, cache: Optional[Dict]=None) -> Union["BoundUploadable", ParseFailures]:
        ...

    def get_treedefs(self) -> Set:
        ...

Filter = Dict[str, Any]

def filter_match_key(f: Filter) -> str:
    return repr(sorted(f.items()))

class Matchee(TypedDict):
    # need to reference the fk in the penultimate table in join to to-many
    ref: ColumnElement
    # which column to use in the table (== the otherside of ref)
    backref: str
    filters: Filter
    path: List[str]

def matchee_to_key(matchee: Matchee):
    return (matchee['backref'], matchee['path'], filter_match_key(matchee['filters']))

class Predicate(NamedTuple):
    ref: ColumnElement
    value: Any = None
    path: List[str] = []

class FilterPredicate(NamedTuple):
    # gets flatenned into ANDs
    filter: List[Predicate] = []
    # basically the entire exclude can be flatenned into ORs. (NOT A and NOT B -> NOT (A or B))
    # significantly reduces the tables needed in the look-up query (vs Django's default)
    exclude: Dict[
        str, # the model name
        List[Matchee] # list of found references
        ] = {}

    def merge(self, other: 'FilterPredicate') -> 'FilterPredicate':
        filters = [*self.filter, *other.filter]
        exclude = reduce(
            lambda accum, current: {**accum, current[0]: [*accum.get(current[0], []), *current[1]]},
            other.exclude.items(),
            self.exclude
        )
        return FilterPredicate(filters, exclude)
    
    def to_one_augment(self, uploadable: 'BoundUploadable', relationship: Relationship, sql_table: SQLTable, path: List[str]) -> Optional['FilterPredicate']:
        if self.filter or self.exclude:
            return None
        return FilterPredicate([Predicate(getattr(sql_table, relationship.column), None, [*path, relationship.name])])

    def to_many_augment(self, uploadable: 'BoundUploadable', relationship: Relationship, sql_table: SQLTable, path: List[str]) -> Optional['FilterPredicate']:
        if self.filter:
            return None
        
        # nested excludes don't make sense and complicates everything. this avoids it (while keeping semantics same)
        return FilterPredicate(exclude={
            relationship.relatedModelName: [{
                'ref': getattr(sql_table, sql_table._id),
                'backref': relationship.otherSideName,
                'filters': uploadable.map_static_to_db(),
                'path': path
            }]
        })
    
    @staticmethod
    def from_simple_dict(sql_table: SQLTable, iterator: Iterator[Tuple[str, Any]], path:List[str]=[]):
        # REFACTOR: make this inline?
        return FilterPredicate(
            [Predicate(getattr(sql_table, fieldname), value, [*path, fieldname])
            for fieldname, value in iterator]
        )
        
    def apply_to_query(self, query: Query) -> Query:
        direct = db.and_(*[(field == value) for field, value, _ in self.filter])
        excludes = db.or_(*[FilterPredicate._map_exclude(items) for items in self.exclude.items()])
        filter_by = direct if not self.exclude else db.and_(
                direct,
                db.not_(excludes)
                )
        return query.filter(filter_by)
    
    @staticmethod
    def _map_exclude(current: Tuple[str, List[Matchee]]):
        model_name, matches = current
        sql_table = getattr(sql_models, model_name)
        table = datamodel.get_table_strict(model_name)
        assert len(matches) > 0, "got nothing to exclude"

        criterion = [
            db.and_(
                getattr(sql_table, table.get_relationship(matchee['backref']).column) == matchee['ref'],
                db.and_(
                    *[
                     getattr(sql_table, field) == value
                     for field, value in matchee['filters'].items()
                     ]
                )
                )
            for matchee in matches
            ]
        
        # dbs limit 1 anyways...
        return (db.exists(db.select([1])).where(db.or_(*criterion)))
    
    @staticmethod
    def rel_to_fk(field: Field):
        return field.column if field.is_relationship else field.name
    
    def cache_key(self) -> str:
        filters = sorted((repr(_filter.path), _filter.value) for _filter in self.filter)
        excludes = sorted((key, sorted(matchee_to_key(value) for value in values)) for (key, values) in self.exclude.items())
        return repr((filters, excludes))
    
PredicateWithQuery = Tuple[Query, FilterPredicate]


class BoundUploadable(Protocol):
    def is_one_to_one(self) -> bool:
        ...

    def must_match(self) -> bool:
        ...
    
    def get_predicates(self, query: Query, sql_table: SQLTable, to_one_override: Dict[str, UploadResult]={}, path: List[str] = []) -> PredicateWithQuery:
        ...

    def match_row(self) -> UploadResult:
        ...

    def process_row(self) -> UploadResult:
        ...

    def force_upload_row(self) -> UploadResult:
        ...

    def map_static_to_db(self) -> Filter:
        ...


from functools import reduce
from typing import Callable, Dict, NamedTuple, Optional, Any, Generator, List, Tuple, Union
from typing_extensions import TypedDict

from django.db.models import QuerySet, Q, F, Model, Exists, OuterRef

import specifyweb.specify.models as spmodels
from specifyweb.specify.func import Func

from django.core.exceptions import ObjectDoesNotExist

from specifyweb.workbench.upload.clone import GENERIC_FIELDS_TO_SKIP

Filter = Dict[str, Any]

Value = Optional[Union[str, int, F]]

class ToRemoveMatchee(TypedDict):
    filter_on: Filter
    # It is possible that the node we need to filter on may be present. In this case, we'll remove valid entries. 
    # To avoid that, we track the present ones too. I can't think why this might need more cont, so making it Q
    remove: Optional[Q]

ToRemoveNode = Dict[str, List[ToRemoveMatchee]]

get_model = lambda model_name: getattr(spmodels, model_name.lower().capitalize())

def add_to_remove_node(previous: ToRemoveNode, new_node: ToRemoveNode) -> ToRemoveNode:
    return {
        **previous,
        **{
            key: [*previous.get(key, []), *values]
            for key, values in new_node.items()
        }
    }

class ToRemove(NamedTuple):
    model_name: str
    filter_on: Filter

    def to_cache_key(self):
        return repr((self.model_name, filter_match_key(self.filter_on)))

class DjangoPredicates(NamedTuple):
    filters: Dict[str, Union[Value, List[Any]]] = {} # type: ignore
    to_remove: Optional[ToRemove] = None

    def reduce_for_to_one(self):
        if not self.filters and not self.to_remove and not isinstance(self, SkippablePredicate):
            # If we get here, we know that we can directly reduce to-one
            # to an empty none match, and don't need to bother matching 
            # more.
            return None
        return [self]
    
    def reduce_for_to_many(
            self, 
            uploadable: Any # type: ignore
            ):
        if self.filters or isinstance(self, SkippablePredicate):
            return self
        
        # nested excludes don't make sense and complicates everything.
        # this avoids it (while keeping semantics same).
        # That is, if we hit a "to_remove", we're done, and don't need to go any deeper.
        # Having a "higher" to_remove is just a bad idea (and redundant, we don't care about a deeper one at that point)
        return DjangoPredicates(to_remove=uploadable.get_to_remove())

    @staticmethod
    def _map_reduce(values):
        if not isinstance(values, list):
            return values is None
        return all(value.is_reducible() for value in values)
    
    def is_reducible(self):
        if not self.filters:
            return True
        return all(DjangoPredicates._map_reduce(values) for values in self.filters.values())
    
    def get_cache_key(self, basetable_name: str=None) -> str:
        filters = [
            # we don't care about table past the first one, since rels will uniquely denote the related table..
            (key, tuple([value.get_cache_key() for value in values]) 
             if isinstance(values, list) else repr(values)) 
             for key, values in Func.sort_by_key(self.filters)]
        to_remove = None if self.to_remove is None else self.to_remove.to_cache_key()
        return repr((basetable_name, tuple(filters), to_remove))
    
    def _smart_apply(
            self, 
            query: QuerySet, 
            get_unique_alias: Generator[str, None, None],
            current_model: Model, 
            path: Optional[str] = None, 
            aliases: List[Tuple[str, str]] = [], 
            to_remove_node: 'ToRemoveNode' = {}
            ):
        _get_field_name = lambda raw_name: raw_name if path is None else (path + '__' + raw_name)

        # it's useless to match on nothing. caller should be aware of that
        assert self.filters is not None and self.filters, "trying to force match on nothing"

        base_predicates = {
            _get_field_name(field_name): value
            for (field_name, value) in self.filters.items()
            if not isinstance(value, list)
        }

        filtered = {
            **base_predicates,
            **{name: F(alias) for (name, alias) in aliases[1:]}
        }

        unique_alias = next(get_unique_alias)

        alias_path = _get_field_name('id')
        query = query.filter(**filtered).alias(**{unique_alias: F(alias_path)})
        aliases = [
            *aliases, 
            (alias_path, unique_alias)
            ]

        def _reduce_by_key(rel_name: str):
            # mypy isn't able to infer types correctly
            new_model: Model = current_model._meta.get_field(rel_name).related_model # type: ignore
            assert new_model is not None
            def _reduce(previous: Tuple[QuerySet, ToRemoveNode, List[Any]], current: DjangoPredicates):
                # Don't do anything
                if isinstance(current, SkippablePredicate):
                    return previous
                
                previous_query, previous_to_remove_node, internal_exclude = previous

                if (current.to_remove):
                    assert not current.filters, "Hmm, we are trying to filter on something we'll remove. How??"
                    reverse_side: str = current_model._meta.get_field(rel_name).remote_field.name # type: ignore
                    model_name: str = new_model._meta.model_name # type: ignore
                    assert reverse_side is not None
                    to_remove_node = add_to_remove_node(previous_to_remove_node, {
                        model_name: [{
                        'filter_on': {**current.to_remove.filter_on, reverse_side: OuterRef(unique_alias)},
                        'remove': None if len(internal_exclude) == 0 else Func.make_ors([Q(id=OuterRef(prev)) for prev in internal_exclude])
                    }]})
                    return previous_query, to_remove_node, internal_exclude
                
                new_path = _get_field_name(rel_name)
                
                new_query, node_to_remove, alias_of_child = current._smart_apply(previous_query, get_unique_alias, new_model, new_path, aliases, previous_to_remove_node)
                record_aligned: QuerySet = reduce(lambda _query, _to_remove: _query.exclude(**{alias_of_child: F(_to_remove)}), internal_exclude, new_query)
                return record_aligned, node_to_remove, [*internal_exclude, alias_of_child]
            
            return _reduce
        
        def _reduce_by_rel(accum: Tuple[QuerySet, ToRemoveNode], by_rels: List[DjangoPredicates], rel_name: str):
            modified_query, modified_to_remove, _ = reduce(_reduce_by_key(rel_name), sorted(by_rels, key=lambda pred: int(pred.to_remove is not None)), (accum[0], accum[1], []))
            return modified_query, modified_to_remove
        
        rels = [(key, values) for (key, values) in self.filters.items() if isinstance(values, list)]
        query, to_remove = reduce(
            lambda accum, current: _reduce_by_rel(accum, current[1], current[0]), 
                rels, 
                (query, to_remove_node)
            )
        return query, to_remove, unique_alias

    def apply_to_query(self, base_name: str) -> QuerySet:
        base_model = get_model(base_name)
        query: QuerySet = base_model.objects.all()
        getter = get_unique_predicate()
        if not self.filters:
            return query
        query, to_remove, alias = self._smart_apply(query, getter, base_model, None, aliases=[])
        if to_remove:
            query = query.filter(canonicalize_remove_node(to_remove))
        return query
            

# Use this in places where we need to guarantee unique values. We could use random numbers, but using this
# makes things sane for debugging.
def get_unique_predicate(pre="predicate-") -> Generator[str, None, None]:
    _id = 0
    while True:
        yield f"{pre}{_id}"
        _id += 1

# This predicates is a magic predicate, and is completely ignored during query-building. If a uploadable returns this, it won't be considered for matching
# NOTE: There's a difference between Skipping and returning a null filter (if within to-ones, null will really - correctly - filter for null).
class SkippablePredicate(DjangoPredicates):
    def get_cache_key(self, basetable_name: str = None) -> str:
        return repr(('Skippable', basetable_name))

    def apply_to_query(self, base_name: str) -> QuerySet:
        raise Exception("Attempting to apply skippable predicates to a query!")
    
    def is_reducible(self):
        # Don't reduce it. Doesn't make sense for top-level. But does if in rels
        return False

def filter_match_key(f: Filter) -> str:
    return repr(sorted(f.items()))
    
def canonicalize_remove_node(node: ToRemoveNode) -> Q:
    all_exists = [Q(_map_matchee(matchee, name)) for name, matchee in node.items()]
    all_or = Func.make_ors(all_exists)
    # Don't miss the negation below!
    return ~all_or

def _map_matchee(matchee: List[ToRemoveMatchee], model_name: str) -> Exists:
    model: Model = get_model(model_name)
    qs = [Q(**match['filter_on']) for match in matchee]
    qs_or = Func.make_ors(qs)
    query = model.objects.filter(qs_or)
    to_remove = [match['remove'] for match in matchee if match['remove'] is not None]
    if to_remove:
        query = query.exclude(Func.make_ors(to_remove))
    return Exists(query)

class ContetRef(Exception):
    pass

def safe_fetch(model: Model, filters, version):
    if filters is None:
        return None
    try:
        reference_record = model.objects.select_for_update().get(**filters)
    except ObjectDoesNotExist:
        raise ContetRef(f"Object {filters} at {model._meta.model_name} is no longer present in the database")
    
    incoming_version = getattr(reference_record, 'version', None)

    if incoming_version is not None and version is not None and version != incoming_version:
        raise ContetRef(f"Object {filters} of {model._meta.model_name} is out of date. Please re-run the query")
    
    return reference_record

def resolve_reference_attributes(fields_to_skip, model, reference_record) -> Dict[str, Any]:

    if reference_record is None:
        return {}

    fields_to_skip = [
        *GENERIC_FIELDS_TO_SKIP,
        *fields_to_skip,
    ]

    all_fields = [
        field.attname for field in model._meta.get_fields(include_hidden=True) 
        if field.concrete and (field.attname not in fields_to_skip)
        ]

    clone_attrs = {
        field: getattr(reference_record, field)
        for field in all_fields
    }

    return clone_attrs
from functools import reduce
from typing import Any, Callable, Dict, List, NamedTuple, Optional, Set, Tuple, TypeVar, TypedDict
from specifyweb.specify.models import datamodel
from specifyweb.specify.load_datamodel import Field, Relationship, Table
from specifyweb.stored_queries.execution import execute
from specifyweb.stored_queries.queryfield import QueryField, fields_from_json
from specifyweb.stored_queries.queryfieldspec import FieldSpecJoinPath, QueryFieldSpec, TreeRankQuery
from . import models

# as a note to myself to find which branches/conditions are tricky and need a unit test
def test_case(x): return x

# made as a class to encapsulate type variables and prevent pollution of export
class Func:
    I = TypeVar('I')
    O = TypeVar('O')

    @staticmethod
    def maybe(value: Optional[I], callback: Callable[[I], O]):
        if value is None:
            return None
        return callback(value)
    
MaybeField = Callable[[QueryFieldSpec], Optional[Field]]

# TODO: 
# Investigate if any/some/most of the logic for making an upload plan could be moved to frontend and reused. 
#   - does generation of upload plan in the backend bc upload plan is not known (we don't know count of to-many). 
#       - seemed complicated to merge upload plan from the frontend
#   - need to place id markers at correct level, so need to follow upload plan anyways.


def _get_nested_order(field_spec: QueryFieldSpec):
    # don't care about ordernumber if it ain't nested
    # won't affect logic, just data being saved.
    if len(field_spec.join_path) == 0:
        return None
    return field_spec.table.get_field('ordernumber')


batch_edit_fields: Dict[str, Tuple[MaybeField, int]] = {
    # technically, if version updates are correct, this is useless beyond base tables
    # and to-manys. TODO: Do just that. remove it. sorts asc. using sort, the optimized 
    # dataset construction takes place.
    'id': (lambda field_spec: field_spec.table.idField, 1),
    # version control gets added here. no sort.
    'version': (lambda field_spec: field_spec.table.get_field('version'), None),
    # ordernumber. no sort (actually adding a sort here is useless)
    'order': (_get_nested_order, 0)
}

class BatchEditFieldPack(NamedTuple):
    field: Optional[QueryField] = None
    idx: Optional[int] = None
    value: Any = None # stricten this?

class BatchEditPack(NamedTuple):
    id: BatchEditFieldPack
    order: Optional[BatchEditFieldPack] = None
    version: Optional[BatchEditFieldPack] = None

    # extends a path to contain the last field + for a defined fields
    @staticmethod
    def from_field_spec(field_spec: QueryFieldSpec) -> 'BatchEditPack':
        # don't care about which way. bad things will happen if not sorted. 
        # not using assert () since it can be optimised out.
        if ( batch_edit_fields['id'][1] == 0 or batch_edit_fields['order'][1] == 0 ): raise Exception("the ID field should always be sorted!")
        extend_callback = lambda field: field_spec._replace(join_path=(*field_spec.join_path, field), date_part=None)
        new_field_specs = {
            key: Func.maybe(Func.maybe(
                callback(field_spec), 
                extend_callback
            ),
            lambda field_spec: BatchEditFieldPack(field=BatchEditPack._query_field(field_spec, sort_type))
            )
            for key, (callback, sort_type) in batch_edit_fields.items()
        }
        return BatchEditPack(**new_field_specs)

    # a basic query field spec to field
    @staticmethod
    def _query_field(field_spec: QueryFieldSpec, sort_type: int):
        return QueryField(
            fieldspec=field_spec,
            op_num=8,
            value=None,
            negate=False,
            display=True,
            format_name=None,
            sort_type=sort_type
        )
    
    def _index(
            self, 
            start_idx: int, 
            current: Tuple[Dict[str, Optional[BatchEditFieldPack]], List[BatchEditFieldPack]], 
            next: Tuple[int, Tuple[str, Tuple[MaybeField, int]]]):
        current_dict, fields = current
        field_idx, (field_name, _) = next
        value: Optional[BatchEditFieldPack] = getattr(self, field_name)
        new_dict = {**current_dict, field_name: None if value is None else value._replace(idx=(field_idx + start_idx))}
        new_fields = fields if value is None else [*fields, value.field]
        return new_dict, new_fields

        
    def index_plan(self, start_index=0) -> Tuple['BatchEditPack', List[BatchEditFieldPack]]:
        _dict, fields = reduce(
            lambda accum, next: self._index(start_idx=start_index, current=accum, next=next),
            enumerate(batch_edit_fields.items()), 
            ({}, [])
            )
        return BatchEditPack(**_dict), fields
    
    def bind(self, row: Tuple[Any]):
        return BatchEditPack(**{
            key: Func.maybe(
                    getattr(self, key), 
                    lambda pack: pack._replace(value=row[pack.idx])) for key in batch_edit_fields.keys()
            })
    


# FUTURE: this already supports nested-to-many for most part
# wb plan, but contains query fields along with indexes to look-up in a result row.
# TODO: see if it can be moved + combined with front-end logic. I kept all parsing on backend, but there might be possible beneft in doing this
# on the frontend (it already has code from mapping path -> upload plan)
class RowPlanMap(NamedTuple):
    columns: List[BatchEditFieldPack] = []
    to_one: Dict[str, 'RowPlanMap'] = {}
    to_many: Dict[str, 'RowPlanMap'] = {}
    batch_edit_pack: Optional[BatchEditPack] = None

    @staticmethod
    def _merge(current: Dict[str, 'RowPlanMap'], other: Tuple[str, 'RowPlanMap']) -> Dict[str, 'RowPlanMap']:
        key, other_plan = other
        return {
            **current, 
            # merge if other is also found in ours
            key: other_plan if key not in current else current[key].merge(other_plan)
            }
    
    # takes two row plans, combines them together
    def merge(self: 'RowPlanMap', other: 'RowPlanMap') -> 'RowPlanMap':
        new_columns = [*self.columns, *other.columns]
        batch_edit_pack = self.batch_edit_pack or other.batch_edit_pack
        to_one = reduce(RowPlanMap._merge, other.to_one.items(), self.to_one)
        to_many = reduce(RowPlanMap._merge, other.to_many.items(), self.to_many)
        return RowPlanMap(new_columns, to_one, to_many, batch_edit_pack)
    
    def _index(current: Tuple[int, Dict[str, 'RowPlanMap'], List[BatchEditFieldPack]], other: Tuple[str, 'RowPlanMap']):
        next_start_index = current[0]
        other_indexed, fields = other[1].index_plan(start_index=next_start_index)
        to_return = ((next_start_index + len(fields)), {**current[1], other[0]: other_indexed}, [*current[2], *fields])
        return to_return
    
    # to make things simpler, returns the QueryFields along with indexed plan, which are expected to be used together
    def index_plan(self, start_index=0) -> Tuple['RowPlanMap', List[BatchEditFieldPack]]:
        next_index = len(self.columns) + start_index
        _columns = [column._replace(idx=index) for index, column in zip(range(start_index, next_index), self.columns)]
        next_index, _to_one, fields = reduce(
            RowPlanMap._index, 
            # makes the order deterministic, would be funny otherwise
            sorted(self.to_one.items(), key=lambda x: x[0]), 
            (next_index, {}, self.columns))
        next_index, _to_many, fields = reduce(RowPlanMap._index, sorted(self.to_many.items(), key=lambda x: x[0]), (next_index, {}, fields))
        _batch_indexed, _batch_fields = self.batch_edit_pack.index_plan(start_index=next_index) if self.batch_edit_pack else (None, [])
        return (RowPlanMap(columns=_columns, to_one=_to_one, to_many=_to_many, batch_edit_pack=_batch_indexed), [*fields, *_batch_fields])

    @staticmethod
    # helper for generating an row plan for a single query field
    # handles formatted/aggregated self or relationships correctly (places them in upload-plan at correct level)
    def _recur_row_plan(
            running_path: FieldSpecJoinPath, 
            next_path: FieldSpecJoinPath,
            next_table: Table, # bc queryfieldspecs will be terminated early on 
            original_field: QueryField) -> 'RowPlanMap':
        
        original_field_spec = original_field.fieldspec

        # contains partial path
        partial_field_spec = original_field_spec._replace(join_path=running_path, table=next_table)
        node, *rest = (None,) if not next_path else next_path # to handle CO (formatted)

        # we can't edit relationships's formatted/aggregated anyways.
        batch_edit_pack = None if original_field_spec.needs_formatted() else BatchEditPack.from_field_spec(partial_field_spec)

        if node is None or not node.is_relationship:
            # we are at the end
            return RowPlanMap(columns=[BatchEditFieldPack(field=original_field)], batch_edit_pack=batch_edit_pack)

        rel_type = 'to_one' if node.type.endswith('to-one') else 'to_many'
        return RowPlanMap(
            **{rel_type: {
                node.name: RowPlanMap._recur_row_plan(
                    (*running_path, node),
                    rest,
                    datamodel.get_table(node.relatedModelName),
                    original_field
                    )
                },
                'batch_edit_pack': batch_edit_pack
                }
        )
    
    # generates multiple row plan maps, and merges them into one
    # this doesn't index the row plan, bc that is complicated.
    # instead, see usage of index_plan() which indexes the plan in one go.
    @staticmethod
    def get_row_plan(fields: List[QueryField]) -> 'RowPlanMap':
        iter = [
            RowPlanMap._recur_row_plan((), field.fieldspec.join_path, field.fieldspec.root_table, field) 
            for field in fields
            ]
        return reduce(lambda current, other: current.merge(other), iter, RowPlanMap())

    def bind(self, row: Tuple[Any]) -> 'RowPlanCanonical':
        columns = [column._replace(value=row[column.idx], field=None) for column in self.columns]
        to_ones = {key: value.bind(row) for (key, value) in self.to_one.items()}
        to_many = {
            key: [value.bind(row)]
            for (key, value) in self.to_many.items()
            }
        pack = self.batch_edit_pack.bind(row) if self.batch_edit_pack else None
        return RowPlanCanonical(columns, to_ones, to_many, pack)
    
    # gets a null record to fill-out empty space
    # doesn't support nested-to-many's yet - complicated
    def nullify(self) -> 'RowPlanCanonical':
        columns = [pack._replace(value=None, idx=None) for pack in self.columns]
        to_ones = {key: value.nullify() for (key, value) in self.to_one.items()}
        return RowPlanCanonical(columns, to_ones) 

    # a fake upload plan that keeps track of the maximum ids / order numbrs seen in to-manys
    def to_many_planner(self) -> 'RowPlanMap':
        to_one = {key: value.to_many_planner() for (key, value) in self.to_one.items()}
        to_many = {
            key: RowPlanMap(
                batch_edit_pack=BatchEditPack(order=BatchEditFieldPack(value=0), id=BatchEditFieldPack()) 
                if value.batch_edit_pack.order 
                # only use id if order field is not present
                else BatchEditPack(id=BatchEditFieldPack(value=0))) for (key, value) in self.to_many.items()
            }
        return RowPlanMap(to_one=to_one, to_many=to_many)

# the main data-structure which stores the data
# RowPlanMap is just a map, this stores actual data (to many is a dict of list, rather than just a dict)
# maybe unify that with RowPlanMap?
class RowPlanCanonical(NamedTuple):
    columns: List[BatchEditFieldPack] = []
    to_one: Dict[str, 'RowPlanCanonical'] = {}
    to_many: Dict[str, List[Optional['RowPlanCanonical']]] = {}
    batch_edit_pack: Optional[BatchEditPack] = None

    @staticmethod
    def _maybe_extend(values: List[Optional['RowPlanCanonical']], result:Tuple[bool, 'RowPlanCanonical'] ):
        is_new = result[0]
        new_values = (is_new, [*values, result[1]] if is_new else values)
        return new_values

    # FUTURE: already handles nested to-many.
    def merge(self, row: Tuple[Any], indexed_plan: RowPlanMap) -> Tuple[bool, 'RowPlanCanonical']:
        # nothing to compare against. useful for recursion + handing default null as default value for reduce
        if self.batch_edit_pack is None:
            return True, indexed_plan.bind(row)
        
        # trying to defer actual bind to later
        batch_fields = indexed_plan.batch_edit_pack.bind(row)
        if batch_fields.id.value != self.batch_edit_pack.id.value:
            # if the id itself is different, we are on a different record. just bind and return
            return True, indexed_plan.bind(row)

        # now, ids are the same. no reason to bind other's to one. 
        # however, still need to handle to-manys inside to-ones (this will happen when a row gets duplicated due to to-many)
        # in that case, to-one wouldn't change. but, need to recur down till either new to-many gets found or we are in a dup chain.
        # don't need a new flag here. why?
        to_one = {
            key: value.merge(row, indexed_plan.to_one.get(key))[1]
            for (key, value) in self.to_one.items()
        }

        to_many_packed = [
            (key, (True, [indexed_plan.to_many.get(key).bind(row)])
            if test_case(len(value) == 0)
            # tricky. basically, if the value is absolutely new, then only extend.
            # since ids are already sorted, we don't care about matching to any-other record.
            # but we still need to possibly merge due to nested to-manys
            # NOW: If it causes performance problems, simply make the subsequent merge no-op since we don't handle nested-to-many's anywhere else
            else RowPlanCanonical._maybe_extend(value, (value[-1].merge(row, indexed_plan.to_many.get(key)))))
            for (key, value) in self.to_many.items()
        ]

        to_many_new = any(results[1][0] for results in to_many_packed)
        if to_many_new:
            # a "meh" optimization
            to_many = {
                key: values
                for (key, (_, values)) in to_many_packed
            }
        else:
            to_many = self.to_many
    
        # TODO: explain why those arguments
        return to_many_new, RowPlanCanonical(
            self.columns,
            to_one,
            to_many,
            self.batch_edit_pack
            )

    @staticmethod
    def _update_id_order(values: List['RowPlanCanonical'], plan: RowPlanMap):
        is_id = plan.batch_edit_pack.order is None
        new_value = len(values) if is_id else max([value.batch_edit_pack.order.value for value in values])
        current_value =  plan.batch_edit_pack.order.value if not is_id else plan.batch_edit_pack.id.value
        return RowPlanMap(batch_edit_pack=plan.batch_edit_pack._replace(**{('id' if is_id else 'order'): BatchEditFieldPack(value=max(new_value, current_value))}))
    
    # as we iterate through rows, need to update the to-many stats (number of ids or maximum order we saw)
    # this is done to expand the rows at the end
    def update_to_manys(self, to_many_planner: RowPlanMap) -> RowPlanMap:
        to_one = {key: value.update_to_manys(to_many_planner.to_one.get(key)) for (key, value) in self.to_one.items()}
        to_many = {key: RowPlanCanonical._update_id_order(values, to_many_planner.to_many.get(key)) for key, values in self.to_many.items()}
        return RowPlanMap(to_one=to_one, to_many=to_many)
    
    @staticmethod
    def _extend_id_order(values: List['RowPlanCanonical'], to_many_planner: RowPlanMap, indexed_plan: RowPlanMap) ->  List['RowPlanCanonical']:
        is_id = to_many_planner.batch_edit_pack.order is None
        fill_out = None
        # minor memoization, hehe
        null_record = indexed_plan.nullify()
        if not is_id: # if order is present, things are more complex
            max_order = max([value.batch_edit_pack.order.value for value in values])
            # this might be useless
            assert len(set([value.batch_edit_pack.order.value for value in values])) == len(values)
            # fill-in before, out happens later anyways
            fill_in_range = range(min(max_order, to_many_planner.batch_edit_pack.order.value)+1)
            for fill_in in fill_in_range:
                _test = next(filter(lambda pack: pack.batch_edit_pack.order.value == fill_in, values), null_record)
            # TODO: this is generic and doesn't assume items aren't sorted by order. maybe we can optimize, knowing that.
            filled_in = [next(filter(lambda pack: pack.batch_edit_pack.order.value == fill_in, values), null_record) for fill_in in fill_in_range]
            values = filled_in
            fill_out = to_many_planner.batch_edit_pack.order.value - max_order
            
        if fill_out is None:
            fill_out = to_many_planner.batch_edit_pack.id - len(values)
        
        assert fill_out >= 0, "filling out in opposite directon!"
        rest = range(fill_out)
        values = [*values, *(null_record for _ in rest)]
        return values

    def extend(self, to_many_planner: RowPlanMap, plan: RowPlanMap) -> 'RowPlanCanonical':
        to_ones = {key: value.extend(to_many_planner.to_one.get(key), plan.to_one.get(key)) for (key, value) in self.to_one.items()}
        to_many = {key: RowPlanCanonical._extend_id_order(values, to_many_planner.to_many.get(key), plan.to_many.get(key)) for (key, values) in self.to_many.items()}
        return self._replace(to_one=to_ones, to_many=to_many)

import time
def run_batch_edit(collection, user, spquery):
    """
    start = time.perf_counter()
    limit = 20
    offset = 0
    tableid = spquery['contexttableid']
    fields = fields_from_json(spquery['fields'])
    #_plan = RowPlanMap.get_row_plan([field for field in fields if field.display])
    #indexed, fields = plan.index_plan()
    #non_display_fields = [field for field in fields if not field.field.display]
    #all_fields = [*fields, *non_display_fields]
    ss = time.perf_counter()
    """
    plan = RowPlanMap(
        columns=[BatchEditFieldPack(field=None, idx=0)],
        to_one={},
        to_many={
            'random': RowPlanMap(
                columns=[BatchEditFieldPack(field=None, idx=2)],
                batch_edit_pack=BatchEditPack(
                    id=BatchEditFieldPack(idx=3, value=None),
                    order=BatchEditFieldPack(idx=4, value=None)
                    )
            )
        },
        batch_edit_pack=BatchEditPack(id=BatchEditFieldPack(idx=1, value=None))
        )

    """
    with models.session_context() as session:
        rows = execute(
            session, collection, user, tableid, True, False, all_fields, limit, offset, None, False 
        )
    """
    print(plan)
    rows = [
        ("sme value 1", 1, 'nested to many 1', 2, 0),
        ("sme value 1", 1, 'nested to many 2', 3, 2),
        ("sme value 1", 1, 'nested to many 3', 42, 8),
    ]
    row1 = RowPlanCanonical()
    to_many_planner = plan.to_many_planner()
    for row in rows:
        new, row1 = row1.merge(row, plan)
        to_many_planner = row1.update_to_manys(to_many_planner)
        print(new, row1)
        print("sssssssssssssssssssssssssssssssssssssssssssssssssssssssssss")
        print(to_many_planner)
        print("sssssssssssssssssssssssssssssssssssssssssssssssssssssssssss")
    print(row1)
    print(len(row1.extend(to_many_planner, plan).to_many['random']))



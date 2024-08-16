from functools import reduce
from typing import Any, Callable, Dict, List, NamedTuple, Optional, Tuple, TypeVar
from specifyweb.specify.models import datamodel
from specifyweb.specify.load_datamodel import Field, Table
from specifyweb.stored_queries.execution import execute
from specifyweb.stored_queries.queryfield import QueryField, fields_from_json
from specifyweb.stored_queries.queryfieldspec import FieldSpecJoinPath, QueryFieldSpec, TreeRankQuery
from specifyweb.workbench.models import Spdataset
from specifyweb.workbench.upload.treerecord import TreeRecord
from specifyweb.workbench.upload.upload_plan_schema import parse_column_options
from specifyweb.workbench.upload.upload_table import UploadTable
from specifyweb.workbench.upload.uploadable import NULL_RECORD, Uploadable
from specifyweb.workbench.views import regularize_rows
from specifyweb.specify.func import Func
from . import models

from django.db import transaction

    
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
    'version': (lambda field_spec: field_spec.table.get_field('version'), 0),
    # ordernumber. no sort (actually adding a sort here is useless)
    'order': (_get_nested_order, 1)
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
            key: Func.maybe(
                Func.maybe(callback(field_spec), extend_callback),
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
            current: Tuple[Dict[str, Optional[BatchEditFieldPack]], List[QueryField]], 
            next: Tuple[int, Tuple[str, Tuple[MaybeField, int]]]):
        current_dict, fields = current
        field_idx, (field_name, _) = next
        value: Optional[BatchEditFieldPack] = getattr(self, field_name)
        new_dict = {**current_dict, field_name: None if value is None else value._replace(idx=(field_idx + start_idx))}
        new_fields = fields if value is None else [*fields, value.field]
        return new_dict, new_fields

        
    def index_plan(self, start_index=0) -> Tuple['BatchEditPack', List[QueryField]]:
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
    
    def to_json(self) -> Dict[str, Any]:
        return {
            'id': self.id.value,
            'ordernumber': self.order.value if self.order is not None else None,
            'version': self.version.value if self.version is not None else None
        }
    
    # we not only care that it is part of tree, but also care that there is rank to tree
    def is_part_of_tree(self, query_fields: List[QueryField]) -> bool:
        if self.id is None or self.id.idx is None:
            return False
        id_field = self.id.idx
        field = query_fields[id_field - 1]
        join_path = field.fieldspec.join_path
        if len(join_path) < 2:
            return False
        return isinstance(join_path[-2], TreeRankQuery)
        
    
# FUTURE: this already supports nested-to-many for most part
# wb plan, but contains query fields along with indexes to look-up in a result row.
# TODO: see if it can be moved + combined with front-end logic. I kept all parsing on backend, but there might be possible beneft in doing this
# on the frontend (it already has code from mapping path -> upload plan)
class RowPlanMap(NamedTuple):
    columns: List[BatchEditFieldPack] = []
    to_one: Dict[str, 'RowPlanMap'] = {}
    to_many: Dict[str, 'RowPlanMap'] = {}
    batch_edit_pack: Optional[BatchEditPack] = None
    has_filters: bool = True

    @staticmethod
    def _merge(has_filters: bool):
        def _merger(current: Dict[str, 'RowPlanMap'], other: Tuple[str, 'RowPlanMap']) -> Dict[str, 'RowPlanMap']:
            key, other_plan = other
            return {
                **current, 
                # merge if other is also found in ours
                key: other_plan if key not in current else current[key].merge(other_plan, has_filter_on_parent=has_filters)
                }
        return _merger
    
    # takes two row plans, combines them together. Adjusts has_filters.
    def merge(self: 'RowPlanMap', other: 'RowPlanMap', has_filter_on_parent=False) -> 'RowPlanMap':
        new_columns = [*self.columns, *other.columns]
        batch_edit_pack = self.batch_edit_pack or other.batch_edit_pack
        has_self_filters = has_filter_on_parent or self.has_filters or other.has_filters
        to_one = reduce(RowPlanMap._merge(has_self_filters), other.to_one.items(), self.to_one)
        to_many = reduce(RowPlanMap._merge(False), other.to_many.items(), self.to_many)
        return RowPlanMap(new_columns, to_one, to_many, batch_edit_pack, has_filters=has_self_filters)
    
    def _index(current: Tuple[int, Dict[str, 'RowPlanMap'], List[QueryField]], other: Tuple[str, 'RowPlanMap']):
        next_start_index = current[0]
        other_indexed, fields = other[1].index_plan(start_index=next_start_index)
        to_return = ((next_start_index + len(fields)), {**current[1], other[0]: other_indexed}, [*current[2], *fields])
        return to_return
    
    # to make things simpler, returns the QueryFields along with indexed plan, which are expected to be used together
    def index_plan(self, start_index=1) -> Tuple['RowPlanMap', List[QueryField]]:
        next_index = len(self.columns) + start_index
        # For optimization, and sanity, we remove the field from columns, as they are now completely redundant (we always know what they are using the id)
        _columns = [column._replace(idx=index, field=None) for index, column in zip(range(start_index, next_index), self.columns)]
        _batch_indexed, _batch_fields = self.batch_edit_pack.index_plan(start_index=next_index) if self.batch_edit_pack else (None, [])
        next_index += len(_batch_fields)
        next_index, _to_one, to_one_fields = reduce(
            RowPlanMap._index, 
            # makes the order deterministic, would be funny otherwise
            Func.sort_by_key(self.to_one),
            (next_index, {}, []))
        next_index, _to_many, to_many_fields = reduce(RowPlanMap._index, Func.sort_by_key(self.to_many), (next_index, {}, []))
        column_fields = [column.field for column in self.columns]
        return (RowPlanMap(columns=_columns, to_one=_to_one, to_many=_to_many, batch_edit_pack=_batch_indexed, has_filters=self.has_filters), [*column_fields, *_batch_fields, *to_one_fields, *to_many_fields])

    # helper for generating an row plan for a single query field
    # handles formatted/aggregated self or relationships correctly (places them in upload-plan at correct level)
    # it's complicated to place aggregated within the to-many table. but, since we don't map it to anything, we equivalently place it
    # on the penultimate table's column. that is, say collectingevent -> collectors (aggregated). Semantically, (aggregated) should be on
    # on the colletors table (as a column). Instead, we put it as a column in collectingevent. This has no visual difference (it is unmapped) anyways.
    @staticmethod
    def _recur_row_plan(
            running_path: FieldSpecJoinPath, 
            next_path: FieldSpecJoinPath,
            next_table: Table, # bc queryfieldspecs will be terminated early on 
            original_field: QueryField,
            ) -> 'RowPlanMap':
        
        original_field_spec = original_field.fieldspec

        # contains partial path
        partial_field_spec = original_field_spec._replace(join_path=running_path, table=next_table)

        # to handle CO->(formatted), that's it. this function will never be called with empty path other than top-level formatted/aggregated
        node, *rest = (None,) if not next_path else next_path

        # we can't edit relationships's formatted/aggregated anyways.
        batch_edit_pack = None if original_field_spec.needs_formatted() else BatchEditPack.from_field_spec(partial_field_spec)

        if node is None or (len(rest) == 0):
            # we are at the end
            return RowPlanMap(columns=[BatchEditFieldPack(field=original_field)], batch_edit_pack=batch_edit_pack, has_filters=(original_field.op_num != 8))
        
        assert node.is_relationship, "using a non-relationship as a pass through!"

        rel_type = 'to_many' if node.type.endswith('to-many') or node.type == 'zero-to-one' else 'to_one'

        rel_name = node.name.lower() if not isinstance(node, TreeRankQuery) else node.name
        return RowPlanMap(
            **{rel_type: {
                rel_name: RowPlanMap._recur_row_plan(
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
        return reduce(lambda current, other: current.merge(
            other, 
            has_filter_on_parent=False
            ), iter, RowPlanMap())

    @staticmethod
    def _bind_null(value: 'RowPlanCanonical') -> List['RowPlanCanonical']:
        if value.batch_edit_pack.id.value is None:
            return []
        return [value]
    
    def bind(self, row: Tuple[Any]) -> 'RowPlanCanonical':
        columns = [column._replace(value=row[column.idx], field=None) for column in self.columns]
        to_ones = {key: value.bind(row) for (key, value) in self.to_one.items()}
        to_many = {
            key: RowPlanMap._bind_null(value.bind(row))
            for (key, value) in self.to_many.items()
            }
        pack = self.batch_edit_pack.bind(row) if self.batch_edit_pack else None
        return RowPlanCanonical(columns, to_ones, to_many, pack)
    
    # gets a null record to fill-out empty space
    # doesn't support nested-to-many's yet - complicated
    def nullify(self) -> 'RowPlanCanonical':
        columns = [pack._replace(value='(Not included in results)' if self.has_filters else None) for pack in self.columns]
        to_ones = {key: value.nullify() for (key, value) in self.to_one.items()}
        batch_edit_pack = BatchEditPack(id=BatchEditFieldPack(value=NULL_RECORD)) if self.has_filters else None
        return RowPlanCanonical(columns, to_ones, batch_edit_pack=batch_edit_pack) 

    # a fake upload plan that keeps track of the maximum ids / ord  er numbrs seen in to-manys
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
    def _maybe_extend(values: List[Optional['RowPlanCanonical']], result:Tuple[bool, 'RowPlanCanonical']):
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

        # the most tricky lines in this file
        def _reduce_to_many(accum: Tuple[int, List[Tuple[str, bool, List['RowPlanCanonical']]]], current: Tuple[str, List[RowPlanCanonical]]):
            key, values = current
            previous_length, previous_chain = accum
            stalled = (previous_length > 1) or len(values) == 0
            is_new, new_values = (False, values) if stalled else RowPlanCanonical._maybe_extend(values, values[-1].merge(row, indexed_plan.to_many.get(key)))
            return (max(len(new_values), previous_length), [*previous_chain, (key, is_new, new_values)])
        
        _, to_many_result = reduce(_reduce_to_many, self.to_many.items(), (0, []))

        to_many_new = any(results[1] for results in to_many_result)
        if to_many_new:
            # a "meh" optimization
            to_many = {
                key: values
                for (key, _, values) in to_many_result
            }
        else:
            to_many = self.to_many
    
        # TODO: explain why those arguments
        return False, RowPlanCanonical(
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
            # TODO: this is generic and doesn't assume items aren't sorted by order. maybe we can optimize, knowing that.
            filled_in = [next(filter(lambda pack: pack.batch_edit_pack.order.value == fill_in, values), null_record) for fill_in in fill_in_range]
            values = filled_in
            fill_out = to_many_planner.batch_edit_pack.order.value - max_order
            
        if fill_out is None:
            fill_out = to_many_planner.batch_edit_pack.id.value - len(values)
        
        assert fill_out >= 0, "filling out in opposite directon!"
        rest = range(fill_out)
        values = [*values, *(null_record for _ in rest)]
        return values

    def extend(self, to_many_planner: RowPlanMap, plan: RowPlanMap) -> 'RowPlanCanonical':
        to_ones = {key: value.extend(to_many_planner.to_one.get(key), plan.to_one.get(key)) for (key, value) in self.to_one.items()}
        to_many = {key: RowPlanCanonical._extend_id_order(values, to_many_planner.to_many.get(key), plan.to_many.get(key)) for (key, values) in self.to_many.items()}
        return self._replace(to_one=to_ones, to_many=to_many)

    @staticmethod
    def _make_to_one_flat(callback: Callable[[str, Func.I], Func.O]):
        def _flat(accum: Tuple[List[Any], Dict[str, Func.O]], current: Tuple[str, Func.I]):
            to_one_fields, to_one_pack = callback(*current)
            return [*accum[0], *to_one_fields], {**accum[1], current[0]: to_one_pack}
        return _flat
    
    @staticmethod
    def _make_to_many_flat(callback: Callable[[str, Func.I], Func.O]):
        def _flat(accum: Tuple[List[Any], Dict[str, Any]], current: Tuple[str, List['RowPlanCanonical']]):
            rel_name, to_many = current
            to_many_flattened = [callback(rel_name, canonical) for canonical in to_many]
            row_data = [cell for row in to_many_flattened for cell in row[0]]
            to_many_pack = [cell[1] for cell in to_many_flattened]
            return [*accum[0], *row_data], {**accum[1], rel_name: to_many_pack}
        return _flat
    
    def flatten(self) -> Tuple[List[Any], Dict[str, Any]]:
        cols = [col.value for col in self.columns]
        base_pack = self.batch_edit_pack.to_json() if self.batch_edit_pack is not None else None
        def _flatten(_: str, _self: 'RowPlanCanonical'):
            return _self.flatten()
        _to_one_reducer = RowPlanCanonical._make_to_one_flat(_flatten)
        _to_many_reducer = RowPlanCanonical._make_to_many_flat(_flatten)
        to_ones = reduce(_to_one_reducer, Func.sort_by_key(self.to_one), ([], {}))
        to_many = reduce(_to_many_reducer, Func.sort_by_key(self.to_many), ([], {}))
        all_data = [*cols, *to_ones[0], *to_many[0]]
        return all_data, {'self': base_pack, 'to_one': to_ones[1], 'to_many': to_many[1]} if base_pack else None

    def to_upload_plan(self, base_table: Table, localization_dump: Dict[str, str], query_fields: List[QueryField], fields_added: Dict[str, int], get_column_id: Callable[[str], int]) -> Tuple[List[Tuple[Tuple[int, int], str]], Uploadable]:
        # Yuk, finally. 
        
        # Whether we are something like [det-> (T -- what we are) -> tree]
        intermediary_to_tree = any(canonical.batch_edit_pack is not None and canonical.batch_edit_pack.is_part_of_tree(query_fields) for canonical in self.to_one.values())

        def _lookup_in_fields(_id: Optional[int]):
            assert _id is not None, "invalid lookup used!"
            field = query_fields[_id - 1] # Need to go off by 1, bc we added 1 to account for distinct
            string_id = field.fieldspec.to_stringid()
            localized_label = localization_dump.get(string_id, naive_field_format(field.fieldspec))
            fields_added[localized_label] = fields_added.get(localized_label, 0) + 1
            _count = fields_added[localized_label]
            if _count > 1:
                localized_label += f' #{_count}'
            fieldspec = field.fieldspec
            is_null = fieldspec.needs_formatted() or intermediary_to_tree or (fieldspec.is_temporal() and fieldspec.date_part != 'Full Date') or fieldspec.get_field().name.lower() == 'fullname'
            id_in_original_fields = get_column_id(string_id)
            # bc we can't edit formatted and others. we also can't have intermediary-to-trees as editable...
            return (id_in_original_fields, _count), (None if is_null else fieldspec.get_field().name.lower()), localized_label
        
        key_and_fields_and_headers = [_lookup_in_fields(column.idx) for column in self.columns]

        wb_cols = {
            key: parse_column_options(value)
            for _, key, value in key_and_fields_and_headers
            if key is not None # will happen for formatters/aggregators
        }

        def _to_upload_plan(rel_name: str, _self: 'RowPlanCanonical'):
            related_model = base_table if intermediary_to_tree else datamodel.get_table_strict(base_table.get_relationship(rel_name).relatedModelName)
            return _self.to_upload_plan(related_model, localization_dump, query_fields, fields_added, get_column_id)
        
        _to_one_reducer = RowPlanCanonical._make_to_one_flat(_to_upload_plan)
        _to_many_reducer = RowPlanCanonical._make_to_many_flat(_to_upload_plan)

        to_one_headers, to_one_upload_tables = reduce(_to_one_reducer, Func.sort_by_key(self.to_one), ([], {}))
        to_many_headers, to_many_upload_tables = reduce(_to_many_reducer, Func.sort_by_key(self.to_many), ([], {}))

        raw_headers = [(key, header) for (key, __, header) in key_and_fields_and_headers]
        all_headers = [*raw_headers, *to_one_headers, *to_many_headers]

        if intermediary_to_tree:
            assert len(to_many_upload_tables) == 0, "Found to-many for tree!"
            upload_plan = TreeRecord(
                name=base_table.django_name,
                ranks={
                    key: upload_table.wbcols
                    for (key, upload_table)
                    in to_one_upload_tables.items()
                    }
                )
        else:
            upload_plan = UploadTable(
            name=base_table.django_name,
            overrideScope=None,
            wbcols=wb_cols,
            static={},
            toOne=to_one_upload_tables,
            toMany=to_many_upload_tables
        )
            
        return all_headers, upload_plan
        
# TODO: This really only belongs on the front-end.
# Using this as a last resort to show fields
def naive_field_format(fieldspec: QueryFieldSpec):
    field = fieldspec.get_field()
    if field is None:
        return f"{fieldspec.table.name} (formatted)"
    if field.is_relationship:
        return f"{fieldspec.table.name} ({'formatted' if field.type.endswith('to-one') else 'aggregatd'})"
    return f"{fieldspec.table.name} {field.name}"
    
import json
def run_batch_edit(collection, user, spquery, agent):

    offset = 0
    tableid = int(spquery['contexttableid'])
    captions = spquery['captions']
    limit = int(spquery['limit'])

    recordsetid = spquery.get('recordsetid', None)
    fields = fields_from_json(spquery['fields'])

    visible_fields = [field for field in fields if field.display]

    assert len(visible_fields) == len(captions), "Got misaligned captions!"

    localization_dump: Dict[str, str] = {
        # we cannot use numbers since they can very off
        field.fieldspec.to_stringid(): caption 
        for field, caption in zip(visible_fields, captions)
    }

    row_plan = RowPlanMap.get_row_plan(visible_fields)

    indexed, query_fields = row_plan.index_plan()
    
    # we don't really care about these fields, since we'have already done the numbering (and it won't break with 
    # more fields). We also don't caree about their sort, since their sort is guaranteed to be after ours
    query_with_hidden = [*query_fields, *[field for field in fields if not field.display]]

    with models.session_context() as session:
        rows = execute(
            session, collection, user, tableid, True, False, query_with_hidden, limit, offset, True, recordsetid, False
        )
    
    current_row = None
    to_many_planner = indexed.to_many_planner()

    visited_rows: List[RowPlanCanonical] = []
    row_to_commit = RowPlanCanonical()
    for row in rows['results']:
        is_new, current_row = row_to_commit.merge(row, indexed)
        to_many_planner = current_row.update_to_manys(to_many_planner)
        if is_new:
            visited_rows.append(row_to_commit)
        row_to_commit = current_row

    # The very last row will not have anybody to commit by, so we need to add it.
    # At this point though, we _know_ we need to commit it
    visited_rows.append(row_to_commit) 

    visited_rows = visited_rows[1:]
    assert len(visited_rows) > 0, "nothing to return!"

    raw_rows: List[RowPlanCanonical]  = []
    for visited_row in visited_rows:
        extend_row = visited_row.extend(to_many_planner, indexed)
        row_data, row_batch_edit_pack = extend_row.flatten()
        row_data = [*row_data, json.dumps({'batch_edit': row_batch_edit_pack})]
        raw_rows.append(row_data)
    
    assert len(set([len(raw_row) for raw_row in raw_rows])) == 1, "Made irregular rows somewhere!"

    def _get_orig_column(string_id: str):
        return next(filter(lambda field: field[1].fieldspec.to_stringid() == string_id, enumerate(visible_fields)))[0]
    
    # The keys are lookups into original query field (not modified by us). Used to get ids in the original one.
    key_and_headers, upload_plan = extend_row.to_upload_plan(datamodel.get_table_by_id(tableid), localization_dump, query_fields, {}, _get_orig_column)

    headers_enumerated = enumerate(key_and_headers)

    visual_order = [_id for (_id, _) in sorted(headers_enumerated, key=lambda tup: tup[1])]

    headers = [header for (_, header) in key_and_headers]

    regularized_rows = regularize_rows(len(headers), raw_rows)

    json_upload_plan = upload_plan.unparse()

    # We are _finally_ ready to make a new dataset
    
    with transaction.atomic():
        ds = Spdataset.objects.create(
            specifyuser=user,
            collection=collection,
            name=spquery['name'],
            columns=headers,
            data=regularized_rows,
            importedfilename=spquery['name'],
            createdbyagent=agent,
            modifiedbyagent=agent,
            uploadplan=json.dumps(json_upload_plan),
            visualorder=visual_order,
            isupdate=True
        )
    
    ds_id, ds_name = (ds.id, ds.name)
    ds.id = None
    ds.name = f"Backs - {ds.name}"
    ds.parent_id = ds_id
    # Create the backer.
    ds.save()
    return (ds_id, ds_name)
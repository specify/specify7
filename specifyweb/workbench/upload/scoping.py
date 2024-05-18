from typing import Dict, Any, Optional, Tuple, Callable, Union

from specifyweb.specify.datamodel import datamodel, Table, Relationship
from specifyweb.specify.load_datamodel import DoesNotExistError
from specifyweb.specify import models
from specifyweb.specify.uiformatters import get_uiformatter
from specifyweb.stored_queries.format import get_date_format

from .uploadable import Uploadable, ScopedUploadable
from .upload_table import UploadTable, ScopedUploadTable, OneToOneTable, ScopedOneToOneTable
from .tomany import ToManyRecord, ScopedToManyRecord
from .treerecord import TreeRecord, ScopedTreeRecord
from .column_options import ColumnOptions, ExtendedColumnOptions
from functools import reduce

""" There are cases in which the scoping of records should be dependent on another record/column in a WorkBench dataset.

The DEFERRED_SCOPING dictonary defines the information needed to extract the correct scope to upload/validate a record into.

The structure of DEFERRED_SCOPING is as following:
    The keys are tuples containing the django table name and a relationship that should be scoped. 
    
    The values are tuples containing the table name, field to filter on, and value to pull from that field to use as the collection for the 
    tableName.fieldName in the associated key of DEFERRED_SCOPING

    For example, consider the following the deferred scoping information:
        ("Collectionrelationship", "rightside"): ('collectionreltype', 'name', 'rightsidecollection')

    This information describes the following process to be performed: 
    
    'when uploading the rightside of a Collection Relationship, get the Collection Rel Type in the database from the dataset by 
    filtering Collection Rel Types in the database by name. Then, set the collection of the Collectionrelationship rightside equal to the Collection Rel Type's 
    rightSideCollection' 

    See .upload_plan_schema.py for how this is used

"""
DEFERRED_SCOPING: Dict[Tuple[str, str], Tuple[str, str, str]] = {
    ("Collectionrelationship", "rightside"): ('collectionreltype', 'name', 'rightsidecollection'),
    ("Collectionrelationship", "leftside"): ('collectionreltype', 'name', 'leftsidecollection'),
    }

def scoping_relationships(collection, table: Table) -> Dict[str, int]:
    extra_static: Dict[str, int] = {}

    try:
        table.get_field_strict('collectionmemberid')
        extra_static['collectionmemberid'] = collection.id
    except DoesNotExistError:
        pass

    try:
        table.get_relationship('collection')
        extra_static['collection_id'] = collection.id
    except DoesNotExistError:
        pass

    try:
        table.get_relationship('discipline')
        extra_static['discipline_id'] = collection.discipline.id
    except DoesNotExistError:
        pass

    try:
        table.get_relationship('division')
        extra_static['division_id'] = collection.discipline.division.id
    except DoesNotExistError:
        pass

    try:
        table.get_relationship('institution')
        extra_static['institution_id'] = collection.discipline.division.institution.id
    except DoesNotExistError:
        pass

    return extra_static

AdjustToOnes = Callable[[ScopedUploadable, str], ScopedUploadable]

def _make_one_to_one(fieldname: str, rest: AdjustToOnes) -> AdjustToOnes:
    def adjust_to_ones(u: ScopedUploadable, f: str) -> ScopedUploadable:
        if f == fieldname and isinstance(u, ScopedUploadTable):
            return rest(ScopedOneToOneTable(*u), f)
        else:
            return rest(u, f)
    return adjust_to_ones


def extend_columnoptions(colopts: ColumnOptions, collection, tablename: str, fieldname: str) -> ExtendedColumnOptions:
    schema_items = getattr(models, 'Splocalecontaineritem').objects.filter(
        container__discipline=collection.discipline,
        container__schematype=0,
        container__name=tablename.lower(),
        name=fieldname.lower())

    schemaitem = schema_items and schema_items[0]
    picklistname = schemaitem and schemaitem.picklistname
    picklist_model = getattr(models, 'Picklist')

    if not isinstance(picklistname, str):
        picklist = None
    else:
        picklists = picklist_model.objects.filter(name=picklistname)
        collection_picklists = picklists.filter(collection=collection)
        
        picklist = picklists[0] if len(collection_picklists) == 0 else collection_picklists[0]

    return ExtendedColumnOptions(
        column=colopts.column,
        matchBehavior=colopts.matchBehavior,
        nullAllowed=colopts.nullAllowed,
        default=colopts.default,
        schemaitem=schemaitem,
        uiformatter=get_uiformatter(collection, tablename, fieldname),
        picklist=picklist,
        dateformat=get_date_format(),
    )

def get_deferred_scoping(key, table_name, uploadable, row, base_ut):
    deferred_key  = (table_name, key)
    deferred_scoping = DEFERRED_SCOPING.get(deferred_key, None)

    if deferred_scoping is None:
        return True, uploadable

    if row:
        related_key, filter_field, relationship_name = deferred_scoping
        related_column_name = base_ut.toOne[related_key].wbcols[filter_field].column
        filter_value = row[related_column_name]
        filter_search = {filter_field: filter_value}
        related_table = datamodel.get_table_strict(related_key)
        related = getattr(models, related_table.django_name).objects.get(**filter_search)
        collection_id = getattr(related, relationship_name).id
    else:
        # meh, would just go to the original collection
        collection_id = None

    # don't cache anymore, since values can be dependent on rows.
    return False, uploadable._replace(overrideScope = {'collection': collection_id})

def _apply_scoping_to_uploadtable(table, row, collection, base_ut):
    def _update_uploadtable(previous_pack, current):
        can_cache, previous_to_ones = previous_pack
        field, uploadable = current
        can_cache_this, uploadable = get_deferred_scoping(field, table.django_name, uploadable, row, base_ut)
        can_cache_sub, scoped = uploadable.apply_scoping(collection, row)
        return can_cache and can_cache_this and can_cache_sub, [*previous_to_ones, scoped]
    return _update_uploadtable

def apply_scoping_to_one(ut, collection, row, table):
    adjust_to_ones = to_one_adjustments(collection, table)
    to_ones_items = list(ut.toOne.items())
    can_cache_to_one, to_one_uploadables = reduce(
        _apply_scoping_to_uploadtable(table, row, collection, ut), to_ones_items, (True, [])
    )
    to_ones = {f[0]: adjust_to_ones(u, f[0]) for f, u in zip(to_ones_items, to_one_uploadables)}
    return can_cache_to_one, to_ones

def apply_scoping_to_uploadtable(ut: UploadTable, collection, row=None) -> Tuple[bool, ScopedUploadTable]:
    table = datamodel.get_table_strict(ut.name)
    if ut.overrideScope is not None and isinstance(ut.overrideScope['collection'], int):
        collection = getattr(models, "Collection").objects.filter(id=ut.overrideScope['collection']).get()

    can_cache_to_one, to_ones = apply_scoping_to_one(ut, collection, row, table)
    to_many_results = [
        (f, reduce(_apply_scoping_to_uploadtable(table, row, collection, ut), [(f, r) for r in rs], (True, []))) for ( f, rs) in ut.toMany.items()
    ]

    can_cache_to_many = all(tmr[1][0] for tmr in to_many_results)
    to_many = {
        f: [set_order_number(i, tmr) for i, tmr in enumerate(scoped_tmrs)]
        for f, (_, scoped_tmrs) in to_many_results
    }

    return can_cache_to_many and can_cache_to_one, ScopedUploadTable(
        name=ut.name,
        wbcols={f: extend_columnoptions(colopts, collection, table.name, f) for f, colopts in ut.wbcols.items()},
        static=static_adjustments(table, ut.wbcols, ut.static),
        toOne=to_ones,
        toMany=to_many,
        scopingAttrs=scoping_relationships(collection, table),
        disambiguation=None,
    )

def to_one_adjustments(collection, table: Table) -> AdjustToOnes:
    adjust_to_ones: AdjustToOnes = lambda u, f: u
    if collection.isembeddedcollectingevent and table.name == 'CollectionObject':
        adjust_to_ones = _make_one_to_one('collectingevent', adjust_to_ones)

    elif collection.discipline.ispaleocontextembedded and table.name.lower() == collection.discipline.paleocontextchildtable.lower():
        adjust_to_ones = _make_one_to_one('paleocontext', adjust_to_ones)

    if table.name == 'CollectionObject':
        adjust_to_ones = _make_one_to_one('collectionobjectattribute', adjust_to_ones)
    if table.name == 'CollectingEvent':
        adjust_to_ones = _make_one_to_one('collectingeventattribute', adjust_to_ones)
    if table.name == 'Attachment':
        adjust_to_ones = _make_one_to_one('attachmentimageattribute', adjust_to_ones)
    if table.name == 'CollectingTrip':
        adjust_to_ones = _make_one_to_one('collectingtripattribute', adjust_to_ones)
    if table.name == 'Preparation':
        adjust_to_ones = _make_one_to_one('preparationattribute', adjust_to_ones)

    return adjust_to_ones

def static_adjustments(table: Table, wbcols: Dict[str, ColumnOptions], static: Dict[str, Any]) -> Dict[str, Any]:
    # not sure if this is the right place for this, but it will work for now.
    if table.name == 'Agent' and 'agenttype' not in wbcols and 'agenttype' not in static:
        static = {'agenttype': 1, **static}
    elif table.name == 'Determination' and 'iscurrent' not in wbcols and 'iscurrent' not in static:
        static = {'iscurrent': True, **static}
    else:
        static = static
    return static

def set_order_number(i: int, tmr: ScopedToManyRecord) -> ScopedToManyRecord:
    table = datamodel.get_table_strict(tmr.name)
    if table.get_field('ordernumber'):
        return tmr._replace(scopingAttrs={**tmr.scopingAttrs, 'ordernumber': i})
    return tmr

def apply_scoping_to_tomanyrecord(tmr: ToManyRecord, collection, row) -> Tuple[bool, ScopedToManyRecord]:
    table = datamodel.get_table_strict(tmr.name)

    can_cache_to_one, to_ones = apply_scoping_to_one(tmr, collection, row, table)

    return can_cache_to_one, ScopedToManyRecord(
        name=tmr.name,
        wbcols={f: extend_columnoptions(colopts, collection, table.name, f) for f, colopts in tmr.wbcols.items()},
        static=static_adjustments(table, tmr.wbcols, tmr.static),
        toOne=to_ones,
        scopingAttrs=scoping_relationships(collection, table),
    )

def apply_scoping_to_treerecord(tr: TreeRecord, collection) -> Tuple[bool, ScopedTreeRecord]:
    table = datamodel.get_table_strict(tr.name)

    if table.name == 'Taxon':
        treedef = collection.discipline.taxontreedef

    elif table.name == 'Geography':
        treedef = collection.discipline.geographytreedef

    elif table.name == 'LithoStrat':
        treedef = collection.discipline.lithostrattreedef

    elif table.name == 'GeologicTimePeriod':
        treedef = collection.discipline.geologictimeperiodtreedef

    elif table.name == 'Storage':
        treedef = collection.discipline.division.institution.storagetreedef

    else:
        raise Exception(f'unexpected tree type: {table.name}')

    treedefitems = list(treedef.treedefitems.order_by('rankid'))
    treedef_ranks = [tdi.name for tdi in treedefitems]
    for rank in tr.ranks:
        if rank not in treedef_ranks:
            raise Exception(f'"{rank}" not among {table.name} tree ranks: {treedef_ranks}')

    root = list(getattr(models, table.name.capitalize()).objects.filter(definitionitem=treedefitems[0])[:1]) # assume there is only one

    # don't imagine a use-case for making it non-cachable
    return True, ScopedTreeRecord(
        name=tr.name,
        ranks={r: {f: extend_columnoptions(colopts, collection, table.name, f) for f, colopts in cols.items()} for r, cols in tr.ranks.items()},
        treedef=treedef,
        treedefitems=list(treedef.treedefitems.order_by('rankid')),
        root=root[0] if root else None,
        disambiguation={},
    )

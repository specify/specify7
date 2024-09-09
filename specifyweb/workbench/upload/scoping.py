from typing import Dict, Any, Optional, Tuple, Callable, Union

from specifyweb.specify.datamodel import datamodel, Table, Relationship
from specifyweb.specify.load_datamodel import DoesNotExistError
from specifyweb.specify import models
from specifyweb.specify.uiformatters import get_uiformatter
from specifyweb.stored_queries.format import get_date_format

from .uploadable import Uploadable, ScopedUploadable
from .upload_table import UploadTable, DeferredScopeUploadTable, ScopedUploadTable, OneToOneTable, ScopedOneToOneTable
from .tomany import ToManyRecord, ScopedToManyRecord
from .treerecord import TreeRank, TreeRankRecord, TreeRecord, ScopedTreeRecord
from .column_options import ColumnOptions, ExtendedColumnOptions

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
    schema_items = models.Splocalecontaineritem.objects.filter(
        container__discipline=collection.discipline,
        container__schematype=0,
        container__name=tablename.lower(),
        name=fieldname.lower())

    schemaitem = schema_items and schema_items[0]
    picklistname = schemaitem and schemaitem.picklistname

    if not isinstance(picklistname, str):
        picklist = None
    else:
        picklists = models.Picklist.objects.filter(name=picklistname)
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

def apply_scoping_to_uploadtable(ut: Union[UploadTable, DeferredScopeUploadTable], collection) -> ScopedUploadTable:
    table = datamodel.get_table_strict(ut.name)

    adjust_to_ones = to_one_adjustments(collection, table)
    
    if ut.overrideScope is not None and isinstance(ut.overrideScope['collection'], int):
        collection = models.Collection.objects.filter(id=ut.overrideScope['collection']).get()
    

    return ScopedUploadTable(
        name=ut.name,
        wbcols={f: extend_columnoptions(colopts, collection, table.name, f) for f, colopts in ut.wbcols.items()},
        static=static_adjustments(table, ut.wbcols, ut.static),
        toOne={f: adjust_to_ones(u.apply_scoping(collection), f) for f, u in ut.toOne.items()},
        toMany={f: [set_order_number(i, r.apply_scoping(collection)) for i, r in enumerate(rs)] for f, rs in ut.toMany.items()},
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

def apply_scoping_to_tomanyrecord(tmr: ToManyRecord, collection) -> ScopedToManyRecord:
    table = datamodel.get_table_strict(tmr.name)

    adjust_to_ones = to_one_adjustments(collection, table)

    return ScopedToManyRecord(
        name=tmr.name,
        wbcols={f: extend_columnoptions(colopts, collection, table.name, f) for f, colopts in tmr.wbcols.items()},
        static=static_adjustments(table, tmr.wbcols, tmr.static),
        toOne={f: adjust_to_ones(u.apply_scoping(collection), f) for f, u in tmr.toOne.items()},
        scopingAttrs=scoping_relationships(collection, table),
    )

def apply_scoping_to_treerecord(tr: TreeRecord, collection) -> ScopedTreeRecord:
    table = datamodel.get_table_strict(tr.name)

    treedef = None
    if table.name == 'Taxon':
        if treedef is None:
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

    if treedef is None:
        raise ValueError(f"Could not find treedef for table {table.name}")

    treedefitems = list(treedef.treedefitems.order_by('rankid'))
    treedef_ranks = [tdi.name for tdi in treedefitems]
    for rank in tr.ranks:
        if rank not in treedef_ranks and isinstance(rank, TreeRankRecord) and not rank.check_rank(table.name):
            raise Exception(f'"{rank}" not among {table.name} tree ranks: {treedef_ranks}')

    root = list(getattr(models, table.name.capitalize()).objects.filter(definitionitem=treedefitems[0])[:1]) # assume there is only one

    scoped_ranks: Dict[TreeRankRecord, Dict[str, ExtendedColumnOptions]] = {}
    for r, cols in tr.ranks.items():
        if isinstance(r, str):
            r = TreeRank.create(r, table.name, treedef.id if treedef else None).tree_rank_record()
        scoped_ranks[r] = {}
        for f, colopts in cols.items():
            scoped_ranks[r][f] = extend_columnoptions(colopts, collection, table.name, f)

    return ScopedTreeRecord(
        name=tr.name,
        ranks=scoped_ranks,
        treedef=treedef,
        treedefitems=treedefitems,
        root=root[0] if root else None,
        disambiguation={},
    )

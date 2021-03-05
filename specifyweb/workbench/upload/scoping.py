from typing import Dict, Any, Union, Callable

from specifyweb.specify.datamodel import datamodel, Table, Relationship
from specifyweb.specify.load_datamodel import DoesNotExistError

from .uploadable import Uploadable, ScopedUploadable
from .upload_table import UploadTable, ScopedUploadTable, OneToOneTable, ScopedOneToOneTable
from .tomany import ToManyRecord, ScopedToManyRecord
from .treerecord import TreeRecord, ScopedTreeRecord

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


def apply_scoping_to_uploadtable(ut: UploadTable, collection) -> ScopedUploadTable:
    table = datamodel.get_table_strict(ut.name)

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

    # not sure if this is the right place for this, but it will work for now.
    if table.name == 'Agent' and 'agenttype' not in ut.wbcols and 'agenttype' not in ut.static:
        static = {'agenttype': 1, **ut.static}
    else:
        static = ut.static

    return ScopedUploadTable(
        name=ut.name,
        wbcols=ut.wbcols,
        static=static,
        toOne={f: adjust_to_ones(u.apply_scoping(collection), f) for f, u in ut.toOne.items()},
        toMany={f: [set_order_number(i, r.apply_scoping(collection)) for i, r in enumerate(rs)] for f, rs in ut.toMany.items()},
        scopingAttrs=scoping_relationships(collection, table),
    )

def set_order_number(i: int, tmr: ScopedToManyRecord) -> ScopedToManyRecord:
    table = datamodel.get_table_strict(tmr.name)
    if table.get_field('ordernumber'):
        return tmr._replace(scopingAttrs={**tmr.scopingAttrs, 'ordernumber': i})
    return tmr

def apply_scoping_to_tomanyrecord(tmr: ToManyRecord, collection) -> ScopedToManyRecord:
    table = datamodel.get_table_strict(tmr.name)
    return ScopedToManyRecord(
        name=tmr.name,
        wbcols=tmr.wbcols,
        static=tmr.static,
        toOne={f: u.apply_scoping(collection) for f, u in tmr.toOne.items()},
        scopingAttrs=scoping_relationships(collection, table),
    )

def apply_scoping_to_treerecord(tr: TreeRecord, collection) -> ScopedTreeRecord:
    table = datamodel.get_table_strict(tr.name)

    if table.name == 'Taxon':
        treedefid = collection.discipline.taxontreedef_id

    elif table.name == 'Geography':
        treedefid = collection.discipline.geographytreedef_id

    elif table.name == 'LithoStrat':
        treedefid = collection.discipline.lithostrattreedef_id

    elif table.name == 'GeologicTimePeriod':
        treedefid = collection.discipline.geologictimeperiodtreedef_id

    elif table.name == 'Storage':
        treedefid = collection.discipline.division.institution.storagetreedef_id

    else:
        raise Exception('unexpected tree type: %s' % table)

    return ScopedTreeRecord(
        name=tr.name,
        ranks=tr.ranks,
        treedefid=treedefid,
    )

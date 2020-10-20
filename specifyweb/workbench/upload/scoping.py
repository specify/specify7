from typing import Dict, Any, Union, Callable

from specifyweb.specify.datamodel import datamodel, Table, Relationship
from specifyweb.specify.load_datamodel import DoesNotExistError

from .data import Uploadable
from .upload_table import UploadTable, OneToOneTable
from .tomany import ToManyRecord
from .treerecord import TreeRecord

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

    return extra_static

def _make_one_to_one(fieldname: str) -> Callable[[Uploadable, str], Uploadable]:
    def adjust_to_ones(u: Uploadable, f: str) -> Uploadable:
        if f == fieldname:
            assert isinstance(u, UploadTable)
            return OneToOneTable(*u)
        else:
            return u
    return adjust_to_ones


def apply_scoping_to_uploadtable(ut: UploadTable, collection) -> UploadTable:
    table = datamodel.get_table_strict(ut.name)

    if collection.isembeddedcollectingevent and table.name == 'CollectionObject':
        adjust_to_ones = _make_one_to_one('collectingevent')

    elif collection.discipline.ispaleocontextembedded and table.name.lower() == collection.discipline.paleocontextchildtable.lower():
        adjust_to_ones = _make_one_to_one('paleocontext')

    else:
        def adjust_to_ones(u: Uploadable, f: str) -> Uploadable:
            return u

    return ut._replace(
        static={**scoping_relationships(collection, table), **ut.static},
        toOne={f: adjust_to_ones(u.apply_scoping(collection), f) for f, u in ut.toOne.items()},
        toMany={f: [r.apply_scoping(collection) for r in rs] for f, rs in ut.toMany.items()},
    )

def apply_scoping_to_tomanyrecord(tmr: ToManyRecord, collection) -> ToManyRecord:
    table = datamodel.get_table_strict(tmr.name)
    return tmr._replace(
        static={**scoping_relationships(collection, table), **tmr.static},
        toOne={f: u.apply_scoping(collection) for f, u in tmr.toOne.items()},
    )

def apply_scoping_to_treerecord(tr: TreeRecord, collection) -> TreeRecord:
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

    return tr._replace(treedefid=treedefid)

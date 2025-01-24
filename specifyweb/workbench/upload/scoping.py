from functools import reduce
from typing import Dict, Any, Optional, Tuple, Callable, Union, cast, List

from specifyweb.specify.datamodel import datamodel, Table, is_tree_table
from specifyweb.specify.load_datamodel import DoesNotExistError
from specifyweb.specify import models
from specifyweb.specify.uiformatters import get_uiformatter, get_catalognumber_format, UIFormatter
from specifyweb.specify.utils import get_picklists
from specifyweb.stored_queries.format import get_date_format
from specifyweb.workbench.upload.predicates import SPECIAL_TREE_FIELDS_TO_SKIP

from .uploadable import ScopeGenerator, Uploadable, ScopedUploadable
from .upload_table import UploadTable, ScopedUploadTable, ScopedOneToOneTable
from .column_options import ColumnOptions, ExtendedColumnOptions, DeferredUIFormatter
from .treerecord import TreeRank, TreeRankRecord, TreeRecord, ScopedTreeRecord

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
    ("Collectionrelationship", "rightside"): (
        "collectionreltype",
        "name",
        "rightsidecollection",
    ),
    ("Collectionrelationship", "leftside"): (
        "collectionreltype",
        "name",
        "leftsidecollection",
    ),
}


def scoping_relationships(collection, table: Table) -> Dict[str, int]:
    extra_static: Dict[str, int] = {}

    try:
        table.get_field_strict("collectionmemberid")
        extra_static["collectionmemberid"] = collection.id
    except DoesNotExistError:
        pass

    try:
        table.get_relationship("collection")
        extra_static["collection_id"] = collection.id
    except DoesNotExistError:
        pass

    try:
        table.get_relationship("discipline")
        extra_static["discipline_id"] = collection.discipline.id
    except DoesNotExistError:
        pass

    try:
        table.get_relationship("division")
        extra_static["division_id"] = collection.discipline.division.id
    except DoesNotExistError:
        pass

    try:
        table.get_relationship("institution")
        extra_static["institution_id"] = collection.discipline.division.institution.id
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


def extend_columnoptions(colopts: ColumnOptions, collection, tablename: str, fieldname: str, _toOne: Optional[Dict[str, Uploadable]] = None) -> ExtendedColumnOptions:
    toOne = {} if _toOne is None else _toOne
    picklists, schemaitem = get_picklists(collection, tablename, fieldname)

    if not picklists:
        picklist = None
    else:
        collection_picklists = picklists.filter(collection=collection)

        picklist = (
            picklists[0] if len(collection_picklists) == 0 else collection_picklists[0]
        )

    ui_formatter = get_uiformatter(collection, tablename, fieldname)
    scoped_formatter = (
        None if ui_formatter is None else ui_formatter.apply_scope(collection)
    )
    friendly_repr = f"{tablename}-{fieldname}-{collection}"
    return ExtendedColumnOptions(
        column=colopts.column,
        matchBehavior=colopts.matchBehavior,
        nullAllowed=colopts.nullAllowed,
        default=colopts.default,
        schemaitem=schemaitem,
        uiformatter=get_or_defer_formatter(collection, tablename, fieldname, toOne),
        picklist=picklist,
        dateformat=get_date_format(),
    )


def get_deferred_scoping(
    key: str,
    table_name: str,
    uploadable: UploadTable,
    row: Dict[str, Any],
    base_ut,
    generator: ScopeGenerator,
):
    deferred_key = (table_name, key)
    deferred_scoping = DEFERRED_SCOPING.get(deferred_key, None)

    if deferred_scoping is None:
        return uploadable

    if row:
        related_key, filter_field, relationship_name = deferred_scoping
        other = base_ut.toOne[related_key]
        if not isinstance(other, UploadTable):
            raise Exception("invalid scoping scheme!")
        related_column_name = base_ut.toOne[related_key].wbcols[filter_field].column
        filter_value = row[related_column_name]
        filter_search = {filter_field: filter_value}
        related_table = datamodel.get_table_strict(related_key)
        related = getattr(models, related_table.django_name).objects.get(
            **filter_search
        )
        collection_id = getattr(related, relationship_name).id
    else:
        # meh, would just go to the original collection
        collection_id = None

    # don't cache anymore, since values can be dependent on rows.
    if generator is not None:
        next(generator)  # a bit hacky
    return uploadable._replace(overrideScope={"collection": collection_id})


def get_or_defer_formatter(collection, tablename: str, fieldname: str, _toOne: Dict[str, Uploadable]) -> Union[None, UIFormatter, DeferredUIFormatter]:
    """ The CollectionObject -> catalogNumber format can be determined by the 
    CollectionObjectType -> catalogNumberFormatName for the CollectionObject

    Similarly to PrepType, CollectionObjectType in the WorkBench is resolvable 
    by the 'name' field

    See https://github.com/specify/specify7/issues/5473 
    """
    toOne = {key.lower():value for key, value in _toOne.items()}
    if tablename.lower() == 'collectionobject' and fieldname.lower() == 'catalognumber' and 'collectionobjecttype' in toOne.keys():
        uploadTable = toOne['collectionobjecttype']

        wb_col = cast(UploadTable, uploadTable).wbcols.get('name', None) if hasattr(uploadTable, 'wbcols') else None
        optional_col_name = None if wb_col is None else wb_col.column
        if optional_col_name is not None: 
            col_name = cast(str, optional_col_name)
            formats: Dict[str, Optional[UIFormatter]] = {cot.name: get_catalognumber_format(collection, cot.catalognumberformatname, None) for cot in collection.cotypes.all()}
            return lambda row: formats.get(row[col_name], get_uiformatter(collection, tablename, fieldname))

    return get_uiformatter(collection, tablename, fieldname)


def apply_scoping_to_uploadtable(
    ut: UploadTable, collection, generator: ScopeGenerator = None, row=None
) -> ScopedUploadTable:
    table = datamodel.get_table_strict(ut.name)
    if ut.overrideScope is not None and isinstance(ut.overrideScope["collection"], int):
        collection = models.Collection.objects.get(id=ut.overrideScope["collection"])

    to_one_fields = get_to_one_fields(collection)

    adjuster = reduce(
        lambda accum, curr: _make_one_to_one(curr, accum),
        to_one_fields.get(table.name.lower(), []),
        lambda u, f: u,
    )

    apply_scoping = lambda key, value: get_deferred_scoping(
        key, table.django_name, value, row, ut, generator
    ).apply_scoping(collection, generator, row)

    to_ones = {
        key: adjuster(apply_scoping(key, value), key)
        for (key, value) in ut.toOne.items()
    }

    model = getattr(models, table.django_name)

    def _backref(key):
        return model._meta.get_field(key).remote_field.attname

    to_many = {
        key: [
            set_order_number(i, apply_scoping(key, record), [_backref(key)])
            for i, record in enumerate(records)
        ]
        for (key, records) in ut.toMany.items()
    }

    scoped_table = ScopedUploadTable(
        name=ut.name,
        wbcols={
            f: extend_columnoptions(colopts, collection, table.name, f, ut.toOne)
            for f, colopts in ut.wbcols.items()
        },
        static=ut.static,
        toOne=to_ones,
        toMany=to_many,  # type: ignore
        scopingAttrs=scoping_relationships(collection, table),
        disambiguation=None,
        # Often, we'll need to recur down to clone (nested one-to-ones). Having this entire is handy in such a case
        to_one_fields=to_one_fields,
        match_payload=None,
        # Ignore stuff like parent_id and such for matching, BUT, preserve it for cloning.
        # This is done to allow matching to different parts of the tree, but not make a faulty tree if user doesn't select values (during clone).
        strong_ignore=(SPECIAL_TREE_FIELDS_TO_SKIP if is_tree_table(table) else []),
    )

    return scoped_table


def get_to_one_fields(collection) -> Dict[str, List["str"]]:
    return {
        "collectionobject": [
            *(["collectingevent"] if collection.isembeddedcollectingevent else []),
            "collectionobjectattribute",
        ],
        "collectingevent": ["collectingeventattribute"],
        "attachment": ["attachmentimageattribute"],
        "collectingtrip": ["collectingtripattribute"],
        "preparation": ["preparationattribute"],
        **(
            {collection.discipline.paleocontextchildtable.lower(): ["paleocontext"]}
            if collection.discipline.ispaleocontextembedded
            else {}
        ),
    }


def set_order_number(
    i: int, tmr: ScopedUploadTable, to_ignore: List[str]
) -> ScopedUploadTable:
    table = datamodel.get_table_strict(tmr.name)
    if table.get_field("ordernumber"):
        return tmr._replace(scopingAttrs={**tmr.scopingAttrs, "ordernumber": i})
    return tmr._replace(strong_ignore=[*tmr.strong_ignore, *to_ignore])


def apply_scoping_to_treerecord(tr: TreeRecord, collection) -> ScopedTreeRecord:
    table = datamodel.get_table_strict(tr.name)

    treedef = None
    if table.name == 'Taxon':
        if treedef is None:
            treedef = collection.discipline.taxontreedef

    elif table.name == "Geography":
        treedef = collection.discipline.geographytreedef

    elif table.name == "LithoStrat":
        treedef = collection.discipline.lithostrattreedef

    elif table.name == "GeologicTimePeriod":
        treedef = collection.discipline.geologictimeperiodtreedef

    elif table.name == "Storage":
        treedef = collection.discipline.division.institution.storagetreedef

    elif table.name == 'TectonicUnit':
        treedef = collection.discipline.tectonicunittreedef

    else:
        raise Exception(f"unexpected tree type: {table.name}")

    if treedef is None:
        raise ValueError(f"Could not find treedef for table {table.name}")

    treedefitems = list(treedef.treedefitems.order_by('rankid'))
    treedef_ranks = [tdi.name for tdi in treedefitems]
    for rank in tr.ranks:
        is_valid_rank = (hasattr(rank, 'rank_name') and rank.rank_name in treedef_ranks) or (rank in treedef_ranks) # type: ignore
        if not is_valid_rank and isinstance(rank, TreeRankRecord) and not rank.check_rank(table.name):
            raise Exception(f'"{rank}" not among {table.name} tree ranks: {treedef_ranks}')

    root = list(
        getattr(models, table.name.capitalize()).objects.filter(
            definitionitem=treedefitems[0]
        )[:1]
    )  # assume there is only one

    scoped_ranks: Dict[TreeRankRecord, Dict[str, ExtendedColumnOptions]] = {
        (
            TreeRank.create(
                r, table.name, treedef.id if treedef else None
            ).tree_rank_record()
            if isinstance(r, str)
            else r
        ): {
            f: extend_columnoptions(colopts, collection, table.name, f)
            for f, colopts in cols.items()
        }
        for r, cols in tr.ranks.items()
    }

    return ScopedTreeRecord(
        name=tr.name,
        ranks=scoped_ranks,
        treedef=treedef,
        treedefitems=treedefitems,
        root=root[0] if root else None,
        disambiguation={},
        batch_edit_pack=None,
    )

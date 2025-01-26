from functools import reduce
from typing import Dict, Any, Optional, Tuple, Callable, TypedDict, Union, cast, List

from specifyweb.specify.datamodel import datamodel, Table, is_tree_table
from specifyweb.specify.func import CustomRepr
from specifyweb.specify.load_datamodel import DoesNotExistError
from specifyweb.specify import models
from specifyweb.specify.uiformatters import get_uiformatter, get_catalognumber_format, UIFormatter
from specifyweb.stored_queries.format import get_date_format
from specifyweb.workbench.upload.predicates import SPECIAL_TREE_FIELDS_TO_SKIP
from specifyweb.workbench.upload.scope_context import ScopeContext

from .uploadable import Uploadable, ScopedUploadable, Row
from .upload_table import UploadTable, ScopedUploadTable, ScopedOneToOneTable
from .column_options import ColumnOptions, ExtendedColumnOptions
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


def extend_columnoptions(
        colopts: ColumnOptions, 
        # IMPORTANT: This collection CAN be trusted. That is, even if you are in a collection relationship,
        # it'll always point to the correct collection (so whatever you want to use it for, you can trust it.)
        collection, 
        tablename: str, 
        fieldname: str, 
        row: Optional[Row] = None,
        toOne: Optional[Dict[str, Uploadable]] = None,
        context: Optional[ScopeContext] = None
        ) -> ExtendedColumnOptions:

    context = context or ScopeContext()
    toOne = toOne or {}
    schema_items = models.Splocalecontaineritem.objects.filter(
        container__discipline=collection.discipline,
        container__schematype=0,
        container__name=tablename.lower(),
        name=fieldname.lower(),
    )

    schemaitem = schema_items and schema_items[0]
    picklistname = schemaitem and schemaitem.picklistname

    if not isinstance(picklistname, str):
        picklist = None
    else:
        picklists = models.Picklist.objects.filter(name=picklistname)
        collection_picklists = picklists.filter(collection=collection)

        picklist = (
            picklists[0] if len(collection_picklists) == 0 else collection_picklists[0]
        )


    ui_formatter = get_or_defer_formatter(collection, tablename, fieldname, row, toOne, context)
    scoped_formatter = (
        None if ui_formatter is None else ui_formatter.apply_scope(collection)
    )

    # REFACTOR: Make context always required and simply
    date_format = context.cache['date_format']
    date_format = get_date_format() if date_format is None else date_format
    context.cache['date_format'] = date_format

    # Technically this should contain info about cotypes but oh well
    friendly_repr = f"{collection.collectionname}-{tablename}-{fieldname}"

    return ExtendedColumnOptions(
        column=colopts.column,
        matchBehavior=colopts.matchBehavior,
        nullAllowed=colopts.nullAllowed,
        default=colopts.default,
        schemaitem=schemaitem,
        # Formatters are "scoped" here, that is, all they need is a value coming directly from the row.
        uiformatter=(None if scoped_formatter is None else CustomRepr(scoped_formatter, friendly_repr)),
        picklist=picklist,
        # caching this, since it literally makes a database hit for every row.
        # TODO: I don't think this should belong here in the first place, should probably be in context or something
        dateformat=date_format
    )


def get_deferred_scoping(
    key: str,
    table_name: str,
    uploadable: UploadTable,
    row: Dict[str, Any],
    base_ut,
    context: Optional[ScopeContext]
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
        # TODO: Consider caching this??
        related = getattr(models, related_table.django_name).objects.get(
            **filter_search
        )
        collection_id = getattr(related, relationship_name).id
    else:
        # meh, would just go to the original collection
        collection_id = None

    # don't cache anymore, since values can be dependent on rows.
    if context is not None:
        context.set_is_variable()

    return uploadable._replace(overrideScope={"collection": collection_id})


def get_or_defer_formatter(
        collection, 
        tablename: str, 
        fieldname: str, 
        row: Optional[Row],
        _toOne: Dict[str, Uploadable],
        context: Optional[ScopeContext] = None,
        ) -> Optional[UIFormatter]:
    """ The CollectionObject -> catalogNumber format can be determined by the 
    CollectionObjectType -> catalogNumberFormatName for the CollectionObject

    Similarly to PrepType, CollectionObjectType in the WorkBench is resolvable 
    by the 'name' field

    See https://github.com/specify/specify7/issues/5473 
    """
    toOne = {key.lower():value for key, value in _toOne.items()}

    formatter: Optional[UIFormatter] = None
    if tablename.lower() == 'collectionobject' and fieldname.lower() == 'catalognumber' and 'collectionobjecttype' in toOne:
        uploadTable = toOne['collectionobjecttype']

        wb_col: Optional[ColumnOptions] = cast(UploadTable, uploadTable).wbcols.get('name', None)
        co_type_cache : Dict[str, Optional[UIFormatter]] = {}
        # At this point, we are variable since we saw a co.
        if context:
            context.set_is_variable()
            co_type_cache = context.cache["cotypes"].get(collection, {})
        
        if wb_col is not None:
            # try deferring this expensive operation as much as possible. That is, until we see a value, don't bother fetching catalognumber formats.
            if not co_type_cache:
                co_type_cache = {
                    cot.name: get_catalognumber_format(collection, cot.catalognumberformatname, None) 
                    for cot in collection.cotypes.all()
                }
            if context and collection not in context.cache["cotypes"]:
                # I guess we could 
                context.cache["cotypes"][collection] = co_type_cache

            if row:
                # At this point, we now look at the row.
                formatter = co_type_cache.get(row[wb_col.column]) if row[wb_col.column] is not None else None
        
    
    if formatter is None:
        # All the default cases.
        key = (collection, tablename, fieldname)
        if context:
            formatter = context.cache["fields"].get(key, None)
        
        # cache hit failed
        if formatter is None:
            formatter = get_uiformatter(collection, tablename, fieldname)
        
        if context:
            context.cache["fields"][key] = formatter

    return formatter


def apply_scoping_to_uploadtable(
    ut: UploadTable, collection, context: Optional[ScopeContext] = None, row=None
) -> ScopedUploadTable:
    # IMPORTANT:
    # Before this comment, collection is UNTRUSTED (you'd not necessarily have the correct side of a collection relationship)
    
    table = datamodel.get_table_strict(ut.name)
    if ut.overrideScope is not None and isinstance(ut.overrideScope["collection"], int):
        collection = models.Collection.objects.get(id=ut.overrideScope["collection"])
    
    # After this comment, collection CAN be trusted (even if you are in collection relationships)
    to_one_fields = get_to_one_fields(collection)
    adjuster = reduce(
        lambda accum, curr: _make_one_to_one(curr, accum),
        to_one_fields.get(table.name.lower(), []),
        lambda u, f: u,
    )

    apply_scoping = lambda key, value: get_deferred_scoping(
        key, table.django_name, value, row, ut, context
    ).apply_scoping(collection, context, row)

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
            f: extend_columnoptions(colopts, collection, table.name, f, row, ut.toOne, context)
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

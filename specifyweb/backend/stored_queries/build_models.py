from typing import Optional
from specifyweb.specify.models_utils.load_datamodel import Datamodel, Table, Field, Relationship
from sqlalchemy import Table as Table_Sqlalchemy, Column, ForeignKey, types, orm, MetaData
from sqlalchemy.dialects.mysql import BIT as mysql_bit_type
metadata = MetaData()

class BaseIdAlias:
    id_attr_name: Optional[str] = None

    @property
    def primary_id(self):
        val = getattr(self, "_id", None)
        if val is not None:
            return val
        
        if self.__class__.id_attr_name:
            return getattr(self, self.__class__.id_attr_name, None)
        return None

# Custom BIT type to handle both BIT(1) and TINYINT
class CustomBIT(mysql_bit_type):
    def result_processor(self, dialect, coltype):
        def process(value):
            # Handle TINYINT (integer values) and BIT(1) (byte values)
            if isinstance(value, int):
                return value != 0  # Convert integer to boolean
            if isinstance(value, (bytes, bytearray)):
                return value != b'\x00'  # Convert BIT(1) to boolean
            return value
        return process

def make_table(datamodel: Datamodel, tabledef: Table):
    columns = [ Column(tabledef.idColumn, types.Integer, primary_key=True) ]

    columns.extend(make_column(field) for field in tabledef.fields)
    for reldef in tabledef.relationships:
        if reldef.type in ('many-to-one', 'one-to-one') and hasattr(reldef, 'column') and reldef.column:
            fk = make_foreign_key(datamodel, reldef)
            if fk is not None: columns.append(fk)

    return Table_Sqlalchemy(tabledef.table, metadata, *columns)

def make_foreign_key(datamodel: Datamodel, reldef: Relationship):
    remote_tabledef = datamodel.get_table(reldef.relatedModelName) # TODO: this could be a method of relationship
    if remote_tabledef is None or getattr(remote_tabledef, "skip", False):
        return

    fk_target = '.'.join((remote_tabledef.table, remote_tabledef.idColumn))

    return Column(reldef.column,
                  ForeignKey(fk_target),
                  nullable = not reldef.required,
                  unique = reldef.type == 'one_to_one')

def make_column(flddef: Field):
    field_type = field_type_map[ flddef.type ]

    if hasattr(flddef, 'length') and flddef.length and field_type in (types.Text, types.String):
        field_type = field_type(flddef.length)

    return Column(flddef.column,
                  field_type,
                  index    = flddef.indexed,
                  unique   = flddef.unique,
                  nullable = not flddef.required)


field_type_map = {
    'text'                 : types.Text,
    'json'                 : types.JSON,
    'blob'                 : types.LargeBinary, # mediumblob
    'java.lang.String'     : types.String,
    'java.lang.Integer'    : types.Integer,
    'java.lang.Long'       : types.Integer,
    'java.lang.Byte'       : types.Integer,
    'java.lang.Short'      : types.Integer,
    'java.util.Calendar'   : types.Date,
    'java.util.Date'       : types.Date,
    'java.lang.Float'      : types.Float,
    'java.lang.Double'     : types.Float,
    'java.sql.Timestamp'   : types.DateTime,
    'java.math.BigDecimal' : types.Numeric,
    'java.lang.Boolean'    : CustomBIT
}

def make_tables(datamodel: Datamodel):
    return {td.table: make_table(datamodel, td) for td in iter_included_tables(datamodel)}

def make_classes(datamodel: Datamodel):
    def make_class(tabledef):
        return type(
            tabledef.name,
            (BaseIdAlias,),
            {
                'tableid': tabledef.tableId,
                'id_attr_name': tabledef.idFieldName,
            },
        )

    return {td.name: make_class(td) for td in iter_included_tables(datamodel)}

def map_classes(datamodel: Datamodel, tables: list[Table], classes):

    def map_class(tabledef):
        cls = classes[ tabledef.name ]
        table = tables[ tabledef.table ]

        def make_relationship(reldef):
            has_back_populates = False
            if reldef.relatedModelName not in classes:
                return

            remote_class = classes[reldef.relatedModelName]
            remote_tabledef = datamodel.get_table(reldef.relatedModelName)
            remote_table = tables.get(remote_tabledef.table) if remote_tabledef else None

            # Handle standard to-one relationships with an explicit column.
            if getattr(reldef, "column", None):
                column = getattr(table.c, reldef.column)
                relationship_args = {"foreign_keys": column}

                if remote_class is cls:
                    relationship_args["remote_side"] = table.c[tabledef.idColumn]

                # If the remote side declares a one-to-many back-link without a column,
                # wire the two sides together.
                reverse_one_to_many = None
                if remote_tabledef:
                    reverse_one_to_many = next(
                        (
                            r
                            for r in remote_tabledef.relationships
                            if r.relatedModelName == tabledef.name
                            and r.type == "one-to-many"
                        ),
                        None,
                    )
                if reverse_one_to_many is not None:
                    relationship_args["back_populates"] = reverse_one_to_many.name
                    has_back_populates = True

                if (not has_back_populates) and getattr(reldef, "otherSideName", None):
                    backref_args = {"uselist": reldef.type != "one-to-one"}
                    relationship_args["backref"] = orm.backref(
                        reldef.otherSideName, **backref_args
                    )

                return reldef.name, orm.relationship(remote_class, **relationship_args)

            # Handle one-to-many relationships defined on the parent side (no column specified).
            if reldef.type == "one-to-many" and remote_table is not None:
                # Find a reverse many-to-one pointing back to this table with a FK column.
                reverse_rel = next(
                    (
                        r
                        for r in remote_tabledef.relationships
                        if r.relatedModelName == tabledef.name
                        and getattr(r, "column", None)
                        and r.type in ("many-to-one", "one-to-one")
                    ),
                    None,
                )
                if reverse_rel is None:
                    return

                fk_column = remote_table.c[reverse_rel.column]
                relationship_args = {
                    "foreign_keys": fk_column,
                    "primaryjoin": table.c[tabledef.idColumn] == fk_column,
                }

                # Keep both sides linked when possible.
                relationship_args["back_populates"] = reverse_rel.name

                return reldef.name, orm.relationship(remote_class, **relationship_args)

            return

        id_column = table.c[tabledef.idColumn]
        properties = {
            '_id': id_column,
            tabledef.idFieldName: orm.synonym('_id'),
        }

        properties.update({ flddef.name: table.c[flddef.column]
                            for flddef in tabledef.fields })

        properties.update(relationship
                          for relationship in [ make_relationship(reldef)
                                                for reldef in tabledef.relationships ]
                          if relationship)

        orm.mapper(cls, table, properties=properties)

    for tabledef in iter_included_tables(datamodel):
        map_class(tabledef)

def iter_included_tables(datamodel: Datamodel):
    for td in datamodel.tables:
        if getattr(td, "skip", False):
            continue
        yield td

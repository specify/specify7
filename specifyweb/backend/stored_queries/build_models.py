from typing import Optional
from specifyweb.specify.models_utils.load_datamodel import Datamodel, Table, Field, Relationship
from sqlalchemy import Table as Table_Sqlalchemy, Column, ForeignKey, types, orm, MetaData, ForeignKeyConstraint
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
    """
    Build a SQLAlchemy Table for a Specify datamodel Table definition.

    Key behavior:
    - Supports composite PKs via tabledef.idColumns if present, else uses tabledef.idColumn.
    - Avoids defining the same column name twice.
    - Still establishes foreign key constraints even if a FK column was already created
      as part of the PK (e.g. join tables where PK columns are also FKs).
    """

    # --- Primary key columns (support composite PKs) ---
    pk_cols = getattr(tabledef, "idColumns", None) or [tabledef.idColumn]
    columns = [Column(col, types.Integer, primary_key=True) for col in pk_cols]

    # Track all column names we have already added to avoid duplicates
    colnames = set(pk_cols)

    # Track FK constraints that need to be applied at the table level
    fk_constraints = []

    # --- Normal fields ---
    columns.extend(make_column(field) for field in tabledef.fields)
    for field in tabledef.fields:
        col = getattr(field, "column", None)
        if col:
            colnames.add(col)

    # --- Relationships (to-one FKs) ---
    for reldef in tabledef.relationships:
        if reldef.type not in ("many-to-one", "one-to-one"):
            continue

        rel_col = getattr(reldef, "column", None)
        if not rel_col:
            continue

        # Always add a ForeignKeyConstraint, even if the column already exists
        fk_target = make_fk_target(datamodel, reldef)
        if fk_target is not None:
            remote_table, remote_col = fk_target
            fk_constraints.append(
                ForeignKeyConstraint([rel_col], [f"{remote_table}.{remote_col}"])
            )

        # Only add the FK column as a Column(...) if it doesn't already exist
        # (e.g., avoid redefining a PK column that doubles as FK)
        if rel_col not in colnames:
            fk_col = make_foreign_key(datamodel, reldef)
            if fk_col is not None:
                columns.append(fk_col)
                colnames.add(rel_col)

    return Table_Sqlalchemy(tabledef.table, metadata, *columns, *fk_constraints)


def make_fk_target(datamodel: Datamodel, reldef: Relationship):
    """
    Resolve the FK target (remote_table, remote_pk_column) for a relationship.
    Returns None if the remote table can't be found or has a composite PK (unsupported as FK target here).
    """
    remote_tabledef = datamodel.get_table(reldef.relatedModelName)
    if remote_tabledef is None:
        return None

    remote_pk_cols = getattr(remote_tabledef, "idColumns", None) or [remote_tabledef.idColumn]
    if len(remote_pk_cols) != 1:
        # We don't currently build FKs pointing at composite PK targets.
        return None

    return (remote_tabledef.table, remote_pk_cols[0])


def make_foreign_key(datamodel: Datamodel, reldef: Relationship):
    """
    Build a SQLAlchemy Column for a relationship FK column.
    Used only when the column doesn't already exist in the table.
    """
    fk_target = make_fk_target(datamodel, reldef)
    if fk_target is None:
        return None

    remote_table, remote_col = fk_target
    target = f"{remote_table}.{remote_col}"

    return Column(
        reldef.column,
        ForeignKey(target),
        nullable=not reldef.required,
        unique=(reldef.type == "one-to-one"),
    )

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
    return {td.table: make_table(datamodel, td) for td in datamodel.tables}

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

    return {td.name: make_class(td) for td in datamodel.tables}

def map_classes(datamodel: Datamodel, tables: list[Table], classes):

    def map_class(tabledef):
        cls = classes[ tabledef.name ]
        table = tables[ tabledef.table ]

        def make_relationship(reldef):
            if not hasattr(reldef, 'column') or not reldef.column or reldef.relatedModelName not in classes:
                return

            remote_class = classes[ reldef.relatedModelName ]
            column = getattr(table.c, reldef.column)

            relationship_args = {'foreign_keys': column}
            if remote_class is cls:
                relationship_args['remote_side'] = table.c[ tabledef.idColumn ]

            if hasattr(reldef, 'otherSideName') and reldef.otherSideName:
                backref_args = {'uselist': reldef.type != 'one-to-one'}

                relationship_args['backref'] = orm.backref(reldef.otherSideName, **backref_args)

            return reldef.name, orm.relationship(remote_class, **relationship_args)

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

    for tabledef in datamodel.tables:
        map_class(tabledef)


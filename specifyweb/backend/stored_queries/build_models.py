from typing import NamedTuple, Optional
from specifyweb.specify.models_utils.load_datamodel import (
    Datamodel,
    Field,
    ManyToMany,
    Relationship,
    Table,
)
from sqlalchemy import Table as Table_Sqlalchemy, Column, ForeignKey, types, orm, MetaData
from sqlalchemy.dialects.mysql import BIT as mysql_bit_type
metadata = MetaData()


MANY_TO_MANY_TABLES = {
    "Project_colobj": {
        "table": "project_colobj",
        "id_column": "ProjectColObjID",
        "through_fields": {
            "collectionobject": {
                "model": "CollectionObject",
                "column": "CollectionObjectID",
            },
            "project": {
                "model": "Project",
                "column": "ProjectID",
            },
        },
    },
}


class ManyToManyJoinInfo(NamedTuple):
    table: str
    local_column: str
    remote_column: str

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
    if remote_tabledef is None:
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


def make_many_to_many_table(datamodel: Datamodel, table_info):
    columns = [Column(table_info["id_column"], types.Integer, primary_key=True)]

    for through_field in table_info["through_fields"].values():
        remote_tabledef = datamodel.get_table(through_field["model"])
        if remote_tabledef is None:
            return

        fk_target = ".".join((remote_tabledef.table, remote_tabledef.idColumn))
        columns.append(
            Column(
                through_field["column"],
                types.Integer,
                ForeignKey(fk_target),
                nullable=False,
            )
        )

    return Table_Sqlalchemy(table_info["table"], metadata, *columns)


def get_many_to_many_join_info(
    datamodel: Datamodel, reldef: Relationship
) -> ManyToManyJoinInfo | None:
    if not isinstance(reldef, ManyToMany):
        return None

    table_info = MANY_TO_MANY_TABLES.get(reldef.through_model)
    if table_info is None:
        return None

    local_field = table_info["through_fields"].get(reldef.through_field)
    if local_field is None:
        return None

    remote_field = None
    related_table = datamodel.get_table(reldef.relatedModelName)
    related_relationship = (
        related_table.get_field(reldef.otherSideName, strict=False)
        if related_table is not None and reldef.otherSideName
        else None
    )
    remote_through_field = getattr(related_relationship, "through_field", None)
    if remote_through_field is not None:
        remote_field = table_info["through_fields"].get(remote_through_field)

    if remote_field is None:
        remote_fields = [
            field
            for through_field, field in table_info["through_fields"].items()
            if through_field != reldef.through_field
        ]
        if len(remote_fields) != 1:
            return None
        remote_field = remote_fields[0]

    return ManyToManyJoinInfo(
        table=table_info["table"],
        local_column=local_field["column"],
        remote_column=remote_field["column"],
    )


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
    tables = {td.table: make_table(datamodel, td) for td in datamodel.tables}

    for table_info in MANY_TO_MANY_TABLES.values():
        if table_info["table"] not in tables:
            table = make_many_to_many_table(datamodel, table_info)
            if table is not None:
                tables[table_info["table"]] = table

    return tables

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
            if isinstance(reldef, ManyToMany):
                join_info = get_many_to_many_join_info(datamodel, reldef)
                remote_tabledef = datamodel.get_table(reldef.relatedModelName)
                if (
                    join_info is None
                    or remote_tabledef is None
                    or reldef.relatedModelName not in classes
                    or join_info.table not in tables
                ):
                    return

                remote_class = classes[reldef.relatedModelName]
                remote_table = tables[remote_tabledef.table]
                secondary_table = tables[join_info.table]

                return reldef.name, orm.relationship(
                    remote_class,
                    secondary=secondary_table,
                    primaryjoin=(
                        table.c[tabledef.idColumn]
                        == secondary_table.c[join_info.local_column]
                    ),
                    secondaryjoin=(
                        remote_table.c[remote_tabledef.idColumn]
                        == secondary_table.c[join_info.remote_column]
                    ),
                    viewonly=True,
                )

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

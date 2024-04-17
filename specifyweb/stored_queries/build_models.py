from typing import List
from specifyweb.specify.load_datamodel import Datamodel, Table, Field, Relationship
from sqlalchemy import Table as Table_Sqlalchemy, Column, ForeignKey, types, orm, MetaData
from sqlalchemy.dialects.mysql import BIT as mysql_bit_type
metadata = MetaData()

def make_table(datamodel: Datamodel, tabledef: Table):
    columns = [ Column(tabledef.idColumn, types.Integer, primary_key=True) ]

    columns.extend(make_column(field) for field in tabledef.fields)
    for reldef in tabledef.relationships:
        if reldef.type in ('many-to-one', 'one-to-one') and hasattr(reldef, 'column') and reldef.column is not None:
            fk = make_foreign_key(datamodel, reldef)
            if fk is not None: columns.append(fk)

    try:
        return Table_Sqlalchemy(tabledef.table, metadata, *columns)
    except Exception as e:
        # log error
        print("==============================================================")
        print(f"Error creating table {tabledef.table}: {e}")
        print("==============================================================")
        print(columns)
        for column in columns:
            print(column)
        print("==============================================================")
        # x = tabledef.get_field('discipline')
        for field in tabledef.fields:
            print(field)
        print('==============================================================')
        for reldef in tabledef.relationships:
            print(reldef)
        print('==============================================================')
        discipline = tabledef.get_relationship('discipline')
        print(discipline.column)
        print(discipline.name)
        print('==============================================================')

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

    if hasattr(flddef, 'length') and flddef.length is not None and field_type in (types.Text, types.String):
        field_type = field_type(flddef.length)

    return Column(flddef.column,
                  field_type,
                  index    = flddef.indexed,
                  unique   = flddef.unique,
                  nullable = not flddef.required)


field_type_map = {'text'                 : types.Text,
                  'json'                 : types.JSON,
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
                  'java.lang.Boolean'    : mysql_bit_type}

def make_tables(datamodel: Datamodel):
    return {td.table: make_table(datamodel, td) for td in datamodel.tables}

def make_classes(datamodel: Datamodel):
    def make_class(tabledef):
        return type(tabledef.name, (object,), { 'tableid': tabledef.tableId, '_id': tabledef.idFieldName })

    return {td.name: make_class(td) for td in datamodel.tables}


def map_classes(datamodel: Datamodel, tables: List[Table], classes):

    def map_class(tabledef):
        cls = classes[ tabledef.name ]
        table = tables[ tabledef.table ]

        def make_relationship(reldef):
            if not hasattr(reldef, 'column') or reldef.column is None or reldef.relatedModelName not in classes:
                return

            remote_class = classes[ reldef.relatedModelName ]
            try:
                column = getattr(table.c, reldef.column)
            except Exception as e:
                print(f"Error mapping relationship {reldef.name} for table {tabledef.name}: {e}")
                print(f"table.c: {table.c}")
                print(f"reldef.column: {reldef.column}") # looks like reldef.column is None sometimes

            relationship_args = {'foreign_keys': column}
            if remote_class is cls:
                relationship_args['remote_side'] = table.c[ tabledef.idColumn ]

            if hasattr(reldef, 'otherSideName') and reldef.otherSideName is not None:
                backref_args = {'uselist': reldef.type != 'one-to-one'}

                relationship_args['backref'] = orm.backref(reldef.otherSideName, **backref_args)

            return reldef.name, orm.relationship(remote_class, **relationship_args)

        properties = { tabledef.idFieldName: table.c[tabledef.idColumn] }

        properties.update({ flddef.name: table.c[flddef.column]
                            for flddef in tabledef.fields })

        properties.update(relationship
                          for relationship in [ make_relationship(reldef)
                                                for reldef in tabledef.relationships ]
                          if relationship is not None)

        orm.mapper(cls, table, properties=properties)

    for tabledef in datamodel.tables:
        map_class(tabledef)

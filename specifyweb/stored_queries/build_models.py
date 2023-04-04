from sqlalchemy import Table, Column, ForeignKey, types, orm, MetaData
from sqlalchemy.dialects.mysql import BIT as mysql_bit_type

metadata = MetaData()

def make_table(datamodel, tabledef):
    columns = [ Column(tabledef.idColumn.lower(), types.Integer, primary_key=True) ]

    columns.extend(make_column(field) for field in tabledef.fields)

    for reldef in tabledef.relationships:
        if reldef.type in ('many-to-one', 'one-to-one') and hasattr(reldef, 'column'):
            fk = make_foreign_key(datamodel, reldef)
            if fk is not None: columns.append(fk)

    return Table(tabledef.table, metadata, *columns)

def make_foreign_key(datamodel, reldef):
    remote_tabledef = datamodel.get_table(reldef.relatedModelName) # TODO: this could be a method of relationship
    if remote_tabledef is None:
        return

    fk_target = '.'.join((remote_tabledef.table, remote_tabledef.idColumn.lower()))

    return Column(reldef.column.lower(),
                  ForeignKey(fk_target),
                  nullable = not reldef.required,
                  unique = reldef.type == 'one_to_one')

def make_column(flddef):
    field_type = field_type_map[ flddef.type ]

    if hasattr(flddef, 'length') and field_type in (types.Text, types.String):
        field_type = field_type(flddef.length)

    return Column(flddef.column.lower(),
                  field_type,
                  index    = flddef.indexed,
                  unique   = flddef.unique,
                  nullable = not flddef.required)


field_type_map = {'text'                 : types.Text,
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

def make_tables(datamodel):
    return {td.table: make_table(datamodel, td) for td in datamodel.tables}

def make_classes(datamodel):
    def make_class(tabledef):
        return type(tabledef.name, (object,), { 'tableid': tabledef.tableId, '_id': tabledef.idFieldName.lower() })

    return {td.name: make_class(td) for td in datamodel.tables}


def map_classes(datamodel, tables, classes):

    def map_class(tabledef):
        cls = classes[ tabledef.name ]
        table = tables[ tabledef.table ]

        def make_relationship(reldef):
            if not hasattr(reldef, 'column') or reldef.relatedModelName not in classes:
                return

            remote_class = classes[ reldef.relatedModelName ]
            column = getattr(table.c, reldef.column.lower())

            relationship_args = {'foreign_keys': column}

            if hasattr(reldef, 'otherSideName'):
                backref_args = {'uselist': reldef.type != 'one-to-one'}
                if remote_class is cls:
                    backref_args['remote_side'] = table.c[ tabledef.idColumn.lower() ]

                relationship_args['backref'] = orm.backref(reldef.otherSideName, **backref_args)

            return reldef.name, orm.relationship(remote_class, **relationship_args)

        properties = { tabledef.idFieldName.lower(): table.c[tabledef.idColumn.lower()] }

        properties.update({ flddef.name.lower(): table.c[flddef.column.lower()]
                            for flddef in tabledef.fields })

        properties.update(relationship
                          for relationship in [ make_relationship(reldef)
                                                for reldef in tabledef.relationships ]
                          if relationship is not None)

        orm.mapper(cls, table, properties=properties)

    for tabledef in datamodel.tables:
        map_class(tabledef)

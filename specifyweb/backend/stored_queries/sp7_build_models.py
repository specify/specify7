from sqlalchemy import Column, ForeignKey, types
from sqlalchemy.dialects.mysql import BIT as mysql_bit_type
from specifyweb.specify.load_datamodel import Datamodel, Table, Field, Relationship

TAB1 = '    '
TAB2 = TAB1 + TAB1

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
    field_type = FIELD_TYPE_MAP[ flddef.type ]

    if hasattr(flddef, 'length') and field_type in (types.Text, types.String):
        field_type = field_type(flddef.length)

    return Column(flddef.column,
                  field_type,
                  index    = flddef.indexed,
                  unique   = flddef.unique,
                  nullable = not flddef.required)

FIELD_TYPE_MAP = {
    'text'                 : types.Text,
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
    'java.lang.Boolean'    : mysql_bit_type
}

FIELD_TYPE_CODE_MAP = {
    'text': 'types.Text',
    'json': 'types.JSON',
    'java.lang.String': 'types.String',
    'java.lang.Integer': 'types.Integer',
    'java.lang.Long': 'types.Integer',
    'java.lang.Byte': 'types.Integer',
    'java.lang.Short': 'types.Integer',
    'java.util.Calendar': 'types.Date',
    'java.util.Date': 'types.Date',
    'java.lang.Float': 'types.Float',
    'java.lang.Double': 'types.Float',
    'java.sql.Timestamp': 'types.DateTime',
    'java.math.BigDecimal': 'types.Numeric',
    'java.lang.Boolean': 'mysql_bit_type'
}

def gen_column_code(flddef: Field):
    field_type = FIELD_TYPE_MAP[flddef.type]
    if hasattr(flddef, 'length') and field_type in (types.Text, types.String):
        field_type = field_type(flddef.length)

    column_code = (
        "Column("
        f"'{flddef.column}', "
        f"{FIELD_TYPE_CODE_MAP.get(flddef.type, flddef.type)}, "
        f"index={flddef.indexed}, "
        f"unique={flddef.unique}, "
        f"nullable={not flddef.required}"
        ")"
    )
    return column_code

def gen_foreign_key_code(datamodel: Datamodel, reldef: Relationship):
    remote_tabledef = datamodel.get_table(reldef.relatedModelName) # TODO: this could be a method of relationship
    if remote_tabledef is None:
        return

    fk_target = '.'.join((untitle(remote_tabledef.name), remote_tabledef.idColumn))

    column_code = (
        "Column("
        f"'{reldef.column}', "
        "types.Integer, " # check this, maybe make dynamic
        f"ForeignKey('{fk_target}'), "
        f"nullable={not reldef.required}, "
        f"unique={reldef.type == 'one_to_one'}"
        ")"
    )
    return column_code

def gen_table_code(datamodel: Datamodel, tabledef: Table):
    columns = [ Column(tabledef.idColumn, types.Integer, primary_key=True) ]

    columns.extend(make_column(field) for field in tabledef.fields)
    for reldef in tabledef.relationships:
        if reldef.type in ('many-to-one', 'one-to-one') and hasattr(reldef, 'column'):
            fk = make_foreign_key(datamodel, reldef)
            if fk is not None: columns.append(fk)

    table_code = f"Table(" + '\n'
    table_code += f"name='{tabledef.table}'," + '\n'
    table_code += "metadata=MetaData()," + '\n'
    table_code += f"Column('{tabledef.idColumn}', types.Integer, primary_key=True)," + '\n'
    for flddef in columns:
        table_code += f"    {gen_column_code(flddef)}," + '\n'
    for reldef in tabledef.relationships:
        if reldef.type in ('many-to-one', 'one-to-one') and hasattr(reldef, 'column'):
            fk_code = gen_foreign_key_code(datamodel, reldef)
            if fk_code is not None:
                table_code += f"    {fk_code}," + '\n'
    return table_code

def gen_relationship_code(datamodel: Datamodel, tabledef: Table, reldef: Relationship):
    if not hasattr(reldef, 'column') or reldef.column is None:
        return None
    foreign_tabledef = datamodel.get_table(reldef.relatedModelName)
    if foreign_tabledef is None or reldef.column is None:
        return None
    backref = ''
    if hasattr(reldef, 'otherSideName') and reldef.otherSideName is not None:
        backref = f"backref=backref('{reldef.otherSideName}', uselist={reldef.type != 'one-to-one'})"
    rel_name = reldef.column[:-2]
    rel_name = untitle(rel_name)
    code = (
        f"{rel_name} = relationship("
        f"'{reldef.relatedModelName}', "
        f"foreign_keys='{tabledef.name}.{reldef.column}', "
        f"remote_side='{foreign_tabledef.name}.{foreign_tabledef.idColumn}', "
        f"{backref}"
    )
    if code.endswith(', '):
        code = code[:-2]
    code += ")"
    return code

def gen_tables_code(datamodel: Datamodel):
    tables_code = "tables = {\n"
    for table in datamodel.tables:
        tables_code += f"{TAB1}'{table.table}': {gen_table_code(datamodel, table)},\n"
    tables_code += "}\n"

def gen_class_code(tabledef: Table):
    cls_code = (
        "type("
        f"{tabledef.name}, "
        "(object,), "
        "{"
        f"tableid: {tabledef.tableId}, "
        f"_id: '{tabledef.idFieldName}'"
        "}"
        ")"
    )
    cls_code = (
        f"class {tabledef.name}():\n"
        f"{TAB1}tableid = {tabledef.tableId}\n"
        f"{TAB1}_id = '{tabledef.idFieldName}'\n"
    )
    return cls_code

def gen_sqlalchemy_table_classes_code(datamodel: Datamodel):
    code = (
        "from contextlib import contextmanager\n"
        "from MySQLdb.cursors import SSCursor\n"
        "from django.conf import settings\n"
        "from sqlalchemy import create_engine, ForeignKey, PrimaryKeyConstraint, Table, Column, MetaData\n"
        "from sqlalchemy.types import Integer, Numeric, Float, String, DateTime, Date, Text, JSON\n"
        "from sqlalchemy.import relationship, backref\n"
        "from sqlalchemy.ext.declarative import declarative_base\n"
        "from sqlalchemy.dialects.mysql import BIT as mysql_bit_type\n\n"
        "engine = create_engine(settings.SA_DATABASE_URL, pool_recycle=settings.SA_POOL_RECYCLE,\n"
        "               connect_args={'cursorclass': SSCursor})\n"
        "Session = sessionmaker(bind=engine)\n\n"
        "def make_session_context(session_maker):\n"
        "    @contextmanager\n"
        "    def _session_context():\n"
        "        session = session_maker()\n"
        "        try:\n"
        "            yield session\n"
        "            session.commit()\n"
        "        except:\n"
        "            session.rollback()\n"
        "            raise\n"
        "        finally:\n"
        "            session.close()\n"
        "    return _session_context\n\n"
        "session_context = make_session_context(Session)\n\n"
        "Base = declarative_base()\n\n"
    )
    for table in datamodel.tables:
        # if hasattr(table, 'sp7_only') and table.sp7_only and table.sp7_only != 'specify':
        #     continue
        code += f"class {table.name}(Base):\n"
        code += f"{TAB1}tableid = {table.tableId}\n"
        code += f"{TAB1}_id = '{table.idFieldName}'\n"
        code += f"{TAB1}__tablename__ = '{table.table}'\n\n"
        code += f"{TAB1}{table.idFieldName} = Column('{table.idFieldName.title()}', types.Integer, primary_key=True)\n"
        for field in table.fields:
            code += f"{TAB1}{field.name} = {gen_column_code(field)}\n"
        code += '\n'
        for rel in table.relationships:
            if rel.type in ('many-to-one', 'one-to-one') and hasattr(rel, 'column'):
                fk_code = gen_foreign_key_code(datamodel, rel)
                if fk_code is not None:
                    code += f"{TAB1}{rel.name.title()}ID = {gen_foreign_key_code(datamodel, rel)}\n"
                    # code += f"{TAB1}" # TODO: fix this
        code += '\n'
        for rel in table.relationships:
            rel_code = gen_relationship_code(datamodel, table, rel)
            if rel_code is not None:
                code += f"{TAB1}{rel_code}\n"
        code += '\n'
    # code += "tables = {\n"
    # for table in datamodel.tables:
    #     code += f"{TAB1}'{table.table}': {table.name},\n"
    # code += "}\n\n"
    code += "classes = {\n"
    for table in datamodel.tables:
        code += f"{TAB1}'{table.name}': {table.name},\n"
    code += "}\n\n"
    code += "models_by_tableid = dict((cls.tableid, cls) for cls in list(classes.values()))\n"
    return code

def untitle(s):
    return s[0].lower() + s[1:] if s else ''

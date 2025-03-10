from typing import List, Dict, Union, Optional, Iterable, TypeVar, Callable, cast
from xml.etree import ElementTree
import os
import warnings
import logging
logger = logging.getLogger(__name__)

from django.conf import settings # type: ignore
from django.utils.translation import gettext as _

from specifyweb.specify.config import sp6_dependent_fields, sp6_system_tables

class DoesNotExistError(Exception):
    pass

class TableDoesNotExistError(DoesNotExistError):
    pass

class FieldDoesNotExistError(DoesNotExistError):
    pass


T = TypeVar('T')
U = TypeVar('U')

def strict_to_optional(f: Callable[[U], T], lookup: U, strict: bool) -> Optional[T]:
    try:
        warnings.warn("deprecated. use strict version.", DeprecationWarning)
        return f(lookup)
    except DoesNotExistError:
        if not strict:
            return None
        raise

class Datamodel(object):
    tables: List['Table']

    def __init__(self, tables: List['Table'] = []):
        self.tables = tables

    def get_table(self, tablename: str, strict: bool=False) -> Optional['Table']:
        return strict_to_optional(self.get_table_strict, tablename, strict)

    def get_table_strict(self, tablename: str) -> 'Table':
        tablename = tablename.lower()
        for table in self.tables:
            if table.name.lower() == tablename:
                return table
        raise TableDoesNotExistError(_("No table with name: %(table_name)r") % {'table_name':tablename})

    def get_table_by_id(self, table_id: int, strict: bool=False) -> Optional['Table']:
        return strict_to_optional(self.get_table_by_id_strict, table_id, strict)

    def get_table_by_id_strict(self, table_id: int, strict: bool=False) -> 'Table':
        for table in self.tables:
            if table.tableId == table_id:
                return table
        raise TableDoesNotExistError(_("No table with id: %(table_id)d") % {'table_id':table_id})

    def reverse_relationship(self, relationship: 'Relationship') -> Optional['Relationship']:
        if hasattr(relationship, 'otherSideName'):
            return self.get_table_strict(relationship.relatedModelName).get_relationship(cast(str, relationship.otherSideName))
        else:
            return None

class Table(object):
    system: bool = False
    classname: str
    table: str
    tableId: int
    idColumn: str
    idFieldName: str
    idField: 'Field'
    view: Optional[str]
    searchDialog: Optional[str]
    fields: List['Field']
    indexes: List['Index']
    relationships: List['Relationship']
    fieldAliases: List[Dict[str, str]]
    sp7_only: bool = False
    django_app: str = 'specify'
    virtual_fiels: List['Field'] = []

    def __init__(self, classname: str = None, table: str = None, tableId: int = None, 
                idColumn: str = None, idFieldName: str = None, idField: 'Field' = None, 
                view: Optional[str] = None, searchDialog: Optional[str] = None, fields: List['Field'] = None,
                indexes: List['Index'] = None, relationships: List['Relationship'] = None, 
                fieldAliases: List[Dict[str, str]] = None, system: bool = False,
                sp7_only: bool = False, django_app: str = 'specify', virtual_fields: List['Field'] = None):
        if not classname:
            raise ValueError("classname is required")
        if not table:
            raise ValueError("table is required")
        if not tableId:
            raise ValueError("tableId is required")
        if not idColumn:
            raise ValueError("idColumn is required")
        if not idFieldName:
            raise ValueError("idFieldName is required")
        if not idField:
            raise ValueError("idField is required")
        self.system = system
        self.classname = classname
        self.table = table
        self.tableId = tableId
        self.idColumn = idColumn
        self.idFieldName = idFieldName
        self.idField = idField
        self.view = view
        self.searchDialog = searchDialog
        self.fields = fields if fields is not None else []
        self.indexes = indexes if indexes is not None else []
        self.relationships = relationships if relationships is not None else []
        self.fieldAliases = fieldAliases if fieldAliases is not None else []
        self.sp7_only = sp7_only
        self.django_app = django_app
        self.virtual_fields = virtual_fields if virtual_fields is not None else []

    @property
    def name(self) -> str:
        return self.classname.split('.')[-1]

    @property
    def django_name(self) -> str:
        return self.name.capitalize()

    @property
    def all_fields(self) -> List[Union['Field', 'Relationship']]:
        def af() -> Iterable[Union['Field', 'Relationship']]:
            for f in self.fields:
                yield f
            for r in self.relationships:
                yield r
            yield self.idField

        return list(af())


    def is_virtual_field(self, fieldname: str) -> bool:
        return fieldname in [f.name for f in self.virtual_fields]
   
    def get_field(self, fieldname: str, strict: bool=False) -> Union['Field', 'Relationship', None]:
        return strict_to_optional(self.get_field_strict, fieldname, strict)

    def get_field_strict(self, fieldname: str) -> Union['Field', 'Relationship']:
        fieldname = fieldname.lower()
        for field in self.all_fields:
            if field.name.lower() == fieldname:
                return field
        for field in self.virtual_fields:
            if field.name.lower() == fieldname:
                return field
        # if self.table == 'collectionobject' and fieldname == 'age': # TODO: This is temporary for testing, more conprehensive solution to come.
        #     return Field(name='age', column='age', indexed=False, unique=False, required=False, type='java.lang.Integer', length=0)
        raise FieldDoesNotExistError(_("Field %(field_name)s not in table %(table_name)s. ") % {'field_name':fieldname, 'table_name':self.name} +
                                     _("Fields: %(fields)s") % {'fields':[f.name for f in self.all_fields]})

    def get_relationship(self, name: str) -> 'Relationship':
        field = self.get_field_strict(name)
        if not isinstance(field, Relationship):
            raise FieldDoesNotExistError(f"Field {name} in table {self.name} is not a relationship.")
        return field
    
    def get_index(self, indexname: str, strict: bool=False) -> Optional['Index']:
        for index in self.indexes:
            if indexname in index.name:
                return index
        if strict:
            raise FieldDoesNotExistError(_("Index %(index_name)s not in table %(table_name)s. ") % {'index_name':indexname, 'table_name':self.name} +
                                         _("Indexes: %(indexes)s") % {'indexes':[i.name for i in self.indexes]})
        return None

    @property
    def attachments_field(self) -> Optional['Relationship']:
        try:
            return self.get_relationship('attachments')
        except FieldDoesNotExistError:
            try:
                return self.get_relationship(self.name + 'attachments')
            except FieldDoesNotExistError:
                return None

    @property
    def is_attachment_jointable(self) -> bool:
        return self.name.endswith('Attachment') and self.name != 'Attachment'

    def __repr__(self) -> str:
        return "<SpecifyTable: %s>" % self.name


class Field(object):
    is_relationship: bool = False
    name: str
    column: Optional[str]
    indexed: bool
    unique: bool
    required: bool = False
    type: Optional[str]
    length: Optional[int]

    def __init__(self, name: str = None, column: Optional[str] = None, indexed: bool = None, 
                 unique: bool = None, required: bool = None, type: str = None,
                 length: int = None, is_relationship: bool = False):
        if not name:
            raise ValueError("name is required")
        if not type: 
            raise ValueError('type is required')
        if not column and not is_relationship:
            raise ValueError("column is required")
        self.is_relationship = is_relationship
        self.name = name
        self.column = column
        self.indexed = indexed if indexed is not None else False
        self.unique = unique if unique is not None else False
        self.required = required if required is not None else False
        self.type = type
        self.length = length if length is not None else None

    def __repr__(self) -> str:
        return "<SpecifyField: %s>" % self.name

    def is_temporal(self) -> bool:
        return self.type in ('java.util.Date', 'java.util.Calendar', 'java.sql.Timestamp')

class Index(object):
    name: str
    column_names: List[str] = []

    def __init__(self, name: str = None, column_names: List[str] = None):
        if not name:
            raise ValueError("name is required")
        self.name = name or ''
        self.column_names = column_names if column_names is not None else []

    def __repr__(self) -> str:
        return "<SpecifyIndex: %s>" % self.name

class IdField(Field):
    name: str
    column: str
    type: str
    required: bool = True

    def __init__(self, name: str = None, column: str = None, 
                 type: str = None, required: bool = True):
        super().__init__(name, column, indexed=False, unique=False, required=required, type=type, length=0)

    def __repr__(self) -> str:
        return "<SpecifyIdField: %s>" % self.name

class Relationship(Field):
    is_relationship: bool = True
    dependent: bool = False
    name: str
    type: str
    required: bool
    relatedModelName: str
    column: Optional[str]
    otherSideName: Optional[str]

    def __init__(self, name: str = None, type: str = None, required: bool = None, 
                 relatedModelName: Optional[str] = None, column: Optional[str] = None,
                 otherSideName: Optional[str] = None, dependent: bool = False, is_relationship: bool = True):
        super().__init__(name, column, indexed=False, unique=False, required=required, 
                         type=type, length=0, is_relationship=is_relationship)

        if relatedModelName is None: 
            raise ValueError('relatedModelName is required for Relationship')
        
        if not column and type == 'many-to-one': 
            raise ValueError('column is required')
        
        self.dependent = dependent if dependent is not None else False
        self.column = column
        self.relatedModelName = relatedModelName
        self.otherSideName = otherSideName


def make_table(tabledef: ElementTree.Element) -> Table:
    iddef = tabledef.find('id')
    assert iddef is not None
    display = tabledef.find('display')
    table = Table(
        classname=tabledef.attrib['classname'],
        table=tabledef.attrib['table'],
        tableId=int(tabledef.attrib['tableid']),
        idColumn=iddef.attrib['column'],
        idFieldName=iddef.attrib['name'],
        idField=make_id_field(iddef),
        view=display.attrib.get('view', None) if display is not None else None,
        searchDialog=display.attrib.get('searchdlg', None) if display is not None else None,
        fields=[make_field(fielddef) for fielddef in tabledef.findall('field')],
        indexes=[make_index(indexdef) for indexdef in tabledef.findall('tableindex')],
        relationships=[make_relationship(reldef) for reldef in tabledef.findall('relationship')],
        fieldAliases=[make_field_alias(aliasdef) for aliasdef in tabledef.findall('fieldalias')]
    )
    return table

def make_id_field(fielddef: ElementTree.Element) -> IdField:
    return IdField(
        name=fielddef.attrib['name'],
        column=fielddef.attrib['column'],
        type=fielddef.attrib['type'],
        required=True
    )

def make_field(fielddef: ElementTree.Element) -> Field:
    field = Field(
        name=fielddef.attrib['name'],
        column=fielddef.attrib['column'],
        indexed=(fielddef.attrib['indexed'] == "true"),
        unique=(fielddef.attrib['unique'] == "true"),
        required=(fielddef.attrib['required'] == "true"),
        type=fielddef.attrib['type'],
        length=int(fielddef.attrib['length']) if 'length' in fielddef.attrib else None
    )
    return field

def make_index(indexdef: ElementTree.Element) -> Index:
    index = Index(
        name=indexdef.attrib['indexName'],
        column_names=indexdef.attrib['columnNames'].split(',')
    )
    return index

def make_relationship(reldef: ElementTree.Element) -> Relationship:
    rel = Relationship(
        name=reldef.attrib['relationshipname'],
        type=reldef.attrib['type'],
        required=(reldef.attrib['required'] == "true"),
        relatedModelName=reldef.attrib['classname'].split('.')[-1],
        column=reldef.attrib.get('columnname', None) if 'columnname' in reldef.attrib else None,
        otherSideName=reldef.attrib.get('othersidename', None) if 'othersidename' in reldef.attrib else None
    )
    return rel

def make_field_alias(aliasdef: ElementTree.Element) -> Dict[str, str]:
    alias = dict(aliasdef.attrib)
    return alias

def load_datamodel() -> Optional[Datamodel]:
    try:
        datamodeldef = ElementTree.parse(os.path.join(settings.SPECIFY_CONFIG_DIR, 'specify_datamodel.xml'))
    except FileNotFoundError:
        return None
    datamodel = Datamodel()
    datamodel.tables = [make_table(tabledef) for tabledef in datamodeldef.findall('table')]
    add_collectingevents_to_locality(datamodel)

    flag_dependent_fields(datamodel)
    flag_system_tables(datamodel)

    return datamodel

def add_collectingevents_to_locality(datamodel: Datamodel) -> None:
    rel = Relationship(
        name='collectingEvents',
        type='one-to-many',
        required=False,
        relatedModelName='collectingEvent',
        otherSideName='locality'
    )
    datamodel.get_table_strict('collectingevent').get_relationship('locality').otherSideName = 'collectingEvents'
    datamodel.get_table_strict('locality').relationships.append(rel)

def flag_dependent_fields(datamodel: Datamodel) -> None:
    for name in sp6_dependent_fields:
        tablename, fieldname = name.split('.')
        try:
            field = datamodel.get_table_strict(tablename).get_relationship(fieldname)
        except DoesNotExistError as e:
            logger.warn("missing table or relationship setting dependent field: %s", name)
            continue

        field.dependent = True

    for table in datamodel.tables:
        if table.is_attachment_jointable:
            table.get_relationship('attachment').dependent = True
        if table.attachments_field:
            table.attachments_field.dependent = True

def flag_system_tables(datamodel: Datamodel) -> None:
    for name in sp6_system_tables:
        datamodel.get_table_strict(name).system = True

    for table in datamodel.tables:
        if table.is_attachment_jointable:
            table.system = True
        if table.name.endswith('treedef') or table.name.endswith('treedefitem'):
            table.system = True
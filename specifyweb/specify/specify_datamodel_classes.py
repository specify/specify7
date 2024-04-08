# from operator import index
from typing import List, Dict, Union, Optional, Iterable, TypeVar, Callable
from xml.etree import ElementTree
# from dataclasses import dataclass
import os
import warnings
import logging
logger = logging.getLogger(__name__)

from django.conf import settings # type: ignore
from django.utils.translation import gettext as _

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

# @dataclass
class Datamodel:
    tables: List['Table']

    def __init__(self, tables: List['Table'] = []):
        self.tables = tables

    def get_table(self, tablename: str, strict: bool=False) -> Optional['Table']:
        return strict_to_optional(self.get_table_strict, tablename, strict)

    def get_table_strict(self, tablename: str) -> 'Table':
        tablename = tablename.lower()
        last_table = None
        for table in self.tables:
            if table is None:
                raise Exception(f"table is None, last table {last_table}")
            if table.name is None:
                raise Exception(f"table name is None in table {table}")
            if table.name.lower() == tablename:
                return table
            last_table = table
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
            return self.get_table_strict(relationship.relatedModelName).get_relationship(relationship.otherSideName)
        else:
            return None

# @dataclass
class Table:
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
    system: bool = False

    def __init__(self, classname: Optional[str] = None, table: Optional[str] = None, tableId: Optional[int] = None, 
                 idColumn: Optional[str] = None, idFieldName: Optional[str] = None, idField: Optional['Field'] = None, 
                 view: Optional[str] = None, searchDialog: Optional[str] = None, fields: Optional[List['Field']] = None,
                 indexes: Optional[List['Index']] = None, relationships: Optional[List['Relationship']] = None, 
                 fieldAliases: Optional[List[Dict[str, str]]] = None, system: bool = False):
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

    @property
    def name(self) -> str:
        if self.classname is None:
            raise Exception(f"table {self.table} has no classname")
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


    def get_field(self, fieldname: str, strict: bool=False) -> Union['Field', 'Relationship', None]:
        return strict_to_optional(self.get_field_strict, fieldname, strict)

    def get_field_strict(self, fieldname: str) -> Union['Field', 'Relationship']:
        fieldname = fieldname.lower()
        for field in self.all_fields:
            if field.name.lower() == fieldname:
                return field
        raise FieldDoesNotExistError(_("Field %(field_name)s not in table %(table_name)s. ") % {'field_name':fieldname, 'table_name':self.name} +
                                     _("Fields: %(fields)s") % {'fields':[f.name for f in self.all_fields]})

    def get_relationship(self, name: str) -> 'Relationship':
        field = self.get_field_strict(name)
        if not isinstance(field, Relationship):
            raise FieldDoesNotExistError(f"Field {name} in table {self.name} is not a relationship.")
        return field

    def get_index(self, indexname: str, strict: bool=False) -> 'Index':
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


# @dataclass
class Field:
    is_relationship: bool = False
    name: str
    column: str
    indexed: bool
    unique: bool
    required: bool
    type: str
    length: int

    def __init__(self, name: Optional[str] = None, column: Optional[str] = None, indexed: Optional[bool] = None, 
                 unique: Optional[bool] = None, required: Optional[bool] = None, type: Optional[str] = None, 
                 length: Optional[int] = None, is_relationship: bool = False):
        self.is_relationship = is_relationship
        self.name = name
        self.column = column
        self.indexed = indexed
        self.unique = unique
        self.required = required
        self.type = type
        self.length = length

    def __repr__(self) -> str:
        return "<SpecifyField: %s>" % self.name

    def is_temporal(self) -> bool:
        return self.type in ('java.util.Date', 'java.util.Calendar', 'java.sql.Timestamp')

# @dataclass
class Index:
    name: str
    column_names: List[str] = []

    def __init__(self, name: Optional[str] = None, column_names: Optional[List[str]] = None):
        self.name = name
        self.column_names = column_names if column_names is not None else []

    def __repr__(self) -> str:
        return "<SpecifyIndex: %s>" % self.name

# @dataclass
class IdField(Field):
    name: str
    column: str
    type: str
    required: bool = True

    def __init__(self, name: Optional[str] = None, column: Optional[str] = None, 
                 type: Optional[str] = None, required: bool = True):
        super().__init__(name, column, indexed=False, unique=False, required=required, type=type, length=0)

    def __repr__(self) -> str:
        return "<SpecifyIdField: %s>" % self.name

# @dataclass
class Relationship(Field):
    is_relationship: bool = True
    dependent: bool = False
    name: str
    type: str
    required: bool
    relatedModelName: str
    column: str
    otherSideName: str
    is_to_many: bool = lambda self: 'to_many' in self.type

    def __init__(self, name: Optional[str] = None, type: Optional[str] = None, required: Optional[bool] = None, 
                 relatedModelName: Optional[str] = None, column: Optional[str] = None,
                 otherSideName: Optional[str] = None, dependent: bool = False, is_relationship: bool = True,
                 is_to_many: Optional[bool] = None):
        super().__init__(name, column, indexed=False, unique=False, required=required, 
                         type=type, length=0, is_relationship=is_relationship)
        self.dependent = dependent
        self.relatedModelName = relatedModelName
        self.otherSideName = otherSideName
        # self.is_to_many = is_to_many if is_to_many is not None else 'to_many' in self.type

def add_collectingevents_to_locality(datamodel: Datamodel) -> None:
    rel = Relationship()
    rel.name = 'collectingEvents'
    rel.type = 'one-to-many'
    rel.required = False
    rel.relatedModelName = 'collectingEvent'
    rel.otherSideName = 'locality'

    datamodel.get_table_strict('collectingevent').get_relationship('locality').otherSideName = 'collectingEvents'
    datamodel.get_table_strict('locality').relationships.append(rel)

def flag_dependent_fields(datamodel: Datamodel) -> None:
    for name in dependent_fields:
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
    for name in system_tables:
        datamodel.get_table_strict(name).system = True

    for table in datamodel.tables:
        if table.is_attachment_jointable:
            table.system = True
        if table.name.endswith('treedef') or table.name.endswith('treedefitem'):
            table.system = True

dependent_fields = {
    'Accession.accessionagents',
    'Accession.accessionauthorizations',
    'Accession.addressofrecord',
    'Agent.addresses',
    'Agent.agentgeographies',
    'Agent.agentspecialties',
    'Agent.groups',
    'Agent.identifiers',
    'Agent.variants',
    'Borrow.addressofrecord',
    'Borrow.borrowagents',
    'Borrow.borrowmaterials',
    'Borrow.shipments',
    'Borrowmaterial.borrowreturnmaterials',
    'Collectingevent.collectingeventattribute',
    'Collectingevent.collectingeventattrs',
    'Collectingevent.collectingeventauthorizations',
    'Collectingevent.collectors',
    'Collectingtrip.collectingtripattribute',
    'Collectingtrip.collectingtripauthorizations',
    'Collectingtrip.fundingagents',
    'Collectionobject.collectionobjectattribute',
    'Collectionobject.collectionobjectattrs',
    'Collectionobject.collectionobjectcitations',
    'Collectionobject.conservdescriptions',
    'Collectionobject.determinations',
    'Collectionobject.dnasequences',
    'Collectionobject.exsiccataitems',
    'CollectionObject.leftsiderels',
    'Collectionobject.otheridentifiers',
    'Collectionobject.preparations',
    'Collectionobject.collectionobjectproperties',
    'CollectionObject.rightsiderels',
    'Collectionobject.treatmentevents',
    'Collectionobject.voucherrelationships',
    'Commonnametx.citations',
    'Conservdescription.events',
    'Deaccession.deaccessionagents',
    'Determination.determinationcitations',
    'Determination.determiners',
    'Disposal.disposalagents',
    'Disposal.disposalpreparations',
    'Dnasequence.dnasequencingruns',
    'Dnasequencingrun.citations',
    'Exchangein.exchangeinpreps',
    'Exchangein.addressofrecord',
    'Exchangeout.exchangeoutpreps',
    'Exchangeout.addressofrecord',
    'Exsiccata.exsiccataitems',
    'Fieldnotebook.pagesets',
    'Fieldnotebookpageset.pages',
    'Gift.addressofrecord',
    'Gift.giftagents',
    'Gift.giftpreparations',
    'Gift.shipments',
    'Latlonpolygon.points',
    'Loan.addressofrecord',
    'Loan.loanagents',
    'Loan.loanpreparations',
    'Loan.shipments',
    'Loanpreparation.loanreturnpreparations',
    'Locality.geocoorddetails',
    'Locality.latlonpolygons',
    'Locality.localitycitations',
    'Locality.localitydetails',
    'Locality.localitynamealiass',
    'Materialsample.dnasequences',
    'Picklist.picklistitems',
    'Preparation.materialsamples',
    'Preparation.preparationattribute',
    'Preparation.preparationattrs',
    'Preparation.preparationproperties',
    'Preptype.attributedefs',
    'Referencework.authors',
    'Repositoryagreement.addressofrecord',
    'Repositoryagreement.repositoryagreementagents',
    'Repositoryagreement.repositoryagreementauthorizations',
    'Spquery.fields',
    'Taxon.commonnames',
    'Taxon.taxoncitations',
    'Taxon.taxonattribute',
    'Workbench.workbenchtemplate',
    'Workbenchtemplate.workbenchtemplatemappingitems',
}

system_tables = {
    'Attachment',
    'Attachmentimageattribute',
    'Attachmentmetadata',
    'Attachmenttag',
    'Attributedef',
    'Autonumberingscheme',
    'Datatype',
    'Morphbankview',
    'Picklist',
    'Picklistitem',
    'Recordset',
    'Recordsetitem',
    'Spappresource',
    'Spappresourcedata',
    'Spappresourcedir',
    'Spauditlog',
    'Spauditlogfield',
    'Spexportschema',
    'Spexportschemaitem',
    'Spexportschemaitemmapping',
    'Spexportschemamapping',
    'Spfieldvaluedefault',
    'Splocalecontainer',
    'Splocalecontaineritem',
    'Splocaleitemstr',
    'Sppermission',
    'Spprincipal',
    'Spquery',
    'Spqueryfield',
    'Spreport',
    'Sptasksemaphore',
    'Spversion',
    'Spviewsetobj',
    'Spvisualquery',
    'Specifyuser',
    'Workbench',
    'Workbenchdataitem',
    'Workbenchrow',
    'Workbenchrowexportedrelationship',
    'Workbenchrowimage',
    'Workbenchtemplate',
    'Workbenchtemplatemappingitem',
}

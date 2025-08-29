from collections import OrderedDict
import json

from django.conf import settings

def table_to_dict(table):
    data = OrderedDict()
    data['classname'] = table.classname
    data['table'] = table.table
    data['tableId'] = table.tableId
    if hasattr(table, 'view') and table.view is not None:
        data['view'] = table.view
    if table.classname in NULL_VIEW_OUTPUT:
        data['view'] = None
    if hasattr(table, 'searchDialog') and table.searchDialog is not None:
        data['searchDialog'] = table.searchDialog
    if table.classname in NULL_SEARCH_DIALOG_OUTPUT:
        data['searchDialog'] = None
    data['system'] = table.system
    data['idColumn'] = table.idColumn
    data['idFieldName'] = table.idFieldName
    data['fields'] = [field_to_dict(field) for field in table.fields]
    data['relationships'] = [rel_to_dict(table, rel) for rel in table.relationships]
    data['fieldAliases'] = table.fieldAliases
    return data

def field_to_dict(field):
    data = OrderedDict()
    data['name'] = field.name
    data['column'] = field.column
    data['indexed'] = field.indexed
    data['unique'] = field.unique
    data['required'] = field.required
    data['type'] = field.type
    if hasattr(field, 'length') and field.length is not None:
        data['length'] = field.length
    return data

def rel_to_dict(table, rel):
    data = OrderedDict()
    data['name'] = rel.name
    data['type'] = rel.type
    data['required'] = rel.required
    data['dependent'] = rel.dependent
    data['relatedModelName'] = rel.relatedModelName
    if hasattr(rel, 'column') and rel.column is not None and rel.column != '':
        data['column'] =  rel.column
    if hasattr(rel, 'otherSideName') and rel.otherSideName is not None and rel.otherSideName != '':
        data['otherSideName'] = rel.otherSideName
    return data

def datamodel_to_seq(datamodel):
    return [table_to_dict(table) for table in datamodel.tables]

def datamodel_to_json(datamodel):
    indent = {'indent': 2} if settings.DEBUG else {}
    return json.dumps(datamodel_to_seq(datamodel), **indent)

# These are added because load_datamodel sets the view and searchDialog to None,
# even when they are not specified.  This is to create a well structured Table class.
# With these, the context/datamodel.json output will be the same as in Specify 6.8.03.
NULL_SEARCH_DIALOG_OUTPUT = {
    'edu.ku.brc.specify.datamodel.AccessionAuthorization',
    'edu.ku.brc.specify.datamodel.Address',
    'edu.ku.brc.specify.datamodel.AgentAttachment',
    'edu.ku.brc.specify.datamodel.AgentIdentifier',
    'edu.ku.brc.specify.datamodel.AgentVariant',
    'edu.ku.brc.specify.datamodel.Attachment',
    'edu.ku.brc.specify.datamodel.Borrow',
    'edu.ku.brc.specify.datamodel.BorrowAgent',
    'edu.ku.brc.specify.datamodel.BorrowAttachment',
    'edu.ku.brc.specify.datamodel.BorrowMaterial',
    'edu.ku.brc.specify.datamodel.BorrowReturnMaterial',
    'edu.ku.brc.specify.datamodel.CollectingEventAttachment',
    'edu.ku.brc.specify.datamodel.CollectingEventAuthorization',
    'edu.ku.brc.specify.datamodel.CollectingTripAttachment',
    'edu.ku.brc.specify.datamodel.CollectingTripAuthorization',
    'edu.ku.brc.specify.datamodel.Collection',
    'edu.ku.brc.specify.datamodel.CollectionObjectAttachment',
    'edu.ku.brc.specify.datamodel.CollectionObjectProperty',
    'edu.ku.brc.specify.datamodel.CollectionRelationship',
    'edu.ku.brc.specify.datamodel.ConservDescriptionAttachment',
    'edu.ku.brc.specify.datamodel.ConservEventAttachment',
    'edu.ku.brc.specify.datamodel.DNASequenceAttachment',
    'edu.ku.brc.specify.datamodel.DNASequencingRunAttachment',
    'edu.ku.brc.specify.datamodel.DisposalPreparation',
    'edu.ku.brc.specify.datamodel.ExchangeIn',
    'edu.ku.brc.specify.datamodel.ExchangeInPrep',
    'edu.ku.brc.specify.datamodel.ExchangeOut',
    'edu.ku.brc.specify.datamodel.ExchangeOutPrep',
    'edu.ku.brc.specify.datamodel.Extractor',
    'edu.ku.brc.specify.datamodel.FieldNotebookAttachment',
    'edu.ku.brc.specify.datamodel.FieldNotebookPageAttachment',
    'edu.ku.brc.specify.datamodel.FieldNotebookPageSetAttachment',
    'edu.ku.brc.specify.datamodel.FundingAgent',
    'edu.ku.brc.specify.datamodel.Gift',
    'edu.ku.brc.specify.datamodel.GiftAgent',
    'edu.ku.brc.specify.datamodel.GiftAttachment',
    'edu.ku.brc.specify.datamodel.GiftPreparation',
    'edu.ku.brc.specify.datamodel.GroupPerson',
    'edu.ku.brc.specify.datamodel.InfoRequest',
    'edu.ku.brc.specify.datamodel.Institution',
    'edu.ku.brc.specify.datamodel.Loan',
    'edu.ku.brc.specify.datamodel.LoanAgent',
    'edu.ku.brc.specify.datamodel.LoanAttachment',
    'edu.ku.brc.specify.datamodel.LoanPreparation',
    'edu.ku.brc.specify.datamodel.LocalityAttachment',
    'edu.ku.brc.specify.datamodel.OtherIdentifier',
    'edu.ku.brc.specify.datamodel.PcrPerson',
    'edu.ku.brc.specify.datamodel.PermitAttachment',
    'edu.ku.brc.specify.datamodel.PickList',
    'edu.ku.brc.specify.datamodel.PickListItem',
    'edu.ku.brc.specify.datamodel.PreparationAttachment',
    'edu.ku.brc.specify.datamodel.PreparationProperty',
    'edu.ku.brc.specify.datamodel.ReferenceWorkAttachment',
    'edu.ku.brc.specify.datamodel.RepositoryAgreementAttachment',
    'edu.ku.brc.specify.datamodel.StorageAttachment',
    'edu.ku.brc.specify.datamodel.TaxonAttachment',
    'edu.ku.brc.specify.datamodel.VoucherRelationship'
}

NULL_VIEW_OUTPUT = {
    'edu.ku.brc.specify.datamodel.AccessionAuthorization',
    'edu.ku.brc.specify.datamodel.CollectingEventAuthorization',
    'edu.ku.brc.specify.datamodel.CollectingTripAuthorization',
    'edu.ku.brc.specify.datamodel.CollectionRelType'
}
from xml.etree import ElementTree
import os
import logging
from django.conf import settings # type: ignore
from django.utils.translation import gettext as _

logger = logging.getLogger(__name__)

TAB1 = '    '
TAB2 = TAB1 + TAB1
TAB3 = TAB2 + TAB1

def gen_field_code(fielddef: ElementTree.Element) -> str:
    field_code = (
        f"Field("
        f"name='{fielddef.attrib['name']}', "
        f"column='{fielddef.attrib['column']}', "
        f"indexed={fielddef.attrib['indexed'] == 'true'}, "
        f"unique={fielddef.attrib['unique'] == 'true'}, "
        f"required={fielddef.attrib['required'] == 'true'}, "
        f"type='{fielddef.attrib['type']}'"
    )
    if 'length' in fielddef.attrib:
        field_code += f", length={fielddef.attrib['length']}"
    return field_code + ")"

def gen_id_field_code(fielddef: ElementTree.Element) -> str:
    return (
        f"IdField("
        f"name='{fielddef.attrib['name']}', "
        f"column='{fielddef.attrib['column']}', "
        f"type='{fielddef.attrib['type']}'"
        f")"
    )

def gen_relationship_code(reldef: ElementTree.Element, tabledef: ElementTree.Element = None) -> str:
    code = (
        f"Relationship("
        f"is_relationship=True, " # check assignement logic
        # f"dependent={reldef.attrib['dependent'] == 'true'}," # check assignement logic
        f"name='{reldef.attrib['relationshipname']}', "
        f"type='{reldef.attrib['type']}',"
        f"required={reldef.attrib['required'] == 'true'}, "
        # f"is_to_many={'to_many' in reldef.attrib['type']}, "
        f"relatedModelName='{reldef.attrib['classname'].split('.')[-1]}'"
    )
    if 'columnname' in reldef.attrib:
        code += f", column='{reldef.attrib['columnname']}'"
    if 'othersidename' in reldef.attrib:
        code += f", otherSideName='{reldef.attrib['othersidename']}'"
    # if tabledef.attrib['table'] == 'collectingevent' and reldef.attrib['relationshipname'] == 'locality':
    #     code += f", otherSideName='collectingEvents'"
    code += ")"

    return code

def gen_index_code(indexdef: ElementTree.Element) -> str:
    return (
        f"Index("
        f"name='{indexdef.attrib['indexName']}', "
        f"column_names={indexdef.attrib['columnNames'].split(',')}"
        f")"
    )

def gen_field_alias_code(aliasdef: ElementTree.Element) -> str:
    return (
        "{"
        f"{', '.join(f'{repr(k)}:{repr(v)}' for k, v in aliasdef.attrib.items())}"
        "}"
    )

def gen_list_code(items, gen_item_code, indent):
    return ',\n'.join(f"{indent}{gen_item_code(item)}" for item in items)

def gen_table_code(tabledef: ElementTree.Element) -> str:
    table_code = (
        f"Table(\n"
        # f"{TAB2}system='{tabledef.attrib['system']}',\n"
        f"{TAB2}classname='{tabledef.attrib['classname']}',\n"
        f"{TAB2}table='{tabledef.attrib['table']}',\n"
        f"{TAB2}tableId={tabledef.attrib['tableid']},\n"
        f"{TAB2}idColumn='{tabledef.find('id').attrib['column']}',\n"
        f"{TAB2}idFieldName='{tabledef.find('id').attrib['name']}',\n"
        f"{TAB2}idField={gen_id_field_code(tabledef.find('id'))},\n"
        f"{TAB2}fields=[\n"
        f"{gen_list_code(tabledef.findall('field'), gen_field_code, TAB3)}\n"
        f"{TAB2}],\n"
        f"{TAB2}indexes=[\n"
        f"{gen_list_code(tabledef.findall('tableindex'), gen_index_code, TAB3)}\n"
        f"{TAB2}],\n"
        f"{TAB2}relationships=[\n"
        f"{gen_list_code(tabledef.findall('relationship'), lambda reldef: gen_relationship_code(reldef, tabledef), TAB3)}\n"
        f"{TAB2}],\n"
        f"{TAB2}fieldAliases=[\n"
        f"{gen_list_code(tabledef.findall('fieldalias'), gen_field_alias_code, TAB3)}\n"
        f"{TAB2}]"
    )
    display = tabledef.find('display')
    if display is not None:
        view = display.attrib.get('view', None)
        searchDialog = display.attrib.get('searchdlg', None)
        if view is not None:
            table_code += f",\n{TAB2}view='{view}',\n"
        else:
            table_code += f",\n{TAB2}view=None,\n"
        if searchDialog is not None:
            table_code += f"{TAB2}searchDialog='{searchDialog}'"
        else:
            table_code += f"{TAB2}searchDialog=None"
        # table_code += (
        #     f",\n{TAB2}view='{display.attrib.get('view', None)}',\n"
        #     f"{TAB2}searchDialog='{display.attrib.get('searchdlg', None)}'"
        # )
    return table_code + "\n    )"

def gen_datamodel_code(datamodeldef: ElementTree.Element) -> str:
    tables_code = ",\n    ".join(gen_table_code(tabledef) for tabledef in datamodeldef.findall('table'))
    return (
        "datamodel = Datamodel("
        f"tables=[\n{TAB1}"
        f"{tables_code}\n"
        "])"
    )

def build_datamodel_code_from_xml():
    datamodeldef = ElementTree.parse(os.path.join(settings.SPECIFY_CONFIG_DIR, 'specify_datamodel.xml'))
    datamodel_code = "from .specify_datamodel_classes import *\n\n"
    datamodel_code += gen_datamodel_code(datamodeldef)
    datamodel_code += "\n\nadd_collectingevents_to_locality(datamodel)"
    datamodel_code += "\nflag_dependent_fields(datamodel)"
    datamodel_code += "\nflag_system_tables(datamodel)\n"
    return datamodel_code

def is_dependent_field(reldef: ElementTree.Element, tabledef: ElementTree.Element) -> bool:
    pass

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
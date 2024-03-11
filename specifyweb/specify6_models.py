# from django.db import models
# from closure_tree import ClosureModel

# class Accession(Table):
#     # classname = edu.ku.brc.specify.datamodel.Accession
#     table = accession
#     tableId = 7
#     idColumn = AccessionID
#     idFieldName = accessionId
#     idField = <SpecifyIdField: accessionId>
#     view = Accession
#     searchDialog = AccessionSearch
#     fields = [<SpecifyField: accessionCondition>, <SpecifyField: accessionNumber>, <SpecifyField: dateAccessioned>, <SpecifyField: dateAcknowledged>, <SpecifyField: dateReceived>, <SpecifyField: integer1>, <SpecifyField: integer2>, <SpecifyField: integer3>, <SpecifyField: number1>, <SpecifyField: number2>, <SpecifyField: remarks>, <SpecifyField: status>, <SpecifyField: text1>, <SpecifyField: text2>, <SpecifyField: text3>, <SpecifyField: text4>, <SpecifyField: text5>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: totalValue>, <SpecifyField: type>, <SpecifyField: verbatimDate>, <SpecifyField: version>, <SpecifyField: yesNo1>, <SpecifyField: yesNo2>]
#     relationships = [<SpecifyField: accessionAgents>, <SpecifyField: accessionAttachments>, <SpecifyField: accessionAuthorizations>, <SpecifyField: accessionCitations>, <SpecifyField: addressOfRecord>, <SpecifyField: appraisals>, <SpecifyField: collectionObjects>, <SpecifyField: createdByAgent>, <SpecifyField: division>, <SpecifyField: modifiedByAgent>, <SpecifyField: repositoryAgreement>, <SpecifyField: treatmentEvents>]
#     fieldAliases = []

# class AccessionAgent(Table):
#     # classname = edu.ku.brc.specify.datamodel.AccessionAgent
#     table = accessionagent
#     tableId = 12
#     idColumn = AccessionAgentID
#     idFieldName = accessionAgentId
#     idField = <SpecifyIdField: accessionAgentId>
#     view = AccessionAgent
#     searchDialog = AccessionAgentSearch
#     fields = [<SpecifyField: remarks>, <SpecifyField: role>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: accession>, <SpecifyField: agent>, <SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>, <SpecifyField: repositoryAgreement>]
#     fieldAliases = []

# class AccessionAttachment(Table):
#     # classname = edu.ku.brc.specify.datamodel.AccessionAttachment
#     table = accessionattachment
#     tableId = 108
#     idColumn = AccessionAttachmentID
#     idFieldName = accessionAttachmentId
#     idField = <SpecifyIdField: accessionAttachmentId>
#     view = ObjectAttachment
#     searchDialog = AttachmentSearch
#     fields = [<SpecifyField: ordinal>, <SpecifyField: remarks>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: accession>, <SpecifyField: attachment>, <SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []
#     system = True

# class AccessionAuthorization(Table):
#     # classname = edu.ku.brc.specify.datamodel.AccessionAuthorization
#     table = accessionauthorization
#     tableId = 13
#     idColumn = AccessionAuthorizationID
#     idFieldName = accessionAuthorizationId
#     idField = <SpecifyIdField: accessionAuthorizationId>
#     view = None
#     searchDialog = None
#     fields = [<SpecifyField: remarks>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: accession>, <SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>, <SpecifyField: permit>, <SpecifyField: repositoryAgreement>]
#     fieldAliases = []

# class AccessionCitation(Table):
#     # classname = edu.ku.brc.specify.datamodel.AccessionCitation
#     table = accessioncitation
#     tableId = 159
#     idColumn = AccessionCitationID
#     idFieldName = accessionCitationId
#     idField = <SpecifyIdField: accessionCitationId>
#     fields = [<SpecifyField: figureNumber>, <SpecifyField: isFigured>, <SpecifyField: pageNumber>, <SpecifyField: plateNumber>, <SpecifyField: remarks>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: accession>, <SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>, <SpecifyField: referenceWork>]
#     fieldAliases = []

# class Address(Table):
#     # classname = edu.ku.brc.specify.datamodel.Address
#     table = address
#     tableId = 8
#     idColumn = AddressID
#     idFieldName = addressId
#     idField = <SpecifyIdField: addressId>
#     view = Address
#     searchDialog = None
#     fields = [<SpecifyField: address>, <SpecifyField: address2>, <SpecifyField: address3>, <SpecifyField: address4>, <SpecifyField: address5>, <SpecifyField: city>, <SpecifyField: country>, <SpecifyField: endDate>, <SpecifyField: fax>, <SpecifyField: isCurrent>, <SpecifyField: isPrimary>, <SpecifyField: isShipping>, <SpecifyField: ordinal>, <SpecifyField: phone1>, <SpecifyField: phone2>, <SpecifyField: positionHeld>, <SpecifyField: postalCode>, <SpecifyField: remarks>, <SpecifyField: roomOrBuilding>, <SpecifyField: startDate>, <SpecifyField: state>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: typeOfAddr>, <SpecifyField: version>]
#     relationships = [<SpecifyField: agent>, <SpecifyField: createdByAgent>, <SpecifyField: divisions>, <SpecifyField: insitutions>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []

# class AddressOfRecord(Table):
#     # classname = edu.ku.brc.specify.datamodel.AddressOfRecord
#     table = addressofrecord
#     tableId = 125
#     idColumn = AddressOfRecordID
#     idFieldName = addressOfRecordId
#     idField = <SpecifyIdField: addressOfRecordId>
#     fields = [<SpecifyField: address>, <SpecifyField: address2>, <SpecifyField: city>, <SpecifyField: country>, <SpecifyField: postalCode>, <SpecifyField: remarks>, <SpecifyField: state>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: accessions>, <SpecifyField: agent>, <SpecifyField: createdByAgent>, <SpecifyField: exchangeIns>, <SpecifyField: exchangeOuts>, <SpecifyField: loans>, <SpecifyField: modifiedByAgent>, <SpecifyField: repositoryAgreements>]
#     fieldAliases = []

# class Agent(Table):
#     # classname = edu.ku.brc.specify.datamodel.Agent
#     table = agent
#     tableId = 5
#     idColumn = AgentID
#     idFieldName = agentId
#     idField = <SpecifyIdField: agentId>
#     view = Agent
#     searchDialog = AgentSearch
#     fields = [<SpecifyField: abbreviation>, <SpecifyField: agentType>, <SpecifyField: date1>, <SpecifyField: date1Precision>, <SpecifyField: date2>, <SpecifyField: date2Precision>, <SpecifyField: dateOfBirth>, <SpecifyField: dateOfBirthPrecision>, <SpecifyField: dateOfDeath>, <SpecifyField: dateOfDeathPrecision>, <SpecifyField: dateType>, <SpecifyField: email>, <SpecifyField: firstName>, <SpecifyField: guid>, <SpecifyField: initials>, <SpecifyField: integer1>, <SpecifyField: integer2>, <SpecifyField: interests>, <SpecifyField: jobTitle>, <SpecifyField: lastName>, <SpecifyField: middleInitial>, <SpecifyField: remarks>, <SpecifyField: suffix>, <SpecifyField: text1>, <SpecifyField: text2>, <SpecifyField: text3>, <SpecifyField: text4>, <SpecifyField: text5>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: title>, <SpecifyField: url>, <SpecifyField: verbatimDate1>, <SpecifyField: verbatimDate2>, <SpecifyField: version>]
#     relationships = [<SpecifyField: addresses>, <SpecifyField: agentAttachments>, <SpecifyField: agentGeographies>, <SpecifyField: agentSpecialties>, <SpecifyField: collContentContact>, <SpecifyField: collTechContact>, <SpecifyField: collectors>, <SpecifyField: createdByAgent>, <SpecifyField: division>, <SpecifyField: groups>, <SpecifyField: identifiers>, <SpecifyField: instContentContact>, <SpecifyField: instTechContact>, <SpecifyField: members>, <SpecifyField: modifiedByAgent>, <SpecifyField: orgMembers>, <SpecifyField: organization>, <SpecifyField: specifyUser>, <SpecifyField: variants>]
#     fieldAliases = []

# class AgentAttachment(Table):
#     # classname = edu.ku.brc.specify.datamodel.AgentAttachment
#     table = agentattachment
#     tableId = 109
#     idColumn = AgentAttachmentID
#     idFieldName = agentAttachmentId
#     idField = <SpecifyIdField: agentAttachmentId>
#     view = AgentAttachment
#     searchDialog = None
#     fields = [<SpecifyField: ordinal>, <SpecifyField: remarks>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: agent>, <SpecifyField: attachment>, <SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []
#     system = True

# class AgentGeography(Table):
#     # classname = edu.ku.brc.specify.datamodel.AgentGeography
#     table = agentgeography
#     tableId = 78
#     idColumn = AgentGeographyID
#     idFieldName = agentGeographyId
#     idField = <SpecifyIdField: agentGeographyId>
#     fields = [<SpecifyField: remarks>, <SpecifyField: role>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: agent>, <SpecifyField: createdByAgent>, <SpecifyField: geography>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []

# class AgentIdentifier(Table):
#     # classname = edu.ku.brc.specify.datamodel.AgentIdentifier
#     table = agentidentifier
#     tableId = 168
#     idColumn = AgentIdentifierID
#     idFieldName = agentIdentifierId
#     idField = <SpecifyIdField: agentIdentifierId>
#     view = AgentIdentifier
#     searchDialog = None
#     fields = [<SpecifyField: date1>, <SpecifyField: date1Precision>, <SpecifyField: date2>, <SpecifyField: date2Precision>, <SpecifyField: identifier>, <SpecifyField: identifierType>, <SpecifyField: remarks>, <SpecifyField: text1>, <SpecifyField: text2>, <SpecifyField: text3>, <SpecifyField: text4>, <SpecifyField: text5>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>, <SpecifyField: yesNo1>, <SpecifyField: yesNo2>, <SpecifyField: yesNo3>, <SpecifyField: yesNo4>, <SpecifyField: yesNo5>]
#     relationships = [<SpecifyField: agent>, <SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []

# class AgentSpecialty(Table):
#     # classname = edu.ku.brc.specify.datamodel.AgentSpecialty
#     table = agentspecialty
#     tableId = 86
#     idColumn = AgentSpecialtyID
#     idFieldName = agentSpecialtyId
#     idField = <SpecifyIdField: agentSpecialtyId>
#     fields = [<SpecifyField: orderNumber>, <SpecifyField: specialtyName>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: agent>, <SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []

# class AgentVariant(Table):
#     # classname = edu.ku.brc.specify.datamodel.AgentVariant
#     table = agentvariant
#     tableId = 107
#     idColumn = AgentVariantID
#     idFieldName = agentVariantId
#     idField = <SpecifyIdField: agentVariantId>
#     view = AgentVariant
#     searchDialog = None
#     fields = [<SpecifyField: country>, <SpecifyField: language>, <SpecifyField: name>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: varType>, <SpecifyField: variant>, <SpecifyField: version>]
#     relationships = [<SpecifyField: agent>, <SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []

# class Appraisal(Table):
#     # classname = edu.ku.brc.specify.datamodel.Appraisal
#     table = appraisal
#     tableId = 67
#     idColumn = AppraisalID
#     idFieldName = appraisalId
#     idField = <SpecifyIdField: appraisalId>
#     view = Appraisal
#     searchDialog = AppraisalSearch
#     fields = [<SpecifyField: appraisalDate>, <SpecifyField: appraisalNumber>, <SpecifyField: appraisalValue>, <SpecifyField: monetaryUnitType>, <SpecifyField: notes>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: accession>, <SpecifyField: agent>, <SpecifyField: collectionObjects>, <SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []

# class Attachment(Table):
#     # classname = edu.ku.brc.specify.datamodel.Attachment
#     table = attachment
#     tableId = 41
#     idColumn = AttachmentID
#     idFieldName = attachmentId
#     idField = <SpecifyIdField: attachmentId>
#     view = AttachmentsForm
#     searchDialog = None
#     fields = [<SpecifyField: attachmentLocation>, <SpecifyField: attachmentStorageConfig>, <SpecifyField: captureDevice>, <SpecifyField: copyrightDate>, <SpecifyField: copyrightHolder>, <SpecifyField: credit>, <SpecifyField: dateImaged>, <SpecifyField: fileCreatedDate>, <SpecifyField: guid>, <SpecifyField: isPublic>, <SpecifyField: license>, <SpecifyField: licenseLogoUrl>, <SpecifyField: metadataText>, <SpecifyField: mimeType>, <SpecifyField: origFilename>, <SpecifyField: remarks>, <SpecifyField: scopeID>, <SpecifyField: scopeType>, <SpecifyField: subjectOrientation>, <SpecifyField: subtype>, <SpecifyField: tableID>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: title>, <SpecifyField: type>, <SpecifyField: version>, <SpecifyField: visibility>]
#     relationships = [<SpecifyField: accessionAttachments>, <SpecifyField: agentAttachments>, <SpecifyField: attachmentImageAttribute>, <SpecifyField: borrowAttachments>, <SpecifyField: collectingEventAttachments>, <SpecifyField: collectingTripAttachments>, <SpecifyField: collectionObjectAttachments>, <SpecifyField: conservDescriptionAttachments>, <SpecifyField: conservEventAttachments>, <SpecifyField: createdByAgent>, <SpecifyField: creator>, <SpecifyField: deaccessionAttachments>, <SpecifyField: disposalAttachments>, <SpecifyField: dnaSequenceAttachments>, <SpecifyField: dnaSequencingRunAttachments>, <SpecifyField: exchangeInAttachments>, <SpecifyField: exchangeOutAttachments>, <SpecifyField: fieldNotebookAttachments>, <SpecifyField: fieldNotebookPageAttachments>, <SpecifyField: fieldNotebookPageSetAttachments>, <SpecifyField: giftAttachments>, <SpecifyField: loanAttachments>, <SpecifyField: localityAttachments>, <SpecifyField: metadata>, <SpecifyField: modifiedByAgent>, <SpecifyField: permitAttachments>, <SpecifyField: preparationAttachments>, <SpecifyField: referenceWorkAttachments>, <SpecifyField: repositoryAgreementAttachments>, <SpecifyField: storageAttachments>, <SpecifyField: tags>, <SpecifyField: taxonAttachments>, <SpecifyField: treatmentEventAttachments>, <SpecifyField: visibilitySetBy>]
#     fieldAliases = []
#     system = True

# class AttachmentImageAttribute(Table):
#     # classname = edu.ku.brc.specify.datamodel.AttachmentImageAttribute
#     table = attachmentimageattribute
#     tableId = 139
#     idColumn = AttachmentImageAttributeID
#     idFieldName = attachmentImageAttributeId
#     idField = <SpecifyIdField: attachmentImageAttributeId>
#     fields = [<SpecifyField: creativeCommons>, <SpecifyField: height>, <SpecifyField: imageType>, <SpecifyField: magnification>, <SpecifyField: mbImageId>, <SpecifyField: number1>, <SpecifyField: number2>, <SpecifyField: remarks>, <SpecifyField: resolution>, <SpecifyField: text1>, <SpecifyField: text2>, <SpecifyField: timestampCreated>, <SpecifyField: timestampLastSend>, <SpecifyField: timestampLastUpdateCheck>, <SpecifyField: timestampModified>, <SpecifyField: version>, <SpecifyField: viewDescription>, <SpecifyField: width>, <SpecifyField: yesNo1>, <SpecifyField: yesNo2>]
#     relationships = [<SpecifyField: attachments>, <SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>, <SpecifyField: morphBankView>]
#     fieldAliases = []
#     system = True

# class AttachmentMetadata(Table):
#     # classname = edu.ku.brc.specify.datamodel.AttachmentMetadata
#     table = attachmentmetadata
#     tableId = 42
#     idColumn = AttachmentMetadataID
#     idFieldName = attachmentMetadataID
#     idField = <SpecifyIdField: attachmentMetadataID>
#     fields = [<SpecifyField: name>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: value>, <SpecifyField: version>]
#     relationships = [<SpecifyField: attachment>, <SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []
#     system = True

# class AttachmentTag(Table):
#     # classname = edu.ku.brc.specify.datamodel.AttachmentTag
#     table = attachmenttag
#     tableId = 130
#     idColumn = AttachmentTagID
#     idFieldName = attachmentTagID
#     idField = <SpecifyIdField: attachmentTagID>
#     fields = [<SpecifyField: tag>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: attachment>, <SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []
#     system = True

# class AttributeDef(Table):
#     # classname = edu.ku.brc.specify.datamodel.AttributeDef
#     table = attributedef
#     tableId = 16
#     idColumn = AttributeDefID
#     idFieldName = attributeDefId
#     idField = <SpecifyIdField: attributeDefId>
#     fields = [<SpecifyField: dataType>, <SpecifyField: fieldName>, <SpecifyField: tableType>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: collectingEventAttrs>, <SpecifyField: collectionObjectAttrs>, <SpecifyField: createdByAgent>, <SpecifyField: discipline>, <SpecifyField: modifiedByAgent>, <SpecifyField: prepType>, <SpecifyField: preparationAttrs>]
#     fieldAliases = []
#     system = True

# class Author(Table):
#     # classname = edu.ku.brc.specify.datamodel.Author
#     table = author
#     tableId = 17
#     idColumn = AuthorID
#     idFieldName = authorId
#     idField = <SpecifyIdField: authorId>
#     view = Author
#     searchDialog = AuthorSearch
#     fields = [<SpecifyField: orderNumber>, <SpecifyField: remarks>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: agent>, <SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>, <SpecifyField: referenceWork>]
#     fieldAliases = []

# class AutoNumberingScheme(Table):
#     # classname = edu.ku.brc.specify.datamodel.AutoNumberingScheme
#     table = autonumberingscheme
#     tableId = 97
#     idColumn = AutoNumberingSchemeID
#     idFieldName = autoNumberingSchemeId
#     idField = <SpecifyIdField: autoNumberingSchemeId>
#     view = AutoNumberingScheme
#     searchDialog = AutoNumberingScheme
#     fields = [<SpecifyField: formatName>, <SpecifyField: isNumericOnly>, <SpecifyField: schemeClassName>, <SpecifyField: schemeName>, <SpecifyField: tableNumber>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: collections>, <SpecifyField: createdByAgent>, <SpecifyField: disciplines>, <SpecifyField: divisions>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []
#     system = True

# class Borrow(Table):
#     # classname = edu.ku.brc.specify.datamodel.Borrow
#     table = borrow
#     tableId = 18
#     idColumn = BorrowID
#     idFieldName = borrowId
#     idField = <SpecifyIdField: borrowId>
#     view = Borrow
#     searchDialog = None
#     fields = [<SpecifyField: borrowDate>, <SpecifyField: borrowDatePrecision>, <SpecifyField: collectionMemberId>, <SpecifyField: currentDueDate>, <SpecifyField: dateClosed>, <SpecifyField: invoiceNumber>, <SpecifyField: isClosed>, <SpecifyField: isFinancialResponsibility>, <SpecifyField: number1>, <SpecifyField: number2>, <SpecifyField: numberOfItemsBorrowed>, <SpecifyField: originalDueDate>, <SpecifyField: receivedDate>, <SpecifyField: remarks>, <SpecifyField: status>, <SpecifyField: text1>, <SpecifyField: text2>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>, <SpecifyField: yesNo1>, <SpecifyField: yesNo2>]
#     relationships = [<SpecifyField: addressOfRecord>, <SpecifyField: borrowAgents>, <SpecifyField: borrowAttachments>, <SpecifyField: borrowMaterials>, <SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>, <SpecifyField: shipments>]
#     fieldAliases = []

# class BorrowAgent(Table):
#     # classname = edu.ku.brc.specify.datamodel.BorrowAgent
#     table = borrowagent
#     tableId = 19
#     idColumn = BorrowAgentID
#     idFieldName = borrowAgentId
#     idField = <SpecifyIdField: borrowAgentId>
#     view = BorrowAgent
#     searchDialog = None
#     fields = [<SpecifyField: collectionMemberId>, <SpecifyField: remarks>, <SpecifyField: role>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: agent>, <SpecifyField: borrow>, <SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []

# class BorrowAttachment(Table):
#     # classname = edu.ku.brc.specify.datamodel.BorrowAttachment
#     table = borrowattachment
#     tableId = 145
#     idColumn = BorrowAttachmentID
#     idFieldName = borrowAttachmentId
#     idField = <SpecifyIdField: borrowAttachmentId>
#     view = ObjectAttachment
#     searchDialog = None
#     fields = [<SpecifyField: ordinal>, <SpecifyField: remarks>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: attachment>, <SpecifyField: borrow>, <SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []
#     system = True

# class BorrowMaterial(Table):
#     # classname = edu.ku.brc.specify.datamodel.BorrowMaterial
#     table = borrowmaterial
#     tableId = 20
#     idColumn = BorrowMaterialID
#     idFieldName = borrowMaterialId
#     idField = <SpecifyIdField: borrowMaterialId>
#     view = BorrowMaterial
#     searchDialog = None
#     fields = [<SpecifyField: collectionMemberId>, <SpecifyField: description>, <SpecifyField: inComments>, <SpecifyField: materialNumber>, <SpecifyField: outComments>, <SpecifyField: quantity>, <SpecifyField: quantityResolved>, <SpecifyField: quantityReturned>, <SpecifyField: text1>, <SpecifyField: text2>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: borrow>, <SpecifyField: borrowReturnMaterials>, <SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []

# class BorrowReturnMaterial(Table):
#     # classname = edu.ku.brc.specify.datamodel.BorrowReturnMaterial
#     table = borrowreturnmaterial
#     tableId = 21
#     idColumn = BorrowReturnMaterialID
#     idFieldName = borrowReturnMaterialId
#     idField = <SpecifyIdField: borrowReturnMaterialId>
#     view = BorrowReturnMaterial
#     searchDialog = None
#     fields = [<SpecifyField: collectionMemberId>, <SpecifyField: quantity>, <SpecifyField: remarks>, <SpecifyField: returnedDate>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: agent>, <SpecifyField: borrowMaterial>, <SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []

# class CollectingEvent(Table):
#     # classname = edu.ku.brc.specify.datamodel.CollectingEvent
#     table = collectingevent
#     tableId = 10
#     idColumn = CollectingEventID
#     idFieldName = collectingEventId
#     idField = <SpecifyIdField: collectingEventId>
#     view = CollectingEvent
#     searchDialog = CollectingEventSearch
#     fields = [<SpecifyField: endDate>, <SpecifyField: endDatePrecision>, <SpecifyField: endDateVerbatim>, <SpecifyField: endTime>, <SpecifyField: guid>, <SpecifyField: integer1>, <SpecifyField: integer2>, <SpecifyField: method>, <SpecifyField: remarks>, <SpecifyField: reservedInteger3>, <SpecifyField: reservedInteger4>, <SpecifyField: reservedText1>, <SpecifyField: reservedText2>, <SpecifyField: sgrStatus>, <SpecifyField: startDate>, <SpecifyField: startDatePrecision>, <SpecifyField: startDateVerbatim>, <SpecifyField: startTime>, <SpecifyField: stationFieldNumber>, <SpecifyField: stationFieldNumberModifier1>, <SpecifyField: stationFieldNumberModifier2>, <SpecifyField: stationFieldNumberModifier3>, <SpecifyField: text1>, <SpecifyField: text2>, <SpecifyField: text3>, <SpecifyField: text4>, <SpecifyField: text5>, <SpecifyField: text6>, <SpecifyField: text7>, <SpecifyField: text8>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: uniqueIdentifier>, <SpecifyField: verbatimDate>, <SpecifyField: verbatimLocality>, <SpecifyField: version>, <SpecifyField: visibility>]
#     relationships = [<SpecifyField: collectingEventAttachments>, <SpecifyField: collectingEventAttribute>, <SpecifyField: collectingEventAttrs>, <SpecifyField: collectingEventAuthorizations>, <SpecifyField: collectingTrip>, <SpecifyField: collectionObjects>, <SpecifyField: collectors>, <SpecifyField: createdByAgent>, <SpecifyField: discipline>, <SpecifyField: locality>, <SpecifyField: modifiedByAgent>, <SpecifyField: paleoContext>, <SpecifyField: visibilitySetBy>]
#     fieldAliases = []

# class CollectingEventAttachment(Table):
#     # classname = edu.ku.brc.specify.datamodel.CollectingEventAttachment
#     table = collectingeventattachment
#     tableId = 110
#     idColumn = CollectingEventAttachmentID
#     idFieldName = collectingEventAttachmentId
#     idField = <SpecifyIdField: collectingEventAttachmentId>
#     view = ObjectAttachment
#     searchDialog = None
#     fields = [<SpecifyField: collectionMemberId>, <SpecifyField: ordinal>, <SpecifyField: remarks>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: attachment>, <SpecifyField: collectingEvent>, <SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []
#     system = True

# class CollectingEventAttr(Table):
#     # classname = edu.ku.brc.specify.datamodel.CollectingEventAttr
#     table = collectingeventattr
#     tableId = 25
#     idColumn = AttrID
#     idFieldName = attrId
#     idField = <SpecifyIdField: attrId>
#     fields = [<SpecifyField: collectionMemberId>, <SpecifyField: dblValue>, <SpecifyField: strValue>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: collectingEvent>, <SpecifyField: createdByAgent>, <SpecifyField: definition>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []

# class CollectingEventAttribute(Table):
#     # classname = edu.ku.brc.specify.datamodel.CollectingEventAttribute
#     table = collectingeventattribute
#     tableId = 92
#     idColumn = CollectingEventAttributeID
#     idFieldName = collectingEventAttributeId
#     idField = <SpecifyIdField: collectingEventAttributeId>
#     fields = [<SpecifyField: integer1>, <SpecifyField: integer10>, <SpecifyField: integer2>, <SpecifyField: integer3>, <SpecifyField: integer4>, <SpecifyField: integer5>, <SpecifyField: integer6>, <SpecifyField: integer7>, <SpecifyField: integer8>, <SpecifyField: integer9>, <SpecifyField: number1>, <SpecifyField: number10>, <SpecifyField: number11>, <SpecifyField: number12>, <SpecifyField: number13>, <SpecifyField: number2>, <SpecifyField: number3>, <SpecifyField: number4>, <SpecifyField: number5>, <SpecifyField: number6>, <SpecifyField: number7>, <SpecifyField: number8>, <SpecifyField: number9>, <SpecifyField: remarks>, <SpecifyField: text1>, <SpecifyField: text10>, <SpecifyField: text11>, <SpecifyField: text12>, <SpecifyField: text13>, <SpecifyField: text14>, <SpecifyField: text15>, <SpecifyField: text16>, <SpecifyField: text17>, <SpecifyField: text2>, <SpecifyField: text3>, <SpecifyField: text4>, <SpecifyField: text5>, <SpecifyField: text6>, <SpecifyField: text7>, <SpecifyField: text8>, <SpecifyField: text9>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>, <SpecifyField: yesNo1>, <SpecifyField: yesNo2>, <SpecifyField: yesNo3>, <SpecifyField: yesNo4>, <SpecifyField: yesNo5>]
#     relationships = [<SpecifyField: collectingEvents>, <SpecifyField: createdByAgent>, <SpecifyField: discipline>, <SpecifyField: hostTaxon>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []

# class CollectingEventAuthorization(Table):
#     # classname = edu.ku.brc.specify.datamodel.CollectingEventAuthorization
#     table = collectingeventauthorization
#     tableId = 152
#     idColumn = CollectingEventAuthorizationID
#     idFieldName = collectingEventAuthorizationId
#     idField = <SpecifyIdField: collectingEventAuthorizationId>
#     view = None
#     searchDialog = None
#     fields = [<SpecifyField: remarks>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: collectingEvent>, <SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>, <SpecifyField: permit>]
#     fieldAliases = []

# class CollectingTrip(Table):
#     # classname = edu.ku.brc.specify.datamodel.CollectingTrip
#     table = collectingtrip
#     tableId = 87
#     idColumn = CollectingTripID
#     idFieldName = collectingTripId
#     idField = <SpecifyIdField: collectingTripId>
#     view = CollectingTripForm
#     searchDialog = CollectingTripSearch
#     fields = [<SpecifyField: collectingTripName>, <SpecifyField: cruise>, <SpecifyField: date1>, <SpecifyField: date1Precision>, <SpecifyField: date2>, <SpecifyField: date2Precision>, <SpecifyField: endDate>, <SpecifyField: endDatePrecision>, <SpecifyField: endDateVerbatim>, <SpecifyField: endTime>, <SpecifyField: expedition>, <SpecifyField: number1>, <SpecifyField: number2>, <SpecifyField: remarks>, <SpecifyField: sponsor>, <SpecifyField: startDate>, <SpecifyField: startDatePrecision>, <SpecifyField: startDateVerbatim>, <SpecifyField: startTime>, <SpecifyField: text1>, <SpecifyField: text2>, <SpecifyField: text3>, <SpecifyField: text4>, <SpecifyField: text5>, <SpecifyField: text6>, <SpecifyField: text7>, <SpecifyField: text8>, <SpecifyField: text9>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>, <SpecifyField: vessel>, <SpecifyField: yesNo1>, <SpecifyField: yesNo2>]
#     relationships = [<SpecifyField: agent1>, <SpecifyField: agent2>, <SpecifyField: collectingEvents>, <SpecifyField: collectingTripAttachments>, <SpecifyField: collectingTripAttribute>, <SpecifyField: collectingTripAuthorizations>, <SpecifyField: createdByAgent>, <SpecifyField: discipline>, <SpecifyField: fundingAgents>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []

# class CollectingTripAttachment(Table):
#     # classname = edu.ku.brc.specify.datamodel.CollectingTripAttachment
#     table = collectingtripattachment
#     tableId = 156
#     idColumn = CollectingTripAttachmentID
#     idFieldName = collectingTripAttachmentId
#     idField = <SpecifyIdField: collectingTripAttachmentId>
#     view = ObjectAttachment
#     searchDialog = None
#     fields = [<SpecifyField: collectionMemberId>, <SpecifyField: ordinal>, <SpecifyField: remarks>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: attachment>, <SpecifyField: collectingTrip>, <SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []
#     system = True

# class CollectingTripAttribute(Table):
#     # classname = edu.ku.brc.specify.datamodel.CollectingTripAttribute
#     table = collectingtripattribute
#     tableId = 157
#     idColumn = CollectingTripAttributeID
#     idFieldName = collectingTripAttributeId
#     idField = <SpecifyIdField: collectingTripAttributeId>
#     fields = [<SpecifyField: integer1>, <SpecifyField: integer10>, <SpecifyField: integer2>, <SpecifyField: integer3>, <SpecifyField: integer4>, <SpecifyField: integer5>, <SpecifyField: integer6>, <SpecifyField: integer7>, <SpecifyField: integer8>, <SpecifyField: integer9>, <SpecifyField: number1>, <SpecifyField: number10>, <SpecifyField: number11>, <SpecifyField: number12>, <SpecifyField: number13>, <SpecifyField: number2>, <SpecifyField: number3>, <SpecifyField: number4>, <SpecifyField: number5>, <SpecifyField: number6>, <SpecifyField: number7>, <SpecifyField: number8>, <SpecifyField: number9>, <SpecifyField: remarks>, <SpecifyField: text1>, <SpecifyField: text10>, <SpecifyField: text11>, <SpecifyField: text12>, <SpecifyField: text13>, <SpecifyField: text14>, <SpecifyField: text15>, <SpecifyField: text16>, <SpecifyField: text17>, <SpecifyField: text2>, <SpecifyField: text3>, <SpecifyField: text4>, <SpecifyField: text5>, <SpecifyField: text6>, <SpecifyField: text7>, <SpecifyField: text8>, <SpecifyField: text9>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>, <SpecifyField: yesNo1>, <SpecifyField: yesNo2>, <SpecifyField: yesNo3>, <SpecifyField: yesNo4>, <SpecifyField: yesNo5>]
#     relationships = [<SpecifyField: collectingTrips>, <SpecifyField: createdByAgent>, <SpecifyField: discipline>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []

# class CollectingTripAuthorization(Table):
#     # classname = edu.ku.brc.specify.datamodel.CollectingTripAuthorization
#     table = collectingtripauthorization
#     tableId = 158
#     idColumn = CollectingTripAuthorizationID
#     idFieldName = collectingTripAuthorizationId
#     idField = <SpecifyIdField: collectingTripAuthorizationId>
#     view = None
#     searchDialog = None
#     fields = [<SpecifyField: remarks>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: collectingTrip>, <SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>, <SpecifyField: permit>]
#     fieldAliases = []

# class Collection(Table):
#     # classname = edu.ku.brc.specify.datamodel.Collection
#     table = collection
#     tableId = 23
#     idColumn = UserGroupScopeId
#     idFieldName = userGroupScopeId
#     idField = <SpecifyIdField: userGroupScopeId>
#     view = Collection
#     searchDialog = None
#     fields = [<SpecifyField: catalogNumFormatName>, <SpecifyField: code>, <SpecifyField: collectionName>, <SpecifyField: collectionType>, <SpecifyField: dbContentVersion>, <SpecifyField: description>, <SpecifyField: developmentStatus>, <SpecifyField: estimatedSize>, <SpecifyField: guid>, <SpecifyField: institutionType>, <SpecifyField: isEmbeddedCollectingEvent>, <SpecifyField: isaNumber>, <SpecifyField: kingdomCoverage>, <SpecifyField: preservationMethodType>, <SpecifyField: primaryFocus>, <SpecifyField: primaryPurpose>, <SpecifyField: regNumber>, <SpecifyField: remarks>, <SpecifyField: scope>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>, <SpecifyField: webPortalURI>, <SpecifyField: webSiteURI>]
#     relationships = [<SpecifyField: adminContact>, <SpecifyField: contentContacts>, <SpecifyField: createdByAgent>, <SpecifyField: discipline>, <SpecifyField: institutionNetwork>, <SpecifyField: leftSideRelTypes>, <SpecifyField: modifiedByAgent>, <SpecifyField: numberingSchemes>, <SpecifyField: pickLists>, <SpecifyField: prepTypes>, <SpecifyField: rightSideRelTypes>, <SpecifyField: technicalContacts>, <SpecifyField: userGroups>]
#     fieldAliases = []

# class CollectionObject(Table):
#     # classname = edu.ku.brc.specify.datamodel.CollectionObject
#     table = collectionobject
#     tableId = 1
#     idColumn = CollectionObjectID
#     idFieldName = collectionObjectId
#     idField = <SpecifyIdField: collectionObjectId>
#     view = CollectionObject
#     searchDialog = CollectionObjectSearch
#     fields = [<SpecifyField: altCatalogNumber>, <SpecifyField: availability>, <SpecifyField: catalogNumber>, <SpecifyField: catalogedDate>, <SpecifyField: catalogedDatePrecision>, <SpecifyField: catalogedDateVerbatim>, <SpecifyField: collectionMemberId>, <SpecifyField: countAmt>, <SpecifyField: date1>, <SpecifyField: date1Precision>, <SpecifyField: deaccessioned>, <SpecifyField: description>, <SpecifyField: embargoReason>, <SpecifyField: embargoReleaseDate>, <SpecifyField: embargoReleaseDatePrecision>, <SpecifyField: embargoStartDate>, <SpecifyField: embargoStartDatePrecision>, <SpecifyField: fieldNumber>, <SpecifyField: guid>, <SpecifyField: integer1>, <SpecifyField: integer2>, <SpecifyField: inventoryDate>, <SpecifyField: inventoryDatePrecision>, <SpecifyField: modifier>, <SpecifyField: name>, <SpecifyField: notifications>, <SpecifyField: number1>, <SpecifyField: number2>, <SpecifyField: numberOfDuplicates>, <SpecifyField: objectCondition>, <SpecifyField: ocr>, <SpecifyField: projectNumber>, <SpecifyField: remarks>, <SpecifyField: reservedInteger3>, <SpecifyField: reservedInteger4>, <SpecifyField: reservedText>, <SpecifyField: reservedText2>, <SpecifyField: reservedText3>, <SpecifyField: restrictions>, <SpecifyField: sgrStatus>, <SpecifyField: text1>, <SpecifyField: text2>, <SpecifyField: text3>, <SpecifyField: text4>, <SpecifyField: text5>, <SpecifyField: text6>, <SpecifyField: text7>, <SpecifyField: text8>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: totalValue>, <SpecifyField: uniqueIdentifier>, <SpecifyField: version>, <SpecifyField: visibility>, <SpecifyField: yesNo1>, <SpecifyField: yesNo2>, <SpecifyField: yesNo3>, <SpecifyField: yesNo4>, <SpecifyField: yesNo5>, <SpecifyField: yesNo6>]
#     relationships = [<SpecifyField: accession>, <SpecifyField: agent1>, <SpecifyField: appraisal>, <SpecifyField: cataloger>, <SpecifyField: collectingEvent>, <SpecifyField: collection>, <SpecifyField: collectionObjectAttachments>, <SpecifyField: collectionObjectAttribute>, <SpecifyField: collectionObjectAttrs>, <SpecifyField: collectionObjectCitations>, <SpecifyField: collectionObjectProperties>, <SpecifyField: conservDescriptions>, <SpecifyField: container>, <SpecifyField: containerOwner>, <SpecifyField: createdByAgent>, <SpecifyField: determinations>, <SpecifyField: dnaSequences>, <SpecifyField: embargoAuthority>, <SpecifyField: exsiccataItems>, <SpecifyField: fieldNotebookPage>, <SpecifyField: inventorizedBy>, <SpecifyField: leftSideRels>, <SpecifyField: modifiedByAgent>, <SpecifyField: otherIdentifiers>, <SpecifyField: paleoContext>, <SpecifyField: preparations>, <SpecifyField: projects>, <SpecifyField: rightSideRels>, <SpecifyField: treatmentEvents>, <SpecifyField: visibilitySetBy>, <SpecifyField: voucherRelationships>]
#     fieldAliases = []

# class CollectionObjectAttachment(Table):
#     # classname = edu.ku.brc.specify.datamodel.CollectionObjectAttachment
#     table = collectionobjectattachment
#     tableId = 111
#     idColumn = CollectionObjectAttachmentID
#     idFieldName = collectionObjectAttachmentId
#     idField = <SpecifyIdField: collectionObjectAttachmentId>
#     view = ObjectAttachment
#     searchDialog = None
#     fields = [<SpecifyField: collectionMemberId>, <SpecifyField: ordinal>, <SpecifyField: remarks>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: attachment>, <SpecifyField: collectionObject>, <SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []
#     system = True

# class CollectionObjectAttr(Table):
#     # classname = edu.ku.brc.specify.datamodel.CollectionObjectAttr
#     table = collectionobjectattr
#     tableId = 28
#     idColumn = AttrID
#     idFieldName = attrId
#     idField = <SpecifyIdField: attrId>
#     fields = [<SpecifyField: collectionMemberId>, <SpecifyField: dblValue>, <SpecifyField: strValue>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: collectionObject>, <SpecifyField: createdByAgent>, <SpecifyField: definition>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []

# class CollectionObjectAttribute(Table):
#     # classname = edu.ku.brc.specify.datamodel.CollectionObjectAttribute
#     table = collectionobjectattribute
#     tableId = 93
#     idColumn = CollectionObjectAttributeID
#     idFieldName = collectionObjectAttributeId
#     idField = <SpecifyIdField: collectionObjectAttributeId>
#     fields = [<SpecifyField: bottomDistance>, <SpecifyField: collectionMemberId>, <SpecifyField: date1>, <SpecifyField: date1Precision>, <SpecifyField: direction>, <SpecifyField: distanceUnits>, <SpecifyField: integer1>, <SpecifyField: integer10>, <SpecifyField: integer2>, <SpecifyField: integer3>, <SpecifyField: integer4>, <SpecifyField: integer5>, <SpecifyField: integer6>, <SpecifyField: integer7>, <SpecifyField: integer8>, <SpecifyField: integer9>, <SpecifyField: number1>, <SpecifyField: number10>, <SpecifyField: number11>, <SpecifyField: number12>, <SpecifyField: number13>, <SpecifyField: number14>, <SpecifyField: number15>, <SpecifyField: number16>, <SpecifyField: number17>, <SpecifyField: number18>, <SpecifyField: number19>, <SpecifyField: number2>, <SpecifyField: number20>, <SpecifyField: number21>, <SpecifyField: number22>, <SpecifyField: number23>, <SpecifyField: number24>, <SpecifyField: number25>, <SpecifyField: number26>, <SpecifyField: number27>, <SpecifyField: number28>, <SpecifyField: number29>, <SpecifyField: number3>, <SpecifyField: number30>, <SpecifyField: number31>, <SpecifyField: number32>, <SpecifyField: number33>, <SpecifyField: number34>, <SpecifyField: number35>, <SpecifyField: number36>, <SpecifyField: number37>, <SpecifyField: number38>, <SpecifyField: number39>, <SpecifyField: number4>, <SpecifyField: number40>, <SpecifyField: number41>, <SpecifyField: number42>, <SpecifyField: number5>, <SpecifyField: number6>, <SpecifyField: number7>, <SpecifyField: number8>, <SpecifyField: number9>, <SpecifyField: positionState>, <SpecifyField: remarks>, <SpecifyField: text1>, <SpecifyField: text10>, <SpecifyField: text11>, <SpecifyField: text12>, <SpecifyField: text13>, <SpecifyField: text14>, <SpecifyField: text15>, <SpecifyField: text16>, <SpecifyField: text17>, <SpecifyField: text18>, <SpecifyField: text19>, <SpecifyField: text2>, <SpecifyField: text20>, <SpecifyField: text21>, <SpecifyField: text22>, <SpecifyField: text23>, <SpecifyField: text24>, <SpecifyField: text25>, <SpecifyField: text26>, <SpecifyField: text27>, <SpecifyField: text28>, <SpecifyField: text29>, <SpecifyField: text3>, <SpecifyField: text30>, <SpecifyField: text31>, <SpecifyField: text32>, <SpecifyField: text33>, <SpecifyField: text34>, <SpecifyField: text35>, <SpecifyField: text36>, <SpecifyField: text37>, <SpecifyField: text38>, <SpecifyField: text39>, <SpecifyField: text4>, <SpecifyField: text40>, <SpecifyField: text5>, <SpecifyField: text6>, <SpecifyField: text7>, <SpecifyField: text8>, <SpecifyField: text9>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: topDistance>, <SpecifyField: version>, <SpecifyField: yesNo1>, <SpecifyField: yesNo10>, <SpecifyField: yesNo11>, <SpecifyField: yesNo12>, <SpecifyField: yesNo13>, <SpecifyField: yesNo14>, <SpecifyField: yesNo15>, <SpecifyField: yesNo16>, <SpecifyField: yesNo17>, <SpecifyField: yesNo18>, <SpecifyField: yesNo19>, <SpecifyField: yesNo2>, <SpecifyField: yesNo20>, <SpecifyField: yesNo3>, <SpecifyField: yesNo4>, <SpecifyField: yesNo5>, <SpecifyField: yesNo6>, <SpecifyField: yesNo7>, <SpecifyField: yesNo8>, <SpecifyField: yesNo9>]
#     relationships = [<SpecifyField: agent1>, <SpecifyField: collectionObjects>, <SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []

# class CollectionObjectCitation(Table):
#     # classname = edu.ku.brc.specify.datamodel.CollectionObjectCitation
#     table = collectionobjectcitation
#     tableId = 29
#     idColumn = CollectionObjectCitationID
#     idFieldName = collectionObjectCitationId
#     idField = <SpecifyIdField: collectionObjectCitationId>
#     fields = [<SpecifyField: collectionMemberId>, <SpecifyField: figureNumber>, <SpecifyField: isFigured>, <SpecifyField: pageNumber>, <SpecifyField: plateNumber>, <SpecifyField: remarks>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: collectionObject>, <SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>, <SpecifyField: referenceWork>]
#     fieldAliases = []

# class CollectionObjectProperty(Table):
#     # classname = edu.ku.brc.specify.datamodel.CollectionObjectProperty
#     table = collectionobjectproperty
#     tableId = 153
#     idColumn = CollectionObjectPropertyID
#     idFieldName = collectionObjectPropertyId
#     idField = <SpecifyIdField: collectionObjectPropertyId>
#     view = CollectionObjectProperty
#     searchDialog = None
#     fields = [<SpecifyField: collectionMemberId>, <SpecifyField: date1>, <SpecifyField: date10>, <SpecifyField: date11>, <SpecifyField: date12>, <SpecifyField: date13>, <SpecifyField: date14>, <SpecifyField: date15>, <SpecifyField: date16>, <SpecifyField: date17>, <SpecifyField: date18>, <SpecifyField: date19>, <SpecifyField: date2>, <SpecifyField: date20>, <SpecifyField: date3>, <SpecifyField: date4>, <SpecifyField: date5>, <SpecifyField: date6>, <SpecifyField: date7>, <SpecifyField: date8>, <SpecifyField: date9>, <SpecifyField: guid>, <SpecifyField: integer1>, <SpecifyField: integer10>, <SpecifyField: integer11>, <SpecifyField: integer12>, <SpecifyField: integer13>, <SpecifyField: integer14>, <SpecifyField: integer15>, <SpecifyField: integer16>, <SpecifyField: integer17>, <SpecifyField: integer18>, <SpecifyField: integer19>, <SpecifyField: integer2>, <SpecifyField: integer20>, <SpecifyField: integer21>, <SpecifyField: integer22>, <SpecifyField: integer23>, <SpecifyField: integer24>, <SpecifyField: integer25>, <SpecifyField: integer26>, <SpecifyField: integer27>, <SpecifyField: integer28>, <SpecifyField: integer29>, <SpecifyField: integer3>, <SpecifyField: integer30>, <SpecifyField: integer4>, <SpecifyField: integer5>, <SpecifyField: integer6>, <SpecifyField: integer7>, <SpecifyField: integer8>, <SpecifyField: integer9>, <SpecifyField: number1>, <SpecifyField: number10>, <SpecifyField: number11>, <SpecifyField: number12>, <SpecifyField: number13>, <SpecifyField: number14>, <SpecifyField: number15>, <SpecifyField: number16>, <SpecifyField: number17>, <SpecifyField: number18>, <SpecifyField: number19>, <SpecifyField: number2>, <SpecifyField: number20>, <SpecifyField: number21>, <SpecifyField: number22>, <SpecifyField: number23>, <SpecifyField: number24>, <SpecifyField: number25>, <SpecifyField: number26>, <SpecifyField: number27>, <SpecifyField: number28>, <SpecifyField: number29>, <SpecifyField: number3>, <SpecifyField: number30>, <SpecifyField: number4>, <SpecifyField: number5>, <SpecifyField: number6>, <SpecifyField: number7>, <SpecifyField: number8>, <SpecifyField: number9>, <SpecifyField: remarks>, <SpecifyField: text1>, <SpecifyField: text10>, <SpecifyField: text11>, <SpecifyField: text12>, <SpecifyField: text13>, <SpecifyField: text14>, <SpecifyField: text15>, <SpecifyField: text16>, <SpecifyField: text17>, <SpecifyField: text18>, <SpecifyField: text19>, <SpecifyField: text2>, <SpecifyField: text20>, <SpecifyField: text21>, <SpecifyField: text22>, <SpecifyField: text23>, <SpecifyField: text24>, <SpecifyField: text25>, <SpecifyField: text26>, <SpecifyField: text27>, <SpecifyField: text28>, <SpecifyField: text29>, <SpecifyField: text3>, <SpecifyField: text30>, <SpecifyField: text31>, <SpecifyField: text32>, <SpecifyField: text33>, <SpecifyField: text34>, <SpecifyField: text35>, <SpecifyField: text36>, <SpecifyField: text37>, <SpecifyField: text38>, <SpecifyField: text39>, <SpecifyField: text4>, <SpecifyField: text40>, <SpecifyField: text5>, <SpecifyField: text6>, <SpecifyField: text7>, <SpecifyField: text8>, <SpecifyField: text9>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>, <SpecifyField: yesNo1>, <SpecifyField: yesNo10>, <SpecifyField: yesNo11>, <SpecifyField: yesNo12>, <SpecifyField: yesNo13>, <SpecifyField: yesNo14>, <SpecifyField: yesNo15>, <SpecifyField: yesNo16>, <SpecifyField: yesNo17>, <SpecifyField: yesNo18>, <SpecifyField: yesNo19>, <SpecifyField: yesNo2>, <SpecifyField: yesNo20>, <SpecifyField: yesNo3>, <SpecifyField: yesNo4>, <SpecifyField: yesNo5>, <SpecifyField: yesNo6>, <SpecifyField: yesNo7>, <SpecifyField: yesNo8>, <SpecifyField: yesNo9>]
#     relationships = [<SpecifyField: agent1>, <SpecifyField: agent10>, <SpecifyField: agent11>, <SpecifyField: agent12>, <SpecifyField: agent13>, <SpecifyField: agent14>, <SpecifyField: agent15>, <SpecifyField: agent16>, <SpecifyField: agent17>, <SpecifyField: agent18>, <SpecifyField: agent19>, <SpecifyField: agent2>, <SpecifyField: agent20>, <SpecifyField: agent3>, <SpecifyField: agent4>, <SpecifyField: agent5>, <SpecifyField: agent6>, <SpecifyField: agent7>, <SpecifyField: agent8>, <SpecifyField: agent9>, <SpecifyField: collectionObject>, <SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []

# class CollectionRelType(Table):
#     # classname = edu.ku.brc.specify.datamodel.CollectionRelType
#     table = collectionreltype
#     tableId = 98
#     idColumn = CollectionRelTypeID
#     idFieldName = collectionRelTypeId
#     idField = <SpecifyIdField: collectionRelTypeId>
#     view = None
#     searchDialog = CollectionRelTypeSearch
#     fields = [<SpecifyField: name>, <SpecifyField: remarks>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: createdByAgent>, <SpecifyField: leftSideCollection>, <SpecifyField: modifiedByAgent>, <SpecifyField: rightSideCollection>]
#     fieldAliases = []

# class CollectionRelationship(Table):
#     # classname = edu.ku.brc.specify.datamodel.CollectionRelationship
#     table = collectionrelationship
#     tableId = 99
#     idColumn = CollectionRelationshipID
#     idFieldName = collectionRelationshipId
#     idField = <SpecifyIdField: collectionRelationshipId>
#     view = CollectionRelationship
#     searchDialog = None
#     fields = [<SpecifyField: text1>, <SpecifyField: text2>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: collectionRelType>, <SpecifyField: createdByAgent>, <SpecifyField: leftSide>, <SpecifyField: modifiedByAgent>, <SpecifyField: rightSide>]
#     fieldAliases = []

# class Collector(Table):
#     # classname = edu.ku.brc.specify.datamodel.Collector
#     table = collector
#     tableId = 30
#     idColumn = CollectorID
#     idFieldName = collectorId
#     idField = <SpecifyIdField: collectorId>
#     view = Collector
#     searchDialog = CollectorSearch
#     fields = [<SpecifyField: isPrimary>, <SpecifyField: orderNumber>, <SpecifyField: remarks>, <SpecifyField: text1>, <SpecifyField: text2>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>, <SpecifyField: yesNo1>, <SpecifyField: yesNo2>]
#     relationships = [<SpecifyField: agent>, <SpecifyField: collectingEvent>, <SpecifyField: createdByAgent>, <SpecifyField: division>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []

# class CommonNameTx(Table):
#     # classname = edu.ku.brc.specify.datamodel.CommonNameTx
#     table = commonnametx
#     tableId = 106
#     idColumn = CommonNameTxID
#     idFieldName = commonNameTxId
#     idField = <SpecifyIdField: commonNameTxId>
#     fields = [<SpecifyField: author>, <SpecifyField: country>, <SpecifyField: language>, <SpecifyField: name>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: variant>, <SpecifyField: version>]
#     relationships = [<SpecifyField: citations>, <SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>, <SpecifyField: taxon>]
#     fieldAliases = []

# class CommonNameTxCitation(Table):
#     # classname = edu.ku.brc.specify.datamodel.CommonNameTxCitation
#     table = commonnametxcitation
#     tableId = 134
#     idColumn = CommonNameTxCitationID
#     idFieldName = commonNameTxCitationId
#     idField = <SpecifyIdField: commonNameTxCitationId>
#     fields = [<SpecifyField: figureNumber>, <SpecifyField: isFigured>, <SpecifyField: number1>, <SpecifyField: number2>, <SpecifyField: pageNumber>, <SpecifyField: plateNumber>, <SpecifyField: remarks>, <SpecifyField: text1>, <SpecifyField: text2>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>, <SpecifyField: yesNo1>, <SpecifyField: yesNo2>]
#     relationships = [<SpecifyField: commonNameTx>, <SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>, <SpecifyField: referenceWork>]
#     fieldAliases = []

# class ConservDescription(Table):
#     # classname = edu.ku.brc.specify.datamodel.ConservDescription
#     table = conservdescription
#     tableId = 103
#     idColumn = ConservDescriptionID
#     idFieldName = conservDescriptionId
#     idField = <SpecifyIdField: conservDescriptionId>
#     fields = [<SpecifyField: backgroundInfo>, <SpecifyField: composition>, <SpecifyField: date1>, <SpecifyField: date1Precision>, <SpecifyField: date2>, <SpecifyField: date2Precision>, <SpecifyField: date3>, <SpecifyField: date3Precision>, <SpecifyField: date4>, <SpecifyField: date4Precision>, <SpecifyField: date5>, <SpecifyField: date5Precision>, <SpecifyField: description>, <SpecifyField: determinedDate>, <SpecifyField: displayRecommendations>, <SpecifyField: height>, <SpecifyField: integer1>, <SpecifyField: integer2>, <SpecifyField: integer3>, <SpecifyField: integer4>, <SpecifyField: integer5>, <SpecifyField: lightRecommendations>, <SpecifyField: number1>, <SpecifyField: number2>, <SpecifyField: number3>, <SpecifyField: number4>, <SpecifyField: number5>, <SpecifyField: objLength>, <SpecifyField: otherRecommendations>, <SpecifyField: remarks>, <SpecifyField: shortDesc>, <SpecifyField: source>, <SpecifyField: text1>, <SpecifyField: text2>, <SpecifyField: text3>, <SpecifyField: text4>, <SpecifyField: text5>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: units>, <SpecifyField: version>, <SpecifyField: width>, <SpecifyField: yesNo1>, <SpecifyField: yesNo2>, <SpecifyField: yesNo3>, <SpecifyField: yesNo4>, <SpecifyField: yesNo5>]
#     relationships = [<SpecifyField: collectionObject>, <SpecifyField: conservDescriptionAttachments>, <SpecifyField: createdByAgent>, <SpecifyField: division>, <SpecifyField: events>, <SpecifyField: modifiedByAgent>, <SpecifyField: preparation>]
#     fieldAliases = []

# class ConservDescriptionAttachment(Table):
#     # classname = edu.ku.brc.specify.datamodel.ConservDescriptionAttachment
#     table = conservdescriptionattachment
#     tableId = 112
#     idColumn = ConservDescriptionAttachmentID
#     idFieldName = conservDescriptionAttachmentId
#     idField = <SpecifyIdField: conservDescriptionAttachmentId>
#     view = ObjectAttachment
#     searchDialog = None
#     fields = [<SpecifyField: ordinal>, <SpecifyField: remarks>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: attachment>, <SpecifyField: conservDescription>, <SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []
#     system = True

# class ConservEvent(Table):
#     # classname = edu.ku.brc.specify.datamodel.ConservEvent
#     table = conservevent
#     tableId = 73
#     idColumn = ConservEventID
#     idFieldName = conservEventId
#     idField = <SpecifyIdField: conservEventId>
#     fields = [<SpecifyField: advTestingExam>, <SpecifyField: advTestingExamResults>, <SpecifyField: completedComments>, <SpecifyField: completedDate>, <SpecifyField: completedDatePrecision>, <SpecifyField: conditionReport>, <SpecifyField: curatorApprovalDate>, <SpecifyField: curatorApprovalDatePrecision>, <SpecifyField: examDate>, <SpecifyField: examDatePrecision>, <SpecifyField: number1>, <SpecifyField: number2>, <SpecifyField: photoDocs>, <SpecifyField: remarks>, <SpecifyField: text1>, <SpecifyField: text2>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: treatmentCompDate>, <SpecifyField: treatmentCompDatePrecision>, <SpecifyField: treatmentReport>, <SpecifyField: version>, <SpecifyField: yesNo1>, <SpecifyField: yesNo2>]
#     relationships = [<SpecifyField: conservDescription>, <SpecifyField: conservEventAttachments>, <SpecifyField: createdByAgent>, <SpecifyField: curator>, <SpecifyField: examinedByAgent>, <SpecifyField: modifiedByAgent>, <SpecifyField: treatedByAgent>]
#     fieldAliases = []

# class ConservEventAttachment(Table):
#     # classname = edu.ku.brc.specify.datamodel.ConservEventAttachment
#     table = conserveventattachment
#     tableId = 113
#     idColumn = ConservEventAttachmentID
#     idFieldName = conservEventAttachmentId
#     idField = <SpecifyIdField: conservEventAttachmentId>
#     view = ObjectAttachment
#     searchDialog = None
#     fields = [<SpecifyField: ordinal>, <SpecifyField: remarks>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: attachment>, <SpecifyField: conservEvent>, <SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []
#     system = True

# class Container(Table):
#     # classname = edu.ku.brc.specify.datamodel.Container
#     table = container
#     tableId = 31
#     idColumn = ContainerID
#     idFieldName = containerId
#     idField = <SpecifyIdField: containerId>
#     view = Container
#     searchDialog = ContainerSearch
#     fields = [<SpecifyField: collectionMemberId>, <SpecifyField: description>, <SpecifyField: name>, <SpecifyField: number>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: type>, <SpecifyField: version>]
#     relationships = [<SpecifyField: children>, <SpecifyField: collectionObjectKids>, <SpecifyField: collectionObjects>, <SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>, <SpecifyField: parent>, <SpecifyField: storage>]
#     fieldAliases = []

# class DNAPrimer(Table):
#     # classname = edu.ku.brc.specify.datamodel.DNAPrimer
#     table = dnaprimer
#     tableId = 150
#     idColumn = DNAPrimerID
#     idFieldName = dnaPrimerId
#     idField = <SpecifyIdField: dnaPrimerId>
#     view = DNAPrimer
#     searchDialog = DNAPrimerSearch
#     fields = [<SpecifyField: integer1>, <SpecifyField: integer2>, <SpecifyField: number1>, <SpecifyField: number2>, <SpecifyField: primerDesignator>, <SpecifyField: primerNameForward>, <SpecifyField: primerNameReverse>, <SpecifyField: primerReferenceCitationForward>, <SpecifyField: primerReferenceCitationReverse>, <SpecifyField: primerReferenceLinkForward>, <SpecifyField: primerReferenceLinkReverse>, <SpecifyField: primerSequenceForward>, <SpecifyField: primerSequenceReverse>, <SpecifyField: purificationMethod>, <SpecifyField: remarks>, <SpecifyField: reservedInteger3>, <SpecifyField: reservedInteger4>, <SpecifyField: reservedNumber3>, <SpecifyField: reservedNumber4>, <SpecifyField: reservedText3>, <SpecifyField: reservedText4>, <SpecifyField: text1>, <SpecifyField: text2>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>, <SpecifyField: yesNo1>, <SpecifyField: yesNo2>]
#     relationships = [<SpecifyField: createdByAgent>, <SpecifyField: dnaSequencingRuns>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []

# class DNASequence(Table):
#     # classname = edu.ku.brc.specify.datamodel.DNASequence
#     table = dnasequence
#     tableId = 121
#     idColumn = DnaSequenceID
#     idFieldName = dnaSequenceId
#     idField = <SpecifyIdField: dnaSequenceId>
#     fields = [<SpecifyField: ambiguousResidues>, <SpecifyField: boldBarcodeId>, <SpecifyField: boldLastUpdateDate>, <SpecifyField: boldSampleId>, <SpecifyField: boldTranslationMatrix>, <SpecifyField: collectionMemberId>, <SpecifyField: compA>, <SpecifyField: compC>, <SpecifyField: compG>, <SpecifyField: compT>, <SpecifyField: extractionDate>, <SpecifyField: extractionDatePrecision>, <SpecifyField: genbankAccessionNumber>, <SpecifyField: geneSequence>, <SpecifyField: moleculeType>, <SpecifyField: number1>, <SpecifyField: number2>, <SpecifyField: number3>, <SpecifyField: remarks>, <SpecifyField: sequenceDate>, <SpecifyField: sequenceDatePrecision>, <SpecifyField: targetMarker>, <SpecifyField: text1>, <SpecifyField: text2>, <SpecifyField: text3>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: totalResidues>, <SpecifyField: version>, <SpecifyField: yesNo1>, <SpecifyField: yesNo2>, <SpecifyField: yesNo3>]
#     relationships = [<SpecifyField: attachments>, <SpecifyField: collectionObject>, <SpecifyField: createdByAgent>, <SpecifyField: dnaSequencingRuns>, <SpecifyField: extractor>, <SpecifyField: extractors>, <SpecifyField: materialSample>, <SpecifyField: modifiedByAgent>, <SpecifyField: pcrPersons>, <SpecifyField: sequencer>]
#     fieldAliases = []

# class DNASequenceAttachment(Table):
#     # classname = edu.ku.brc.specify.datamodel.DNASequenceAttachment
#     table = dnasequenceattachment
#     tableId = 147
#     idColumn = DnaSequenceAttachmentId
#     idFieldName = dnaSequenceAttachmentId
#     idField = <SpecifyIdField: dnaSequenceAttachmentId>
#     view = ObjectAttachment
#     searchDialog = None
#     fields = [<SpecifyField: ordinal>, <SpecifyField: remarks>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: attachment>, <SpecifyField: createdByAgent>, <SpecifyField: dnaSequence>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []
#     system = True

# class DNASequencingRun(Table):
#     # classname = edu.ku.brc.specify.datamodel.DNASequencingRun
#     table = dnasequencingrun
#     tableId = 88
#     idColumn = DNASequencingRunID
#     idFieldName = dnaSequencingRunId
#     idField = <SpecifyIdField: dnaSequencingRunId>
#     fields = [<SpecifyField: collectionMemberId>, <SpecifyField: dryadDOI>, <SpecifyField: geneSequence>, <SpecifyField: number1>, <SpecifyField: number2>, <SpecifyField: number3>, <SpecifyField: ordinal>, <SpecifyField: pcrCocktailPrimer>, <SpecifyField: pcrForwardPrimerCode>, <SpecifyField: pcrPrimerName>, <SpecifyField: pcrPrimerSequence5_3>, <SpecifyField: pcrReversePrimerCode>, <SpecifyField: readDirection>, <SpecifyField: remarks>, <SpecifyField: runDate>, <SpecifyField: scoreFileName>, <SpecifyField: sequenceCocktailPrimer>, <SpecifyField: sequencePrimerCode>, <SpecifyField: sequencePrimerName>, <SpecifyField: sequencePrimerSequence5_3>, <SpecifyField: sraExperimentID>, <SpecifyField: sraRunID>, <SpecifyField: sraSubmissionID>, <SpecifyField: text1>, <SpecifyField: text2>, <SpecifyField: text3>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: traceFileName>, <SpecifyField: version>, <SpecifyField: yesNo1>, <SpecifyField: yesNo2>, <SpecifyField: yesNo3>]
#     relationships = [<SpecifyField: attachments>, <SpecifyField: citations>, <SpecifyField: createdByAgent>, <SpecifyField: dnaPrimer>, <SpecifyField: dnaSequence>, <SpecifyField: modifiedByAgent>, <SpecifyField: preparedByAgent>, <SpecifyField: runByAgent>]
#     fieldAliases = []

# class DNASequencingRunAttachment(Table):
#     # classname = edu.ku.brc.specify.datamodel.DNASequencingRunAttachment
#     table = dnasequencerunattachment
#     tableId = 135
#     idColumn = DnaSequencingRunAttachmentId
#     idFieldName = dnaSequencingRunAttachmentId
#     idField = <SpecifyIdField: dnaSequencingRunAttachmentId>
#     view = ObjectAttachment
#     searchDialog = None
#     fields = [<SpecifyField: ordinal>, <SpecifyField: remarks>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: attachment>, <SpecifyField: createdByAgent>, <SpecifyField: dnaSequencingRun>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []
#     system = True

# class DNASequencingRunCitation(Table):
#     # classname = edu.ku.brc.specify.datamodel.DNASequencingRunCitation
#     table = dnasequencingruncitation
#     tableId = 105
#     idColumn = DNASequencingRunCitationID
#     idFieldName = dnaSequencingRunCitationId
#     idField = <SpecifyIdField: dnaSequencingRunCitationId>
#     fields = [<SpecifyField: figureNumber>, <SpecifyField: isFigured>, <SpecifyField: number1>, <SpecifyField: number2>, <SpecifyField: pageNumber>, <SpecifyField: plateNumber>, <SpecifyField: remarks>, <SpecifyField: text1>, <SpecifyField: text2>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>, <SpecifyField: yesNo1>, <SpecifyField: yesNo2>]
#     relationships = [<SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>, <SpecifyField: referenceWork>, <SpecifyField: sequencingRun>]
#     fieldAliases = []

# class DataType(Table):
#     # classname = edu.ku.brc.specify.datamodel.DataType
#     table = datatype
#     tableId = 33
#     idColumn = DataTypeID
#     idFieldName = dataTypeId
#     idField = <SpecifyIdField: dataTypeId>
#     fields = [<SpecifyField: name>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []
#     system = True

# class Deaccession(Table):
#     # classname = edu.ku.brc.specify.datamodel.Deaccession
#     table = deaccession
#     tableId = 163
#     idColumn = DeaccessionID
#     idFieldName = deaccessionId
#     idField = <SpecifyIdField: deaccessionId>
#     view = Deaccession
#     searchDialog = DeaccessionSearch
#     fields = [<SpecifyField: date1>, <SpecifyField: date2>, <SpecifyField: deaccessionDate>, <SpecifyField: deaccessionNumber>, <SpecifyField: integer1>, <SpecifyField: integer2>, <SpecifyField: integer3>, <SpecifyField: integer4>, <SpecifyField: integer5>, <SpecifyField: number1>, <SpecifyField: number2>, <SpecifyField: number3>, <SpecifyField: number4>, <SpecifyField: number5>, <SpecifyField: remarks>, <SpecifyField: status>, <SpecifyField: text1>, <SpecifyField: text2>, <SpecifyField: text3>, <SpecifyField: text4>, <SpecifyField: text5>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: type>, <SpecifyField: version>, <SpecifyField: yesNo1>, <SpecifyField: yesNo2>, <SpecifyField: yesNo3>, <SpecifyField: yesNo4>, <SpecifyField: yesNo5>]
#     relationships = [<SpecifyField: agent1>, <SpecifyField: agent2>, <SpecifyField: createdByAgent>, <SpecifyField: deaccessionAgents>, <SpecifyField: deaccessionAttachments>, <SpecifyField: disposals>, <SpecifyField: exchangeOuts>, <SpecifyField: gifts>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []

# class DeaccessionAgent(Table):
#     # classname = edu.ku.brc.specify.datamodel.DeaccessionAgent
#     table = deaccessionagent
#     tableId = 164
#     idColumn = DeaccessionAgentID
#     idFieldName = deaccessionAgentId
#     idField = <SpecifyIdField: deaccessionAgentId>
#     view = DeaccessionAgent
#     searchDialog = DeaccessionAgentSearch
#     fields = [<SpecifyField: remarks>, <SpecifyField: role>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: agent>, <SpecifyField: createdByAgent>, <SpecifyField: deaccession>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []

# class DeaccessionAttachment(Table):
#     # classname = edu.ku.brc.specify.datamodel.DeaccessionAttachment
#     table = deaccessionattachment
#     tableId = 165
#     idColumn = DeaccessionAttachmentID
#     idFieldName = deaccessionAttachmentId
#     idField = <SpecifyIdField: deaccessionAttachmentId>
#     view = ObjectAttachment
#     searchDialog = AttachmentSearch
#     fields = [<SpecifyField: ordinal>, <SpecifyField: remarks>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: attachment>, <SpecifyField: createdByAgent>, <SpecifyField: deaccession>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []
#     system = True

# class Determination(Table):
#     # classname = edu.ku.brc.specify.datamodel.Determination
#     table = determination
#     tableId = 9
#     idColumn = DeterminationID
#     idFieldName = determinationId
#     idField = <SpecifyIdField: determinationId>
#     view = Determination
#     searchDialog = DeterminationSearch
#     fields = [<SpecifyField: addendum>, <SpecifyField: alternateName>, <SpecifyField: collectionMemberId>, <SpecifyField: confidence>, <SpecifyField: determinedDate>, <SpecifyField: determinedDatePrecision>, <SpecifyField: featureOrBasis>, <SpecifyField: guid>, <SpecifyField: integer1>, <SpecifyField: integer2>, <SpecifyField: integer3>, <SpecifyField: integer4>, <SpecifyField: integer5>, <SpecifyField: isCurrent>, <SpecifyField: method>, <SpecifyField: nameUsage>, <SpecifyField: number1>, <SpecifyField: number2>, <SpecifyField: number3>, <SpecifyField: number4>, <SpecifyField: number5>, <SpecifyField: qualifier>, <SpecifyField: remarks>, <SpecifyField: subSpQualifier>, <SpecifyField: text1>, <SpecifyField: text2>, <SpecifyField: text3>, <SpecifyField: text4>, <SpecifyField: text5>, <SpecifyField: text6>, <SpecifyField: text7>, <SpecifyField: text8>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: typeStatusName>, <SpecifyField: varQualifier>, <SpecifyField: version>, <SpecifyField: yesNo1>, <SpecifyField: yesNo2>, <SpecifyField: yesNo3>, <SpecifyField: yesNo4>, <SpecifyField: yesNo5>]
#     relationships = [<SpecifyField: collectionObject>, <SpecifyField: createdByAgent>, <SpecifyField: determinationCitations>, <SpecifyField: determiner>, <SpecifyField: determiners>, <SpecifyField: modifiedByAgent>, <SpecifyField: preferredTaxon>, <SpecifyField: taxon>]
#     fieldAliases = []

# class DeterminationCitation(Table):
#     # classname = edu.ku.brc.specify.datamodel.DeterminationCitation
#     table = determinationcitation
#     tableId = 38
#     idColumn = DeterminationCitationID
#     idFieldName = determinationCitationId
#     idField = <SpecifyIdField: determinationCitationId>
#     fields = [<SpecifyField: collectionMemberId>, <SpecifyField: figureNumber>, <SpecifyField: isFigured>, <SpecifyField: pageNumber>, <SpecifyField: plateNumber>, <SpecifyField: remarks>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: createdByAgent>, <SpecifyField: determination>, <SpecifyField: modifiedByAgent>, <SpecifyField: referenceWork>]
#     fieldAliases = []

# class Determiner(Table):
#     # classname = edu.ku.brc.specify.datamodel.Determiner
#     table = determiner
#     tableId = 167
#     idColumn = DeterminerID
#     idFieldName = determinerId
#     idField = <SpecifyIdField: determinerId>
#     view = Determiner
#     searchDialog = DeterminerSearch
#     fields = [<SpecifyField: isPrimary>, <SpecifyField: orderNumber>, <SpecifyField: remarks>, <SpecifyField: text1>, <SpecifyField: text2>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>, <SpecifyField: yesNo1>, <SpecifyField: yesNo2>]
#     relationships = [<SpecifyField: agent>, <SpecifyField: createdByAgent>, <SpecifyField: determination>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []

# class Discipline(Table):
#     # classname = edu.ku.brc.specify.datamodel.Discipline
#     table = discipline
#     tableId = 26
#     idColumn = UserGroupScopeId
#     idFieldName = userGroupScopeId
#     idField = <SpecifyIdField: userGroupScopeId>
#     view = Discipline
#     searchDialog = DisciplineSearch
#     fields = [<SpecifyField: isPaleoContextEmbedded>, <SpecifyField: name>, <SpecifyField: paleoContextChildTable>, <SpecifyField: regNumber>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: type>, <SpecifyField: version>]
#     relationships = [<SpecifyField: attributeDefs>, <SpecifyField: collections>, <SpecifyField: createdByAgent>, <SpecifyField: dataType>, <SpecifyField: division>, <SpecifyField: geographyTreeDef>, <SpecifyField: geologicTimePeriodTreeDef>, <SpecifyField: lithoStratTreeDef>, <SpecifyField: modifiedByAgent>, <SpecifyField: numberingSchemes>, <SpecifyField: spExportSchemas>, <SpecifyField: spLocaleContainers>, <SpecifyField: taxonTreeDef>, <SpecifyField: userGroups>]
#     fieldAliases = []

# class Disposal(Table):
#     # classname = edu.ku.brc.specify.datamodel.Disposal
#     table = disposal
#     tableId = 34
#     idColumn = DisposalID
#     idFieldName = disposalId
#     idField = <SpecifyIdField: disposalId>
#     view = Disposal
#     searchDialog = DisposalSearch
#     fields = [<SpecifyField: disposalDate>, <SpecifyField: disposalNumber>, <SpecifyField: doNotExport>, <SpecifyField: number1>, <SpecifyField: number2>, <SpecifyField: remarks>, <SpecifyField: text1>, <SpecifyField: text2>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: type>, <SpecifyField: version>, <SpecifyField: yesNo1>, <SpecifyField: yesNo2>]
#     relationships = [<SpecifyField: createdByAgent>, <SpecifyField: deaccession>, <SpecifyField: disposalAgents>, <SpecifyField: disposalAttachments>, <SpecifyField: disposalPreparations>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []

# class DisposalAgent(Table):
#     # classname = edu.ku.brc.specify.datamodel.DisposalAgent
#     table = disposalagent
#     tableId = 35
#     idColumn = DisposalAgentID
#     idFieldName = disposalAgentId
#     idField = <SpecifyIdField: disposalAgentId>
#     view = DisposalAgent
#     searchDialog = DisposalAgentSearch
#     fields = [<SpecifyField: remarks>, <SpecifyField: role>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: agent>, <SpecifyField: createdByAgent>, <SpecifyField: disposal>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []

# class DisposalAttachment(Table):
#     # classname = edu.ku.brc.specify.datamodel.DisposalAttachment
#     table = disposalattachment
#     tableId = 166
#     idColumn = DisposalAttachmentID
#     idFieldName = disposalAttachmentId
#     idField = <SpecifyIdField: disposalAttachmentId>
#     view = ObjectAttachment
#     searchDialog = AttachmentSearch
#     fields = [<SpecifyField: ordinal>, <SpecifyField: remarks>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: attachment>, <SpecifyField: createdByAgent>, <SpecifyField: disposal>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []
#     system = True

# class DisposalPreparation(Table):
#     # classname = edu.ku.brc.specify.datamodel.DisposalPreparation
#     table = disposalpreparation
#     tableId = 36
#     idColumn = DisposalPreparationID
#     idFieldName = disposalPreparationId
#     idField = <SpecifyIdField: disposalPreparationId>
#     view = DisposalPreparation
#     searchDialog = None
#     fields = [<SpecifyField: quantity>, <SpecifyField: remarks>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: createdByAgent>, <SpecifyField: disposal>, <SpecifyField: loanReturnPreparation>, <SpecifyField: modifiedByAgent>, <SpecifyField: preparation>]
#     fieldAliases = []

# class Division(Table):
#     # classname = edu.ku.brc.specify.datamodel.Division
#     table = division
#     tableId = 96
#     idColumn = UserGroupScopeId
#     idFieldName = userGroupScopeId
#     idField = <SpecifyIdField: userGroupScopeId>
#     view = Division
#     searchDialog = DivisionSearch
#     fields = [<SpecifyField: abbrev>, <SpecifyField: altName>, <SpecifyField: description>, <SpecifyField: discipline>, <SpecifyField: iconURI>, <SpecifyField: name>, <SpecifyField: regNumber>, <SpecifyField: remarks>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: uri>, <SpecifyField: version>]
#     relationships = [<SpecifyField: address>, <SpecifyField: createdByAgent>, <SpecifyField: disciplines>, <SpecifyField: institution>, <SpecifyField: members>, <SpecifyField: modifiedByAgent>, <SpecifyField: numberingSchemes>, <SpecifyField: userGroups>]
#     fieldAliases = []

# class ExchangeIn(Table):
#     # classname = edu.ku.brc.specify.datamodel.ExchangeIn
#     table = exchangein
#     tableId = 39
#     idColumn = ExchangeInID
#     idFieldName = exchangeInId
#     idField = <SpecifyIdField: exchangeInId>
#     view = ExchangeIn
#     searchDialog = None
#     fields = [<SpecifyField: contents>, <SpecifyField: descriptionOfMaterial>, <SpecifyField: exchangeDate>, <SpecifyField: exchangeInNumber>, <SpecifyField: number1>, <SpecifyField: number2>, <SpecifyField: quantityExchanged>, <SpecifyField: remarks>, <SpecifyField: srcGeography>, <SpecifyField: srcTaxonomy>, <SpecifyField: text1>, <SpecifyField: text2>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>, <SpecifyField: yesNo1>, <SpecifyField: yesNo2>]
#     relationships = [<SpecifyField: addressOfRecord>, <SpecifyField: agentCatalogedBy>, <SpecifyField: agentReceivedFrom>, <SpecifyField: createdByAgent>, <SpecifyField: division>, <SpecifyField: exchangeInAttachments>, <SpecifyField: exchangeInPreps>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []

# class ExchangeInAttachment(Table):
#     # classname = edu.ku.brc.specify.datamodel.ExchangeInAttachment
#     table = exchangeinattachment
#     tableId = 169
#     idColumn = ExchangeInAttachmentID
#     idFieldName = exchangeInAttachmentId
#     idField = <SpecifyIdField: exchangeInAttachmentId>
#     view = ObjectAttachment
#     searchDialog = AttachmentSearch
#     fields = [<SpecifyField: ordinal>, <SpecifyField: remarks>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: attachment>, <SpecifyField: createdByAgent>, <SpecifyField: exchangeIn>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []
#     system = True

# class ExchangeInPrep(Table):
#     # classname = edu.ku.brc.specify.datamodel.ExchangeInPrep
#     table = exchangeinprep
#     tableId = 140
#     idColumn = ExchangeInPrepID
#     idFieldName = exchangeInPrepId
#     idField = <SpecifyIdField: exchangeInPrepId>
#     view = ExchangeInPrep
#     searchDialog = None
#     fields = [<SpecifyField: comments>, <SpecifyField: descriptionOfMaterial>, <SpecifyField: number1>, <SpecifyField: quantity>, <SpecifyField: text1>, <SpecifyField: text2>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: createdByAgent>, <SpecifyField: discipline>, <SpecifyField: exchangeIn>, <SpecifyField: modifiedByAgent>, <SpecifyField: preparation>]
#     fieldAliases = []

# class ExchangeOut(Table):
#     # classname = edu.ku.brc.specify.datamodel.ExchangeOut
#     table = exchangeout
#     tableId = 40
#     idColumn = ExchangeOutID
#     idFieldName = exchangeOutId
#     idField = <SpecifyIdField: exchangeOutId>
#     view = ExchangeOut
#     searchDialog = None
#     fields = [<SpecifyField: contents>, <SpecifyField: descriptionOfMaterial>, <SpecifyField: exchangeDate>, <SpecifyField: exchangeOutNumber>, <SpecifyField: number1>, <SpecifyField: number2>, <SpecifyField: quantityExchanged>, <SpecifyField: remarks>, <SpecifyField: srcGeography>, <SpecifyField: srcTaxonomy>, <SpecifyField: text1>, <SpecifyField: text2>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>, <SpecifyField: yesNo1>, <SpecifyField: yesNo2>]
#     relationships = [<SpecifyField: addressOfRecord>, <SpecifyField: agentCatalogedBy>, <SpecifyField: agentSentTo>, <SpecifyField: createdByAgent>, <SpecifyField: deaccession>, <SpecifyField: division>, <SpecifyField: exchangeOutAttachments>, <SpecifyField: exchangeOutPreps>, <SpecifyField: modifiedByAgent>, <SpecifyField: shipments>]
#     fieldAliases = []

# class ExchangeOutAttachment(Table):
#     # classname = edu.ku.brc.specify.datamodel.ExchangeOutAttachment
#     table = exchangeoutattachment
#     tableId = 170
#     idColumn = ExchangeOutAttachmentID
#     idFieldName = exchangeOutAttachmentId
#     idField = <SpecifyIdField: exchangeOutAttachmentId>
#     view = ObjectAttachment
#     searchDialog = AttachmentSearch
#     fields = [<SpecifyField: ordinal>, <SpecifyField: remarks>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: attachment>, <SpecifyField: createdByAgent>, <SpecifyField: exchangeOut>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []
#     system = True

# class ExchangeOutPrep(Table):
#     # classname = edu.ku.brc.specify.datamodel.ExchangeOutPrep
#     table = exchangeoutprep
#     tableId = 141
#     idColumn = ExchangeOutPrepID
#     idFieldName = exchangeOutPrepId
#     idField = <SpecifyIdField: exchangeOutPrepId>
#     view = ExchangeOutPrep
#     searchDialog = None
#     fields = [<SpecifyField: comments>, <SpecifyField: descriptionOfMaterial>, <SpecifyField: number1>, <SpecifyField: quantity>, <SpecifyField: text1>, <SpecifyField: text2>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: createdByAgent>, <SpecifyField: discipline>, <SpecifyField: exchangeOut>, <SpecifyField: modifiedByAgent>, <SpecifyField: preparation>]
#     fieldAliases = []

# class Exsiccata(Table):
#     # classname = edu.ku.brc.specify.datamodel.Exsiccata
#     table = exsiccata
#     tableId = 89
#     idColumn = ExsiccataID
#     idFieldName = exsiccataId
#     idField = <SpecifyIdField: exsiccataId>
#     view = Exsiccata
#     searchDialog = ExsiccataSearch
#     fields = [<SpecifyField: remarks>, <SpecifyField: schedae>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: title>, <SpecifyField: version>]
#     relationships = [<SpecifyField: createdByAgent>, <SpecifyField: exsiccataItems>, <SpecifyField: modifiedByAgent>, <SpecifyField: referenceWork>]
#     fieldAliases = []

# class ExsiccataItem(Table):
#     # classname = edu.ku.brc.specify.datamodel.ExsiccataItem
#     table = exsiccataitem
#     tableId = 104
#     idColumn = ExsiccataItemID
#     idFieldName = exsiccataItemId
#     idField = <SpecifyIdField: exsiccataItemId>
#     fields = [<SpecifyField: fascicle>, <SpecifyField: number>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: collectionObject>, <SpecifyField: createdByAgent>, <SpecifyField: exsiccata>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []

# class Extractor(Table):
#     # classname = edu.ku.brc.specify.datamodel.Extractor
#     table = extractor
#     tableId = 160
#     idColumn = ExtractorID
#     idFieldName = extractorId
#     idField = <SpecifyIdField: extractorId>
#     view = Extractor
#     searchDialog = None
#     fields = [<SpecifyField: orderNumber>, <SpecifyField: remarks>, <SpecifyField: text1>, <SpecifyField: text2>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>, <SpecifyField: yesNo1>, <SpecifyField: yesNo2>]
#     relationships = [<SpecifyField: agent>, <SpecifyField: createdByAgent>, <SpecifyField: dnaSequence>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []

# class FieldNotebook(Table):
#     # classname = edu.ku.brc.specify.datamodel.FieldNotebook
#     table = fieldnotebook
#     tableId = 83
#     idColumn = FieldNotebookID
#     idFieldName = fieldNotebookId
#     idField = <SpecifyIdField: fieldNotebookId>
#     fields = [<SpecifyField: description>, <SpecifyField: endDate>, <SpecifyField: location>, <SpecifyField: name>, <SpecifyField: startDate>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: attachments>, <SpecifyField: collection>, <SpecifyField: createdByAgent>, <SpecifyField: discipline>, <SpecifyField: modifiedByAgent>, <SpecifyField: ownerAgent>, <SpecifyField: pageSets>]
#     fieldAliases = []

# class FieldNotebookAttachment(Table):
#     # classname = edu.ku.brc.specify.datamodel.FieldNotebookAttachment
#     table = fieldnotebookattachment
#     tableId = 127
#     idColumn = FieldNotebookAttachmentId
#     idFieldName = fieldNotebookAttachmentId
#     idField = <SpecifyIdField: fieldNotebookAttachmentId>
#     view = ObjectAttachment
#     searchDialog = None
#     fields = [<SpecifyField: ordinal>, <SpecifyField: remarks>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: attachment>, <SpecifyField: createdByAgent>, <SpecifyField: fieldNotebook>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []
#     system = True

# class FieldNotebookPage(Table):
#     # classname = edu.ku.brc.specify.datamodel.FieldNotebookPage
#     table = fieldnotebookpage
#     tableId = 85
#     idColumn = FieldNotebookPageID
#     idFieldName = fieldNotebookPageId
#     idField = <SpecifyIdField: fieldNotebookPageId>
#     view = FieldNotebookPage
#     searchDialog = FieldNotebookPageSearch
#     fields = [<SpecifyField: description>, <SpecifyField: pageNumber>, <SpecifyField: scanDate>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: attachments>, <SpecifyField: collectionObjects>, <SpecifyField: createdByAgent>, <SpecifyField: discipline>, <SpecifyField: modifiedByAgent>, <SpecifyField: pageSet>]
#     fieldAliases = []

# class FieldNotebookPageAttachment(Table):
#     # classname = edu.ku.brc.specify.datamodel.FieldNotebookPageAttachment
#     table = fieldnotebookpageattachment
#     tableId = 129
#     idColumn = FieldNotebookPageAttachmentId
#     idFieldName = fieldNotebookPageAttachmentId
#     idField = <SpecifyIdField: fieldNotebookPageAttachmentId>
#     view = ObjectAttachment
#     searchDialog = None
#     fields = [<SpecifyField: ordinal>, <SpecifyField: remarks>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: attachment>, <SpecifyField: createdByAgent>, <SpecifyField: fieldNotebookPage>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []
#     system = True

# class FieldNotebookPageSet(Table):
#     # classname = edu.ku.brc.specify.datamodel.FieldNotebookPageSet
#     table = fieldnotebookpageset
#     tableId = 84
#     idColumn = FieldNotebookPageSetID
#     idFieldName = fieldNotebookPageSetId
#     idField = <SpecifyIdField: fieldNotebookPageSetId>
#     fields = [<SpecifyField: description>, <SpecifyField: endDate>, <SpecifyField: method>, <SpecifyField: orderNumber>, <SpecifyField: startDate>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: attachments>, <SpecifyField: createdByAgent>, <SpecifyField: discipline>, <SpecifyField: fieldNotebook>, <SpecifyField: modifiedByAgent>, <SpecifyField: pages>, <SpecifyField: sourceAgent>]
#     fieldAliases = []

# class FieldNotebookPageSetAttachment(Table):
#     # classname = edu.ku.brc.specify.datamodel.FieldNotebookPageSetAttachment
#     table = fieldnotebookpagesetattachment
#     tableId = 128
#     idColumn = FieldNotebookPageSetAttachmentId
#     idFieldName = fieldNotebookPageSetAttachmentId
#     idField = <SpecifyIdField: fieldNotebookPageSetAttachmentId>
#     view = ObjectAttachment
#     searchDialog = None
#     fields = [<SpecifyField: ordinal>, <SpecifyField: remarks>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: attachment>, <SpecifyField: createdByAgent>, <SpecifyField: fieldNotebookPageSet>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []
#     system = True

# class FundingAgent(Table):
#     # classname = edu.ku.brc.specify.datamodel.FundingAgent
#     table = fundingagent
#     tableId = 146
#     idColumn = FundingAgentID
#     idFieldName = fundingAgentId
#     idField = <SpecifyIdField: fundingAgentId>
#     view = FundingAgent
#     searchDialog = None
#     fields = [<SpecifyField: isPrimary>, <SpecifyField: orderNumber>, <SpecifyField: remarks>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: type>, <SpecifyField: version>]
#     relationships = [<SpecifyField: agent>, <SpecifyField: collectingTrip>, <SpecifyField: createdByAgent>, <SpecifyField: division>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []

# class GeoCoordDetail(Table):
#     # classname = edu.ku.brc.specify.datamodel.GeoCoordDetail
#     table = geocoorddetail
#     tableId = 123
#     idColumn = GeoCoordDetailID
#     idFieldName = geoCoordDetailId
#     idField = <SpecifyIdField: geoCoordDetailId>
#     fields = [<SpecifyField: errorPolygon>, <SpecifyField: geoRefAccuracy>, <SpecifyField: geoRefAccuracyUnits>, <SpecifyField: geoRefCompiledDate>, <SpecifyField: geoRefDetDate>, <SpecifyField: geoRefDetRef>, <SpecifyField: geoRefRemarks>, <SpecifyField: geoRefVerificationStatus>, <SpecifyField: integer1>, <SpecifyField: integer2>, <SpecifyField: integer3>, <SpecifyField: integer4>, <SpecifyField: integer5>, <SpecifyField: maxUncertaintyEst>, <SpecifyField: maxUncertaintyEstUnit>, <SpecifyField: namedPlaceExtent>, <SpecifyField: noGeoRefBecause>, <SpecifyField: number1>, <SpecifyField: number2>, <SpecifyField: number3>, <SpecifyField: number4>, <SpecifyField: number5>, <SpecifyField: originalCoordSystem>, <SpecifyField: protocol>, <SpecifyField: source>, <SpecifyField: text1>, <SpecifyField: text2>, <SpecifyField: text3>, <SpecifyField: text4>, <SpecifyField: text5>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: uncertaintyPolygon>, <SpecifyField: validation>, <SpecifyField: version>, <SpecifyField: yesNo1>, <SpecifyField: yesNo2>, <SpecifyField: yesNo3>, <SpecifyField: yesNo4>, <SpecifyField: yesNo5>]
#     relationships = [<SpecifyField: createdByAgent>, <SpecifyField: geoRefCompiledBy>, <SpecifyField: geoRefDetBy>, <SpecifyField: locality>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []

# class Geography(Table):
#     # classname = edu.ku.brc.specify.datamodel.Geography
#     table = geography
#     tableId = 3
#     idColumn = GeographyID
#     idFieldName = geographyId
#     idField = <SpecifyIdField: geographyId>
#     view = Geography
#     searchDialog = GeographySearch
#     fields = [<SpecifyField: abbrev>, <SpecifyField: centroidLat>, <SpecifyField: centroidLon>, <SpecifyField: commonName>, <SpecifyField: fullName>, <SpecifyField: geographyCode>, <SpecifyField: gml>, <SpecifyField: guid>, <SpecifyField: highestChildNodeNumber>, <SpecifyField: isAccepted>, <SpecifyField: isCurrent>, <SpecifyField: name>, <SpecifyField: nodeNumber>, <SpecifyField: number1>, <SpecifyField: number2>, <SpecifyField: rankId>, <SpecifyField: remarks>, <SpecifyField: text1>, <SpecifyField: text2>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: timestampVersion>, <SpecifyField: version>]
#     relationships = [<SpecifyField: acceptedChildren>, <SpecifyField: acceptedGeography>, <SpecifyField: children>, <SpecifyField: createdByAgent>, <SpecifyField: definition>, <SpecifyField: definitionItem>, <SpecifyField: localities>, <SpecifyField: modifiedByAgent>, <SpecifyField: parent>]
#     fieldAliases = [{'vname': 'acceptedParent', 'aname': 'acceptedGeography'}]

# class GeographyTreeDef(Table):
#     # classname = edu.ku.brc.specify.datamodel.GeographyTreeDef
#     table = geographytreedef
#     tableId = 44
#     idColumn = GeographyTreeDefID
#     idFieldName = geographyTreeDefId
#     idField = <SpecifyIdField: geographyTreeDefId>
#     fields = [<SpecifyField: fullNameDirection>, <SpecifyField: name>, <SpecifyField: remarks>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: createdByAgent>, <SpecifyField: disciplines>, <SpecifyField: modifiedByAgent>, <SpecifyField: treeDefItems>, <SpecifyField: treeEntries>]
#     fieldAliases = []

# class GeographyTreeDefItem(Table):
#     # classname = edu.ku.brc.specify.datamodel.GeographyTreeDefItem
#     table = geographytreedefitem
#     tableId = 45
#     idColumn = GeographyTreeDefItemID
#     idFieldName = geographyTreeDefItemId
#     idField = <SpecifyIdField: geographyTreeDefItemId>
#     fields = [<SpecifyField: fullNameSeparator>, <SpecifyField: isEnforced>, <SpecifyField: isInFullName>, <SpecifyField: name>, <SpecifyField: rankId>, <SpecifyField: remarks>, <SpecifyField: textAfter>, <SpecifyField: textBefore>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: title>, <SpecifyField: version>]
#     relationships = [<SpecifyField: children>, <SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>, <SpecifyField: parent>, <SpecifyField: treeDef>, <SpecifyField: treeEntries>]
#     fieldAliases = []

# class GeologicTimePeriod(Table):
#     # classname = edu.ku.brc.specify.datamodel.GeologicTimePeriod
#     table = geologictimeperiod
#     tableId = 46
#     idColumn = GeologicTimePeriodID
#     idFieldName = geologicTimePeriodId
#     idField = <SpecifyIdField: geologicTimePeriodId>
#     view = GeologicTimePeriod
#     searchDialog = ChronosStratSearch
#     fields = [<SpecifyField: endPeriod>, <SpecifyField: endUncertainty>, <SpecifyField: fullName>, <SpecifyField: guid>, <SpecifyField: highestChildNodeNumber>, <SpecifyField: isAccepted>, <SpecifyField: isBioStrat>, <SpecifyField: name>, <SpecifyField: nodeNumber>, <SpecifyField: rankId>, <SpecifyField: remarks>, <SpecifyField: standard>, <SpecifyField: startPeriod>, <SpecifyField: startUncertainty>, <SpecifyField: text1>, <SpecifyField: text2>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: acceptedChildren>, <SpecifyField: acceptedGeologicTimePeriod>, <SpecifyField: bioStratsPaleoContext>, <SpecifyField: children>, <SpecifyField: chronosStratsPaleoContext>, <SpecifyField: createdByAgent>, <SpecifyField: definition>, <SpecifyField: definitionItem>, <SpecifyField: modifiedByAgent>, <SpecifyField: parent>]
#     fieldAliases = [{'vname': 'acceptedParent', 'aname': 'acceptedGeologicTimePeriod'}]

# class GeologicTimePeriodTreeDef(Table):
#     # classname = edu.ku.brc.specify.datamodel.GeologicTimePeriodTreeDef
#     table = geologictimeperiodtreedef
#     tableId = 47
#     idColumn = GeologicTimePeriodTreeDefID
#     idFieldName = geologicTimePeriodTreeDefId
#     idField = <SpecifyIdField: geologicTimePeriodTreeDefId>
#     fields = [<SpecifyField: fullNameDirection>, <SpecifyField: name>, <SpecifyField: remarks>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: createdByAgent>, <SpecifyField: disciplines>, <SpecifyField: modifiedByAgent>, <SpecifyField: treeDefItems>, <SpecifyField: treeEntries>]
#     fieldAliases = []

# class GeologicTimePeriodTreeDefItem(Table):
#     # classname = edu.ku.brc.specify.datamodel.GeologicTimePeriodTreeDefItem
#     table = geologictimeperiodtreedefitem
#     tableId = 48
#     idColumn = GeologicTimePeriodTreeDefItemID
#     idFieldName = geologicTimePeriodTreeDefItemId
#     idField = <SpecifyIdField: geologicTimePeriodTreeDefItemId>
#     fields = [<SpecifyField: fullNameSeparator>, <SpecifyField: isEnforced>, <SpecifyField: isInFullName>, <SpecifyField: name>, <SpecifyField: rankId>, <SpecifyField: remarks>, <SpecifyField: textAfter>, <SpecifyField: textBefore>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: title>, <SpecifyField: version>]
#     relationships = [<SpecifyField: children>, <SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>, <SpecifyField: parent>, <SpecifyField: treeDef>, <SpecifyField: treeEntries>]
#     fieldAliases = []

# class Gift(Table):
#     # classname = edu.ku.brc.specify.datamodel.Gift
#     table = gift
#     tableId = 131
#     idColumn = GiftID
#     idFieldName = giftId
#     idField = <SpecifyIdField: giftId>
#     view = Gift
#     searchDialog = None
#     fields = [<SpecifyField: contents>, <SpecifyField: date1>, <SpecifyField: date1Precision>, <SpecifyField: dateReceived>, <SpecifyField: giftDate>, <SpecifyField: giftNumber>, <SpecifyField: integer1>, <SpecifyField: integer2>, <SpecifyField: integer3>, <SpecifyField: isFinancialResponsibility>, <SpecifyField: number1>, <SpecifyField: number2>, <SpecifyField: purposeOfGift>, <SpecifyField: receivedComments>, <SpecifyField: remarks>, <SpecifyField: specialConditions>, <SpecifyField: srcGeography>, <SpecifyField: srcTaxonomy>, <SpecifyField: status>, <SpecifyField: text1>, <SpecifyField: text2>, <SpecifyField: text3>, <SpecifyField: text4>, <SpecifyField: text5>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>, <SpecifyField: yesNo1>, <SpecifyField: yesNo2>]
#     relationships = [<SpecifyField: addressOfRecord>, <SpecifyField: createdByAgent>, <SpecifyField: deaccession>, <SpecifyField: discipline>, <SpecifyField: division>, <SpecifyField: giftAgents>, <SpecifyField: giftAttachments>, <SpecifyField: giftPreparations>, <SpecifyField: modifiedByAgent>, <SpecifyField: shipments>]
#     fieldAliases = []

# class GiftAgent(Table):
#     # classname = edu.ku.brc.specify.datamodel.GiftAgent
#     table = giftagent
#     tableId = 133
#     idColumn = GiftAgentID
#     idFieldName = giftAgentId
#     idField = <SpecifyIdField: giftAgentId>
#     view = GiftAgent
#     searchDialog = None
#     fields = [<SpecifyField: date1>, <SpecifyField: remarks>, <SpecifyField: role>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: agent>, <SpecifyField: createdByAgent>, <SpecifyField: discipline>, <SpecifyField: gift>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []

# class GiftAttachment(Table):
#     # classname = edu.ku.brc.specify.datamodel.GiftAttachment
#     table = giftattachment
#     tableId = 144
#     idColumn = GiftAttachmentID
#     idFieldName = giftAttachmentId
#     idField = <SpecifyIdField: giftAttachmentId>
#     view = ObjectAttachment
#     searchDialog = None
#     fields = [<SpecifyField: ordinal>, <SpecifyField: remarks>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: attachment>, <SpecifyField: createdByAgent>, <SpecifyField: gift>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []
#     system = True

# class GiftPreparation(Table):
#     # classname = edu.ku.brc.specify.datamodel.GiftPreparation
#     table = giftpreparation
#     tableId = 132
#     idColumn = GiftPreparationID
#     idFieldName = giftPreparationId
#     idField = <SpecifyIdField: giftPreparationId>
#     view = GiftItems
#     searchDialog = None
#     fields = [<SpecifyField: descriptionOfMaterial>, <SpecifyField: inComments>, <SpecifyField: outComments>, <SpecifyField: quantity>, <SpecifyField: receivedComments>, <SpecifyField: text1>, <SpecifyField: text2>, <SpecifyField: text3>, <SpecifyField: text4>, <SpecifyField: text5>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: createdByAgent>, <SpecifyField: discipline>, <SpecifyField: gift>, <SpecifyField: modifiedByAgent>, <SpecifyField: preparation>]
#     fieldAliases = []

# class GroupPerson(Table):
#     # classname = edu.ku.brc.specify.datamodel.GroupPerson
#     table = groupperson
#     tableId = 49
#     idColumn = GroupPersonID
#     idFieldName = groupPersonId
#     idField = <SpecifyIdField: groupPersonId>
#     view = GroupPerson
#     searchDialog = None
#     fields = [<SpecifyField: orderNumber>, <SpecifyField: remarks>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: createdByAgent>, <SpecifyField: division>, <SpecifyField: group>, <SpecifyField: member>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []

# class InfoRequest(Table):
#     # classname = edu.ku.brc.specify.datamodel.InfoRequest
#     table = inforequest
#     tableId = 50
#     idColumn = InfoRequestID
#     idFieldName = infoRequestID
#     idField = <SpecifyIdField: infoRequestID>
#     view = InfoRequest
#     searchDialog = None
#     fields = [<SpecifyField: collectionMemberId>, <SpecifyField: email>, <SpecifyField: firstName>, <SpecifyField: infoReqNumber>, <SpecifyField: institution>, <SpecifyField: lastName>, <SpecifyField: remarks>, <SpecifyField: replyDate>, <SpecifyField: requestDate>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: agent>, <SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>, <SpecifyField: recordSets>]
#     fieldAliases = []

# class Institution(Table):
#     # classname = edu.ku.brc.specify.datamodel.Institution
#     table = institution
#     tableId = 94
#     idColumn = UserGroupScopeId
#     idFieldName = userGroupScopeId
#     idField = <SpecifyIdField: userGroupScopeId>
#     view = Institution
#     searchDialog = None
#     fields = [<SpecifyField: altName>, <SpecifyField: code>, <SpecifyField: copyright>, <SpecifyField: currentManagedRelVersion>, <SpecifyField: currentManagedSchemaVersion>, <SpecifyField: description>, <SpecifyField: disclaimer>, <SpecifyField: guid>, <SpecifyField: hasBeenAsked>, <SpecifyField: iconURI>, <SpecifyField: ipr>, <SpecifyField: isAccessionsGlobal>, <SpecifyField: isAnonymous>, <SpecifyField: isReleaseManagedGlobally>, <SpecifyField: isSecurityOn>, <SpecifyField: isServerBased>, <SpecifyField: isSharingLocalities>, <SpecifyField: isSingleGeographyTree>, <SpecifyField: license>, <SpecifyField: lsidAuthority>, <SpecifyField: minimumPwdLength>, <SpecifyField: name>, <SpecifyField: regNumber>, <SpecifyField: remarks>, <SpecifyField: termsOfUse>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: uri>, <SpecifyField: version>]
#     relationships = [<SpecifyField: address>, <SpecifyField: contentContacts>, <SpecifyField: createdByAgent>, <SpecifyField: divisions>, <SpecifyField: modifiedByAgent>, <SpecifyField: storageTreeDef>, <SpecifyField: technicalContacts>, <SpecifyField: userGroups>]
#     fieldAliases = []

# class InstitutionNetwork(Table):
#     # classname = edu.ku.brc.specify.datamodel.InstitutionNetwork
#     table = institutionnetwork
#     tableId = 142
#     idColumn = InstitutionNetworkID
#     idFieldName = institutionNetworkId
#     idField = <SpecifyIdField: institutionNetworkId>
#     fields = [<SpecifyField: altName>, <SpecifyField: code>, <SpecifyField: copyright>, <SpecifyField: description>, <SpecifyField: disclaimer>, <SpecifyField: iconURI>, <SpecifyField: ipr>, <SpecifyField: license>, <SpecifyField: name>, <SpecifyField: remarks>, <SpecifyField: termsOfUse>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: uri>, <SpecifyField: version>]
#     relationships = [<SpecifyField: address>, <SpecifyField: collections>, <SpecifyField: contacts>, <SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []

# class Journal(Table):
#     # classname = edu.ku.brc.specify.datamodel.Journal
#     table = journal
#     tableId = 51
#     idColumn = JournalID
#     idFieldName = journalId
#     idField = <SpecifyIdField: journalId>
#     view = JournalForm
#     searchDialog = JournalSearch
#     fields = [<SpecifyField: guid>, <SpecifyField: issn>, <SpecifyField: journalAbbreviation>, <SpecifyField: journalName>, <SpecifyField: remarks>, <SpecifyField: text1>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: createdByAgent>, <SpecifyField: institution>, <SpecifyField: modifiedByAgent>, <SpecifyField: referenceWorks>]
#     fieldAliases = []

# class LatLonPolygon(Table):
#     # classname = edu.ku.brc.specify.datamodel.LatLonPolygon
#     table = latlonpolygon
#     tableId = 136
#     idColumn = LatLonPolygonID
#     idFieldName = latLonPolygonId
#     idField = <SpecifyIdField: latLonPolygonId>
#     fields = [<SpecifyField: description>, <SpecifyField: isPolyline>, <SpecifyField: name>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: createdByAgent>, <SpecifyField: locality>, <SpecifyField: modifiedByAgent>, <SpecifyField: points>, <SpecifyField: visualQuery>]
#     fieldAliases = []

# class LatLonPolygonPnt(Table):
#     # classname = edu.ku.brc.specify.datamodel.LatLonPolygonPnt
#     table = latlonpolygonpnt
#     tableId = 137
#     idColumn = LatLonPolygonPntID
#     idFieldName = latLonPolygonPntId
#     idField = <SpecifyIdField: latLonPolygonPntId>
#     fields = [<SpecifyField: elevation>, <SpecifyField: latitude>, <SpecifyField: longitude>, <SpecifyField: ordinal>]
#     relationships = [<SpecifyField: latLonPolygon>]
#     fieldAliases = []

# class LithoStrat(Table):
#     # classname = edu.ku.brc.specify.datamodel.LithoStrat
#     table = lithostrat
#     tableId = 100
#     idColumn = LithoStratID
#     idFieldName = lithoStratId
#     idField = <SpecifyIdField: lithoStratId>
#     view = LithoStrat
#     searchDialog = LithoStratSearch
#     fields = [<SpecifyField: fullName>, <SpecifyField: guid>, <SpecifyField: highestChildNodeNumber>, <SpecifyField: isAccepted>, <SpecifyField: name>, <SpecifyField: nodeNumber>, <SpecifyField: number1>, <SpecifyField: number2>, <SpecifyField: rankId>, <SpecifyField: remarks>, <SpecifyField: text1>, <SpecifyField: text2>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>, <SpecifyField: yesNo1>, <SpecifyField: yesNo2>]
#     relationships = [<SpecifyField: acceptedChildren>, <SpecifyField: acceptedLithoStrat>, <SpecifyField: children>, <SpecifyField: createdByAgent>, <SpecifyField: definition>, <SpecifyField: definitionItem>, <SpecifyField: modifiedByAgent>, <SpecifyField: paleoContexts>, <SpecifyField: parent>]
#     fieldAliases = [{'vname': 'acceptedParent', 'aname': 'acceptedLithoStrat'}]

# class LithoStratTreeDef(Table):
#     # classname = edu.ku.brc.specify.datamodel.LithoStratTreeDef
#     table = lithostrattreedef
#     tableId = 101
#     idColumn = LithoStratTreeDefID
#     idFieldName = lithoStratTreeDefId
#     idField = <SpecifyIdField: lithoStratTreeDefId>
#     fields = [<SpecifyField: fullNameDirection>, <SpecifyField: name>, <SpecifyField: remarks>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: createdByAgent>, <SpecifyField: disciplines>, <SpecifyField: modifiedByAgent>, <SpecifyField: treeDefItems>, <SpecifyField: treeEntries>]
#     fieldAliases = []

# class LithoStratTreeDefItem(Table):
#     # classname = edu.ku.brc.specify.datamodel.LithoStratTreeDefItem
#     table = lithostrattreedefitem
#     tableId = 102
#     idColumn = LithoStratTreeDefItemID
#     idFieldName = lithoStratTreeDefItemId
#     idField = <SpecifyIdField: lithoStratTreeDefItemId>
#     fields = [<SpecifyField: fullNameSeparator>, <SpecifyField: isEnforced>, <SpecifyField: isInFullName>, <SpecifyField: name>, <SpecifyField: rankId>, <SpecifyField: remarks>, <SpecifyField: textAfter>, <SpecifyField: textBefore>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: title>, <SpecifyField: version>]
#     relationships = [<SpecifyField: children>, <SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>, <SpecifyField: parent>, <SpecifyField: treeDef>, <SpecifyField: treeEntries>]
#     fieldAliases = []

# class Loan(Table):
#     # classname = edu.ku.brc.specify.datamodel.Loan
#     table = loan
#     tableId = 52
#     idColumn = LoanID
#     idFieldName = loanId
#     idField = <SpecifyIdField: loanId>
#     view = Loan
#     searchDialog = None
#     fields = [<SpecifyField: contents>, <SpecifyField: currentDueDate>, <SpecifyField: dateClosed>, <SpecifyField: dateReceived>, <SpecifyField: integer1>, <SpecifyField: integer2>, <SpecifyField: integer3>, <SpecifyField: isClosed>, <SpecifyField: isFinancialResponsibility>, <SpecifyField: loanDate>, <SpecifyField: loanNumber>, <SpecifyField: number1>, <SpecifyField: number2>, <SpecifyField: originalDueDate>, <SpecifyField: overdueNotiSentDate>, <SpecifyField: purposeOfLoan>, <SpecifyField: receivedComments>, <SpecifyField: remarks>, <SpecifyField: specialConditions>, <SpecifyField: srcGeography>, <SpecifyField: srcTaxonomy>, <SpecifyField: status>, <SpecifyField: text1>, <SpecifyField: text2>, <SpecifyField: text3>, <SpecifyField: text4>, <SpecifyField: text5>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>, <SpecifyField: yesNo1>, <SpecifyField: yesNo2>]
#     relationships = [<SpecifyField: addressOfRecord>, <SpecifyField: createdByAgent>, <SpecifyField: discipline>, <SpecifyField: division>, <SpecifyField: loanAgents>, <SpecifyField: loanAttachments>, <SpecifyField: loanPreparations>, <SpecifyField: modifiedByAgent>, <SpecifyField: shipments>]
#     fieldAliases = []

# class LoanAgent(Table):
#     # classname = edu.ku.brc.specify.datamodel.LoanAgent
#     table = loanagent
#     tableId = 53
#     idColumn = LoanAgentID
#     idFieldName = loanAgentId
#     idField = <SpecifyIdField: loanAgentId>
#     view = LoanAgent
#     searchDialog = None
#     fields = [<SpecifyField: remarks>, <SpecifyField: role>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: agent>, <SpecifyField: createdByAgent>, <SpecifyField: discipline>, <SpecifyField: loan>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []

# class LoanAttachment(Table):
#     # classname = edu.ku.brc.specify.datamodel.LoanAttachment
#     table = loanattachment
#     tableId = 114
#     idColumn = LoanAttachmentID
#     idFieldName = loanAttachmentId
#     idField = <SpecifyIdField: loanAttachmentId>
#     view = ObjectAttachment
#     searchDialog = None
#     fields = [<SpecifyField: ordinal>, <SpecifyField: remarks>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: attachment>, <SpecifyField: createdByAgent>, <SpecifyField: loan>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []
#     system = True

# class LoanPreparation(Table):
#     # classname = edu.ku.brc.specify.datamodel.LoanPreparation
#     table = loanpreparation
#     tableId = 54
#     idColumn = LoanPreparationID
#     idFieldName = loanPreparationId
#     idField = <SpecifyIdField: loanPreparationId>
#     view = LoanItems
#     searchDialog = None
#     fields = [<SpecifyField: descriptionOfMaterial>, <SpecifyField: inComments>, <SpecifyField: isResolved>, <SpecifyField: outComments>, <SpecifyField: quantity>, <SpecifyField: quantityResolved>, <SpecifyField: quantityReturned>, <SpecifyField: receivedComments>, <SpecifyField: text1>, <SpecifyField: text2>, <SpecifyField: text3>, <SpecifyField: text4>, <SpecifyField: text5>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: createdByAgent>, <SpecifyField: discipline>, <SpecifyField: loan>, <SpecifyField: loanReturnPreparations>, <SpecifyField: modifiedByAgent>, <SpecifyField: preparation>]
#     fieldAliases = []

# class LoanReturnPreparation(Table):
#     # classname = edu.ku.brc.specify.datamodel.LoanReturnPreparation
#     table = loanreturnpreparation
#     tableId = 55
#     idColumn = LoanReturnPreparationID
#     idFieldName = loanReturnPreparationId
#     idField = <SpecifyIdField: loanReturnPreparationId>
#     fields = [<SpecifyField: quantityResolved>, <SpecifyField: quantityReturned>, <SpecifyField: remarks>, <SpecifyField: returnedDate>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: createdByAgent>, <SpecifyField: discipline>, <SpecifyField: disposalPreparations>, <SpecifyField: loanPreparation>, <SpecifyField: modifiedByAgent>, <SpecifyField: receivedBy>]
#     fieldAliases = []

# class Locality(Table):
#     # classname = edu.ku.brc.specify.datamodel.Locality
#     table = locality
#     tableId = 2
#     idColumn = LocalityID
#     idFieldName = localityId
#     idField = <SpecifyIdField: localityId>
#     view = Locality
#     searchDialog = LocalitySearch
#     fields = [<SpecifyField: datum>, <SpecifyField: elevationAccuracy>, <SpecifyField: elevationMethod>, <SpecifyField: gml>, <SpecifyField: guid>, <SpecifyField: lat1text>, <SpecifyField: lat2text>, <SpecifyField: latLongAccuracy>, <SpecifyField: latLongMethod>, <SpecifyField: latLongType>, <SpecifyField: latitude1>, <SpecifyField: latitude2>, <SpecifyField: localityName>, <SpecifyField: long1text>, <SpecifyField: long2text>, <SpecifyField: longitude1>, <SpecifyField: longitude2>, <SpecifyField: maxElevation>, <SpecifyField: minElevation>, <SpecifyField: namedPlace>, <SpecifyField: originalElevationUnit>, <SpecifyField: originalLatLongUnit>, <SpecifyField: relationToNamedPlace>, <SpecifyField: remarks>, <SpecifyField: sgrStatus>, <SpecifyField: shortName>, <SpecifyField: srcLatLongUnit>, <SpecifyField: text1>, <SpecifyField: text2>, <SpecifyField: text3>, <SpecifyField: text4>, <SpecifyField: text5>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: uniqueIdentifier>, <SpecifyField: verbatimElevation>, <SpecifyField: verbatimLatitude>, <SpecifyField: verbatimLongitude>, <SpecifyField: version>, <SpecifyField: visibility>, <SpecifyField: yesNo1>, <SpecifyField: yesNo2>, <SpecifyField: yesNo3>, <SpecifyField: yesNo4>, <SpecifyField: yesNo5>]
#     relationships = [<SpecifyField: createdByAgent>, <SpecifyField: discipline>, <SpecifyField: geoCoordDetails>, <SpecifyField: geography>, <SpecifyField: latLonpolygons>, <SpecifyField: localityAttachments>, <SpecifyField: localityCitations>, <SpecifyField: localityDetails>, <SpecifyField: localityNameAliass>, <SpecifyField: modifiedByAgent>, <SpecifyField: paleoContext>, <SpecifyField: visibilitySetBy>, <SpecifyField: collectingEvents>]
#     fieldAliases = []

# class LocalityAttachment(Table):
#     # classname = edu.ku.brc.specify.datamodel.LocalityAttachment
#     table = localityattachment
#     tableId = 115
#     idColumn = LocalityAttachmentID
#     idFieldName = localityAttachmentId
#     idField = <SpecifyIdField: localityAttachmentId>
#     view = ObjectAttachment
#     searchDialog = None
#     fields = [<SpecifyField: ordinal>, <SpecifyField: remarks>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: attachment>, <SpecifyField: createdByAgent>, <SpecifyField: locality>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []
#     system = True

# class LocalityCitation(Table):
#     # classname = edu.ku.brc.specify.datamodel.LocalityCitation
#     table = localitycitation
#     tableId = 57
#     idColumn = LocalityCitationID
#     idFieldName = localityCitationId
#     idField = <SpecifyIdField: localityCitationId>
#     fields = [<SpecifyField: figureNumber>, <SpecifyField: isFigured>, <SpecifyField: pageNumber>, <SpecifyField: plateNumber>, <SpecifyField: remarks>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: createdByAgent>, <SpecifyField: discipline>, <SpecifyField: locality>, <SpecifyField: modifiedByAgent>, <SpecifyField: referenceWork>]
#     fieldAliases = []

# class LocalityDetail(Table):
#     # classname = edu.ku.brc.specify.datamodel.LocalityDetail
#     table = localitydetail
#     tableId = 124
#     idColumn = LocalityDetailID
#     idFieldName = localityDetailId
#     idField = <SpecifyIdField: localityDetailId>
#     fields = [<SpecifyField: baseMeridian>, <SpecifyField: drainage>, <SpecifyField: endDepth>, <SpecifyField: endDepthUnit>, <SpecifyField: endDepthVerbatim>, <SpecifyField: gml>, <SpecifyField: hucCode>, <SpecifyField: island>, <SpecifyField: islandGroup>, <SpecifyField: mgrsZone>, <SpecifyField: nationalParkName>, <SpecifyField: number1>, <SpecifyField: number2>, <SpecifyField: number3>, <SpecifyField: number4>, <SpecifyField: number5>, <SpecifyField: paleoLat>, <SpecifyField: paleoLng>, <SpecifyField: rangeDesc>, <SpecifyField: rangeDirection>, <SpecifyField: section>, <SpecifyField: sectionPart>, <SpecifyField: startDepth>, <SpecifyField: startDepthUnit>, <SpecifyField: startDepthVerbatim>, <SpecifyField: text1>, <SpecifyField: text2>, <SpecifyField: text3>, <SpecifyField: text4>, <SpecifyField: text5>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: township>, <SpecifyField: townshipDirection>, <SpecifyField: utmDatum>, <SpecifyField: utmEasting>, <SpecifyField: utmFalseEasting>, <SpecifyField: utmFalseNorthing>, <SpecifyField: utmNorthing>, <SpecifyField: utmOrigLatitude>, <SpecifyField: utmOrigLongitude>, <SpecifyField: utmScale>, <SpecifyField: utmZone>, <SpecifyField: version>, <SpecifyField: waterBody>, <SpecifyField: yesNo1>, <SpecifyField: yesNo2>, <SpecifyField: yesNo3>, <SpecifyField: yesNo4>, <SpecifyField: yesNo5>]
#     relationships = [<SpecifyField: createdByAgent>, <SpecifyField: locality>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []

# class LocalityNameAlias(Table):
#     # classname = edu.ku.brc.specify.datamodel.LocalityNameAlias
#     table = localitynamealias
#     tableId = 120
#     idColumn = LocalityNameAliasID
#     idFieldName = localityNameAliasId
#     idField = <SpecifyIdField: localityNameAliasId>
#     fields = [<SpecifyField: name>, <SpecifyField: source>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: createdByAgent>, <SpecifyField: discipline>, <SpecifyField: locality>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []

# class MaterialSample(Table):
#     # classname = edu.ku.brc.specify.datamodel.MaterialSample
#     table = materialsample
#     tableId = 151
#     idColumn = MaterialSampleID
#     idFieldName = materialSampleId
#     idField = <SpecifyIdField: materialSampleId>
#     fields = [<SpecifyField: GGBN_absorbanceRatio260_230>, <SpecifyField: GGBN_absorbanceRatio260_280>, <SpecifyField: GGBN_absorbanceRatioMethod>, <SpecifyField: GGBN_concentration>, <SpecifyField: GGBN_concentrationUnit>, <SpecifyField: GGBN_materialSampleType>, <SpecifyField: GGBN_medium>, <SpecifyField: GGBN_purificationMethod>, <SpecifyField: GGBN_quality>, <SpecifyField: GGBN_qualityCheckDate>, <SpecifyField: GGBN_qualityRemarks>, <SpecifyField: GGBN_sampleDesignation>, <SpecifyField: GGBN_sampleSize>, <SpecifyField: GGBN_volume>, <SpecifyField: GGBN_volumeUnit>, <SpecifyField: GGBN_weight>, <SpecifyField: GGBN_weightMethod>, <SpecifyField: GGBN_weightUnit>, <SpecifyField: collectionMemberId>, <SpecifyField: extractionDate>, <SpecifyField: guid>, <SpecifyField: integer1>, <SpecifyField: integer2>, <SpecifyField: number1>, <SpecifyField: number2>, <SpecifyField: remarks>, <SpecifyField: reservedInteger3>, <SpecifyField: reservedInteger4>, <SpecifyField: reservedNumber3>, <SpecifyField: reservedNumber4>, <SpecifyField: reservedText3>, <SpecifyField: reservedText4>, <SpecifyField: sraBioProjectID>, <SpecifyField: sraBioSampleID>, <SpecifyField: sraProjectID>, <SpecifyField: sraSampleID>, <SpecifyField: text1>, <SpecifyField: text2>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>, <SpecifyField: yesNo1>, <SpecifyField: yesNo2>]
#     relationships = [<SpecifyField: createdByAgent>, <SpecifyField: dnaSequences>, <SpecifyField: extractor>, <SpecifyField: modifiedByAgent>, <SpecifyField: preparation>]
#     fieldAliases = []

# class MorphBankView(Table):
#     # classname = edu.ku.brc.specify.datamodel.MorphBankView
#     table = morphbankview
#     tableId = 138
#     idColumn = MorphBankViewID
#     idFieldName = morphBankViewId
#     idField = <SpecifyIdField: morphBankViewId>
#     view = MorphBankView
#     searchDialog = MorphBankViewSearch
#     fields = [<SpecifyField: developmentState>, <SpecifyField: form>, <SpecifyField: imagingPreparationTechnique>, <SpecifyField: imagingTechnique>, <SpecifyField: morphBankExternalViewId>, <SpecifyField: sex>, <SpecifyField: specimenPart>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>, <SpecifyField: viewAngle>, <SpecifyField: viewName>]
#     relationships = [<SpecifyField: attachmentImageAttributes>, <SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []
#     system = True

# class OtherIdentifier(Table):
#     # classname = edu.ku.brc.specify.datamodel.OtherIdentifier
#     table = otheridentifier
#     tableId = 61
#     idColumn = OtherIdentifierID
#     idFieldName = otherIdentifierId
#     idField = <SpecifyIdField: otherIdentifierId>
#     view = OtherIdentifiers
#     searchDialog = None
#     fields = [<SpecifyField: collectionMemberId>, <SpecifyField: date1>, <SpecifyField: date1Precision>, <SpecifyField: date2>, <SpecifyField: date2Precision>, <SpecifyField: identifier>, <SpecifyField: institution>, <SpecifyField: remarks>, <SpecifyField: text1>, <SpecifyField: text2>, <SpecifyField: text3>, <SpecifyField: text4>, <SpecifyField: text5>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>, <SpecifyField: yesNo1>, <SpecifyField: yesNo2>, <SpecifyField: yesNo3>, <SpecifyField: yesNo4>, <SpecifyField: yesNo5>]
#     relationships = [<SpecifyField: agent1>, <SpecifyField: agent2>, <SpecifyField: collectionObject>, <SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []

# class PaleoContext(Table):
#     # classname = edu.ku.brc.specify.datamodel.PaleoContext
#     table = paleocontext
#     tableId = 32
#     idColumn = PaleoContextID
#     idFieldName = paleoContextId
#     idField = <SpecifyIdField: paleoContextId>
#     view = PaleoContext
#     searchDialog = PaleoContextSearch
#     fields = [<SpecifyField: number1>, <SpecifyField: number2>, <SpecifyField: number3>, <SpecifyField: number4>, <SpecifyField: number5>, <SpecifyField: paleoContextName>, <SpecifyField: remarks>, <SpecifyField: text1>, <SpecifyField: text2>, <SpecifyField: text3>, <SpecifyField: text4>, <SpecifyField: text5>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>, <SpecifyField: yesNo1>, <SpecifyField: yesNo2>, <SpecifyField: yesNo3>, <SpecifyField: yesNo4>, <SpecifyField: yesNo5>]
#     relationships = [<SpecifyField: bioStrat>, <SpecifyField: chronosStrat>, <SpecifyField: chronosStratEnd>, <SpecifyField: collectingEvents>, <SpecifyField: collectionObjects>, <SpecifyField: createdByAgent>, <SpecifyField: discipline>, <SpecifyField: lithoStrat>, <SpecifyField: localities>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []

# class PcrPerson(Table):
#     # classname = edu.ku.brc.specify.datamodel.PcrPerson
#     table = pcrperson
#     tableId = 161
#     idColumn = PcrPersonID
#     idFieldName = pcrPersonId
#     idField = <SpecifyIdField: pcrPersonId>
#     view = PcrPerson
#     searchDialog = None
#     fields = [<SpecifyField: orderNumber>, <SpecifyField: remarks>, <SpecifyField: text1>, <SpecifyField: text2>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>, <SpecifyField: yesNo1>, <SpecifyField: yesNo2>]
#     relationships = [<SpecifyField: agent>, <SpecifyField: createdByAgent>, <SpecifyField: dnaSequence>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []

# class Permit(Table):
#     # classname = edu.ku.brc.specify.datamodel.Permit
#     table = permit
#     tableId = 6
#     idColumn = PermitID
#     idFieldName = permitId
#     idField = <SpecifyIdField: permitId>
#     view = Permit
#     searchDialog = PermitSearch
#     fields = [<SpecifyField: copyright>, <SpecifyField: endDate>, <SpecifyField: isAvailable>, <SpecifyField: isRequired>, <SpecifyField: issuedDate>, <SpecifyField: number1>, <SpecifyField: number2>, <SpecifyField: permitNumber>, <SpecifyField: permitText>, <SpecifyField: remarks>, <SpecifyField: renewalDate>, <SpecifyField: reservedInteger1>, <SpecifyField: reservedInteger2>, <SpecifyField: reservedText3>, <SpecifyField: reservedText4>, <SpecifyField: startDate>, <SpecifyField: status>, <SpecifyField: statusQualifier>, <SpecifyField: text1>, <SpecifyField: text2>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: type>, <SpecifyField: version>, <SpecifyField: yesNo1>, <SpecifyField: yesNo2>]
#     relationships = [<SpecifyField: accessionAuthorizations>, <SpecifyField: collectingEventAuthorizations>, <SpecifyField: collectingTripAuthorizations>, <SpecifyField: createdByAgent>, <SpecifyField: institution>, <SpecifyField: issuedBy>, <SpecifyField: issuedTo>, <SpecifyField: modifiedByAgent>, <SpecifyField: permitAttachments>]
#     fieldAliases = []

# class PermitAttachment(Table):
#     # classname = edu.ku.brc.specify.datamodel.PermitAttachment
#     table = permitattachment
#     tableId = 116
#     idColumn = PermitAttachmentID
#     idFieldName = permitAttachmentId
#     idField = <SpecifyIdField: permitAttachmentId>
#     view = ObjectAttachment
#     searchDialog = None
#     fields = [<SpecifyField: ordinal>, <SpecifyField: remarks>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: attachment>, <SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>, <SpecifyField: permit>]
#     fieldAliases = []
#     system = True

# class PickList(Table):
#     # classname = edu.ku.brc.specify.datamodel.PickList
#     table = picklist
#     tableId = 500
#     idColumn = PickListID
#     idFieldName = pickListId
#     idField = <SpecifyIdField: pickListId>
#     view = PickList
#     searchDialog = None
#     fields = [<SpecifyField: fieldName>, <SpecifyField: filterFieldName>, <SpecifyField: filterValue>, <SpecifyField: formatter>, <SpecifyField: isSystem>, <SpecifyField: name>, <SpecifyField: readOnly>, <SpecifyField: sizeLimit>, <SpecifyField: sortType>, <SpecifyField: tableName>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: type>, <SpecifyField: version>]
#     relationships = [<SpecifyField: collection>, <SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>, <SpecifyField: pickListItems>]
#     fieldAliases = []
#     system = True

# class PickListItem(Table):
#     # classname = edu.ku.brc.specify.datamodel.PickListItem
#     table = picklistitem
#     tableId = 501
#     idColumn = PickListItemID
#     idFieldName = pickListItemId
#     idField = <SpecifyIdField: pickListItemId>
#     view = PickListItem
#     searchDialog = None
#     fields = [<SpecifyField: ordinal>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: title>, <SpecifyField: value>, <SpecifyField: version>]
#     relationships = [<SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>, <SpecifyField: pickList>]
#     fieldAliases = []
#     system = True

# class PrepType(Table):
#     # classname = edu.ku.brc.specify.datamodel.PrepType
#     table = preptype
#     tableId = 65
#     idColumn = PrepTypeID
#     idFieldName = prepTypeId
#     idField = <SpecifyIdField: prepTypeId>
#     view = PrepType
#     searchDialog = PrepTypeSearch
#     fields = [<SpecifyField: isLoanable>, <SpecifyField: name>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: attributeDefs>, <SpecifyField: collection>, <SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []

# class Preparation(Table):
#     # classname = edu.ku.brc.specify.datamodel.Preparation
#     table = preparation
#     tableId = 63
#     idColumn = PreparationID
#     idFieldName = preparationId
#     idField = <SpecifyIdField: preparationId>
#     view = Preparation
#     searchDialog = PreparationSearch
#     fields = [<SpecifyField: barCode>, <SpecifyField: collectionMemberId>, <SpecifyField: countAmt>, <SpecifyField: date1>, <SpecifyField: date1Precision>, <SpecifyField: date2>, <SpecifyField: date2Precision>, <SpecifyField: date3>, <SpecifyField: date3Precision>, <SpecifyField: date4>, <SpecifyField: date4Precision>, <SpecifyField: description>, <SpecifyField: guid>, <SpecifyField: integer1>, <SpecifyField: integer2>, <SpecifyField: number1>, <SpecifyField: number2>, <SpecifyField: preparedDate>, <SpecifyField: preparedDatePrecision>, <SpecifyField: remarks>, <SpecifyField: reservedInteger3>, <SpecifyField: reservedInteger4>, <SpecifyField: sampleNumber>, <SpecifyField: status>, <SpecifyField: storageLocation>, <SpecifyField: text1>, <SpecifyField: text10>, <SpecifyField: text11>, <SpecifyField: text12>, <SpecifyField: text13>, <SpecifyField: text2>, <SpecifyField: text3>, <SpecifyField: text4>, <SpecifyField: text5>, <SpecifyField: text6>, <SpecifyField: text7>, <SpecifyField: text8>, <SpecifyField: text9>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>, <SpecifyField: yesNo1>, <SpecifyField: yesNo2>, <SpecifyField: yesNo3>]
#     relationships = [<SpecifyField: alternateStorage>, <SpecifyField: collectionObject>, <SpecifyField: conservDescriptions>, <SpecifyField: createdByAgent>, <SpecifyField: disposalPreparations>, <SpecifyField: exchangeInPreps>, <SpecifyField: exchangeOutPreps>, <SpecifyField: giftPreparations>, <SpecifyField: loanPreparations>, <SpecifyField: materialSamples>, <SpecifyField: modifiedByAgent>, <SpecifyField: prepType>, <SpecifyField: preparationAttachments>, <SpecifyField: preparationAttribute>, <SpecifyField: preparationAttrs>, <SpecifyField: preparationProperties>, <SpecifyField: preparedByAgent>, <SpecifyField: storage>]
#     fieldAliases = []

# class PreparationAttachment(Table):
#     # classname = edu.ku.brc.specify.datamodel.PreparationAttachment
#     table = preparationattachment
#     tableId = 117
#     idColumn = PreparationAttachmentID
#     idFieldName = preparationAttachmentId
#     idField = <SpecifyIdField: preparationAttachmentId>
#     view = ObjectAttachment
#     searchDialog = None
#     fields = [<SpecifyField: collectionMemberId>, <SpecifyField: ordinal>, <SpecifyField: remarks>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: attachment>, <SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>, <SpecifyField: preparation>]
#     fieldAliases = []
#     system = True

# class PreparationAttr(Table):
#     # classname = edu.ku.brc.specify.datamodel.PreparationAttr
#     table = preparationattr
#     tableId = 64
#     idColumn = AttrID
#     idFieldName = attrId
#     idField = <SpecifyIdField: attrId>
#     fields = [<SpecifyField: collectionMemberId>, <SpecifyField: dblValue>, <SpecifyField: strValue>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: createdByAgent>, <SpecifyField: definition>, <SpecifyField: modifiedByAgent>, <SpecifyField: preparation>]
#     fieldAliases = []

# class PreparationAttribute(Table):
#     # classname = edu.ku.brc.specify.datamodel.PreparationAttribute
#     table = preparationattribute
#     tableId = 91
#     idColumn = PreparationAttributeID
#     idFieldName = preparationAttributeId
#     idField = <SpecifyIdField: preparationAttributeId>
#     fields = [<SpecifyField: attrDate>, <SpecifyField: collectionMemberId>, <SpecifyField: number1>, <SpecifyField: number2>, <SpecifyField: number3>, <SpecifyField: number4>, <SpecifyField: number5>, <SpecifyField: number6>, <SpecifyField: number7>, <SpecifyField: number8>, <SpecifyField: number9>, <SpecifyField: remarks>, <SpecifyField: text1>, <SpecifyField: text10>, <SpecifyField: text11>, <SpecifyField: text12>, <SpecifyField: text13>, <SpecifyField: text14>, <SpecifyField: text15>, <SpecifyField: text16>, <SpecifyField: text17>, <SpecifyField: text18>, <SpecifyField: text19>, <SpecifyField: text2>, <SpecifyField: text20>, <SpecifyField: text21>, <SpecifyField: text22>, <SpecifyField: text23>, <SpecifyField: text24>, <SpecifyField: text25>, <SpecifyField: text26>, <SpecifyField: text3>, <SpecifyField: text4>, <SpecifyField: text5>, <SpecifyField: text6>, <SpecifyField: text7>, <SpecifyField: text8>, <SpecifyField: text9>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>, <SpecifyField: yesNo1>, <SpecifyField: yesNo2>, <SpecifyField: yesNo3>, <SpecifyField: yesNo4>]
#     relationships = [<SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>, <SpecifyField: preparations>]
#     fieldAliases = []

# class PreparationProperty(Table):
#     # classname = edu.ku.brc.specify.datamodel.PreparationProperty
#     table = preparationproperty
#     tableId = 154
#     idColumn = PreparationPropertyID
#     idFieldName = preparationPropertyId
#     idField = <SpecifyIdField: preparationPropertyId>
#     view = PreparationProperty
#     searchDialog = None
#     fields = [<SpecifyField: collectionMemberId>, <SpecifyField: date1>, <SpecifyField: date10>, <SpecifyField: date11>, <SpecifyField: date12>, <SpecifyField: date13>, <SpecifyField: date14>, <SpecifyField: date15>, <SpecifyField: date16>, <SpecifyField: date17>, <SpecifyField: date18>, <SpecifyField: date19>, <SpecifyField: date2>, <SpecifyField: date20>, <SpecifyField: date3>, <SpecifyField: date4>, <SpecifyField: date5>, <SpecifyField: date6>, <SpecifyField: date7>, <SpecifyField: date8>, <SpecifyField: date9>, <SpecifyField: guid>, <SpecifyField: integer1>, <SpecifyField: integer10>, <SpecifyField: integer11>, <SpecifyField: integer12>, <SpecifyField: integer13>, <SpecifyField: integer14>, <SpecifyField: integer15>, <SpecifyField: integer16>, <SpecifyField: integer17>, <SpecifyField: integer18>, <SpecifyField: integer19>, <SpecifyField: integer2>, <SpecifyField: integer20>, <SpecifyField: integer21>, <SpecifyField: integer22>, <SpecifyField: integer23>, <SpecifyField: integer24>, <SpecifyField: integer25>, <SpecifyField: integer26>, <SpecifyField: integer27>, <SpecifyField: integer28>, <SpecifyField: integer29>, <SpecifyField: integer3>, <SpecifyField: integer30>, <SpecifyField: integer4>, <SpecifyField: integer5>, <SpecifyField: integer6>, <SpecifyField: integer7>, <SpecifyField: integer8>, <SpecifyField: integer9>, <SpecifyField: number1>, <SpecifyField: number10>, <SpecifyField: number11>, <SpecifyField: number12>, <SpecifyField: number13>, <SpecifyField: number14>, <SpecifyField: number15>, <SpecifyField: number16>, <SpecifyField: number17>, <SpecifyField: number18>, <SpecifyField: number19>, <SpecifyField: number2>, <SpecifyField: number20>, <SpecifyField: number21>, <SpecifyField: number22>, <SpecifyField: number23>, <SpecifyField: number24>, <SpecifyField: number25>, <SpecifyField: number26>, <SpecifyField: number27>, <SpecifyField: number28>, <SpecifyField: number29>, <SpecifyField: number3>, <SpecifyField: number30>, <SpecifyField: number4>, <SpecifyField: number5>, <SpecifyField: number6>, <SpecifyField: number7>, <SpecifyField: number8>, <SpecifyField: number9>, <SpecifyField: remarks>, <SpecifyField: text1>, <SpecifyField: text10>, <SpecifyField: text11>, <SpecifyField: text12>, <SpecifyField: text13>, <SpecifyField: text14>, <SpecifyField: text15>, <SpecifyField: text16>, <SpecifyField: text17>, <SpecifyField: text18>, <SpecifyField: text19>, <SpecifyField: text2>, <SpecifyField: text20>, <SpecifyField: text21>, <SpecifyField: text22>, <SpecifyField: text23>, <SpecifyField: text24>, <SpecifyField: text25>, <SpecifyField: text26>, <SpecifyField: text27>, <SpecifyField: text28>, <SpecifyField: text29>, <SpecifyField: text3>, <SpecifyField: text30>, <SpecifyField: text31>, <SpecifyField: text32>, <SpecifyField: text33>, <SpecifyField: text34>, <SpecifyField: text35>, <SpecifyField: text36>, <SpecifyField: text37>, <SpecifyField: text38>, <SpecifyField: text39>, <SpecifyField: text4>, <SpecifyField: text40>, <SpecifyField: text5>, <SpecifyField: text6>, <SpecifyField: text7>, <SpecifyField: text8>, <SpecifyField: text9>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>, <SpecifyField: yesNo1>, <SpecifyField: yesNo10>, <SpecifyField: yesNo11>, <SpecifyField: yesNo12>, <SpecifyField: yesNo13>, <SpecifyField: yesNo14>, <SpecifyField: yesNo15>, <SpecifyField: yesNo16>, <SpecifyField: yesNo17>, <SpecifyField: yesNo18>, <SpecifyField: yesNo19>, <SpecifyField: yesNo2>, <SpecifyField: yesNo20>, <SpecifyField: yesNo3>, <SpecifyField: yesNo4>, <SpecifyField: yesNo5>, <SpecifyField: yesNo6>, <SpecifyField: yesNo7>, <SpecifyField: yesNo8>, <SpecifyField: yesNo9>]
#     relationships = [<SpecifyField: agent1>, <SpecifyField: agent10>, <SpecifyField: agent11>, <SpecifyField: agent12>, <SpecifyField: agent13>, <SpecifyField: agent14>, <SpecifyField: agent15>, <SpecifyField: agent16>, <SpecifyField: agent17>, <SpecifyField: agent18>, <SpecifyField: agent19>, <SpecifyField: agent2>, <SpecifyField: agent20>, <SpecifyField: agent3>, <SpecifyField: agent4>, <SpecifyField: agent5>, <SpecifyField: agent6>, <SpecifyField: agent7>, <SpecifyField: agent8>, <SpecifyField: agent9>, <SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>, <SpecifyField: preparation>]
#     fieldAliases = []

# class Project(Table):
#     # classname = edu.ku.brc.specify.datamodel.Project
#     table = project
#     tableId = 66
#     idColumn = ProjectID
#     idFieldName = projectId
#     idField = <SpecifyIdField: projectId>
#     view = Project
#     searchDialog = ProjectSearch
#     fields = [<SpecifyField: collectionMemberId>, <SpecifyField: endDate>, <SpecifyField: grantAgency>, <SpecifyField: grantNumber>, <SpecifyField: number1>, <SpecifyField: number2>, <SpecifyField: projectDescription>, <SpecifyField: projectName>, <SpecifyField: projectNumber>, <SpecifyField: remarks>, <SpecifyField: startDate>, <SpecifyField: text1>, <SpecifyField: text2>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: url>, <SpecifyField: version>, <SpecifyField: yesNo1>, <SpecifyField: yesNo2>]
#     relationships = [<SpecifyField: agent>, <SpecifyField: collectionObjects>, <SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []

# class RecordSet(Table):
#     # classname = edu.ku.brc.specify.datamodel.RecordSet
#     table = recordset
#     tableId = 68
#     idColumn = RecordSetID
#     idFieldName = recordSetId
#     idField = <SpecifyIdField: recordSetId>
#     fields = [<SpecifyField: allPermissionLevel>, <SpecifyField: collectionMemberId>, <SpecifyField: dbTableId>, <SpecifyField: groupPermissionLevel>, <SpecifyField: name>, <SpecifyField: ownerPermissionLevel>, <SpecifyField: remarks>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: type>, <SpecifyField: version>]
#     relationships = [<SpecifyField: createdByAgent>, <SpecifyField: group>, <SpecifyField: infoRequest>, <SpecifyField: modifiedByAgent>, <SpecifyField: recordSetItems>, <SpecifyField: specifyUser>]
#     fieldAliases = []
#     system = True

# class RecordSetItem(Table):
#     # classname = edu.ku.brc.specify.datamodel.RecordSetItem
#     table = recordsetitem
#     tableId = 502
#     idColumn = RecordSetItemID
#     idFieldName = recordSetItemId
#     idField = <SpecifyIdField: recordSetItemId>
#     fields = [<SpecifyField: order>, <SpecifyField: recordId>]
#     relationships = [<SpecifyField: recordSet>]
#     fieldAliases = []
#     system = True

# class ReferenceWork(Table):
#     # classname = edu.ku.brc.specify.datamodel.ReferenceWork
#     table = referencework
#     tableId = 69
#     idColumn = ReferenceWorkID
#     idFieldName = referenceWorkId
#     idField = <SpecifyIdField: referenceWorkId>
#     view = ReferenceWork
#     searchDialog = ReferenceWorkSearch
#     fields = [<SpecifyField: doi>, <SpecifyField: guid>, <SpecifyField: isPublished>, <SpecifyField: isbn>, <SpecifyField: libraryNumber>, <SpecifyField: number1>, <SpecifyField: number2>, <SpecifyField: pages>, <SpecifyField: placeOfPublication>, <SpecifyField: publisher>, <SpecifyField: referenceWorkType>, <SpecifyField: remarks>, <SpecifyField: text1>, <SpecifyField: text2>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: title>, <SpecifyField: uri>, <SpecifyField: url>, <SpecifyField: version>, <SpecifyField: volume>, <SpecifyField: workDate>, <SpecifyField: yesNo1>, <SpecifyField: yesNo2>]
#     relationships = [<SpecifyField: authors>, <SpecifyField: collectionObjectCitations>, <SpecifyField: containedRFParent>, <SpecifyField: containedReferenceWorks>, <SpecifyField: createdByAgent>, <SpecifyField: determinationCitations>, <SpecifyField: exsiccatae>, <SpecifyField: institution>, <SpecifyField: journal>, <SpecifyField: localityCitations>, <SpecifyField: modifiedByAgent>, <SpecifyField: referenceWorkAttachments>, <SpecifyField: taxonCitations>]
#     fieldAliases = []

# class ReferenceWorkAttachment(Table):
#     # classname = edu.ku.brc.specify.datamodel.ReferenceWorkAttachment
#     table = referenceworkattachment
#     tableId = 143
#     idColumn = ReferenceWorkAttachmentID
#     idFieldName = referenceWorkAttachmentId
#     idField = <SpecifyIdField: referenceWorkAttachmentId>
#     view = ObjectAttachment
#     searchDialog = None
#     fields = [<SpecifyField: ordinal>, <SpecifyField: remarks>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: attachment>, <SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>, <SpecifyField: referenceWork>]
#     fieldAliases = []
#     system = True

# class RepositoryAgreement(Table):
#     # classname = edu.ku.brc.specify.datamodel.RepositoryAgreement
#     table = repositoryagreement
#     tableId = 70
#     idColumn = RepositoryAgreementID
#     idFieldName = repositoryAgreementId
#     idField = <SpecifyIdField: repositoryAgreementId>
#     view = RepositoryAgreement
#     searchDialog = RepositoryAgreementSearch
#     fields = [<SpecifyField: dateReceived>, <SpecifyField: endDate>, <SpecifyField: number1>, <SpecifyField: number2>, <SpecifyField: remarks>, <SpecifyField: repositoryAgreementNumber>, <SpecifyField: startDate>, <SpecifyField: status>, <SpecifyField: text1>, <SpecifyField: text2>, <SpecifyField: text3>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>, <SpecifyField: yesNo1>, <SpecifyField: yesNo2>]
#     relationships = [<SpecifyField: accessions>, <SpecifyField: addressOfRecord>, <SpecifyField: createdByAgent>, <SpecifyField: division>, <SpecifyField: modifiedByAgent>, <SpecifyField: originator>, <SpecifyField: repositoryAgreementAgents>, <SpecifyField: repositoryAgreementAttachments>, <SpecifyField: repositoryAgreementAuthorizations>]
#     fieldAliases = []

# class RepositoryAgreementAttachment(Table):
#     # classname = edu.ku.brc.specify.datamodel.RepositoryAgreementAttachment
#     table = repositoryagreementattachment
#     tableId = 118
#     idColumn = RepositoryAgreementAttachmentID
#     idFieldName = repositoryAgreementAttachmentId
#     idField = <SpecifyIdField: repositoryAgreementAttachmentId>
#     view = ObjectAttachment
#     searchDialog = None
#     fields = [<SpecifyField: ordinal>, <SpecifyField: remarks>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: attachment>, <SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>, <SpecifyField: repositoryAgreement>]
#     fieldAliases = []
#     system = True

# class Shipment(Table):
#     # classname = edu.ku.brc.specify.datamodel.Shipment
#     table = shipment
#     tableId = 71
#     idColumn = ShipmentID
#     idFieldName = shipmentId
#     idField = <SpecifyIdField: shipmentId>
#     fields = [<SpecifyField: insuredForAmount>, <SpecifyField: number1>, <SpecifyField: number2>, <SpecifyField: numberOfPackages>, <SpecifyField: remarks>, <SpecifyField: shipmentDate>, <SpecifyField: shipmentMethod>, <SpecifyField: shipmentNumber>, <SpecifyField: text1>, <SpecifyField: text2>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>, <SpecifyField: weight>, <SpecifyField: yesNo1>, <SpecifyField: yesNo2>]
#     relationships = [<SpecifyField: borrow>, <SpecifyField: createdByAgent>, <SpecifyField: discipline>, <SpecifyField: exchangeOut>, <SpecifyField: gift>, <SpecifyField: loan>, <SpecifyField: modifiedByAgent>, <SpecifyField: shippedBy>, <SpecifyField: shippedTo>, <SpecifyField: shipper>]
#     fieldAliases = []

# class SpAppResource(Table):
#     # classname = edu.ku.brc.specify.datamodel.SpAppResource
#     table = spappresource
#     tableId = 514
#     idColumn = SpAppResourceID
#     idFieldName = spAppResourceId
#     idField = <SpecifyIdField: spAppResourceId>
#     fields = [<SpecifyField: allPermissionLevel>, <SpecifyField: description>, <SpecifyField: groupPermissionLevel>, <SpecifyField: level>, <SpecifyField: metaData>, <SpecifyField: mimeType>, <SpecifyField: name>, <SpecifyField: ownerPermissionLevel>, <SpecifyField: timestampCreated>, <SpecifyField: version>]
#     relationships = [<SpecifyField: createdByAgent>, <SpecifyField: group>, <SpecifyField: modifiedByAgent>, <SpecifyField: spAppResourceDatas>, <SpecifyField: spAppResourceDir>, <SpecifyField: spReports>, <SpecifyField: specifyUser>]
#     fieldAliases = []
#     system = True

# class SpAppResourceData(Table):
#     # classname = edu.ku.brc.specify.datamodel.SpAppResourceData
#     table = spappresourcedata
#     tableId = 515
#     idColumn = SpAppResourceDataID
#     idFieldName = spAppResourceDataId
#     idField = <SpecifyIdField: spAppResourceDataId>
#     fields = [<SpecifyField: data>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>, <SpecifyField: spAppResource>, <SpecifyField: spViewSetObj>]
#     fieldAliases = []
#     system = True

# class SpAppResourceDir(Table):
#     # classname = edu.ku.brc.specify.datamodel.SpAppResourceDir
#     table = spappresourcedir
#     tableId = 516
#     idColumn = SpAppResourceDirID
#     idFieldName = spAppResourceDirId
#     idField = <SpecifyIdField: spAppResourceDirId>
#     fields = [<SpecifyField: disciplineType>, <SpecifyField: isPersonal>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: userType>, <SpecifyField: version>]
#     relationships = [<SpecifyField: collection>, <SpecifyField: createdByAgent>, <SpecifyField: discipline>, <SpecifyField: modifiedByAgent>, <SpecifyField: spPersistedAppResources>, <SpecifyField: spPersistedViewSets>, <SpecifyField: specifyUser>]
#     fieldAliases = []
#     system = True

# class SpAuditLog(Table):
#     # classname = edu.ku.brc.specify.datamodel.SpAuditLog
#     table = spauditlog
#     tableId = 530
#     idColumn = SpAuditLogID
#     idFieldName = spAuditLogId
#     idField = <SpecifyIdField: spAuditLogId>
#     fields = [<SpecifyField: action>, <SpecifyField: parentRecordId>, <SpecifyField: parentTableNum>, <SpecifyField: recordId>, <SpecifyField: recordVersion>, <SpecifyField: tableNum>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: createdByAgent>, <SpecifyField: fields>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []
#     system = True

# class SpAuditLogField(Table):
#     # classname = edu.ku.brc.specify.datamodel.SpAuditLogField
#     table = spauditlogfield
#     tableId = 531
#     idColumn = SpAuditLogFieldID
#     idFieldName = spAuditLogFieldId
#     idField = <SpecifyIdField: spAuditLogFieldId>
#     fields = [<SpecifyField: fieldName>, <SpecifyField: newValue>, <SpecifyField: oldValue>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>, <SpecifyField: spAuditLog>]
#     fieldAliases = []
#     system = True

# class SpExportSchema(Table):
#     # classname = edu.ku.brc.specify.datamodel.SpExportSchema
#     table = spexportschema
#     tableId = 524
#     idColumn = SpExportSchemaID
#     idFieldName = spExportSchemaId
#     idField = <SpecifyIdField: spExportSchemaId>
#     fields = [<SpecifyField: description>, <SpecifyField: schemaName>, <SpecifyField: schemaVersion>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: createdByAgent>, <SpecifyField: discipline>, <SpecifyField: modifiedByAgent>, <SpecifyField: spExportSchemaItems>, <SpecifyField: spExportSchemaMappings>]
#     fieldAliases = []
#     system = True

# class SpExportSchemaItem(Table):
#     # classname = edu.ku.brc.specify.datamodel.SpExportSchemaItem
#     table = spexportschemaitem
#     tableId = 525
#     idColumn = SpExportSchemaItemID
#     idFieldName = spExportSchemaItemId
#     idField = <SpecifyIdField: spExportSchemaItemId>
#     fields = [<SpecifyField: dataType>, <SpecifyField: description>, <SpecifyField: fieldName>, <SpecifyField: formatter>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>, <SpecifyField: spExportSchema>, <SpecifyField: spLocaleContainerItem>]
#     fieldAliases = []
#     system = True

# class SpExportSchemaItemMapping(Table):
#     # classname = edu.ku.brc.specify.datamodel.SpExportSchemaItemMapping
#     table = spexportschemaitemmapping
#     tableId = 527
#     idColumn = SpExportSchemaItemMappingID
#     idFieldName = spExportSchemaItemMappingId
#     idField = <SpecifyIdField: spExportSchemaItemMappingId>
#     fields = [<SpecifyField: exportedFieldName>, <SpecifyField: extensionItem>, <SpecifyField: remarks>, <SpecifyField: rowType>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: createdByAgent>, <SpecifyField: exportSchemaItem>, <SpecifyField: exportSchemaMapping>, <SpecifyField: modifiedByAgent>, <SpecifyField: queryField>]
#     fieldAliases = []
#     system = True

# class SpExportSchemaMapping(Table):
#     # classname = edu.ku.brc.specify.datamodel.SpExportSchemaMapping
#     table = spexportschemamapping
#     tableId = 528
#     idColumn = SpExportSchemaMappingID
#     idFieldName = spExportSchemaMappingId
#     idField = <SpecifyIdField: spExportSchemaMappingId>
#     fields = [<SpecifyField: collectionMemberId>, <SpecifyField: description>, <SpecifyField: mappingName>, <SpecifyField: timestampCreated>, <SpecifyField: timestampExported>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: createdByAgent>, <SpecifyField: mappings>, <SpecifyField: modifiedByAgent>, <SpecifyField: spExportSchemas>, <SpecifyField: symbiotaInstances>]
#     fieldAliases = []
#     system = True

# class SpFieldValueDefault(Table):
#     # classname = edu.ku.brc.specify.datamodel.SpFieldValueDefault
#     table = spfieldvaluedefault
#     tableId = 520
#     idColumn = SpFieldValueDefaultID
#     idFieldName = spFieldValueDefaultId
#     idField = <SpecifyIdField: spFieldValueDefaultId>
#     fields = [<SpecifyField: collectionMemberId>, <SpecifyField: fieldName>, <SpecifyField: idValue>, <SpecifyField: strValue>, <SpecifyField: tableName>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []
#     system = True

# class SpLocaleContainer(Table):
#     # classname = edu.ku.brc.specify.datamodel.SpLocaleContainer
#     table = splocalecontainer
#     tableId = 503
#     idColumn = SpLocaleContainerID
#     idFieldName = spLocaleContainerId
#     idField = <SpecifyIdField: spLocaleContainerId>
#     fields = [<SpecifyField: aggregator>, <SpecifyField: defaultUI>, <SpecifyField: format>, <SpecifyField: isHidden>, <SpecifyField: isSystem>, <SpecifyField: isUIFormatter>, <SpecifyField: name>, <SpecifyField: pickListName>, <SpecifyField: schemaType>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: type>, <SpecifyField: version>]
#     relationships = [<SpecifyField: createdByAgent>, <SpecifyField: descs>, <SpecifyField: discipline>, <SpecifyField: items>, <SpecifyField: modifiedByAgent>, <SpecifyField: names>]
#     fieldAliases = []
#     system = True

# class SpLocaleContainerItem(Table):
#     # classname = edu.ku.brc.specify.datamodel.SpLocaleContainerItem
#     table = splocalecontaineritem
#     tableId = 504
#     idColumn = SpLocaleContainerItemID
#     idFieldName = spLocaleContainerItemId
#     idField = <SpecifyIdField: spLocaleContainerItemId>
#     fields = [<SpecifyField: format>, <SpecifyField: isHidden>, <SpecifyField: isRequired>, <SpecifyField: isSystem>, <SpecifyField: isUIFormatter>, <SpecifyField: name>, <SpecifyField: pickListName>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: type>, <SpecifyField: version>, <SpecifyField: webLinkName>]
#     relationships = [<SpecifyField: container>, <SpecifyField: createdByAgent>, <SpecifyField: descs>, <SpecifyField: modifiedByAgent>, <SpecifyField: names>, <SpecifyField: spExportSchemaItems>]
#     fieldAliases = []
#     system = True

# class SpLocaleItemStr(Table):
#     # classname = edu.ku.brc.specify.datamodel.SpLocaleItemStr
#     table = splocaleitemstr
#     tableId = 505
#     idColumn = SpLocaleItemStrID
#     idFieldName = spLocaleItemStrId
#     idField = <SpecifyIdField: spLocaleItemStrId>
#     fields = [<SpecifyField: country>, <SpecifyField: language>, <SpecifyField: text>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: variant>, <SpecifyField: version>]
#     relationships = [<SpecifyField: containerDesc>, <SpecifyField: containerName>, <SpecifyField: createdByAgent>, <SpecifyField: itemDesc>, <SpecifyField: itemName>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []
#     system = True

# class SpPermission(Table):
#     # classname = edu.ku.brc.specify.datamodel.SpPermission
#     table = sppermission
#     tableId = 521
#     idColumn = SpPermissionID
#     idFieldName = permissionId
#     idField = <SpecifyIdField: permissionId>
#     fields = [<SpecifyField: actions>, <SpecifyField: name>, <SpecifyField: permissionClass>, <SpecifyField: targetId>]
#     relationships = [<SpecifyField: principals>]
#     fieldAliases = []
#     system = True

# class SpPrincipal(Table):
#     # classname = edu.ku.brc.specify.datamodel.SpPrincipal
#     table = spprincipal
#     tableId = 522
#     idColumn = SpPrincipalID
#     idFieldName = userGroupId
#     idField = <SpecifyIdField: userGroupId>
#     fields = [<SpecifyField: groupSubClass>, <SpecifyField: groupType>, <SpecifyField: name>, <SpecifyField: priority>, <SpecifyField: remarks>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>, <SpecifyField: permissions>, <SpecifyField: scope>, <SpecifyField: specifyUsers>]
#     fieldAliases = []
#     system = True

# class SpQuery(Table):
#     # classname = edu.ku.brc.specify.datamodel.SpQuery
#     table = spquery
#     tableId = 517
#     idColumn = SpQueryID
#     idFieldName = spQueryId
#     idField = <SpecifyIdField: spQueryId>
#     fields = [<SpecifyField: contextName>, <SpecifyField: contextTableId>, <SpecifyField: countOnly>, <SpecifyField: formatAuditRecIds>, <SpecifyField: isFavorite>, <SpecifyField: name>, <SpecifyField: ordinal>, <SpecifyField: remarks>, <SpecifyField: searchSynonymy>, <SpecifyField: selectDistinct>, <SpecifyField: smushed>, <SpecifyField: sqlStr>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: createdByAgent>, <SpecifyField: fields>, <SpecifyField: modifiedByAgent>, <SpecifyField: reports>, <SpecifyField: specifyUser>]
#     fieldAliases = []
#     system = True

# class SpQueryField(Table):
#     # classname = edu.ku.brc.specify.datamodel.SpQueryField
#     table = spqueryfield
#     tableId = 518
#     idColumn = SpQueryFieldID
#     idFieldName = spQueryFieldId
#     idField = <SpecifyIdField: spQueryFieldId>
#     fields = [<SpecifyField: allowNulls>, <SpecifyField: alwaysFilter>, <SpecifyField: columnAlias>, <SpecifyField: contextTableIdent>, <SpecifyField: endValue>, <SpecifyField: fieldName>, <SpecifyField: formatName>, <SpecifyField: isDisplay>, <SpecifyField: isNot>, <SpecifyField: isPrompt>, <SpecifyField: isRelFld>, <SpecifyField: operEnd>, <SpecifyField: operStart>, <SpecifyField: position>, <SpecifyField: sortType>, <SpecifyField: startValue>, <SpecifyField: stringId>, <SpecifyField: tableList>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: createdByAgent>, <SpecifyField: mappings>, <SpecifyField: modifiedByAgent>, <SpecifyField: query>]
#     fieldAliases = []
#     system = True

# class SpReport(Table):
#     # classname = edu.ku.brc.specify.datamodel.SpReport
#     table = spreport
#     tableId = 519
#     idColumn = SpReportId
#     idFieldName = spReportId
#     idField = <SpecifyIdField: spReportId>
#     fields = [<SpecifyField: name>, <SpecifyField: remarks>, <SpecifyField: repeatCount>, <SpecifyField: repeatField>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: appResource>, <SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>, <SpecifyField: query>, <SpecifyField: specifyUser>, <SpecifyField: workbenchTemplate>]
#     fieldAliases = []
#     system = True

# class SpSymbiotaInstance(Table):
#     # classname = edu.ku.brc.specify.datamodel.SpSymbiotaInstance
#     table = spsymbiotainstance
#     tableId = 533
#     idColumn = SpSymbiotaInstanceID
#     idFieldName = spSymbiotaInstanceId
#     idField = <SpecifyIdField: spSymbiotaInstanceId>
#     fields = [<SpecifyField: collectionMemberId>, <SpecifyField: description>, <SpecifyField: instanceName>, <SpecifyField: lastCacheBuild>, <SpecifyField: lastPull>, <SpecifyField: lastPush>, <SpecifyField: remarks>, <SpecifyField: symbiotaKey>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>, <SpecifyField: schemaMapping>]
#     fieldAliases = []

# class SpTaskSemaphore(Table):
#     # classname = edu.ku.brc.specify.datamodel.SpTaskSemaphore
#     table = sptasksemaphore
#     tableId = 526
#     idColumn = TaskSemaphoreID
#     idFieldName = spTaskSemaphoreId
#     idField = <SpecifyIdField: spTaskSemaphoreId>
#     fields = [<SpecifyField: context>, <SpecifyField: isLocked>, <SpecifyField: lockedTime>, <SpecifyField: machineName>, <SpecifyField: scope>, <SpecifyField: taskName>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: usageCount>, <SpecifyField: version>]
#     relationships = [<SpecifyField: collection>, <SpecifyField: createdByAgent>, <SpecifyField: discipline>, <SpecifyField: modifiedByAgent>, <SpecifyField: owner>]
#     fieldAliases = []
#     system = True

# class SpVersion(Table):
#     # classname = edu.ku.brc.specify.datamodel.SpVersion
#     table = spversion
#     tableId = 529
#     idColumn = SpVersionID
#     idFieldName = spVersionId
#     idField = <SpecifyIdField: spVersionId>
#     fields = [<SpecifyField: appName>, <SpecifyField: appVersion>, <SpecifyField: dbClosedBy>, <SpecifyField: isDBClosed>, <SpecifyField: schemaVersion>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>, <SpecifyField: workbenchSchemaVersion>]
#     relationships = [<SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []
#     system = True

# class SpViewSetObj(Table):
#     # classname = edu.ku.brc.specify.datamodel.SpViewSetObj
#     table = spviewsetobj
#     tableId = 513
#     idColumn = SpViewSetObjID
#     idFieldName = spViewSetObjId
#     idField = <SpecifyIdField: spViewSetObjId>
#     fields = [<SpecifyField: description>, <SpecifyField: fileName>, <SpecifyField: level>, <SpecifyField: metaData>, <SpecifyField: name>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>, <SpecifyField: spAppResourceDatas>, <SpecifyField: spAppResourceDir>]
#     fieldAliases = []
#     system = True

# class SpVisualQuery(Table):
#     # classname = edu.ku.brc.specify.datamodel.SpVisualQuery
#     table = spvisualquery
#     tableId = 532
#     idColumn = SpVisualQueryID
#     idFieldName = spVisualQueryId
#     idField = <SpecifyIdField: spVisualQueryId>
#     fields = [<SpecifyField: description>, <SpecifyField: name>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>, <SpecifyField: polygons>, <SpecifyField: specifyUser>]
#     fieldAliases = []
#     system = True

# class SpecifyUser(Table):
#     # classname = edu.ku.brc.specify.datamodel.SpecifyUser
#     table = specifyuser
#     tableId = 72
#     idColumn = SpecifyUserID
#     idFieldName = specifyUserId
#     idField = <SpecifyIdField: specifyUserId>
#     fields = [<SpecifyField: accumMinLoggedIn>, <SpecifyField: email>, <SpecifyField: isLoggedIn>, <SpecifyField: isLoggedInReport>, <SpecifyField: loginCollectionName>, <SpecifyField: loginDisciplineName>, <SpecifyField: loginOutTime>, <SpecifyField: name>, <SpecifyField: password>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: userType>, <SpecifyField: version>]
#     relationships = [<SpecifyField: agents>, <SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>, <SpecifyField: spAppResourceDirs>, <SpecifyField: spAppResources>, <SpecifyField: spPrincipals>, <SpecifyField: spQuerys>, <SpecifyField: taskSemaphores>, <SpecifyField: workbenchTemplates>, <SpecifyField: workbenches>]
#     fieldAliases = []
#     system = True

# class Storage(Table):
#     # classname = edu.ku.brc.specify.datamodel.Storage
#     table = storage
#     tableId = 58
#     idColumn = StorageID
#     idFieldName = storageId
#     idField = <SpecifyIdField: storageId>
#     view = Storage
#     searchDialog = StorageSearch
#     fields = [<SpecifyField: abbrev>, <SpecifyField: fullName>, <SpecifyField: highestChildNodeNumber>, <SpecifyField: isAccepted>, <SpecifyField: name>, <SpecifyField: nodeNumber>, <SpecifyField: number1>, <SpecifyField: number2>, <SpecifyField: rankId>, <SpecifyField: remarks>, <SpecifyField: text1>, <SpecifyField: text2>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: timestampVersion>, <SpecifyField: version>]
#     relationships = [<SpecifyField: acceptedChildren>, <SpecifyField: acceptedStorage>, <SpecifyField: children>, <SpecifyField: containers>, <SpecifyField: createdByAgent>, <SpecifyField: definition>, <SpecifyField: definitionItem>, <SpecifyField: modifiedByAgent>, <SpecifyField: parent>, <SpecifyField: preparations>, <SpecifyField: storageAttachments>]
#     fieldAliases = [{'vname': 'acceptedParent', 'aname': 'acceptedStorage'}]

# class StorageAttachment(Table):
#     # classname = edu.ku.brc.specify.datamodel.StorageAttachment
#     table = storageattachment
#     tableId = 148
#     idColumn = StorageAttachmentID
#     idFieldName = storageAttachmentId
#     idField = <SpecifyIdField: storageAttachmentId>
#     view = ObjectAttachment
#     searchDialog = None
#     fields = [<SpecifyField: ordinal>, <SpecifyField: remarks>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: attachment>, <SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>, <SpecifyField: storage>]
#     fieldAliases = []
#     system = True

# class StorageTreeDef(Table):
#     # classname = edu.ku.brc.specify.datamodel.StorageTreeDef
#     table = storagetreedef
#     tableId = 59
#     idColumn = StorageTreeDefID
#     idFieldName = storageTreeDefId
#     idField = <SpecifyIdField: storageTreeDefId>
#     fields = [<SpecifyField: fullNameDirection>, <SpecifyField: name>, <SpecifyField: remarks>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: createdByAgent>, <SpecifyField: institutions>, <SpecifyField: modifiedByAgent>, <SpecifyField: treeDefItems>, <SpecifyField: treeEntries>]
#     fieldAliases = []

# class StorageTreeDefItem(Table):
#     # classname = edu.ku.brc.specify.datamodel.StorageTreeDefItem
#     table = storagetreedefitem
#     tableId = 60
#     idColumn = StorageTreeDefItemID
#     idFieldName = storageTreeDefItemId
#     idField = <SpecifyIdField: storageTreeDefItemId>
#     fields = [<SpecifyField: fullNameSeparator>, <SpecifyField: isEnforced>, <SpecifyField: isInFullName>, <SpecifyField: name>, <SpecifyField: rankId>, <SpecifyField: remarks>, <SpecifyField: textAfter>, <SpecifyField: textBefore>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: title>, <SpecifyField: version>]
#     relationships = [<SpecifyField: children>, <SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>, <SpecifyField: parent>, <SpecifyField: treeDef>, <SpecifyField: treeEntries>]
#     fieldAliases = []

# class Taxon(Table):
#     # classname = edu.ku.brc.specify.datamodel.Taxon
#     table = taxon
#     tableId = 4
#     idColumn = TaxonID
#     idFieldName = taxonId
#     idField = <SpecifyIdField: taxonId>
#     view = Taxon
#     searchDialog = TaxonSearch
#     fields = [<SpecifyField: author>, <SpecifyField: citesStatus>, <SpecifyField: colStatus>, <SpecifyField: commonName>, <SpecifyField: cultivarName>, <SpecifyField: environmentalProtectionStatus>, <SpecifyField: esaStatus>, <SpecifyField: fullName>, <SpecifyField: groupNumber>, <SpecifyField: guid>, <SpecifyField: highestChildNodeNumber>, <SpecifyField: integer1>, <SpecifyField: integer2>, <SpecifyField: integer3>, <SpecifyField: integer4>, <SpecifyField: integer5>, <SpecifyField: isAccepted>, <SpecifyField: isHybrid>, <SpecifyField: isisNumber>, <SpecifyField: labelFormat>, <SpecifyField: lsid>, <SpecifyField: name>, <SpecifyField: ncbiTaxonNumber>, <SpecifyField: nodeNumber>, <SpecifyField: number1>, <SpecifyField: number2>, <SpecifyField: number3>, <SpecifyField: number4>, <SpecifyField: number5>, <SpecifyField: rankId>, <SpecifyField: remarks>, <SpecifyField: source>, <SpecifyField: taxonomicSerialNumber>, <SpecifyField: text1>, <SpecifyField: text10>, <SpecifyField: text11>, <SpecifyField: text12>, <SpecifyField: text13>, <SpecifyField: text14>, <SpecifyField: text15>, <SpecifyField: text16>, <SpecifyField: text17>, <SpecifyField: text18>, <SpecifyField: text19>, <SpecifyField: text2>, <SpecifyField: text20>, <SpecifyField: text3>, <SpecifyField: text4>, <SpecifyField: text5>, <SpecifyField: text6>, <SpecifyField: text7>, <SpecifyField: text8>, <SpecifyField: text9>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: unitInd1>, <SpecifyField: unitInd2>, <SpecifyField: unitInd3>, <SpecifyField: unitInd4>, <SpecifyField: unitName1>, <SpecifyField: unitName2>, <SpecifyField: unitName3>, <SpecifyField: unitName4>, <SpecifyField: usfwsCode>, <SpecifyField: version>, <SpecifyField: visibility>, <SpecifyField: yesNo1>, <SpecifyField: yesNo10>, <SpecifyField: yesNo11>, <SpecifyField: yesNo12>, <SpecifyField: yesNo13>, <SpecifyField: yesNo14>, <SpecifyField: yesNo15>, <SpecifyField: yesNo16>, <SpecifyField: yesNo17>, <SpecifyField: yesNo18>, <SpecifyField: yesNo19>, <SpecifyField: yesNo2>, <SpecifyField: yesNo3>, <SpecifyField: yesNo4>, <SpecifyField: yesNo5>, <SpecifyField: yesNo6>, <SpecifyField: yesNo7>, <SpecifyField: yesNo8>, <SpecifyField: yesNo9>]
#     relationships = [<SpecifyField: acceptedChildren>, <SpecifyField: acceptedTaxon>, <SpecifyField: children>, <SpecifyField: collectingEventAttributes>, <SpecifyField: commonNames>, <SpecifyField: createdByAgent>, <SpecifyField: definition>, <SpecifyField: definitionItem>, <SpecifyField: determinations>, <SpecifyField: hybridChildren1>, <SpecifyField: hybridChildren2>, <SpecifyField: hybridParent1>, <SpecifyField: hybridParent2>, <SpecifyField: modifiedByAgent>, <SpecifyField: parent>, <SpecifyField: taxonAttachments>, <SpecifyField: taxonAttribute>, <SpecifyField: taxonCitations>, <SpecifyField: visibilitySetBy>]
#     fieldAliases = [{'vname': 'acceptedParent', 'aname': 'acceptedTaxon'}]

# class TaxonAttachment(Table):
#     # classname = edu.ku.brc.specify.datamodel.TaxonAttachment
#     table = taxonattachment
#     tableId = 119
#     idColumn = TaxonAttachmentID
#     idFieldName = taxonAttachmentId
#     idField = <SpecifyIdField: taxonAttachmentId>
#     view = ObjectAttachment
#     searchDialog = None
#     fields = [<SpecifyField: ordinal>, <SpecifyField: remarks>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: attachment>, <SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>, <SpecifyField: taxon>]
#     fieldAliases = []
#     system = True

# class TaxonAttribute(Table):
#     # classname = edu.ku.brc.specify.datamodel.TaxonAttribute
#     table = taxonattribute
#     tableId = 162
#     idColumn = TaxonAttributeID
#     idFieldName = taxonAttributeId
#     idField = <SpecifyIdField: taxonAttributeId>
#     fields = [<SpecifyField: date1>, <SpecifyField: date1Precision>, <SpecifyField: number1>, <SpecifyField: number10>, <SpecifyField: number11>, <SpecifyField: number12>, <SpecifyField: number13>, <SpecifyField: number14>, <SpecifyField: number15>, <SpecifyField: number16>, <SpecifyField: number17>, <SpecifyField: number18>, <SpecifyField: number19>, <SpecifyField: number2>, <SpecifyField: number20>, <SpecifyField: number3>, <SpecifyField: number4>, <SpecifyField: number5>, <SpecifyField: number6>, <SpecifyField: number7>, <SpecifyField: number8>, <SpecifyField: number9>, <SpecifyField: remarks>, <SpecifyField: text1>, <SpecifyField: text10>, <SpecifyField: text11>, <SpecifyField: text12>, <SpecifyField: text13>, <SpecifyField: text14>, <SpecifyField: text15>, <SpecifyField: text16>, <SpecifyField: text17>, <SpecifyField: text18>, <SpecifyField: text19>, <SpecifyField: text2>, <SpecifyField: text20>, <SpecifyField: text21>, <SpecifyField: text22>, <SpecifyField: text23>, <SpecifyField: text24>, <SpecifyField: text25>, <SpecifyField: text26>, <SpecifyField: text27>, <SpecifyField: text28>, <SpecifyField: text29>, <SpecifyField: text3>, <SpecifyField: text30>, <SpecifyField: text31>, <SpecifyField: text32>, <SpecifyField: text33>, <SpecifyField: text34>, <SpecifyField: text35>, <SpecifyField: text36>, <SpecifyField: text37>, <SpecifyField: text38>, <SpecifyField: text39>, <SpecifyField: text4>, <SpecifyField: text40>, <SpecifyField: text41>, <SpecifyField: text42>, <SpecifyField: text43>, <SpecifyField: text44>, <SpecifyField: text45>, <SpecifyField: text46>, <SpecifyField: text47>, <SpecifyField: text48>, <SpecifyField: text49>, <SpecifyField: text5>, <SpecifyField: text50>, <SpecifyField: text51>, <SpecifyField: text52>, <SpecifyField: text53>, <SpecifyField: text54>, <SpecifyField: text55>, <SpecifyField: text56>, <SpecifyField: text57>, <SpecifyField: text58>, <SpecifyField: text6>, <SpecifyField: text7>, <SpecifyField: text8>, <SpecifyField: text9>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>, <SpecifyField: yesNo1>, <SpecifyField: yesNo10>, <SpecifyField: yesNo11>, <SpecifyField: yesNo12>, <SpecifyField: yesNo13>, <SpecifyField: yesNo14>, <SpecifyField: yesNo15>, <SpecifyField: yesNo16>, <SpecifyField: yesNo17>, <SpecifyField: yesNo18>, <SpecifyField: yesNo19>, <SpecifyField: yesNo2>, <SpecifyField: yesNo20>, <SpecifyField: yesNo21>, <SpecifyField: yesNo22>, <SpecifyField: yesNo23>, <SpecifyField: yesNo24>, <SpecifyField: yesNo25>, <SpecifyField: yesNo26>, <SpecifyField: yesNo27>, <SpecifyField: yesNo28>, <SpecifyField: yesNo29>, <SpecifyField: yesNo3>, <SpecifyField: yesNo30>, <SpecifyField: yesNo31>, <SpecifyField: yesNo32>, <SpecifyField: yesNo33>, <SpecifyField: yesNo34>, <SpecifyField: yesNo35>, <SpecifyField: yesNo36>, <SpecifyField: yesNo37>, <SpecifyField: yesNo38>, <SpecifyField: yesNo39>, <SpecifyField: yesNo4>, <SpecifyField: yesNo40>, <SpecifyField: yesNo41>, <SpecifyField: yesNo42>, <SpecifyField: yesNo43>, <SpecifyField: yesNo44>, <SpecifyField: yesNo45>, <SpecifyField: yesNo46>, <SpecifyField: yesNo47>, <SpecifyField: yesNo48>, <SpecifyField: yesNo49>, <SpecifyField: yesNo5>, <SpecifyField: yesNo50>, <SpecifyField: yesNo51>, <SpecifyField: yesNo52>, <SpecifyField: yesNo53>, <SpecifyField: yesNo54>, <SpecifyField: yesNo55>, <SpecifyField: yesNo56>, <SpecifyField: yesNo57>, <SpecifyField: yesNo58>, <SpecifyField: yesNo59>, <SpecifyField: yesNo6>, <SpecifyField: yesNo60>, <SpecifyField: yesNo61>, <SpecifyField: yesNo62>, <SpecifyField: yesNo63>, <SpecifyField: yesNo64>, <SpecifyField: yesNo65>, <SpecifyField: yesNo66>, <SpecifyField: yesNo67>, <SpecifyField: yesNo68>, <SpecifyField: yesNo69>, <SpecifyField: yesNo7>, <SpecifyField: yesNo70>, <SpecifyField: yesNo71>, <SpecifyField: yesNo72>, <SpecifyField: yesNo73>, <SpecifyField: yesNo74>, <SpecifyField: yesNo75>, <SpecifyField: yesNo76>, <SpecifyField: yesNo77>, <SpecifyField: yesNo78>, <SpecifyField: yesNo79>, <SpecifyField: yesNo8>, <SpecifyField: yesNo80>, <SpecifyField: yesNo81>, <SpecifyField: yesNo82>, <SpecifyField: yesNo9>]
#     relationships = [<SpecifyField: agent1>, <SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>, <SpecifyField: taxons>]
#     fieldAliases = []

# class TaxonCitation(Table):
#     # classname = edu.ku.brc.specify.datamodel.TaxonCitation
#     table = taxoncitation
#     tableId = 75
#     idColumn = TaxonCitationID
#     idFieldName = taxonCitationId
#     idField = <SpecifyIdField: taxonCitationId>
#     fields = [<SpecifyField: figureNumber>, <SpecifyField: isFigured>, <SpecifyField: number1>, <SpecifyField: number2>, <SpecifyField: pageNumber>, <SpecifyField: plateNumber>, <SpecifyField: remarks>, <SpecifyField: text1>, <SpecifyField: text2>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>, <SpecifyField: yesNo1>, <SpecifyField: yesNo2>]
#     relationships = [<SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>, <SpecifyField: referenceWork>, <SpecifyField: taxon>]
#     fieldAliases = []

# class TaxonTreeDef(Table):
#     # classname = edu.ku.brc.specify.datamodel.TaxonTreeDef
#     table = taxontreedef
#     tableId = 76
#     idColumn = TaxonTreeDefID
#     idFieldName = taxonTreeDefId
#     idField = <SpecifyIdField: taxonTreeDefId>
#     fields = [<SpecifyField: fullNameDirection>, <SpecifyField: name>, <SpecifyField: remarks>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: createdByAgent>, <SpecifyField: discipline>, <SpecifyField: modifiedByAgent>, <SpecifyField: treeDefItems>, <SpecifyField: treeEntries>]
#     fieldAliases = []

# class TaxonTreeDefItem(Table):
#     # classname = edu.ku.brc.specify.datamodel.TaxonTreeDefItem
#     table = taxontreedefitem
#     tableId = 77
#     idColumn = TaxonTreeDefItemID
#     idFieldName = taxonTreeDefItemId
#     idField = <SpecifyIdField: taxonTreeDefItemId>
#     view = TaxonTreeDefItem
#     searchDialog = TaxonTreeDefItemSearch
#     fields = [<SpecifyField: formatToken>, <SpecifyField: fullNameSeparator>, <SpecifyField: isEnforced>, <SpecifyField: isInFullName>, <SpecifyField: name>, <SpecifyField: rankId>, <SpecifyField: remarks>, <SpecifyField: textAfter>, <SpecifyField: textBefore>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: title>, <SpecifyField: version>]
#     relationships = [<SpecifyField: children>, <SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>, <SpecifyField: parent>, <SpecifyField: treeDef>, <SpecifyField: treeEntries>]
#     fieldAliases = []

# class TreatmentEvent(Table):
#     # classname = edu.ku.brc.specify.datamodel.TreatmentEvent
#     table = treatmentevent
#     tableId = 122
#     idColumn = TreatmentEventID
#     idFieldName = treatmentEventId
#     idField = <SpecifyIdField: treatmentEventId>
#     fields = [<SpecifyField: dateBoxed>, <SpecifyField: dateCleaned>, <SpecifyField: dateCompleted>, <SpecifyField: dateReceived>, <SpecifyField: dateToIsolation>, <SpecifyField: dateTreatmentEnded>, <SpecifyField: dateTreatmentStarted>, <SpecifyField: fieldNumber>, <SpecifyField: location>, <SpecifyField: number1>, <SpecifyField: number2>, <SpecifyField: number3>, <SpecifyField: number4>, <SpecifyField: number5>, <SpecifyField: remarks>, <SpecifyField: text1>, <SpecifyField: text2>, <SpecifyField: text3>, <SpecifyField: text4>, <SpecifyField: text5>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: treatmentNumber>, <SpecifyField: type>, <SpecifyField: version>, <SpecifyField: yesNo1>, <SpecifyField: yesNo2>, <SpecifyField: yesNo3>]
#     relationships = [<SpecifyField: accession>, <SpecifyField: authorizedBy>, <SpecifyField: collectionObject>, <SpecifyField: createdByAgent>, <SpecifyField: division>, <SpecifyField: modifiedByAgent>, <SpecifyField: performedBy>, <SpecifyField: treatmentEventAttachments>]
#     fieldAliases = []

# class TreatmentEventAttachment(Table):
#     # classname = edu.ku.brc.specify.datamodel.TreatmentEventAttachment
#     table = treatmenteventattachment
#     tableId = 149
#     idColumn = TreatmentEventAttachmentID
#     idFieldName = treatmentEventAttachmentId
#     idField = <SpecifyIdField: treatmentEventAttachmentId>
#     view = ObjectAttachment
#     searchDialog = AttachmentSearch
#     fields = [<SpecifyField: ordinal>, <SpecifyField: remarks>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: attachment>, <SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>, <SpecifyField: treatmentEvent>]
#     fieldAliases = []
#     system = True

# class VoucherRelationship(Table):
#     # classname = edu.ku.brc.specify.datamodel.VoucherRelationship
#     table = voucherrelationship
#     tableId = 155
#     idColumn = VoucherRelationshipID
#     idFieldName = voucherRelationshipId
#     idField = <SpecifyIdField: voucherRelationshipId>
#     view = VoucherRelationship
#     searchDialog = None
#     fields = [<SpecifyField: collectionCode>, <SpecifyField: collectionMemberId>, <SpecifyField: institutionCode>, <SpecifyField: integer1>, <SpecifyField: integer2>, <SpecifyField: integer3>, <SpecifyField: number1>, <SpecifyField: number2>, <SpecifyField: number3>, <SpecifyField: remarks>, <SpecifyField: text1>, <SpecifyField: text2>, <SpecifyField: text3>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: urlLink>, <SpecifyField: version>, <SpecifyField: voucherNumber>, <SpecifyField: yesNo1>, <SpecifyField: yesNo2>, <SpecifyField: yesNo3>]
#     relationships = [<SpecifyField: collectionObject>, <SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>]
#     fieldAliases = []

# class Workbench(Table):
#     # classname = edu.ku.brc.specify.datamodel.Workbench
#     table = workbench
#     tableId = 79
#     idColumn = WorkbenchID
#     idFieldName = workbenchId
#     idField = <SpecifyIdField: workbenchId>
#     fields = [<SpecifyField: allPermissionLevel>, <SpecifyField: dbTableId>, <SpecifyField: exportInstitutionName>, <SpecifyField: exportedFromTableName>, <SpecifyField: formId>, <SpecifyField: groupPermissionLevel>, <SpecifyField: lockedByUserName>, <SpecifyField: name>, <SpecifyField: ownerPermissionLevel>, <SpecifyField: remarks>, <SpecifyField: srcFilePath>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: createdByAgent>, <SpecifyField: group>, <SpecifyField: modifiedByAgent>, <SpecifyField: specifyUser>, <SpecifyField: workbenchRows>, <SpecifyField: workbenchTemplate>]
#     fieldAliases = []
#     system = True

# class WorkbenchDataItem(Table):
#     # classname = edu.ku.brc.specify.datamodel.WorkbenchDataItem
#     table = workbenchdataitem
#     tableId = 80
#     idColumn = WorkbenchDataItemID
#     idFieldName = workbenchDataItemId
#     idField = <SpecifyIdField: workbenchDataItemId>
#     fields = [<SpecifyField: cellData>, <SpecifyField: rowNumber>, <SpecifyField: validationStatus>]
#     relationships = [<SpecifyField: workbenchRow>, <SpecifyField: workbenchTemplateMappingItem>]
#     fieldAliases = []
#     system = True

# class WorkbenchRow(Table):
#     # classname = edu.ku.brc.specify.datamodel.WorkbenchRow
#     table = workbenchrow
#     tableId = 90
#     idColumn = WorkbenchRowID
#     idFieldName = workbenchRowId
#     idField = <SpecifyIdField: workbenchRowId>
#     fields = [<SpecifyField: bioGeomancerResults>, <SpecifyField: cardImageData>, <SpecifyField: cardImageFullPath>, <SpecifyField: errorEstimate>, <SpecifyField: errorPolygon>, <SpecifyField: lat1Text>, <SpecifyField: lat2Text>, <SpecifyField: long1Text>, <SpecifyField: long2Text>, <SpecifyField: recordId>, <SpecifyField: rowNumber>, <SpecifyField: sgrStatus>, <SpecifyField: uploadStatus>]
#     relationships = [<SpecifyField: workbench>, <SpecifyField: workbenchDataItems>, <SpecifyField: workbenchRowExportedRelationships>, <SpecifyField: workbenchRowImages>]
#     fieldAliases = []
#     system = True

# class WorkbenchRowExportedRelationship(Table):
#     # classname = edu.ku.brc.specify.datamodel.WorkbenchRowExportedRelationship
#     table = workbenchrowexportedrelationship
#     tableId = 126
#     idColumn = WorkbenchRowExportedRelationshipID
#     idFieldName = workbenchRowExportedRelationshipId
#     idField = <SpecifyIdField: workbenchRowExportedRelationshipId>
#     fields = [<SpecifyField: recordId>, <SpecifyField: relationshipName>, <SpecifyField: sequence>, <SpecifyField: tableName>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>, <SpecifyField: workbenchRow>]
#     fieldAliases = []
#     system = True

# class WorkbenchRowImage(Table):
#     # classname = edu.ku.brc.specify.datamodel.WorkbenchRowImage
#     table = workbenchrowimage
#     tableId = 95
#     idColumn = WorkbenchRowImageID
#     idFieldName = workbenchRowImageId
#     idField = <SpecifyIdField: workbenchRowImageId>
#     fields = [<SpecifyField: attachToTableName>, <SpecifyField: cardImageData>, <SpecifyField: cardImageFullPath>, <SpecifyField: imageOrder>]
#     relationships = [<SpecifyField: workbenchRow>]
#     fieldAliases = []
#     system = True

# class WorkbenchTemplate(Table):
#     # classname = edu.ku.brc.specify.datamodel.WorkbenchTemplate
#     table = workbenchtemplate
#     tableId = 81
#     idColumn = WorkbenchTemplateID
#     idFieldName = workbenchTemplateId
#     idField = <SpecifyIdField: workbenchTemplateId>
#     fields = [<SpecifyField: name>, <SpecifyField: remarks>, <SpecifyField: srcFilePath>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>]
#     relationships = [<SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>, <SpecifyField: specifyUser>, <SpecifyField: workbenchTemplateMappingItems>, <SpecifyField: workbenches>]
#     fieldAliases = []
#     system = True

# class WorkbenchTemplateMappingItem(Table):
#     # classname = edu.ku.brc.specify.datamodel.WorkbenchTemplateMappingItem
#     table = workbenchtemplatemappingitem
#     tableId = 82
#     idColumn = WorkbenchTemplateMappingItemID
#     idFieldName = workbenchTemplateMappingItemId
#     idField = <SpecifyIdField: workbenchTemplateMappingItemId>
#     fields = [<SpecifyField: caption>, <SpecifyField: carryForward>, <SpecifyField: dataFieldLength>, <SpecifyField: fieldName>, <SpecifyField: fieldType>, <SpecifyField: importedColName>, <SpecifyField: isEditable>, <SpecifyField: isExportableToContent>, <SpecifyField: isIncludedInTitle>, <SpecifyField: isRequired>, <SpecifyField: metaData>, <SpecifyField: origImportColumnIndex>, <SpecifyField: srcTableId>, <SpecifyField: tableName>, <SpecifyField: timestampCreated>, <SpecifyField: timestampModified>, <SpecifyField: version>, <SpecifyField: viewOrder>, <SpecifyField: xCoord>, <SpecifyField: yCoord>]
#     relationships = [<SpecifyField: createdByAgent>, <SpecifyField: modifiedByAgent>, <SpecifyField: workbenchDataItems>, <SpecifyField: workbenchTemplate>]
#     fieldAliases = []
#     system = True



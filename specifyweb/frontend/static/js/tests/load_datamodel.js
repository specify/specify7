define(['jquery'], function($) {
    return [
        {
            "classname": "edu.ku.brc.specify.datamodel.Accession",
            "table": "accession",
            "tableId": 7,
            "view": "Accession",
            "searchDialog": "AccessionSearch",
            "system": false,
            "idColumn": "AccessionID",
            "idFieldName": "accessionId",
            "fields": [
                {
                    "name": "accessionCondition",
                    "column": "AccessionCondition",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "accessionNumber",
                    "column": "AccessionNumber",
                    "indexed": true,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 60
                },
                {
                    "name": "dateAccessioned",
                    "column": "DateAccessioned",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Calendar"
                },
                {
                    "name": "dateAcknowledged",
                    "column": "DateAcknowledged",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Calendar"
                },
                {
                    "name": "dateReceived",
                    "column": "DateReceived",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Calendar"
                },
                {
                    "name": "number1",
                    "column": "Number1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "number2",
                    "column": "Number2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "status",
                    "column": "Status",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "text1",
                    "column": "Text1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 300
                },
                {
                    "name": "text2",
                    "column": "Text2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 300
                },
                {
                    "name": "text3",
                    "column": "Text3",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 300
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "totalValue",
                    "column": "TotalValue",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.math.BigDecimal"
                },
                {
                    "name": "type",
                    "column": "Type",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "verbatimDate",
                    "column": "VerbatimDate",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "yesNo1",
                    "column": "YesNo1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "yesNo2",
                    "column": "YesNo2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                }
            ],
            "relationships": [
                {
                    "name": "accessionAgents",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "AccessionAgent",
                    "otherSideName": "accession"
                },
                {
                    "name": "accessionAttachments",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "AccessionAttachment",
                    "otherSideName": "accession"
                },
                {
                    "name": "accessionAuthorizations",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "AccessionAuthorization",
                    "otherSideName": "accession"
                },
                {
                    "name": "addressOfRecord",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "AddressOfRecord",
                    "column": "AddressOfRecordID",
                    "otherSideName": "accessions"
                },
                {
                    "name": "appraisals",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Appraisal",
                    "otherSideName": "accession"
                },
                {
                    "name": "collectionObjects",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "CollectionObject",
                    "otherSideName": "accession"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "deaccessions",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Deaccession",
                    "otherSideName": "accession"
                },
                {
                    "name": "division",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Division",
                    "column": "DivisionID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "repositoryAgreement",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "RepositoryAgreement",
                    "column": "RepositoryAgreementID",
                    "otherSideName": "accessions"
                },
                {
                    "name": "treatmentEvents",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "TreatmentEvent",
                    "otherSideName": "accession"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.AccessionAgent",
            "table": "accessionagent",
            "tableId": 12,
            "view": "AccessionAgent",
            "searchDialog": "AccessionAgentSearch",
            "system": false,
            "idColumn": "AccessionAgentID",
            "idFieldName": "accessionAgentId",
            "fields": [
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "role",
                    "column": "Role",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "accession",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Accession",
                    "column": "AccessionID",
                    "otherSideName": "accessionAgents"
                },
                {
                    "name": "agent",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "AgentID"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "repositoryAgreement",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "RepositoryAgreement",
                    "column": "RepositoryAgreementID",
                    "otherSideName": "repositoryAgreementAgents"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.AccessionAttachment",
            "table": "accessionattachment",
            "tableId": 108,
            "view": "ObjectAttachment",
            "searchDialog": "AttachmentSearch",
            "system": false,
            "idColumn": "AccessionAttachmentID",
            "idFieldName": "accessionAttachmentId",
            "fields": [
                {
                    "name": "ordinal",
                    "column": "Ordinal",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "accession",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Accession",
                    "column": "AccessionID",
                    "otherSideName": "accessionAttachments"
                },
                {
                    "name": "attachment",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Attachment",
                    "column": "AttachmentID",
                    "otherSideName": "accessionAttachments"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.AccessionAuthorization",
            "table": "accessionauthorization",
            "tableId": 13,
            "view": null,
            "searchDialog": null,
            "system": false,
            "idColumn": "AccessionAuthorizationID",
            "idFieldName": "accessionAuthorizationId",
            "fields": [
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "accession",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Accession",
                    "column": "AccessionID",
                    "otherSideName": "accessionAuthorizations"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "permit",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Permit",
                    "column": "PermitID",
                    "otherSideName": "accessionAuthorizations"
                },
                {
                    "name": "repositoryAgreement",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "RepositoryAgreement",
                    "column": "RepositoryAgreementID",
                    "otherSideName": "repositoryAgreementAuthorizations"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.Address",
            "table": "address",
            "tableId": 8,
            "view": "Address",
            "searchDialog": null,
            "system": false,
            "idColumn": "AddressID",
            "idFieldName": "addressId",
            "fields": [
                {
                    "name": "address",
                    "column": "Address",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "address2",
                    "column": "Address2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "address3",
                    "column": "Address3",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "address4",
                    "column": "Address4",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "address5",
                    "column": "Address5",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "city",
                    "column": "City",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "country",
                    "column": "Country",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "endDate",
                    "column": "EndDate",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Calendar"
                },
                {
                    "name": "fax",
                    "column": "Fax",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "isCurrent",
                    "column": "IsCurrent",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "isPrimary",
                    "column": "IsPrimary",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "isShipping",
                    "column": "IsShipping",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "ordinal",
                    "column": "Ordinal",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "phone1",
                    "column": "Phone1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "phone2",
                    "column": "Phone2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "positionHeld",
                    "column": "PositionHeld",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "postalCode",
                    "column": "PostalCode",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "roomOrBuilding",
                    "column": "RoomOrBuilding",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "startDate",
                    "column": "StartDate",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Calendar"
                },
                {
                    "name": "state",
                    "column": "State",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "typeOfAddr",
                    "column": "TypeOfAddr",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "agent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "AgentID",
                    "otherSideName": "addresses"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "divisions",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Division",
                    "otherSideName": "address"
                },
                {
                    "name": "insitutions",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Institution",
                    "otherSideName": "address"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.AddressOfRecord",
            "table": "addressofrecord",
            "tableId": 125,
            "system": false,
            "idColumn": "AddressOfRecordID",
            "idFieldName": "addressOfRecordId",
            "fields": [
                {
                    "name": "address",
                    "column": "Address",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "address2",
                    "column": "Address2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "city",
                    "column": "City",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "country",
                    "column": "Country",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "postalCode",
                    "column": "PostalCode",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "state",
                    "column": "State",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "accessions",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Accession",
                    "otherSideName": "addressOfRecord"
                },
                {
                    "name": "agent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "AgentID"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "exchangeIns",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "ExchangeIn",
                    "otherSideName": "addressOfRecord"
                },
                {
                    "name": "exchangeOuts",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "ExchangeOut",
                    "otherSideName": "addressOfRecord"
                },
                {
                    "name": "loans",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Loan",
                    "otherSideName": "addressOfRecord"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "repositoryAgreements",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "RepositoryAgreement",
                    "otherSideName": "addressOfRecord"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.Agent",
            "table": "agent",
            "tableId": 5,
            "view": "Agent",
            "searchDialog": "AgentSearch",
            "system": false,
            "idColumn": "AgentID",
            "idFieldName": "agentId",
            "fields": [
                {
                    "name": "abbreviation",
                    "column": "Abbreviation",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "agentType",
                    "column": "AgentType",
                    "indexed": true,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Byte"
                },
                {
                    "name": "dateOfBirth",
                    "column": "DateOfBirth",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Calendar"
                },
                {
                    "name": "dateOfBirthPrecision",
                    "column": "DateOfBirthPrecision",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Byte"
                },
                {
                    "name": "dateOfDeath",
                    "column": "DateOfDeath",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Calendar"
                },
                {
                    "name": "dateOfDeathPrecision",
                    "column": "DateOfDeathPrecision",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Byte"
                },
                {
                    "name": "dateType",
                    "column": "DateType",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Byte"
                },
                {
                    "name": "email",
                    "column": "Email",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "firstName",
                    "column": "FirstName",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "guid",
                    "column": "GUID",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 128
                },
                {
                    "name": "initials",
                    "column": "Initials",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 8
                },
                {
                    "name": "interests",
                    "column": "Interests",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "jobTitle",
                    "column": "JobTitle",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "lastName",
                    "column": "LastName",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 120
                },
                {
                    "name": "middleInitial",
                    "column": "MiddleInitial",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "title",
                    "column": "Title",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "url",
                    "column": "URL",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 1024
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "addresses",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "Address",
                    "otherSideName": "agent"
                },
                {
                    "name": "agentAttachments",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "AgentAttachment",
                    "otherSideName": "agent"
                },
                {
                    "name": "agentGeographies",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "AgentGeography",
                    "otherSideName": "agent"
                },
                {
                    "name": "agentSpecialties",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "AgentSpecialty",
                    "otherSideName": "agent"
                },
                {
                    "name": "collContentContact",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Collection",
                    "column": "CollectionCCID",
                    "otherSideName": "contentContacts"
                },
                {
                    "name": "collTechContact",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Collection",
                    "column": "CollectionTCID",
                    "otherSideName": "technicalContacts"
                },
                {
                    "name": "collectors",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Collector",
                    "otherSideName": "agent"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "division",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Division",
                    "column": "DivisionID",
                    "otherSideName": "members"
                },
                {
                    "name": "groups",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "GroupPerson",
                    "otherSideName": "group"
                },
                {
                    "name": "instContentContact",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Institution",
                    "column": "InstitutionCCID",
                    "otherSideName": "contentContacts"
                },
                {
                    "name": "instTechContact",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Institution",
                    "column": "InstitutionTCID",
                    "otherSideName": "technicalContacts"
                },
                {
                    "name": "members",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "GroupPerson",
                    "otherSideName": "member"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "orgMembers",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "otherSideName": "organization"
                },
                {
                    "name": "organization",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ParentOrganizationID",
                    "otherSideName": "orgMembers"
                },
                {
                    "name": "specifyUser",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "SpecifyUser",
                    "column": "SpecifyUserID",
                    "otherSideName": "agents"
                },
                {
                    "name": "variants",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "AgentVariant",
                    "otherSideName": "agent"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.AgentAttachment",
            "table": "agentattachment",
            "tableId": 109,
            "view": "AgentAttachment",
            "searchDialog": null,
            "system": false,
            "idColumn": "AgentAttachmentID",
            "idFieldName": "agentAttachmentId",
            "fields": [
                {
                    "name": "ordinal",
                    "column": "Ordinal",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "agent",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "AgentID",
                    "otherSideName": "agentAttachments"
                },
                {
                    "name": "attachment",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Attachment",
                    "column": "AttachmentID",
                    "otherSideName": "agentAttachments"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.AgentGeography",
            "table": "agentgeography",
            "tableId": 78,
            "system": false,
            "idColumn": "AgentGeographyID",
            "idFieldName": "agentGeographyId",
            "fields": [
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "role",
                    "column": "Role",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "agent",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "AgentID",
                    "otherSideName": "agentGeographies"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "geography",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Geography",
                    "column": "GeographyID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.AgentSpecialty",
            "table": "agentspecialty",
            "tableId": 86,
            "system": false,
            "idColumn": "AgentSpecialtyID",
            "idFieldName": "agentSpecialtyId",
            "fields": [
                {
                    "name": "orderNumber",
                    "column": "OrderNumber",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "specialtyName",
                    "column": "SpecialtyName",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "agent",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "AgentID",
                    "otherSideName": "agentSpecialties"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.AgentVariant",
            "table": "agentvariant",
            "tableId": 107,
            "view": "AgentVariant",
            "searchDialog": null,
            "system": false,
            "idColumn": "AgentVariantID",
            "idFieldName": "agentVariantId",
            "fields": [
                {
                    "name": "country",
                    "column": "Country",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 2
                },
                {
                    "name": "language",
                    "column": "Language",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 2
                },
                {
                    "name": "name",
                    "column": "Name",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "varType",
                    "column": "VarType",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Byte"
                },
                {
                    "name": "variant",
                    "column": "Variant",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 2
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "agent",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "AgentID",
                    "otherSideName": "variants"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.Appraisal",
            "table": "appraisal",
            "tableId": 67,
            "view": "Appraisal",
            "searchDialog": "AppraisalSearch",
            "system": false,
            "idColumn": "AppraisalID",
            "idFieldName": "appraisalId",
            "fields": [
                {
                    "name": "appraisalDate",
                    "column": "AppraisalDate",
                    "indexed": true,
                    "unique": false,
                    "required": true,
                    "type": "java.util.Calendar"
                },
                {
                    "name": "appraisalNumber",
                    "column": "AppraisalNumber",
                    "indexed": true,
                    "unique": true,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "appraisalValue",
                    "column": "AppraisalValue",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.math.BigDecimal"
                },
                {
                    "name": "monetaryUnitType",
                    "column": "MonetaryUnitType",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 8
                },
                {
                    "name": "notes",
                    "column": "Notes",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 2048
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "accession",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Accession",
                    "column": "AccessionID",
                    "otherSideName": "appraisals"
                },
                {
                    "name": "agent",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "AgentID"
                },
                {
                    "name": "collectionObjects",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "CollectionObject",
                    "otherSideName": "appraisal"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.Attachment",
            "table": "attachment",
            "tableId": 41,
            "view": "AttachmentsForm",
            "searchDialog": null,
            "system": true,
            "idColumn": "AttachmentID",
            "idFieldName": "attachmentId",
            "fields": [
                {
                    "name": "attachmentLocation",
                    "column": "AttachmentLocation",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 128
                },
                {
                    "name": "copyrightDate",
                    "column": "CopyrightDate",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "copyrightHolder",
                    "column": "CopyrightHolder",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "credit",
                    "column": "Credit",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "dateImaged",
                    "column": "DateImaged",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "fileCreatedDate",
                    "column": "FileCreatedDate",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Calendar"
                },
                {
                    "name": "guid",
                    "column": "GUID",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 128
                },
                {
                    "name": "license",
                    "column": "License",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "mimeType",
                    "column": "MimeType",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "origFilename",
                    "column": "OrigFilename",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 20000
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "scopeID",
                    "column": "ScopeID",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "scopeType",
                    "column": "ScopeType",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Byte"
                },
                {
                    "name": "tableID",
                    "column": "TableID",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Short"
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "title",
                    "column": "Title",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "visibility",
                    "column": "Visibility",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Byte"
                }
            ],
            "relationships": [
                {
                    "name": "accessionAttachments",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "AccessionAttachment",
                    "otherSideName": "attachment"
                },
                {
                    "name": "agentAttachments",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "AgentAttachment",
                    "otherSideName": "attachment"
                },
                {
                    "name": "attachmentImageAttribute",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "AttachmentImageAttribute",
                    "column": "AttachmentImageAttributeID",
                    "otherSideName": "attachments"
                },
                {
                    "name": "borrowAttachments",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "BorrowAttachment",
                    "otherSideName": "attachment"
                },
                {
                    "name": "collectingEventAttachments",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "CollectingEventAttachment",
                    "otherSideName": "attachment"
                },
                {
                    "name": "collectionObjectAttachments",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "CollectionObjectAttachment",
                    "otherSideName": "attachment"
                },
                {
                    "name": "conservDescriptionAttachments",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "ConservDescriptionAttachment",
                    "otherSideName": "attachment"
                },
                {
                    "name": "conservEventAttachments",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "ConservEventAttachment",
                    "otherSideName": "attachment"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "dnaSequenceAttachments",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "DNASequenceAttachment",
                    "otherSideName": "attachment"
                },
                {
                    "name": "dnaSequencingRunAttachments",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "DNASequencingRunAttachment",
                    "otherSideName": "attachment"
                },
                {
                    "name": "fieldNotebookAttachments",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "FieldNotebookAttachment",
                    "otherSideName": "attachment"
                },
                {
                    "name": "fieldNotebookPageAttachments",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "FieldNotebookPageAttachment",
                    "otherSideName": "attachment"
                },
                {
                    "name": "fieldNotebookPageSetAttachments",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "FieldNotebookPageSetAttachment",
                    "otherSideName": "attachment"
                },
                {
                    "name": "giftAttachments",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "GiftAttachment",
                    "otherSideName": "attachment"
                },
                {
                    "name": "loanAttachments",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "LoanAttachment",
                    "otherSideName": "attachment"
                },
                {
                    "name": "localityAttachments",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "LocalityAttachment",
                    "otherSideName": "attachment"
                },
                {
                    "name": "metadata",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "AttachmentMetadata",
                    "otherSideName": "attachment"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "permitAttachments",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "PermitAttachment",
                    "otherSideName": "attachment"
                },
                {
                    "name": "preparationAttachments",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "PreparationAttachment",
                    "otherSideName": "attachment"
                },
                {
                    "name": "referenceWorkAttachments",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "ReferenceWorkAttachment",
                    "otherSideName": "attachment"
                },
                {
                    "name": "repositoryAgreementAttachments",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "RepositoryAgreementAttachment",
                    "otherSideName": "attachment"
                },
                {
                    "name": "tags",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "AttachmentTag",
                    "otherSideName": "attachment"
                },
                {
                    "name": "taxonAttachments",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "TaxonAttachment",
                    "otherSideName": "attachment"
                },
                {
                    "name": "visibilitySetBy",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "SpecifyUser",
                    "column": "VisibilitySetByID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.AttachmentImageAttribute",
            "table": "attachmentimageattribute",
            "tableId": 139,
            "system": true,
            "idColumn": "AttachmentImageAttributeID",
            "idFieldName": "attachmentImageAttributeId",
            "fields": [
                {
                    "name": "creativeCommons",
                    "column": "CreativeCommons",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 500
                },
                {
                    "name": "height",
                    "column": "Height",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer",
                    "length": 24
                },
                {
                    "name": "imageType",
                    "column": "ImageType",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 80
                },
                {
                    "name": "magnification",
                    "column": "Magnification",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Double",
                    "length": 24
                },
                {
                    "name": "mbImageId",
                    "column": "MBImageID",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer",
                    "length": 24
                },
                {
                    "name": "number1",
                    "column": "Number1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Double",
                    "length": 24
                },
                {
                    "name": "number2",
                    "column": "Number2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Double",
                    "length": 24
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "resolution",
                    "column": "Resolution",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Double",
                    "length": 24
                },
                {
                    "name": "text1",
                    "column": "Text1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 200
                },
                {
                    "name": "text2",
                    "column": "Text2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 200
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampLastSend",
                    "column": "TimestampLastSend",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampLastUpdateCheck",
                    "column": "TimestampLastUpdateCheck",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "viewDescription",
                    "column": "ViewDescription",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 80
                },
                {
                    "name": "width",
                    "column": "Width",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer",
                    "length": 24
                },
                {
                    "name": "yesNo1",
                    "column": "YesNo1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "yesNo2",
                    "column": "YesNo2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                }
            ],
            "relationships": [
                {
                    "name": "attachments",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "Attachment",
                    "otherSideName": "attachmentImageAttribute"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "morphBankView",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "MorphBankView",
                    "column": "MorphBankViewID",
                    "otherSideName": "attachmentImageAttributes"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.AttachmentMetadata",
            "table": "attachmentmetadata",
            "tableId": 42,
            "system": true,
            "idColumn": "AttachmentMetadataID",
            "idFieldName": "attachmentMetadataID",
            "fields": [
                {
                    "name": "name",
                    "column": "Name",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "value",
                    "column": "Value",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 128
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "attachment",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Attachment",
                    "column": "AttachmentID",
                    "otherSideName": "metadata"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.AttachmentTag",
            "table": "attachmenttag",
            "tableId": 130,
            "system": true,
            "idColumn": "AttachmentTagID",
            "idFieldName": "attachmentTagID",
            "fields": [
                {
                    "name": "tag",
                    "column": "Tag",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "attachment",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Attachment",
                    "column": "AttachmentID",
                    "otherSideName": "tags"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.AttributeDef",
            "table": "attributedef",
            "tableId": 16,
            "system": true,
            "idColumn": "AttributeDefID",
            "idFieldName": "attributeDefId",
            "fields": [
                {
                    "name": "dataType",
                    "column": "DataType",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Short"
                },
                {
                    "name": "fieldName",
                    "column": "FieldName",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "tableType",
                    "column": "TableType",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Short"
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "collectingEventAttrs",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "CollectingEventAttr",
                    "otherSideName": "definition"
                },
                {
                    "name": "collectionObjectAttrs",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "CollectionObjectAttr",
                    "otherSideName": "definition"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "discipline",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Discipline",
                    "column": "DisciplineID",
                    "otherSideName": "attributeDefs"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "prepType",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "PrepType",
                    "column": "PrepTypeID",
                    "otherSideName": "attributeDefs"
                },
                {
                    "name": "preparationAttrs",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "PreparationAttr",
                    "otherSideName": "definition"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.Author",
            "table": "author",
            "tableId": 17,
            "view": "Author",
            "searchDialog": "AuthorSearch",
            "system": false,
            "idColumn": "AuthorID",
            "idFieldName": "authorId",
            "fields": [
                {
                    "name": "orderNumber",
                    "column": "OrderNumber",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Short"
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "agent",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "AgentID"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "referenceWork",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "ReferenceWork",
                    "column": "ReferenceWorkID",
                    "otherSideName": "authors"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.AutoNumberingScheme",
            "table": "autonumberingscheme",
            "tableId": 97,
            "view": "AutoNumberingScheme",
            "searchDialog": "AutoNumberingScheme",
            "system": true,
            "idColumn": "AutoNumberingSchemeID",
            "idFieldName": "autoNumberingSchemeId",
            "fields": [
                {
                    "name": "formatName",
                    "column": "FormatName",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "isNumericOnly",
                    "column": "IsNumericOnly",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "schemeClassName",
                    "column": "SchemeClassName",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "schemeName",
                    "column": "SchemeName",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "tableNumber",
                    "column": "TableNumber",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "collections",
                    "type": "many-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Collection",
                    "otherSideName": "numberingSchemes"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "disciplines",
                    "type": "many-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Discipline",
                    "otherSideName": "numberingSchemes"
                },
                {
                    "name": "divisions",
                    "type": "many-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Division",
                    "otherSideName": "numberingSchemes"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.Borrow",
            "table": "borrow",
            "tableId": 18,
            "view": "Borrow",
            "searchDialog": null,
            "system": false,
            "idColumn": "BorrowID",
            "idFieldName": "borrowId",
            "fields": [
                {
                    "name": "collectionMemberId",
                    "column": "CollectionMemberID",
                    "indexed": true,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "currentDueDate",
                    "column": "CurrentDueDate",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Calendar"
                },
                {
                    "name": "dateClosed",
                    "column": "DateClosed",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Calendar",
                    "length": 10
                },
                {
                    "name": "invoiceNumber",
                    "column": "InvoiceNumber",
                    "indexed": true,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "isClosed",
                    "column": "IsClosed",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "isFinancialResponsibility",
                    "column": "IsFinancialResponsibility",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "number1",
                    "column": "Number1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float",
                    "length": 24
                },
                {
                    "name": "number2",
                    "column": "Number2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float",
                    "length": 24
                },
                {
                    "name": "originalDueDate",
                    "column": "OriginalDueDate",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Calendar"
                },
                {
                    "name": "receivedDate",
                    "column": "ReceivedDate",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Calendar"
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "text1",
                    "column": "Text1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 300
                },
                {
                    "name": "text2",
                    "column": "Text2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 300
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "yesNo1",
                    "column": "YesNo1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "yesNo2",
                    "column": "YesNo2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                }
            ],
            "relationships": [
                {
                    "name": "addressOfRecord",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "AddressOfRecord",
                    "column": "AddressOfRecordID"
                },
                {
                    "name": "borrowAgents",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "BorrowAgent",
                    "otherSideName": "borrow"
                },
                {
                    "name": "borrowAttachments",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "BorrowAttachment",
                    "otherSideName": "borrow"
                },
                {
                    "name": "borrowMaterials",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "BorrowMaterial",
                    "otherSideName": "borrow"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "shipments",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Shipment",
                    "otherSideName": "borrow"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.BorrowAgent",
            "table": "borrowagent",
            "tableId": 19,
            "view": "BorrowAgent",
            "searchDialog": null,
            "system": false,
            "idColumn": "BorrowAgentID",
            "idFieldName": "borrowAgentId",
            "fields": [
                {
                    "name": "collectionMemberId",
                    "column": "CollectionMemberID",
                    "indexed": true,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "role",
                    "column": "Role",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "agent",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "AgentID"
                },
                {
                    "name": "borrow",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Borrow",
                    "column": "BorrowID",
                    "otherSideName": "borrowAgents"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.BorrowAttachment",
            "table": "borrowattachment",
            "tableId": 145,
            "view": "ObjectAttachment",
            "searchDialog": null,
            "system": false,
            "idColumn": "BorrowAttachmentID",
            "idFieldName": "borrowAttachmentId",
            "fields": [
                {
                    "name": "ordinal",
                    "column": "Ordinal",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "attachment",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Attachment",
                    "column": "AttachmentID",
                    "otherSideName": "borrowAttachments"
                },
                {
                    "name": "borrow",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Borrow",
                    "column": "BorrowID",
                    "otherSideName": "borrowAttachments"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.BorrowMaterial",
            "table": "borrowmaterial",
            "tableId": 20,
            "system": false,
            "idColumn": "BorrowMaterialID",
            "idFieldName": "borrowMaterialId",
            "fields": [
                {
                    "name": "collectionMemberId",
                    "column": "CollectionMemberID",
                    "indexed": true,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "description",
                    "column": "Description",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "inComments",
                    "column": "InComments",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 1024
                },
                {
                    "name": "materialNumber",
                    "column": "MaterialNumber",
                    "indexed": true,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "outComments",
                    "column": "OutComments",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 1024
                },
                {
                    "name": "quantity",
                    "column": "Quantity",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Short"
                },
                {
                    "name": "quantityResolved",
                    "column": "QuantityResolved",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Short"
                },
                {
                    "name": "quantityReturned",
                    "column": "QuantityReturned",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Short"
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "borrow",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Borrow",
                    "column": "BorrowID",
                    "otherSideName": "borrowMaterials"
                },
                {
                    "name": "borrowReturnMaterials",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "BorrowReturnMaterial",
                    "otherSideName": "borrowMaterial"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.BorrowReturnMaterial",
            "table": "borrowreturnmaterial",
            "tableId": 21,
            "system": false,
            "idColumn": "BorrowReturnMaterialID",
            "idFieldName": "borrowReturnMaterialId",
            "fields": [
                {
                    "name": "collectionMemberId",
                    "column": "CollectionMemberID",
                    "indexed": true,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "quantity",
                    "column": "Quantity",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Short"
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "returnedDate",
                    "column": "ReturnedDate",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Calendar"
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "agent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ReturnedByID"
                },
                {
                    "name": "borrowMaterial",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "BorrowMaterial",
                    "column": "BorrowMaterialID",
                    "otherSideName": "borrowReturnMaterials"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.CollectingEvent",
            "table": "collectingevent",
            "tableId": 10,
            "view": "CollectingEvent",
            "searchDialog": "CollectingEventSearch",
            "system": false,
            "idColumn": "CollectingEventID",
            "idFieldName": "collectingEventId",
            "fields": [
                {
                    "name": "endDate",
                    "column": "EndDate",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Calendar"
                },
                {
                    "name": "endDatePrecision",
                    "column": "EndDatePrecision",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Byte"
                },
                {
                    "name": "endDateVerbatim",
                    "column": "EndDateVerbatim",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "endTime",
                    "column": "EndTime",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Short"
                },
                {
                    "name": "guid",
                    "column": "GUID",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 128
                },
                {
                    "name": "method",
                    "column": "Method",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "sgrStatus",
                    "column": "SGRStatus",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Byte"
                },
                {
                    "name": "startDate",
                    "column": "StartDate",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Calendar"
                },
                {
                    "name": "startDatePrecision",
                    "column": "StartDatePrecision",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Byte"
                },
                {
                    "name": "startDateVerbatim",
                    "column": "StartDateVerbatim",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "startTime",
                    "column": "StartTime",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Short"
                },
                {
                    "name": "stationFieldNumber",
                    "column": "StationFieldNumber",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "verbatimDate",
                    "column": "VerbatimDate",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "verbatimLocality",
                    "column": "VerbatimLocality",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 2048
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "visibility",
                    "column": "Visibility",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Byte"
                }
            ],
            "relationships": [
                {
                    "name": "collectingEventAttachments",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "CollectingEventAttachment",
                    "otherSideName": "collectingEvent"
                },
                {
                    "name": "collectingEventAttribute",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "CollectingEventAttribute",
                    "column": "CollectingEventAttributeID",
                    "otherSideName": "collectingEvents"
                },
                {
                    "name": "collectingEventAttrs",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "CollectingEventAttr",
                    "otherSideName": "collectingEvent"
                },
                {
                    "name": "collectingTrip",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "CollectingTrip",
                    "column": "CollectingTripID",
                    "otherSideName": "collectingEvents"
                },
                {
                    "name": "collectionObjects",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "CollectionObject",
                    "otherSideName": "collectingEvent"
                },
                {
                    "name": "collectors",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "Collector",
                    "otherSideName": "collectingEvent"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "discipline",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Discipline",
                    "column": "DisciplineID"
                },
                {
                    "name": "locality",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Locality",
                    "column": "LocalityID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "visibilitySetBy",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "SpecifyUser",
                    "column": "VisibilitySetByID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.CollectingEventAttachment",
            "table": "collectingeventattachment",
            "tableId": 110,
            "view": "ObjectAttachment",
            "searchDialog": null,
            "system": false,
            "idColumn": "CollectingEventAttachmentID",
            "idFieldName": "collectingEventAttachmentId",
            "fields": [
                {
                    "name": "collectionMemberId",
                    "column": "CollectionMemberID",
                    "indexed": true,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "ordinal",
                    "column": "Ordinal",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "attachment",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Attachment",
                    "column": "AttachmentID",
                    "otherSideName": "collectingEventAttachments"
                },
                {
                    "name": "collectingEvent",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "CollectingEvent",
                    "column": "CollectingEventID",
                    "otherSideName": "collectingEventAttachments"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.CollectingEventAttr",
            "table": "collectingeventattr",
            "tableId": 25,
            "system": false,
            "idColumn": "AttrID",
            "idFieldName": "attrId",
            "fields": [
                {
                    "name": "collectionMemberId",
                    "column": "CollectionMemberID",
                    "indexed": true,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "dblValue",
                    "column": "DoubleValue",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Double"
                },
                {
                    "name": "strValue",
                    "column": "StrValue",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "collectingEvent",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "CollectingEvent",
                    "column": "CollectingEventID",
                    "otherSideName": "collectingEventAttrs"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "definition",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "AttributeDef",
                    "column": "AttributeDefID",
                    "otherSideName": "collectingEventAttrs"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.CollectingEventAttribute",
            "table": "collectingeventattribute",
            "tableId": 92,
            "system": false,
            "idColumn": "CollectingEventAttributeID",
            "idFieldName": "collectingEventAttributeId",
            "fields": [
                {
                    "name": "number1",
                    "column": "Number1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "number10",
                    "column": "Number10",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "number11",
                    "column": "Number11",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "number12",
                    "column": "Number12",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "number13",
                    "column": "Number13",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "number2",
                    "column": "Number2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "number3",
                    "column": "Number3",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "number4",
                    "column": "Number4",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "number5",
                    "column": "Number5",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "number6",
                    "column": "Number6",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "number7",
                    "column": "Number7",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "number8",
                    "column": "Number8",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "number9",
                    "column": "Number9",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "text1",
                    "column": "Text1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 300
                },
                {
                    "name": "text10",
                    "column": "Text10",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "text11",
                    "column": "Text11",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "text12",
                    "column": "Text12",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "text13",
                    "column": "Text13",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "text14",
                    "column": "Text14",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "text15",
                    "column": "Text15",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "text16",
                    "column": "Text16",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "text17",
                    "column": "Text17",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "text2",
                    "column": "Text2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 300
                },
                {
                    "name": "text3",
                    "column": "Text3",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 300
                },
                {
                    "name": "text4",
                    "column": "Text4",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 100
                },
                {
                    "name": "text5",
                    "column": "Text5",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 100
                },
                {
                    "name": "text6",
                    "column": "Text6",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "text7",
                    "column": "Text7",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "text8",
                    "column": "Text8",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "text9",
                    "column": "Text9",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "yesNo1",
                    "column": "YesNo1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "yesNo2",
                    "column": "YesNo2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "yesNo3",
                    "column": "YesNo3",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "yesNo4",
                    "column": "YesNo4",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "yesNo5",
                    "column": "YesNo5",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                }
            ],
            "relationships": [
                {
                    "name": "collectingEvents",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "CollectingEvent",
                    "otherSideName": "collectingEventAttribute"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "discipline",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Discipline",
                    "column": "DisciplineID"
                },
                {
                    "name": "hostTaxon",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Taxon",
                    "column": "HostTaxonID",
                    "otherSideName": "collectingEventAttributes"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.CollectingTrip",
            "table": "collectingtrip",
            "tableId": 87,
            "view": "CollectingTripForm",
            "searchDialog": "CollectingTripSearch",
            "system": false,
            "idColumn": "CollectingTripID",
            "idFieldName": "collectingTripId",
            "fields": [
                {
                    "name": "collectingTripName",
                    "column": "CollectingTripName",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "endDate",
                    "column": "EndDate",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Calendar"
                },
                {
                    "name": "endDatePrecision",
                    "column": "EndDatePrecision",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Byte"
                },
                {
                    "name": "endDateVerbatim",
                    "column": "EndDateVerbatim",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "endTime",
                    "column": "EndTime",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Short"
                },
                {
                    "name": "number1",
                    "column": "Number1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "number2",
                    "column": "Number2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "sponsor",
                    "column": "Sponsor",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "startDate",
                    "column": "StartDate",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Calendar"
                },
                {
                    "name": "startDatePrecision",
                    "column": "StartDatePrecision",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Byte"
                },
                {
                    "name": "startDateVerbatim",
                    "column": "StartDateVerbatim",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "startTime",
                    "column": "StartTime",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Short"
                },
                {
                    "name": "text1",
                    "column": "Text1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "text2",
                    "column": "Text2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 128
                },
                {
                    "name": "text3",
                    "column": "Text3",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "text4",
                    "column": "Text4",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "yesNo1",
                    "column": "YesNo1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "yesNo2",
                    "column": "YesNo2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                }
            ],
            "relationships": [
                {
                    "name": "collectingEvents",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "CollectingEvent",
                    "otherSideName": "collectingTrip"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "discipline",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Discipline",
                    "column": "DisciplineID"
                },
                {
                    "name": "fundingAgents",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "FundingAgent",
                    "otherSideName": "collectingTrip"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.Collection",
            "table": "collection",
            "tableId": 23,
            "view": "Collection",
            "searchDialog": null,
            "system": false,
            "idColumn": "UserGroupScopeId",
            "idFieldName": "userGroupScopeId",
            "fields": [
                {
                    "name": "catalogNumFormatName",
                    "column": "CatalogFormatNumName",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "code",
                    "column": "Code",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "collectionName",
                    "column": "CollectionName",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "collectionType",
                    "column": "CollectionType",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "dbContentVersion",
                    "column": "DbContentVersion",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "description",
                    "column": "Description",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 2048
                },
                {
                    "name": "developmentStatus",
                    "column": "DevelopmentStatus",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "estimatedSize",
                    "column": "EstimatedSize",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "guid",
                    "column": "GUID",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 128
                },
                {
                    "name": "institutionType",
                    "column": "InstitutionType",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "isEmbeddedCollectingEvent",
                    "column": "IsEmbeddedCollectingEvent",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "isaNumber",
                    "column": "IsaNumber",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 24
                },
                {
                    "name": "kingdomCoverage",
                    "column": "KingdomCoverage",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "preservationMethodType",
                    "column": "PreservationMethodType",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "primaryFocus",
                    "column": "PrimaryFocus",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "primaryPurpose",
                    "column": "PrimaryPurpose",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "regNumber",
                    "column": "RegNumber",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 24
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "scope",
                    "column": "Scope",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 2048
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "webPortalURI",
                    "column": "WebPortalURI",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "webSiteURI",
                    "column": "WebSiteURI",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 255
                }
            ],
            "relationships": [
                {
                    "name": "contentContacts",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "otherSideName": "collContentContact"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "discipline",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Discipline",
                    "column": "DisciplineID",
                    "otherSideName": "collections"
                },
                {
                    "name": "institutionNetwork",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Institution",
                    "column": "InstitutionNetworkID"
                },
                {
                    "name": "leftSideRelTypes",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "CollectionRelType",
                    "otherSideName": "leftSideCollection"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "numberingSchemes",
                    "type": "many-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "AutoNumberingScheme",
                    "otherSideName": "collections"
                },
                {
                    "name": "pickLists",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "PickList",
                    "otherSideName": "collection"
                },
                {
                    "name": "prepTypes",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "PrepType",
                    "otherSideName": "collection"
                },
                {
                    "name": "rightSideRelTypes",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "CollectionRelType",
                    "otherSideName": "rightSideCollection"
                },
                {
                    "name": "technicalContacts",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "otherSideName": "collTechContact"
                },
                {
                    "name": "userGroups",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "SpPrincipal",
                    "otherSideName": "scope"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.CollectionObject",
            "table": "collectionobject",
            "tableId": 1,
            "view": "CollectionObject",
            "searchDialog": "CollectionObjectSearch",
            "system": false,
            "idColumn": "CollectionObjectID",
            "idFieldName": "collectionObjectId",
            "fields": [
                {
                    "name": "altCatalogNumber",
                    "column": "AltCatalogNumber",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "availability",
                    "column": "Availability",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "catalogNumber",
                    "column": "CatalogNumber",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "catalogedDate",
                    "column": "CatalogedDate",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Calendar"
                },
                {
                    "name": "catalogedDatePrecision",
                    "column": "CatalogedDatePrecision",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Byte"
                },
                {
                    "name": "catalogedDateVerbatim",
                    "column": "CatalogedDateVerbatim",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "collectionMemberId",
                    "column": "CollectionMemberID",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "countAmt",
                    "column": "CountAmt",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "deaccessioned",
                    "column": "Deaccessioned",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "description",
                    "column": "Description",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "fieldNumber",
                    "column": "FieldNumber",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "guid",
                    "column": "GUID",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 128
                },
                {
                    "name": "inventoryDate",
                    "column": "InventoryDate",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Calendar"
                },
                {
                    "name": "modifier",
                    "column": "Modifier",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "name",
                    "column": "Name",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "notifications",
                    "column": "Notifications",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "number1",
                    "column": "Number1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float",
                    "length": 24
                },
                {
                    "name": "number2",
                    "column": "Number2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float",
                    "length": 24
                },
                {
                    "name": "objectCondition",
                    "column": "ObjectCondition",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "ocr",
                    "column": "OCR",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "projectNumber",
                    "column": "ProjectNumber",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "reservedText",
                    "column": "ReservedText",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 128
                },
                {
                    "name": "restrictions",
                    "column": "Restrictions",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "sgrStatus",
                    "column": "SGRStatus",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Byte"
                },
                {
                    "name": "text1",
                    "column": "Text1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 300
                },
                {
                    "name": "text2",
                    "column": "Text2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 300
                },
                {
                    "name": "text3",
                    "column": "Text3",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "totalValue",
                    "column": "TotalValue",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.math.BigDecimal"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "visibility",
                    "column": "Visibility",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Byte",
                    "length": 10
                },
                {
                    "name": "yesNo1",
                    "column": "YesNo1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "yesNo2",
                    "column": "YesNo2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "yesNo3",
                    "column": "YesNo3",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "yesNo4",
                    "column": "YesNo4",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "yesNo5",
                    "column": "YesNo5",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "yesNo6",
                    "column": "YesNo6",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                }
            ],
            "relationships": [
                {
                    "name": "accession",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Accession",
                    "column": "AccessionID",
                    "otherSideName": "collectionObjects"
                },
                {
                    "name": "appraisal",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Appraisal",
                    "column": "AppraisalID",
                    "otherSideName": "collectionObjects"
                },
                {
                    "name": "cataloger",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CatalogerID"
                },
                {
                    "name": "collectingEvent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "CollectingEvent",
                    "column": "CollectingEventID",
                    "otherSideName": "collectionObjects"
                },
                {
                    "name": "collection",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Collection",
                    "column": "CollectionID"
                },
                {
                    "name": "collectionObjectAttachments",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "CollectionObjectAttachment",
                    "otherSideName": "collectionObject"
                },
                {
                    "name": "collectionObjectAttribute",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "CollectionObjectAttribute",
                    "column": "CollectionObjectAttributeID",
                    "otherSideName": "collectionObjects"
                },
                {
                    "name": "collectionObjectAttrs",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "CollectionObjectAttr",
                    "otherSideName": "collectionObject"
                },
                {
                    "name": "collectionObjectCitations",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "CollectionObjectCitation",
                    "otherSideName": "collectionObject"
                },
                {
                    "name": "conservDescriptions",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "ConservDescription",
                    "otherSideName": "collectionObject"
                },
                {
                    "name": "container",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Container",
                    "column": "ContainerID",
                    "otherSideName": "collectionObjects"
                },
                {
                    "name": "containerOwner",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Container",
                    "column": "ContainerOwnerID",
                    "otherSideName": "collectionObjectKids"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "determinations",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "Determination",
                    "otherSideName": "collectionObject"
                },
                {
                    "name": "dnaSequences",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "DNASequence",
                    "otherSideName": "collectionObject"
                },
                {
                    "name": "exsiccataItems",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "ExsiccataItem",
                    "otherSideName": "collectionObject"
                },
                {
                    "name": "fieldNotebookPage",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "FieldNotebookPage",
                    "column": "FieldNotebookPageID",
                    "otherSideName": "collectionObjects"
                },
                {
                    "name": "leftSideRels",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "CollectionRelationship",
                    "otherSideName": "leftSide"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "otherIdentifiers",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "OtherIdentifier",
                    "otherSideName": "collectionObject"
                },
                {
                    "name": "paleoContext",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "PaleoContext",
                    "column": "PaleoContextID",
                    "otherSideName": "collectionObjects"
                },
                {
                    "name": "preparations",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "Preparation",
                    "otherSideName": "collectionObject"
                },
                {
                    "name": "projects",
                    "type": "many-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Project",
                    "otherSideName": "collectionObjects"
                },
                {
                    "name": "rightSideRels",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "CollectionRelationship",
                    "otherSideName": "rightSide"
                },
                {
                    "name": "treatmentEvents",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "TreatmentEvent",
                    "otherSideName": "collectionObject"
                },
                {
                    "name": "visibilitySetBy",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "SpecifyUser",
                    "column": "VisibilitySetByID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.CollectionObjectAttachment",
            "table": "collectionobjectattachment",
            "tableId": 111,
            "view": "ObjectAttachment",
            "searchDialog": null,
            "system": false,
            "idColumn": "CollectionObjectAttachmentID",
            "idFieldName": "collectionObjectAttachmentId",
            "fields": [
                {
                    "name": "collectionMemberId",
                    "column": "CollectionMemberID",
                    "indexed": true,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "ordinal",
                    "column": "Ordinal",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "attachment",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Attachment",
                    "column": "AttachmentID",
                    "otherSideName": "collectionObjectAttachments"
                },
                {
                    "name": "collectionObject",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "CollectionObject",
                    "column": "CollectionObjectID",
                    "otherSideName": "collectionObjectAttachments"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.CollectionObjectAttr",
            "table": "collectionobjectattr",
            "tableId": 28,
            "system": false,
            "idColumn": "AttrID",
            "idFieldName": "attrId",
            "fields": [
                {
                    "name": "collectionMemberId",
                    "column": "CollectionMemberID",
                    "indexed": true,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "dblValue",
                    "column": "DoubleValue",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Double"
                },
                {
                    "name": "strValue",
                    "column": "StrValue",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "collectionObject",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "CollectionObject",
                    "column": "CollectionObjectID",
                    "otherSideName": "collectionObjectAttrs"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "definition",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "AttributeDef",
                    "column": "AttributeDefID",
                    "otherSideName": "collectionObjectAttrs"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.CollectionObjectAttribute",
            "table": "collectionobjectattribute",
            "tableId": 93,
            "system": false,
            "idColumn": "CollectionObjectAttributeID",
            "idFieldName": "collectionObjectAttributeId",
            "fields": [
                {
                    "name": "collectionMemberId",
                    "column": "CollectionMemberID",
                    "indexed": true,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "number1",
                    "column": "Number1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "number10",
                    "column": "Number10",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "number11",
                    "column": "Number11",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "number12",
                    "column": "Number12",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "number13",
                    "column": "Number13",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "number14",
                    "column": "Number14",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "number15",
                    "column": "Number15",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "number16",
                    "column": "Number16",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "number17",
                    "column": "Number17",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "number18",
                    "column": "Number18",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "number19",
                    "column": "Number19",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "number2",
                    "column": "Number2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "number20",
                    "column": "Number20",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "number21",
                    "column": "Number21",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "number22",
                    "column": "Number22",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "number23",
                    "column": "Number23",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "number24",
                    "column": "Number24",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "number25",
                    "column": "Number25",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "number26",
                    "column": "Number26",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "number27",
                    "column": "Number27",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "number28",
                    "column": "Number28",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "number29",
                    "column": "Number29",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "number3",
                    "column": "Number3",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "number30",
                    "column": "Number30",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Short"
                },
                {
                    "name": "number31",
                    "column": "Number31",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "number32",
                    "column": "Number32",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "number33",
                    "column": "Number33",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "number34",
                    "column": "Number34",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "number35",
                    "column": "Number35",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "number36",
                    "column": "Number36",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "number37",
                    "column": "Number37",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "number38",
                    "column": "Number38",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "number39",
                    "column": "Number39",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "number4",
                    "column": "Number4",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "number40",
                    "column": "Number40",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "number41",
                    "column": "Number41",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "number42",
                    "column": "Number42",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "number5",
                    "column": "Number5",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "number6",
                    "column": "Number6",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "number7",
                    "column": "Number7",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "number8",
                    "column": "Number8",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Byte"
                },
                {
                    "name": "number9",
                    "column": "Number9",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "text1",
                    "column": "Text1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 300
                },
                {
                    "name": "text10",
                    "column": "Text10",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "text11",
                    "column": "Text11",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "text12",
                    "column": "Text12",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "text13",
                    "column": "Text13",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "text14",
                    "column": "Text14",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "text15",
                    "column": "Text15",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "text2",
                    "column": "Text2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 300
                },
                {
                    "name": "text3",
                    "column": "Text3",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 300
                },
                {
                    "name": "text4",
                    "column": "Text4",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "text5",
                    "column": "Text5",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "text6",
                    "column": "Text6",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 100
                },
                {
                    "name": "text7",
                    "column": "Text7",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 100
                },
                {
                    "name": "text8",
                    "column": "Text8",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "text9",
                    "column": "Text9",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "yesNo1",
                    "column": "YesNo1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "yesNo2",
                    "column": "YesNo2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "yesNo3",
                    "column": "YesNo3",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "yesNo4",
                    "column": "YesNo4",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "yesNo5",
                    "column": "YesNo5",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "yesNo6",
                    "column": "YesNo6",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "yesNo7",
                    "column": "YesNo7",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                }
            ],
            "relationships": [
                {
                    "name": "collectionObjects",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "CollectionObject",
                    "otherSideName": "collectionObjectAttribute"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.CollectionObjectCitation",
            "table": "collectionobjectcitation",
            "tableId": 29,
            "system": false,
            "idColumn": "CollectionObjectCitationID",
            "idFieldName": "collectionObjectCitationId",
            "fields": [
                {
                    "name": "collectionMemberId",
                    "column": "CollectionMemberID",
                    "indexed": true,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "isFigured",
                    "column": "IsFigured",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "collectionObject",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "CollectionObject",
                    "column": "CollectionObjectID",
                    "otherSideName": "collectionObjectCitations"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "referenceWork",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "ReferenceWork",
                    "column": "ReferenceWorkID",
                    "otherSideName": "collectionObjectCitations"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.CollectionRelType",
            "table": "collectionreltype",
            "tableId": 98,
            "system": true,
            "idColumn": "CollectionRelTypeID",
            "idFieldName": "collectionRelTypeId",
            "fields": [
                {
                    "name": "name",
                    "column": "Name",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 4096
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "leftSideCollection",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Collection",
                    "column": "LeftSideCollectionID",
                    "otherSideName": "leftSideRelTypes"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "rightSideCollection",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Collection",
                    "column": "RightSideCollectionID",
                    "otherSideName": "rightSideRelTypes"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.CollectionRelationship",
            "table": "collectionrelationship",
            "tableId": 99,
            "system": true,
            "idColumn": "CollectionRelationshipID",
            "idFieldName": "collectionRelationshipId",
            "fields": [
                {
                    "name": "text1",
                    "column": "Text1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "text2",
                    "column": "Text2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "collectionRelType",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "CollectionRelType",
                    "column": "CollectionRelTypeID"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "leftSide",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "CollectionObject",
                    "column": "LeftSideCollectionID",
                    "otherSideName": "leftSideRels"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "rightSide",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "CollectionObject",
                    "column": "RightSideCollectionID",
                    "otherSideName": "rightSideRels"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.Collector",
            "table": "collector",
            "tableId": 30,
            "view": "Collector",
            "searchDialog": "CollectorSearch",
            "system": false,
            "idColumn": "CollectorID",
            "idFieldName": "collectorId",
            "fields": [
                {
                    "name": "isPrimary",
                    "column": "IsPrimary",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "orderNumber",
                    "column": "OrderNumber",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "agent",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "AgentID",
                    "otherSideName": "collectors"
                },
                {
                    "name": "collectingEvent",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "CollectingEvent",
                    "column": "CollectingEventID",
                    "otherSideName": "collectors"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "division",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Division",
                    "column": "DivisionID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.CommonNameTx",
            "table": "commonnametx",
            "tableId": 106,
            "system": false,
            "idColumn": "CommonNameTxID",
            "idFieldName": "commonNameTxId",
            "fields": [
                {
                    "name": "author",
                    "column": "Author",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 128
                },
                {
                    "name": "country",
                    "column": "Country",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 2
                },
                {
                    "name": "language",
                    "column": "Language",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 2
                },
                {
                    "name": "name",
                    "column": "Name",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "variant",
                    "column": "Variant",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 2
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "citations",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "CommonNameTxCitation",
                    "otherSideName": "commonNameTx"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "taxon",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Taxon",
                    "column": "TaxonID",
                    "otherSideName": "commonNames"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.CommonNameTxCitation",
            "table": "commonnametxcitation",
            "tableId": 134,
            "system": false,
            "idColumn": "CommonNameTxCitationID",
            "idFieldName": "commonNameTxCitationId",
            "fields": [
                {
                    "name": "number1",
                    "column": "Number1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "number2",
                    "column": "Number2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "text1",
                    "column": "Text1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 300
                },
                {
                    "name": "text2",
                    "column": "Text2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 300
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "yesNo1",
                    "column": "YesNo1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "yesNo2",
                    "column": "YesNo2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                }
            ],
            "relationships": [
                {
                    "name": "commonNameTx",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "CommonNameTx",
                    "column": "CommonNameTxID",
                    "otherSideName": "citations"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "referenceWork",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "ReferenceWork",
                    "column": "ReferenceWorkID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.ConservDescription",
            "table": "conservdescription",
            "tableId": 103,
            "system": false,
            "idColumn": "ConservDescriptionID",
            "idFieldName": "conservDescriptionId",
            "fields": [
                {
                    "name": "backgroundInfo",
                    "column": "BackgroundInfo",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 8192
                },
                {
                    "name": "composition",
                    "column": "Composition",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 8192
                },
                {
                    "name": "description",
                    "column": "Description",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 8192
                },
                {
                    "name": "displayRecommendations",
                    "column": "DisplayRecommendations",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "height",
                    "column": "Height",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "lightRecommendations",
                    "column": "LightRecommendations",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "objLength",
                    "column": "ObjLength",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "otherRecommendations",
                    "column": "OtherRecommendations",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 8192
                },
                {
                    "name": "shortDesc",
                    "column": "ShortDesc",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 128
                },
                {
                    "name": "source",
                    "column": "Source",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 8192
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "units",
                    "column": "Units",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 16
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "width",
                    "column": "Width",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                }
            ],
            "relationships": [
                {
                    "name": "collectionObject",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "CollectionObject",
                    "column": "CollectionObjectID",
                    "otherSideName": "conservDescriptions"
                },
                {
                    "name": "conservDescriptionAttachments",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "ConservDescriptionAttachment",
                    "otherSideName": "conservDescription"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "division",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Division",
                    "column": "DivisionID"
                },
                {
                    "name": "events",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "ConservEvent",
                    "otherSideName": "conservDescription"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.ConservDescriptionAttachment",
            "table": "conservdescriptionattachment",
            "tableId": 112,
            "view": "ObjectAttachment",
            "searchDialog": null,
            "system": false,
            "idColumn": "ConservDescriptionAttachmentID",
            "idFieldName": "conservDescriptionAttachmentId",
            "fields": [
                {
                    "name": "ordinal",
                    "column": "Ordinal",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "attachment",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Attachment",
                    "column": "AttachmentID",
                    "otherSideName": "conservDescriptionAttachments"
                },
                {
                    "name": "conservDescription",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "ConservDescription",
                    "column": "ConservDescriptionID",
                    "otherSideName": "conservDescriptionAttachments"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.ConservEvent",
            "table": "conservevent",
            "tableId": 73,
            "system": false,
            "idColumn": "ConservEventID",
            "idFieldName": "conservEventId",
            "fields": [
                {
                    "name": "advTestingExam",
                    "column": "AdvTestingExam",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 8192
                },
                {
                    "name": "advTestingExamResults",
                    "column": "AdvTestingExamResults",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 8192
                },
                {
                    "name": "completedComments",
                    "column": "CompletedComments",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "completedDate",
                    "column": "CompletedDate",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Calendar"
                },
                {
                    "name": "conditionReport",
                    "column": "ConditionReport",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 8192
                },
                {
                    "name": "curatorApprovalDate",
                    "column": "CuratorApprovalDate",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Calendar",
                    "length": 8192
                },
                {
                    "name": "examDate",
                    "column": "ExamDate",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Calendar"
                },
                {
                    "name": "number1",
                    "column": "Number1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "number2",
                    "column": "Number2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "photoDocs",
                    "column": "PhotoDocs",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 8192
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "text1",
                    "column": "Text1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "text2",
                    "column": "Text2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "treatmentCompDate",
                    "column": "TreatmentCompDate",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Calendar"
                },
                {
                    "name": "treatmentReport",
                    "column": "TreatmentReport",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 8192
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "yesNo1",
                    "column": "YesNo1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "yesNo2",
                    "column": "YesNo2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                }
            ],
            "relationships": [
                {
                    "name": "conservDescription",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "ConservDescription",
                    "column": "ConservDescriptionID",
                    "otherSideName": "events"
                },
                {
                    "name": "conservEventAttachments",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "ConservEventAttachment",
                    "otherSideName": "conservEvent"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "curator",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CuratorID"
                },
                {
                    "name": "examinedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ExaminedByAgentID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "treatedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "TreatedByAgentID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.ConservEventAttachment",
            "table": "conserveventattachment",
            "tableId": 113,
            "view": "ObjectAttachment",
            "searchDialog": null,
            "system": false,
            "idColumn": "ConservEventAttachmentID",
            "idFieldName": "conservEventAttachmentId",
            "fields": [
                {
                    "name": "ordinal",
                    "column": "Ordinal",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "attachment",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Attachment",
                    "column": "AttachmentID",
                    "otherSideName": "conservEventAttachments"
                },
                {
                    "name": "conservEvent",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "ConservEvent",
                    "column": "ConservEventID",
                    "otherSideName": "conservEventAttachments"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.Container",
            "table": "container",
            "tableId": 31,
            "view": "Container",
            "searchDialog": "ContainerSearch",
            "system": false,
            "idColumn": "ContainerID",
            "idFieldName": "containerId",
            "fields": [
                {
                    "name": "collectionMemberId",
                    "column": "CollectionMemberID",
                    "indexed": true,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "description",
                    "column": "Description",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "name",
                    "column": "Name",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "number",
                    "column": "Number",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "type",
                    "column": "Type",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Short"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "children",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Container",
                    "otherSideName": "parent"
                },
                {
                    "name": "collectionObjectKids",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "CollectionObject",
                    "otherSideName": "containerOwner"
                },
                {
                    "name": "collectionObjects",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "CollectionObject",
                    "otherSideName": "container"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "parent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Container",
                    "column": "ParentID",
                    "otherSideName": "children"
                },
                {
                    "name": "storage",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Storage",
                    "column": "StorageID",
                    "otherSideName": "containers"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.DNASequence",
            "table": "dnasequence",
            "tableId": 121,
            "system": false,
            "idColumn": "DnaSequenceID",
            "idFieldName": "dnaSequenceId",
            "fields": [
                {
                    "name": "ambiguousResidues",
                    "column": "AmbiguousResidues",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "boldBarcodeId",
                    "column": "BOLDBarcodeID",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "boldLastUpdateDate",
                    "column": "BOLDLastUpdateDate",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Calendar"
                },
                {
                    "name": "boldSampleId",
                    "column": "BOLDSampleID",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "boldTranslationMatrix",
                    "column": "BOLDTranslationMatrix",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "collectionMemberId",
                    "column": "CollectionMemberID",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "compA",
                    "column": "CompA",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "compC",
                    "column": "CompC",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "compG",
                    "column": "CompG",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "compT",
                    "column": "compT",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "genbankAccessionNumber",
                    "column": "GenBankAccessionNumber",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "geneSequence",
                    "column": "GeneSequence",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 2048
                },
                {
                    "name": "moleculeType",
                    "column": "MoleculeType",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "number1",
                    "column": "Number1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "number2",
                    "column": "Number2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "number3",
                    "column": "Number3",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "targetMarker",
                    "column": "TargetMarker",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "text1",
                    "column": "Text1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "text2",
                    "column": "Text2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "text3",
                    "column": "Text3",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "totalResidues",
                    "column": "TotalResidues",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "yesNo1",
                    "column": "YesNo1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "yesNo2",
                    "column": "YesNo2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "yesNo3",
                    "column": "YesNo3",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                }
            ],
            "relationships": [
                {
                    "name": "attachments",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "DNASequenceAttachment",
                    "otherSideName": "dnaSequence"
                },
                {
                    "name": "collectionObject",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "CollectionObject",
                    "column": "CollectionObjectID",
                    "otherSideName": "dnaSequences"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "dnaSequencingRuns",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "DNASequencingRun",
                    "otherSideName": "dnaSequence"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "sequencer",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "AgentID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.DNASequenceAttachment",
            "table": "dnasequenceattachment",
            "tableId": 147,
            "view": "ObjectAttachment",
            "searchDialog": null,
            "system": false,
            "idColumn": "DnaSequenceAttachmentId",
            "idFieldName": "dnaSequenceAttachmentId",
            "fields": [
                {
                    "name": "ordinal",
                    "column": "Ordinal",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "attachment",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Attachment",
                    "column": "AttachmentID",
                    "otherSideName": "dnaSequenceAttachments"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "dnaSequence",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "DNASequence",
                    "column": "DnaSequenceID",
                    "otherSideName": "attachments"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.DNASequencingRun",
            "table": "dnasequencingrun",
            "tableId": 88,
            "system": false,
            "idColumn": "DNASequencingRunID",
            "idFieldName": "dnaSequencingRunId",
            "fields": [
                {
                    "name": "collectionMemberId",
                    "column": "CollectionMemberID",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "geneSequence",
                    "column": "GeneSequence",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text"
                },
                {
                    "name": "number1",
                    "column": "Number1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "number2",
                    "column": "Number2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "number3",
                    "column": "Number3",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "ordinal",
                    "column": "Ordinal",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "pcrCocktailPrimer",
                    "column": "PCRCocktailPrimer",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "pcrForwardPrimerCode",
                    "column": "PCRForwardPrimerCode",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "pcrPrimerName",
                    "column": "PCRPrimerName",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "pcrPrimerSequence5_3",
                    "column": "PCRPrimerSequence5_3",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "pcrReversePrimerCode",
                    "column": "PCRReversePrimerCode",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "readDirection",
                    "column": "ReadDirection",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 16
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "runDate",
                    "column": "RunDate",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Calendar"
                },
                {
                    "name": "scoreFileName",
                    "column": "ScoreFileName",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "sequenceCocktailPrimer",
                    "column": "SequenceCocktailPrimer",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "sequencePrimerCode",
                    "column": "SequencePrimerCode",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "sequencePrimerName",
                    "column": "SequencePrimerName",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "sequencePrimerSequence5_3",
                    "column": "SequencePrimerSequence5_3",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "text1",
                    "column": "Text1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "text2",
                    "column": "Text2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "text3",
                    "column": "Text3",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "traceFileName",
                    "column": "TraceFileName",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "yesNo1",
                    "column": "YesNo1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "yesNo2",
                    "column": "YesNo2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "yesNo3",
                    "column": "YesNo3",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                }
            ],
            "relationships": [
                {
                    "name": "attachments",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "DNASequencingRunAttachment",
                    "otherSideName": "dnaSequencingRun"
                },
                {
                    "name": "citations",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "DNASequencingRunCitation",
                    "otherSideName": "sequencingRun"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "dnaSequence",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "DNASequence",
                    "column": "DNASequenceID",
                    "otherSideName": "dnaSequencingRuns"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "preparedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "PreparedByAgentID"
                },
                {
                    "name": "runByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "RunByAgentID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.DNASequencingRunAttachment",
            "table": "dnasequencerunattachment",
            "tableId": 135,
            "view": "ObjectAttachment",
            "searchDialog": null,
            "system": false,
            "idColumn": "DnaSequencingRunAttachmentId",
            "idFieldName": "dnaSequencingRunAttachmentId",
            "fields": [
                {
                    "name": "ordinal",
                    "column": "Ordinal",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "attachment",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Attachment",
                    "column": "AttachmentID",
                    "otherSideName": "dnaSequencingRunAttachments"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "dnaSequencingRun",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "DNASequencingRun",
                    "column": "DnaSequencingRunID",
                    "otherSideName": "attachments"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.DNASequencingRunCitation",
            "table": "dnasequencingruncitation",
            "tableId": 105,
            "system": false,
            "idColumn": "DNASequencingRunCitationID",
            "idFieldName": "dnaSequencingRunCitationId",
            "fields": [
                {
                    "name": "number1",
                    "column": "Number1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "number2",
                    "column": "Number2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "text1",
                    "column": "Text1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 300
                },
                {
                    "name": "text2",
                    "column": "Text2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 300
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "yesNo1",
                    "column": "YesNo1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "yesNo2",
                    "column": "YesNo2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                }
            ],
            "relationships": [
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "referenceWork",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "ReferenceWork",
                    "column": "ReferenceWorkID"
                },
                {
                    "name": "sequencingRun",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "DNASequencingRun",
                    "column": "DNASequencingRunID",
                    "otherSideName": "citations"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.DataType",
            "table": "datatype",
            "tableId": 33,
            "system": true,
            "idColumn": "DataTypeID",
            "idFieldName": "dataTypeId",
            "fields": [
                {
                    "name": "name",
                    "column": "Name",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.Deaccession",
            "table": "deaccession",
            "tableId": 34,
            "system": false,
            "idColumn": "DeaccessionID",
            "idFieldName": "deaccessionId",
            "fields": [
                {
                    "name": "deaccessionDate",
                    "column": "DeaccessionDate",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Calendar"
                },
                {
                    "name": "deaccessionNumber",
                    "column": "DeaccessionNumber",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "number1",
                    "column": "Number1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float",
                    "length": 24
                },
                {
                    "name": "number2",
                    "column": "Number2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float",
                    "length": 24
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "text1",
                    "column": "Text1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 300
                },
                {
                    "name": "text2",
                    "column": "Text2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 300
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "type",
                    "column": "Type",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "yesNo1",
                    "column": "YesNo1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "yesNo2",
                    "column": "YesNo2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                }
            ],
            "relationships": [
                {
                    "name": "accession",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Accession",
                    "column": "AccessionID",
                    "otherSideName": "deaccessions"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "deaccessionAgents",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "DeaccessionAgent",
                    "otherSideName": "deaccession"
                },
                {
                    "name": "deaccessionPreparations",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "DeaccessionPreparation",
                    "otherSideName": "deaccession"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.DeaccessionAgent",
            "table": "deaccessionagent",
            "tableId": 35,
            "system": false,
            "idColumn": "DeaccessionAgentID",
            "idFieldName": "deaccessionAgentId",
            "fields": [
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "role",
                    "column": "Role",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "agent",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "AgentID"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "deaccession",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Deaccession",
                    "column": "DeaccessionID",
                    "otherSideName": "deaccessionAgents"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.DeaccessionPreparation",
            "table": "deaccessionpreparation",
            "tableId": 36,
            "system": false,
            "idColumn": "DeaccessionPreparationID",
            "idFieldName": "deaccessionPreparationId",
            "fields": [
                {
                    "name": "quantity",
                    "column": "Quantity",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Short"
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "deaccession",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Deaccession",
                    "column": "DeaccessionID",
                    "otherSideName": "deaccessionPreparations"
                },
                {
                    "name": "loanReturnPreparations",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "LoanReturnPreparation",
                    "otherSideName": "deaccessionPreparation"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "preparation",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Preparation",
                    "column": "PreparationID",
                    "otherSideName": "deaccessionPreparations"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.Determination",
            "table": "determination",
            "tableId": 9,
            "view": "Determination",
            "searchDialog": "DeterminationSearch",
            "system": false,
            "idColumn": "DeterminationID",
            "idFieldName": "determinationId",
            "fields": [
                {
                    "name": "addendum",
                    "column": "Addendum",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 16
                },
                {
                    "name": "alternateName",
                    "column": "AlternateName",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 128
                },
                {
                    "name": "collectionMemberId",
                    "column": "CollectionMemberID",
                    "indexed": true,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "confidence",
                    "column": "Confidence",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "determinedDate",
                    "column": "DeterminedDate",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Calendar"
                },
                {
                    "name": "determinedDatePrecision",
                    "column": "DeterminedDatePrecision",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Byte"
                },
                {
                    "name": "featureOrBasis",
                    "column": "FeatureOrBasis",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "guid",
                    "column": "GUID",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 128
                },
                {
                    "name": "isCurrent",
                    "column": "IsCurrent",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "method",
                    "column": "Method",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "nameUsage",
                    "column": "NameUsage",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "number1",
                    "column": "Number1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float",
                    "length": 24
                },
                {
                    "name": "number2",
                    "column": "Number2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float",
                    "length": 24
                },
                {
                    "name": "qualifier",
                    "column": "Qualifier",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 16
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "subSpQualifier",
                    "column": "SubSpQualifier",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 16
                },
                {
                    "name": "text1",
                    "column": "Text1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 300
                },
                {
                    "name": "text2",
                    "column": "Text2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 300
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "typeStatusName",
                    "column": "TypeStatusName",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "varQualifier",
                    "column": "VarQualifier",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 16
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "yesNo1",
                    "column": "YesNo1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "yesNo2",
                    "column": "YesNo2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                }
            ],
            "relationships": [
                {
                    "name": "collectionObject",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "CollectionObject",
                    "column": "CollectionObjectID",
                    "otherSideName": "determinations"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "determinationCitations",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "DeterminationCitation",
                    "otherSideName": "determination"
                },
                {
                    "name": "determiner",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "DeterminerID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "preferredTaxon",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Taxon",
                    "column": "PreferredTaxonID"
                },
                {
                    "name": "taxon",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Taxon",
                    "column": "TaxonID",
                    "otherSideName": "determinations"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.DeterminationCitation",
            "table": "determinationcitation",
            "tableId": 38,
            "system": false,
            "idColumn": "DeterminationCitationID",
            "idFieldName": "determinationCitationId",
            "fields": [
                {
                    "name": "collectionMemberId",
                    "column": "CollectionMemberID",
                    "indexed": true,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "determination",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Determination",
                    "column": "DeterminationID",
                    "otherSideName": "determinationCitations"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "referenceWork",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "ReferenceWork",
                    "column": "ReferenceWorkID",
                    "otherSideName": "determinationCitations"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.Discipline",
            "table": "discipline",
            "tableId": 26,
            "view": "Discipline",
            "searchDialog": "DisciplineSearch",
            "system": false,
            "idColumn": "UserGroupScopeId",
            "idFieldName": "userGroupScopeId",
            "fields": [
                {
                    "name": "name",
                    "column": "Name",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "regNumber",
                    "column": "RegNumber",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 24
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "type",
                    "column": "Type",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "attributeDefs",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "AttributeDef",
                    "otherSideName": "discipline"
                },
                {
                    "name": "collections",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Collection",
                    "otherSideName": "discipline"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "dataType",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "DataType",
                    "column": "DataTypeID"
                },
                {
                    "name": "division",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Division",
                    "column": "DivisionID",
                    "otherSideName": "disciplines"
                },
                {
                    "name": "geographyTreeDef",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "GeographyTreeDef",
                    "column": "GeographyTreeDefID",
                    "otherSideName": "disciplines"
                },
                {
                    "name": "geologicTimePeriodTreeDef",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "GeologicTimePeriodTreeDef",
                    "column": "GeologicTimePeriodTreeDefID",
                    "otherSideName": "disciplines"
                },
                {
                    "name": "lithoStratTreeDef",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "LithoStratTreeDef",
                    "column": "LithoStratTreeDefID",
                    "otherSideName": "disciplines"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "numberingSchemes",
                    "type": "many-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "AutoNumberingScheme",
                    "otherSideName": "disciplines"
                },
                {
                    "name": "spExportSchemas",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "SpExportSchema",
                    "otherSideName": "discipline"
                },
                {
                    "name": "spLocaleContainers",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "SpLocaleContainer",
                    "otherSideName": "discipline"
                },
                {
                    "name": "taxonTreeDef",
                    "type": "one-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "TaxonTreeDef",
                    "column": "TaxonTreeDefID",
                    "otherSideName": "discipline"
                },
                {
                    "name": "userGroups",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "SpPrincipal",
                    "otherSideName": "scope"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.Division",
            "table": "division",
            "tableId": 96,
            "view": "Division",
            "searchDialog": "DivisionSearch",
            "system": false,
            "idColumn": "UserGroupScopeId",
            "idFieldName": "userGroupScopeId",
            "fields": [
                {
                    "name": "abbrev",
                    "column": "Abbrev",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "altName",
                    "column": "AltName",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 128
                },
                {
                    "name": "description",
                    "column": "Description",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 8192
                },
                {
                    "name": "discipline",
                    "column": "DisciplineType",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "iconURI",
                    "column": "IconURI",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "name",
                    "column": "Name",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "regNumber",
                    "column": "RegNumber",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 24
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 8192
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "uri",
                    "column": "Uri",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "address",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Address",
                    "column": "AddressID",
                    "otherSideName": "divisions"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "disciplines",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Discipline",
                    "otherSideName": "division"
                },
                {
                    "name": "institution",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Institution",
                    "column": "InstitutionID",
                    "otherSideName": "divisions"
                },
                {
                    "name": "members",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "otherSideName": "division"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "numberingSchemes",
                    "type": "many-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "AutoNumberingScheme",
                    "otherSideName": "divisions"
                },
                {
                    "name": "userGroups",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "SpPrincipal",
                    "otherSideName": "scope"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.ExchangeIn",
            "table": "exchangein",
            "tableId": 39,
            "system": false,
            "idColumn": "ExchangeInID",
            "idFieldName": "exchangeInId",
            "fields": [
                {
                    "name": "descriptionOfMaterial",
                    "column": "DescriptionOfMaterial",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 120
                },
                {
                    "name": "exchangeDate",
                    "column": "ExchangeDate",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Calendar"
                },
                {
                    "name": "number1",
                    "column": "Number1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float",
                    "length": 24
                },
                {
                    "name": "number2",
                    "column": "Number2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float",
                    "length": 24
                },
                {
                    "name": "quantityExchanged",
                    "column": "QuantityExchanged",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Short"
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "srcGeography",
                    "column": "SrcGeography",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "srcTaxonomy",
                    "column": "SrcTaxonomy",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "text1",
                    "column": "Text1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 300
                },
                {
                    "name": "text2",
                    "column": "Text2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 300
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "yesNo1",
                    "column": "YesNo1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "yesNo2",
                    "column": "YesNo2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                }
            ],
            "relationships": [
                {
                    "name": "addressOfRecord",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "AddressOfRecord",
                    "column": "AddressOfRecordID",
                    "otherSideName": "exchangeIns"
                },
                {
                    "name": "agentCatalogedBy",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CatalogedByID"
                },
                {
                    "name": "agentReceivedFrom",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ReceivedFromOrganizationID"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "division",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Division",
                    "column": "DivisionID"
                },
                {
                    "name": "exchangeInPreps",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "ExchangeInPrep",
                    "otherSideName": "exchangeIn"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.ExchangeInPrep",
            "table": "exchangeinprep",
            "tableId": 140,
            "view": "ExchangeInPrep",
            "searchDialog": null,
            "system": false,
            "idColumn": "ExchangeInPrepID",
            "idFieldName": "exchangeInPrepId",
            "fields": [
                {
                    "name": "comments",
                    "column": "Comments",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text"
                },
                {
                    "name": "descriptionOfMaterial",
                    "column": "DescriptionOfMaterial",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "number1",
                    "column": "Number1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "quantity",
                    "column": "Quantity",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "text1",
                    "column": "Text1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text"
                },
                {
                    "name": "text2",
                    "column": "Text2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text"
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "discipline",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Discipline",
                    "column": "DisciplineID"
                },
                {
                    "name": "exchangeIn",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "ExchangeIn",
                    "column": "ExchangeInID",
                    "otherSideName": "exchangeInPreps"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "preparation",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Preparation",
                    "column": "PreparationID",
                    "otherSideName": "exchangeInPreps"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.ExchangeOut",
            "table": "exchangeout",
            "tableId": 40,
            "system": false,
            "idColumn": "ExchangeOutID",
            "idFieldName": "exchangeOutId",
            "fields": [
                {
                    "name": "descriptionOfMaterial",
                    "column": "DescriptionOfMaterial",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 120
                },
                {
                    "name": "exchangeDate",
                    "column": "ExchangeDate",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Calendar"
                },
                {
                    "name": "number1",
                    "column": "Number1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float",
                    "length": 24
                },
                {
                    "name": "number2",
                    "column": "Number2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float",
                    "length": 24
                },
                {
                    "name": "quantityExchanged",
                    "column": "QuantityExchanged",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Short"
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "srcGeography",
                    "column": "SrcGeography",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "srcTaxonomy",
                    "column": "SrcTaxonomy",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "text1",
                    "column": "Text1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 300
                },
                {
                    "name": "text2",
                    "column": "Text2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 300
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "yesNo1",
                    "column": "YesNo1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "yesNo2",
                    "column": "YesNo2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                }
            ],
            "relationships": [
                {
                    "name": "addressOfRecord",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "AddressOfRecord",
                    "column": "AddressOfRecordID",
                    "otherSideName": "exchangeOuts"
                },
                {
                    "name": "agentCatalogedBy",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CatalogedByID"
                },
                {
                    "name": "agentSentTo",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "SentToOrganizationID"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "division",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Division",
                    "column": "DivisionID"
                },
                {
                    "name": "exchangeOutPreps",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "ExchangeOutPrep",
                    "otherSideName": "exchangeOut"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "shipments",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Shipment",
                    "otherSideName": "exchangeOut"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.ExchangeOutPrep",
            "table": "exchangeoutprep",
            "tableId": 141,
            "view": "ExchangeOutPrep",
            "searchDialog": null,
            "system": false,
            "idColumn": "ExchangeOutPrepID",
            "idFieldName": "exchangeOutPrepId",
            "fields": [
                {
                    "name": "comments",
                    "column": "Comments",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text"
                },
                {
                    "name": "descriptionOfMaterial",
                    "column": "DescriptionOfMaterial",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "number1",
                    "column": "Number1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "quantity",
                    "column": "Quantity",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "text1",
                    "column": "Text1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text"
                },
                {
                    "name": "text2",
                    "column": "Text2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text"
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "discipline",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Discipline",
                    "column": "DisciplineID"
                },
                {
                    "name": "exchangeOut",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "ExchangeOut",
                    "column": "ExchangeOutID",
                    "otherSideName": "exchangeOutPreps"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "preparation",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Preparation",
                    "column": "PreparationID",
                    "otherSideName": "exchangeOutPreps"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.Exsiccata",
            "table": "exsiccata",
            "tableId": 89,
            "view": "Exsiccata",
            "searchDialog": null,
            "system": false,
            "idColumn": "ExsiccataID",
            "idFieldName": "exsiccataId",
            "fields": [
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "title",
                    "column": "Title",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "exsiccataItems",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "ExsiccataItem",
                    "otherSideName": "exsiccata"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "referenceWork",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "ReferenceWork",
                    "column": "ReferenceWorkID",
                    "otherSideName": "exsiccatae"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.ExsiccataItem",
            "table": "exsiccataitem",
            "tableId": 104,
            "system": false,
            "idColumn": "ExsiccataItemID",
            "idFieldName": "exsiccataItemId",
            "fields": [
                {
                    "name": "fascicle",
                    "column": "Fascicle",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 16
                },
                {
                    "name": "number",
                    "column": "Number",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 16
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "collectionObject",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "CollectionObject",
                    "column": "CollectionObjectID",
                    "otherSideName": "exsiccataItems"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "exsiccata",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Exsiccata",
                    "column": "ExsiccataID",
                    "otherSideName": "exsiccataItems"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.FieldNotebook",
            "table": "fieldnotebook",
            "tableId": 83,
            "system": false,
            "idColumn": "FieldNotebookID",
            "idFieldName": "fieldNotebookId",
            "fields": [
                {
                    "name": "description",
                    "column": "Description",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 2048
                },
                {
                    "name": "endDate",
                    "column": "EndDate",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Calendar"
                },
                {
                    "name": "location",
                    "column": "Storage",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "name",
                    "column": "Name",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "startDate",
                    "column": "StartDate",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Calendar"
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "attachments",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "FieldNotebookAttachment",
                    "otherSideName": "fieldNotebook"
                },
                {
                    "name": "collection",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Collection",
                    "column": "CollectionID"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "discipline",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Discipline",
                    "column": "DisciplineID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "ownerAgent",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "AgentID"
                },
                {
                    "name": "pageSets",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "FieldNotebookPageSet",
                    "otherSideName": "fieldNotebook"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.FieldNotebookAttachment",
            "table": "fieldnotebookattachment",
            "tableId": 127,
            "view": "ObjectAttachment",
            "searchDialog": null,
            "system": false,
            "idColumn": "FieldNotebookAttachmentId",
            "idFieldName": "fieldNotebookAttachmentId",
            "fields": [
                {
                    "name": "ordinal",
                    "column": "Ordinal",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 8192
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "attachment",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Attachment",
                    "column": "AttachmentID",
                    "otherSideName": "fieldNotebookAttachments"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "fieldNotebook",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "FieldNotebook",
                    "column": "FieldNotebookID",
                    "otherSideName": "attachments"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.FieldNotebookPage",
            "table": "fieldnotebookpage",
            "tableId": 85,
            "view": "FieldNotebookPage",
            "searchDialog": "FieldNotebookPageSearch",
            "system": false,
            "idColumn": "FieldNotebookPageID",
            "idFieldName": "fieldNotebookPageId",
            "fields": [
                {
                    "name": "description",
                    "column": "Description",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 128
                },
                {
                    "name": "pageNumber",
                    "column": "PageNumber",
                    "indexed": true,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "scanDate",
                    "column": "ScanDate",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Calendar"
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "attachments",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "FieldNotebookPageAttachment",
                    "otherSideName": "fieldNotebookPage"
                },
                {
                    "name": "collectionObjects",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "CollectionObject",
                    "otherSideName": "fieldNotebookPage"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "discipline",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Discipline",
                    "column": "DisciplineID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "pageSet",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "FieldNotebookPageSet",
                    "column": "FieldNotebookPageSetID",
                    "otherSideName": "pages"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.FieldNotebookPageAttachment",
            "table": "fieldnotebookpageattachment",
            "tableId": 129,
            "view": "ObjectAttachment",
            "searchDialog": null,
            "system": false,
            "idColumn": "FieldNotebookPageAttachmentId",
            "idFieldName": "fieldNotebookPageAttachmentId",
            "fields": [
                {
                    "name": "ordinal",
                    "column": "Ordinal",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 8192
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "attachment",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Attachment",
                    "column": "AttachmentID",
                    "otherSideName": "fieldNotebookPageAttachments"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "fieldNotebookPage",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "FieldNotebookPage",
                    "column": "FieldNotebookPageID",
                    "otherSideName": "attachments"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.FieldNotebookPageSet",
            "table": "fieldnotebookpageset",
            "tableId": 84,
            "system": false,
            "idColumn": "FieldNotebookPageSetID",
            "idFieldName": "fieldNotebookPageSetId",
            "fields": [
                {
                    "name": "description",
                    "column": "Description",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 128
                },
                {
                    "name": "endDate",
                    "column": "EndDate",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Calendar"
                },
                {
                    "name": "method",
                    "column": "Method",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "orderNumber",
                    "column": "OrderNumber",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Short"
                },
                {
                    "name": "startDate",
                    "column": "StartDate",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Calendar"
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "attachments",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "FieldNotebookPageSetAttachment",
                    "otherSideName": "fieldNotebookPageSet"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "discipline",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Discipline",
                    "column": "DisciplineID"
                },
                {
                    "name": "fieldNotebook",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "FieldNotebook",
                    "column": "FieldNotebookID",
                    "otherSideName": "pageSets"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "pages",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "FieldNotebookPage",
                    "otherSideName": "pageSet"
                },
                {
                    "name": "sourceAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "AgentID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.FieldNotebookPageSetAttachment",
            "table": "fieldnotebookpagesetattachment",
            "tableId": 128,
            "view": "ObjectAttachment",
            "searchDialog": null,
            "system": false,
            "idColumn": "FieldNotebookPageSetAttachmentId",
            "idFieldName": "fieldNotebookPageSetAttachmentId",
            "fields": [
                {
                    "name": "ordinal",
                    "column": "Ordinal",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 8192
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "attachment",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Attachment",
                    "column": "AttachmentID",
                    "otherSideName": "fieldNotebookPageSetAttachments"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "fieldNotebookPageSet",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "FieldNotebookPageSet",
                    "column": "FieldNotebookPageSetID",
                    "otherSideName": "attachments"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.FundingAgent",
            "table": "fundingagent",
            "tableId": 146,
            "view": "FundingAgent",
            "searchDialog": null,
            "system": false,
            "idColumn": "FundingAgentID",
            "idFieldName": "fundingAgentId",
            "fields": [
                {
                    "name": "isPrimary",
                    "column": "IsPrimary",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "orderNumber",
                    "column": "OrderNumber",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "type",
                    "column": "Type",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "agent",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "AgentID"
                },
                {
                    "name": "collectingTrip",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "CollectingTrip",
                    "column": "CollectingTripID",
                    "otherSideName": "fundingAgents"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "division",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Division",
                    "column": "DivisionID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.GeoCoordDetail",
            "table": "geocoorddetail",
            "tableId": 123,
            "system": false,
            "idColumn": "GeoCoordDetailID",
            "idFieldName": "geoCoordDetailId",
            "fields": [
                {
                    "name": "errorPolygon",
                    "column": "ErrorPolygon",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text"
                },
                {
                    "name": "geoRefAccuracyUnits",
                    "column": "GeoRefAccuracyUnits",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 20
                },
                {
                    "name": "geoRefDetDate",
                    "column": "GeoRefDetDate",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Calendar"
                },
                {
                    "name": "geoRefDetRef",
                    "column": "GeoRefDetRef",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 100
                },
                {
                    "name": "geoRefRemarks",
                    "column": "GeoRefRemarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text"
                },
                {
                    "name": "geoRefVerificationStatus",
                    "column": "GeoRefVerificationStatus",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "maxUncertaintyEst",
                    "column": "MaxUncertaintyEst",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.math.BigDecimal"
                },
                {
                    "name": "maxUncertaintyEstUnit",
                    "column": "MaxUncertaintyEstUnit",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 8
                },
                {
                    "name": "namedPlaceExtent",
                    "column": "NamedPlaceExtent",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.math.BigDecimal"
                },
                {
                    "name": "noGeoRefBecause",
                    "column": "NoGeoRefBecause",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 100
                },
                {
                    "name": "originalCoordSystem",
                    "column": "OriginalCoordSystem",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "protocol",
                    "column": "Protocol",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "source",
                    "column": "Source",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "uncertaintyPolygon",
                    "column": "UncertaintyPolygon",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text"
                },
                {
                    "name": "validation",
                    "column": "Validation",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "geoRefDetBy",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "AgentID"
                },
                {
                    "name": "locality",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Locality",
                    "column": "LocalityID",
                    "otherSideName": "geoCoordDetails"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.Geography",
            "table": "geography",
            "tableId": 3,
            "view": "Geography",
            "searchDialog": "GeographySearch",
            "system": false,
            "idColumn": "GeographyID",
            "idFieldName": "geographyId",
            "fields": [
                {
                    "name": "abbrev",
                    "column": "Abbrev",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 16
                },
                {
                    "name": "centroidLat",
                    "column": "CentroidLat",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.math.BigDecimal"
                },
                {
                    "name": "centroidLon",
                    "column": "CentroidLon",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.math.BigDecimal"
                },
                {
                    "name": "commonName",
                    "column": "CommonName",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 128
                },
                {
                    "name": "fullName",
                    "column": "FullName",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "geographyCode",
                    "column": "GeographyCode",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 24
                },
                {
                    "name": "gml",
                    "column": "GML",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "guid",
                    "column": "GUID",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 128
                },
                {
                    "name": "highestChildNodeNumber",
                    "column": "HighestChildNodeNumber",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "isAccepted",
                    "column": "IsAccepted",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "isCurrent",
                    "column": "IsCurrent",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "name",
                    "column": "Name",
                    "indexed": true,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "nodeNumber",
                    "column": "NodeNumber",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "number1",
                    "column": "Number1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "number2",
                    "column": "Number2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "rankId",
                    "column": "RankID",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "text1",
                    "column": "Text1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "text2",
                    "column": "Text2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampVersion",
                    "column": "TimestampVersion",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Date"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "acceptedChildren",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Geography",
                    "otherSideName": "acceptedGeography"
                },
                {
                    "name": "acceptedGeography",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Geography",
                    "column": "AcceptedID",
                    "otherSideName": "acceptedChildren"
                },
                {
                    "name": "children",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Geography",
                    "otherSideName": "parent"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "definition",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "GeographyTreeDef",
                    "column": "GeographyTreeDefID",
                    "otherSideName": "treeEntries"
                },
                {
                    "name": "definitionItem",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "GeographyTreeDefItem",
                    "column": "GeographyTreeDefItemID",
                    "otherSideName": "treeEntries"
                },
                {
                    "name": "localities",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Locality",
                    "otherSideName": "geography"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "parent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Geography",
                    "column": "ParentID",
                    "otherSideName": "children"
                }
            ],
            "fieldAliases": [
                {
                    "aname": "acceptedGeography",
                    "vname": "acceptedParent"
                }
            ]
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.GeographyTreeDef",
            "table": "geographytreedef",
            "tableId": 44,
            "system": false,
            "idColumn": "GeographyTreeDefID",
            "idFieldName": "geographyTreeDefId",
            "fields": [
                {
                    "name": "fullNameDirection",
                    "column": "FullNameDirection",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "name",
                    "column": "Name",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "disciplines",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Discipline",
                    "otherSideName": "geographyTreeDef"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "treeDefItems",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "GeographyTreeDefItem",
                    "otherSideName": "treeDef"
                },
                {
                    "name": "treeEntries",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Geography",
                    "otherSideName": "definition"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.GeographyTreeDefItem",
            "table": "geographytreedefitem",
            "tableId": 45,
            "system": false,
            "idColumn": "GeographyTreeDefItemID",
            "idFieldName": "geographyTreeDefItemId",
            "fields": [
                {
                    "name": "fullNameSeparator",
                    "column": "FullNameSeparator",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "isEnforced",
                    "column": "IsEnforced",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "isInFullName",
                    "column": "IsInFullName",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "name",
                    "column": "Name",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "rankId",
                    "column": "RankID",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "textAfter",
                    "column": "TextAfter",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "textBefore",
                    "column": "TextBefore",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "title",
                    "column": "Title",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "children",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "GeographyTreeDefItem",
                    "otherSideName": "parent"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "parent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "GeographyTreeDefItem",
                    "column": "ParentItemID",
                    "otherSideName": "children"
                },
                {
                    "name": "treeDef",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "GeographyTreeDef",
                    "column": "GeographyTreeDefID",
                    "otherSideName": "treeDefItems"
                },
                {
                    "name": "treeEntries",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Geography",
                    "otherSideName": "definitionItem"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.GeologicTimePeriod",
            "table": "geologictimeperiod",
            "tableId": 46,
            "view": "GeologicTimePeriod",
            "searchDialog": "ChronosStratSearch",
            "system": false,
            "idColumn": "GeologicTimePeriodID",
            "idFieldName": "geologicTimePeriodId",
            "fields": [
                {
                    "name": "endPeriod",
                    "column": "EndPeriod",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "endUncertainty",
                    "column": "EndUncertainty",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "fullName",
                    "column": "FullName",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "guid",
                    "column": "GUID",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 128
                },
                {
                    "name": "highestChildNodeNumber",
                    "column": "HighestChildNodeNumber",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "isAccepted",
                    "column": "IsAccepted",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "isBioStrat",
                    "column": "IsBioStrat",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "name",
                    "column": "Name",
                    "indexed": true,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "nodeNumber",
                    "column": "NodeNumber",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "rankId",
                    "column": "RankID",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "standard",
                    "column": "Standard",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "startPeriod",
                    "column": "StartPeriod",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "startUncertainty",
                    "column": "StartUncertainty",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "text1",
                    "column": "Text1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 128
                },
                {
                    "name": "text2",
                    "column": "Text2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 128
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "acceptedChildren",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "GeologicTimePeriod",
                    "otherSideName": "acceptedGeologicTimePeriod"
                },
                {
                    "name": "acceptedGeologicTimePeriod",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "GeologicTimePeriod",
                    "column": "AcceptedID",
                    "otherSideName": "acceptedChildren"
                },
                {
                    "name": "bioStratsPaleoContext",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "PaleoContext",
                    "otherSideName": "bioStrat"
                },
                {
                    "name": "children",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "GeologicTimePeriod",
                    "otherSideName": "parent"
                },
                {
                    "name": "chronosStratsPaleoContext",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "PaleoContext",
                    "otherSideName": "chronosStrat"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "definition",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "GeologicTimePeriodTreeDef",
                    "column": "GeologicTimePeriodTreeDefID",
                    "otherSideName": "treeEntries"
                },
                {
                    "name": "definitionItem",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "GeologicTimePeriodTreeDefItem",
                    "column": "GeologicTimePeriodTreeDefItemID",
                    "otherSideName": "treeEntries"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "parent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "GeologicTimePeriod",
                    "column": "ParentID",
                    "otherSideName": "children"
                }
            ],
            "fieldAliases": [
                {
                    "aname": "acceptedGeologicTimePeriod",
                    "vname": "acceptedParent"
                }
            ]
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.GeologicTimePeriodTreeDef",
            "table": "geologictimeperiodtreedef",
            "tableId": 47,
            "system": false,
            "idColumn": "GeologicTimePeriodTreeDefID",
            "idFieldName": "geologicTimePeriodTreeDefId",
            "fields": [
                {
                    "name": "fullNameDirection",
                    "column": "FullNameDirection",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "name",
                    "column": "Name",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "disciplines",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Discipline",
                    "otherSideName": "geologicTimePeriodTreeDef"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "treeDefItems",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "GeologicTimePeriodTreeDefItem",
                    "otherSideName": "treeDef"
                },
                {
                    "name": "treeEntries",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "GeologicTimePeriod",
                    "otherSideName": "definition"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.GeologicTimePeriodTreeDefItem",
            "table": "geologictimeperiodtreedefitem",
            "tableId": 48,
            "system": false,
            "idColumn": "GeologicTimePeriodTreeDefItemID",
            "idFieldName": "geologicTimePeriodTreeDefItemId",
            "fields": [
                {
                    "name": "fullNameSeparator",
                    "column": "FullNameSeparator",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "isEnforced",
                    "column": "IsEnforced",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "isInFullName",
                    "column": "IsInFullName",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "name",
                    "column": "Name",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "rankId",
                    "column": "RankID",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "textAfter",
                    "column": "TextAfter",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "textBefore",
                    "column": "TextBefore",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "title",
                    "column": "Title",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "children",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "GeologicTimePeriodTreeDefItem",
                    "otherSideName": "parent"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "parent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "GeologicTimePeriodTreeDefItem",
                    "column": "ParentItemID",
                    "otherSideName": "children"
                },
                {
                    "name": "treeDef",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "GeologicTimePeriodTreeDef",
                    "column": "GeologicTimePeriodTreeDefID",
                    "otherSideName": "treeDefItems"
                },
                {
                    "name": "treeEntries",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "GeologicTimePeriod",
                    "otherSideName": "definitionItem"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.Gift",
            "table": "gift",
            "tableId": 131,
            "view": "Gift",
            "searchDialog": null,
            "system": false,
            "idColumn": "GiftID",
            "idFieldName": "giftId",
            "fields": [
                {
                    "name": "dateReceived",
                    "column": "DateReceived",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Calendar"
                },
                {
                    "name": "giftDate",
                    "column": "GiftDate",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Calendar"
                },
                {
                    "name": "giftNumber",
                    "column": "GiftNumber",
                    "indexed": true,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "isFinancialResponsibility",
                    "column": "IsFinancialResponsibility",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "number1",
                    "column": "Number1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float",
                    "length": 24
                },
                {
                    "name": "number2",
                    "column": "Number2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float",
                    "length": 24
                },
                {
                    "name": "purposeOfGift",
                    "column": "PurposeOfGift",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "receivedComments",
                    "column": "ReceivedComments",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "specialConditions",
                    "column": "SpecialConditions",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 2048
                },
                {
                    "name": "srcGeography",
                    "column": "SrcGeography",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "srcTaxonomy",
                    "column": "SrcTaxonomy",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "text1",
                    "column": "Text1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 300
                },
                {
                    "name": "text2",
                    "column": "Text2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 300
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "yesNo1",
                    "column": "YesNo1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "yesNo2",
                    "column": "YesNo2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                }
            ],
            "relationships": [
                {
                    "name": "addressOfRecord",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "AddressOfRecord",
                    "column": "AddressOfRecordID"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "discipline",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Discipline",
                    "column": "DisciplineID"
                },
                {
                    "name": "division",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Division",
                    "column": "DivisionID"
                },
                {
                    "name": "giftAgents",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "GiftAgent",
                    "otherSideName": "gift"
                },
                {
                    "name": "giftAttachments",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "GiftAttachment",
                    "otherSideName": "gift"
                },
                {
                    "name": "giftPreparations",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "GiftPreparation",
                    "otherSideName": "gift"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "shipments",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Shipment",
                    "otherSideName": "gift"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.GiftAgent",
            "table": "giftagent",
            "tableId": 133,
            "view": "GiftAgent",
            "searchDialog": null,
            "system": false,
            "idColumn": "GiftAgentID",
            "idFieldName": "giftAgentId",
            "fields": [
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "role",
                    "column": "Role",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "agent",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "AgentID"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "discipline",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Discipline",
                    "column": "DisciplineID"
                },
                {
                    "name": "gift",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Gift",
                    "column": "GiftID",
                    "otherSideName": "giftAgents"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.GiftAttachment",
            "table": "giftattachment",
            "tableId": 144,
            "view": "ObjectAttachment",
            "searchDialog": null,
            "system": false,
            "idColumn": "GiftAttachmentID",
            "idFieldName": "giftAttachmentId",
            "fields": [
                {
                    "name": "ordinal",
                    "column": "Ordinal",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "attachment",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Attachment",
                    "column": "AttachmentID",
                    "otherSideName": "giftAttachments"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "gift",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Gift",
                    "column": "GiftID",
                    "otherSideName": "giftAttachments"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.GiftPreparation",
            "table": "giftpreparation",
            "tableId": 132,
            "view": "GiftItems",
            "searchDialog": null,
            "system": false,
            "idColumn": "GiftPreparationID",
            "idFieldName": "giftPreparationId",
            "fields": [
                {
                    "name": "descriptionOfMaterial",
                    "column": "DescriptionOfMaterial",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "inComments",
                    "column": "InComments",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 1024
                },
                {
                    "name": "outComments",
                    "column": "OutComments",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 1024
                },
                {
                    "name": "quantity",
                    "column": "Quantity",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "receivedComments",
                    "column": "ReceivedComments",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 1024
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "discipline",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Discipline",
                    "column": "DisciplineID"
                },
                {
                    "name": "gift",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Gift",
                    "column": "GiftID",
                    "otherSideName": "giftPreparations"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "preparation",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Preparation",
                    "column": "PreparationID",
                    "otherSideName": "giftPreparations"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.GroupPerson",
            "table": "groupperson",
            "tableId": 49,
            "view": "GroupPerson",
            "searchDialog": null,
            "system": false,
            "idColumn": "GroupPersonID",
            "idFieldName": "groupPersonId",
            "fields": [
                {
                    "name": "orderNumber",
                    "column": "OrderNumber",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Short"
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "division",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Division",
                    "column": "DivisionID"
                },
                {
                    "name": "group",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "GroupID",
                    "otherSideName": "groups"
                },
                {
                    "name": "member",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "MemberID",
                    "otherSideName": "members"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.InfoRequest",
            "table": "inforequest",
            "tableId": 50,
            "view": "InfoRequest",
            "searchDialog": null,
            "system": false,
            "idColumn": "InfoRequestID",
            "idFieldName": "infoRequestID",
            "fields": [
                {
                    "name": "collectionMemberId",
                    "column": "CollectionMemberID",
                    "indexed": true,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "email",
                    "column": "Email",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "firstName",
                    "column": "Firstname",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "infoReqNumber",
                    "column": "InfoReqNumber",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "institution",
                    "column": "Institution",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 127
                },
                {
                    "name": "lastName",
                    "column": "Lastname",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "replyDate",
                    "column": "ReplyDate",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Calendar"
                },
                {
                    "name": "requestDate",
                    "column": "RequestDate",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Calendar"
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "agent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "AgentID"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "recordSets",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "RecordSet",
                    "otherSideName": "infoRequest"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.Institution",
            "table": "institution",
            "tableId": 94,
            "view": "Institution",
            "searchDialog": null,
            "system": false,
            "idColumn": "UserGroupScopeId",
            "idFieldName": "userGroupScopeId",
            "fields": [
                {
                    "name": "altName",
                    "column": "AltName",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 128
                },
                {
                    "name": "code",
                    "column": "Code",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "copyright",
                    "column": "Copyright",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 8192
                },
                {
                    "name": "currentManagedRelVersion",
                    "column": "CurrentManagedRelVersion",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 8
                },
                {
                    "name": "currentManagedSchemaVersion",
                    "column": "CurrentManagedSchemaVersion",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 8
                },
                {
                    "name": "description",
                    "column": "Description",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 8192
                },
                {
                    "name": "disclaimer",
                    "column": "Disclaimer",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 8192
                },
                {
                    "name": "guid",
                    "column": "GUID",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 128
                },
                {
                    "name": "hasBeenAsked",
                    "column": "HasBeenAsked",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "iconURI",
                    "column": "IconURI",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "ipr",
                    "column": "Ipr",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 8192
                },
                {
                    "name": "isAccessionsGlobal",
                    "column": "IsAccessionsGlobal",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "isAnonymous",
                    "column": "IsAnonymous",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "isReleaseManagedGlobally",
                    "column": "IsReleaseManagedGlobally",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "isSecurityOn",
                    "column": "IsSecurityOn",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "isServerBased",
                    "column": "IsServerBased",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "isSharingLocalities",
                    "column": "IsSharingLocalities",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "isSingleGeographyTree",
                    "column": "IsSingleGeographyTree",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "license",
                    "column": "License",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 2048
                },
                {
                    "name": "lsidAuthority",
                    "column": "LsidAuthority",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "minimumPwdLength",
                    "column": "MinimumPwdLength",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Byte"
                },
                {
                    "name": "name",
                    "column": "Name",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "regNumber",
                    "column": "RegNumber",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 24
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 8192
                },
                {
                    "name": "termsOfUse",
                    "column": "TermsOfUse",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 8192
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "uri",
                    "column": "Uri",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "address",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Address",
                    "column": "AddressID",
                    "otherSideName": "insitutions"
                },
                {
                    "name": "contentContacts",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "otherSideName": "instContentContact"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "divisions",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Division",
                    "otherSideName": "institution"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "storageTreeDef",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "StorageTreeDef",
                    "column": "StorageTreeDefID",
                    "otherSideName": "institutions"
                },
                {
                    "name": "technicalContacts",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "otherSideName": "instTechContact"
                },
                {
                    "name": "userGroups",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "SpPrincipal",
                    "otherSideName": "scope"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.InstitutionNetwork",
            "table": "institutionnetwork",
            "tableId": 142,
            "system": false,
            "idColumn": "InstitutionNetworkID",
            "idFieldName": "institutionNetworkId",
            "fields": [
                {
                    "name": "altName",
                    "column": "AltName",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 128
                },
                {
                    "name": "code",
                    "column": "Code",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "copyright",
                    "column": "Copyright",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 8192
                },
                {
                    "name": "description",
                    "column": "Description",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 8192
                },
                {
                    "name": "disclaimer",
                    "column": "Disclaimer",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 8192
                },
                {
                    "name": "iconURI",
                    "column": "IconURI",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "ipr",
                    "column": "Ipr",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 8192
                },
                {
                    "name": "license",
                    "column": "License",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 2048
                },
                {
                    "name": "name",
                    "column": "Name",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 8192
                },
                {
                    "name": "termsOfUse",
                    "column": "TermsOfUse",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 8192
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "uri",
                    "column": "Uri",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "address",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Address",
                    "column": "AddressID"
                },
                {
                    "name": "collections",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Collection",
                    "otherSideName": "institutionNetwork"
                },
                {
                    "name": "contacts",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "otherSideName": "instTechContact"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.Journal",
            "table": "journal",
            "tableId": 51,
            "view": "JournalForm",
            "searchDialog": "JournalSearch",
            "system": false,
            "idColumn": "JournalID",
            "idFieldName": "journalId",
            "fields": [
                {
                    "name": "guid",
                    "column": "GUID",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 128
                },
                {
                    "name": "issn",
                    "column": "ISSN",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 16
                },
                {
                    "name": "journalAbbreviation",
                    "column": "JournalAbbreviation",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "journalName",
                    "column": "JournalName",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "text1",
                    "column": "Text1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "institution",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Institution",
                    "column": "InstitutionID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "referenceWorks",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "ReferenceWork",
                    "otherSideName": "journal"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.LatLonPolygon",
            "table": "latlonpolygon",
            "tableId": 136,
            "system": false,
            "idColumn": "LatLonPolygonID",
            "idFieldName": "latLonPolygonId",
            "fields": [
                {
                    "name": "description",
                    "column": "Description",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "isPolyline",
                    "column": "IsPolyline",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "name",
                    "column": "Name",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "locality",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Locality",
                    "column": "LocalityID",
                    "otherSideName": "latLonpolygons"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "points",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "LatLonPolygonPnt",
                    "otherSideName": "latLonPolygon"
                },
                {
                    "name": "visualQuery",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "SpVisualQuery",
                    "column": "SpVisualQueryID",
                    "otherSideName": "polygons"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.LatLonPolygonPnt",
            "table": "latlonpolygonpnt",
            "tableId": 137,
            "system": false,
            "idColumn": "LatLonPolygonPntID",
            "idFieldName": "latLonPolygonPntId",
            "fields": [
                {
                    "name": "elevation",
                    "column": "Elevation",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "latitude",
                    "column": "Latitude",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.math.BigDecimal"
                },
                {
                    "name": "longitude",
                    "column": "Longitude",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.math.BigDecimal"
                },
                {
                    "name": "ordinal",
                    "column": "Ordinal",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "latLonPolygon",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "LatLonPolygon",
                    "column": "LatLonPolygonID",
                    "otherSideName": "points"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.LithoStrat",
            "table": "lithostrat",
            "tableId": 100,
            "view": "LithoStrat",
            "searchDialog": "LithoStratSearch",
            "system": false,
            "idColumn": "LithoStratID",
            "idFieldName": "lithoStratId",
            "fields": [
                {
                    "name": "fullName",
                    "column": "FullName",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "guid",
                    "column": "GUID",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 128
                },
                {
                    "name": "highestChildNodeNumber",
                    "column": "HighestChildNodeNumber",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "isAccepted",
                    "column": "IsAccepted",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "name",
                    "column": "Name",
                    "indexed": true,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "nodeNumber",
                    "column": "NodeNumber",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "number1",
                    "column": "Number1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Double"
                },
                {
                    "name": "number2",
                    "column": "Number2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Double"
                },
                {
                    "name": "rankId",
                    "column": "RankID",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "text1",
                    "column": "Text1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 300
                },
                {
                    "name": "text2",
                    "column": "Text2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 300
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "yesNo1",
                    "column": "YesNo1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "yesNo2",
                    "column": "YesNo2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                }
            ],
            "relationships": [
                {
                    "name": "acceptedChildren",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "LithoStrat",
                    "otherSideName": "acceptedLithoStrat"
                },
                {
                    "name": "acceptedLithoStrat",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "LithoStrat",
                    "column": "AcceptedID",
                    "otherSideName": "acceptedChildren"
                },
                {
                    "name": "children",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "LithoStrat",
                    "otherSideName": "parent"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "definition",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "LithoStratTreeDef",
                    "column": "LithoStratTreeDefID",
                    "otherSideName": "treeEntries"
                },
                {
                    "name": "definitionItem",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "LithoStratTreeDefItem",
                    "column": "LithoStratTreeDefItemID",
                    "otherSideName": "treeEntries"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "paleoContexts",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "PaleoContext",
                    "otherSideName": "lithoStrat"
                },
                {
                    "name": "parent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "LithoStrat",
                    "column": "ParentID",
                    "otherSideName": "children"
                }
            ],
            "fieldAliases": [
                {
                    "aname": "acceptedLithoStrat",
                    "vname": "acceptedParent"
                }
            ]
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.LithoStratTreeDef",
            "table": "lithostrattreedef",
            "tableId": 101,
            "system": false,
            "idColumn": "LithoStratTreeDefID",
            "idFieldName": "lithoStratTreeDefId",
            "fields": [
                {
                    "name": "fullNameDirection",
                    "column": "FullNameDirection",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "name",
                    "column": "Name",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "disciplines",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Discipline",
                    "otherSideName": "lithoStratTreeDef"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "treeDefItems",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "LithoStratTreeDefItem",
                    "otherSideName": "treeDef"
                },
                {
                    "name": "treeEntries",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "LithoStrat",
                    "otherSideName": "definition"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.LithoStratTreeDefItem",
            "table": "lithostrattreedefitem",
            "tableId": 102,
            "system": false,
            "idColumn": "LithoStratTreeDefItemID",
            "idFieldName": "lithoStratTreeDefItemId",
            "fields": [
                {
                    "name": "fullNameSeparator",
                    "column": "FullNameSeparator",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "isEnforced",
                    "column": "IsEnforced",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "isInFullName",
                    "column": "IsInFullName",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "name",
                    "column": "Name",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "rankId",
                    "column": "RankID",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "textAfter",
                    "column": "TextAfter",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "textBefore",
                    "column": "TextBefore",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "title",
                    "column": "Title",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "children",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "LithoStratTreeDefItem",
                    "otherSideName": "parent"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "parent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "LithoStratTreeDefItem",
                    "column": "ParentItemID",
                    "otherSideName": "children"
                },
                {
                    "name": "treeDef",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "LithoStratTreeDef",
                    "column": "LithoStratTreeDefID",
                    "otherSideName": "treeDefItems"
                },
                {
                    "name": "treeEntries",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "LithoStrat",
                    "otherSideName": "definitionItem"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.Loan",
            "table": "loan",
            "tableId": 52,
            "view": "Loan",
            "searchDialog": null,
            "system": false,
            "idColumn": "LoanID",
            "idFieldName": "loanId",
            "fields": [
                {
                    "name": "currentDueDate",
                    "column": "CurrentDueDate",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Calendar"
                },
                {
                    "name": "dateClosed",
                    "column": "DateClosed",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Calendar"
                },
                {
                    "name": "dateReceived",
                    "column": "DateReceived",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Calendar"
                },
                {
                    "name": "isClosed",
                    "column": "IsClosed",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "isFinancialResponsibility",
                    "column": "IsFinancialResponsibility",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "loanDate",
                    "column": "LoanDate",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Calendar"
                },
                {
                    "name": "loanNumber",
                    "column": "LoanNumber",
                    "indexed": true,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "number1",
                    "column": "Number1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float",
                    "length": 24
                },
                {
                    "name": "number2",
                    "column": "Number2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float",
                    "length": 24
                },
                {
                    "name": "originalDueDate",
                    "column": "OriginalDueDate",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Calendar"
                },
                {
                    "name": "overdueNotiSentDate",
                    "column": "OverdueNotiSetDate",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Calendar"
                },
                {
                    "name": "purposeOfLoan",
                    "column": "PurposeOfLoan",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "receivedComments",
                    "column": "ReceivedComments",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "specialConditions",
                    "column": "SpecialConditions",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 2048
                },
                {
                    "name": "srcGeography",
                    "column": "SrcGeography",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "srcTaxonomy",
                    "column": "SrcTaxonomy",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "text1",
                    "column": "Text1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 300
                },
                {
                    "name": "text2",
                    "column": "Text2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 300
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "yesNo1",
                    "column": "YesNo1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "yesNo2",
                    "column": "YesNo2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                }
            ],
            "relationships": [
                {
                    "name": "addressOfRecord",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "AddressOfRecord",
                    "column": "AddressOfRecordID",
                    "otherSideName": "loans"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "discipline",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Discipline",
                    "column": "DisciplineID"
                },
                {
                    "name": "division",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Division",
                    "column": "DivisionID"
                },
                {
                    "name": "loanAgents",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "LoanAgent",
                    "otherSideName": "loan"
                },
                {
                    "name": "loanAttachments",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "LoanAttachment",
                    "otherSideName": "loan"
                },
                {
                    "name": "loanPreparations",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "LoanPreparation",
                    "otherSideName": "loan"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "shipments",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Shipment",
                    "otherSideName": "loan"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.LoanAgent",
            "table": "loanagent",
            "tableId": 53,
            "view": "LoanAgent",
            "searchDialog": null,
            "system": false,
            "idColumn": "LoanAgentID",
            "idFieldName": "loanAgentId",
            "fields": [
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "role",
                    "column": "Role",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "agent",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "AgentID"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "discipline",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Discipline",
                    "column": "DisciplineID"
                },
                {
                    "name": "loan",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Loan",
                    "column": "LoanID",
                    "otherSideName": "loanAgents"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.LoanAttachment",
            "table": "loanattachment",
            "tableId": 114,
            "view": "ObjectAttachment",
            "searchDialog": null,
            "system": false,
            "idColumn": "LoanAttachmentID",
            "idFieldName": "loanAttachmentId",
            "fields": [
                {
                    "name": "ordinal",
                    "column": "Ordinal",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "attachment",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Attachment",
                    "column": "AttachmentID",
                    "otherSideName": "loanAttachments"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "loan",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Loan",
                    "column": "LoanID",
                    "otherSideName": "loanAttachments"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.LoanPreparation",
            "table": "loanpreparation",
            "tableId": 54,
            "view": "LoanItems",
            "searchDialog": null,
            "system": false,
            "idColumn": "LoanPreparationID",
            "idFieldName": "loanPreparationId",
            "fields": [
                {
                    "name": "descriptionOfMaterial",
                    "column": "DescriptionOfMaterial",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "inComments",
                    "column": "InComments",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 1024
                },
                {
                    "name": "isResolved",
                    "column": "IsResolved",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "outComments",
                    "column": "OutComments",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 1024
                },
                {
                    "name": "quantity",
                    "column": "Quantity",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "quantityResolved",
                    "column": "QuantityResolved",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "quantityReturned",
                    "column": "QuantityReturned",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "receivedComments",
                    "column": "ReceivedComments",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 1024
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "discipline",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Discipline",
                    "column": "DisciplineID"
                },
                {
                    "name": "loan",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Loan",
                    "column": "LoanID",
                    "otherSideName": "loanPreparations"
                },
                {
                    "name": "loanReturnPreparations",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "LoanReturnPreparation",
                    "otherSideName": "loanPreparation"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "preparation",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Preparation",
                    "column": "PreparationID",
                    "otherSideName": "loanPreparations"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.LoanReturnPreparation",
            "table": "loanreturnpreparation",
            "tableId": 55,
            "system": false,
            "idColumn": "LoanReturnPreparationID",
            "idFieldName": "loanReturnPreparationId",
            "fields": [
                {
                    "name": "quantityResolved",
                    "column": "QuantityResolved",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "quantityReturned",
                    "column": "QuantityReturned",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "returnedDate",
                    "column": "ReturnedDate",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Calendar"
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "deaccessionPreparation",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "DeaccessionPreparation",
                    "column": "DeaccessionPreparationID",
                    "otherSideName": "loanReturnPreparations"
                },
                {
                    "name": "discipline",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Discipline",
                    "column": "DisciplineID"
                },
                {
                    "name": "loanPreparation",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "LoanPreparation",
                    "column": "LoanPreparationID",
                    "otherSideName": "loanReturnPreparations"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "receivedBy",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ReceivedByID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.Locality",
            "table": "locality",
            "tableId": 2,
            "view": "Locality",
            "searchDialog": "LocalitySearch",
            "system": false,
            "idColumn": "LocalityID",
            "idFieldName": "localityId",
            "fields": [
                {
                    "name": "datum",
                    "column": "Datum",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "elevationAccuracy",
                    "column": "ElevationAccuracy",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Double"
                },
                {
                    "name": "elevationMethod",
                    "column": "ElevationMethod",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "gml",
                    "column": "GML",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text"
                },
                {
                    "name": "guid",
                    "column": "GUID",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 128
                },
                {
                    "name": "lat1text",
                    "column": "Lat1Text",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "lat2text",
                    "column": "Lat2Text",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "latLongAccuracy",
                    "column": "LatLongAccuracy",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Double"
                },
                {
                    "name": "latLongMethod",
                    "column": "LatLongMethod",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "latLongType",
                    "column": "LatLongType",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "latitude1",
                    "column": "Latitude1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.math.BigDecimal"
                },
                {
                    "name": "latitude2",
                    "column": "Latitude2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.math.BigDecimal"
                },
                {
                    "name": "localityName",
                    "column": "LocalityName",
                    "indexed": true,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "long1text",
                    "column": "Long1Text",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "long2text",
                    "column": "Long2Text",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "longitude1",
                    "column": "Longitude1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.math.BigDecimal"
                },
                {
                    "name": "longitude2",
                    "column": "Longitude2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.math.BigDecimal"
                },
                {
                    "name": "maxElevation",
                    "column": "MaxElevation",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Double"
                },
                {
                    "name": "minElevation",
                    "column": "MinElevation",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Double"
                },
                {
                    "name": "namedPlace",
                    "column": "NamedPlace",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "originalElevationUnit",
                    "column": "OriginalElevationUnit",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "originalLatLongUnit",
                    "column": "OriginalLatLongUnit",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "relationToNamedPlace",
                    "column": "RelationToNamedPlace",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 120
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "sgrStatus",
                    "column": "SGRStatus",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Byte"
                },
                {
                    "name": "shortName",
                    "column": "ShortName",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "srcLatLongUnit",
                    "column": "SrcLatLongUnit",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Byte"
                },
                {
                    "name": "text1",
                    "column": "Text1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 300
                },
                {
                    "name": "text2",
                    "column": "Text2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 300
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "verbatimElevation",
                    "column": "VerbatimElevation",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "visibility",
                    "column": "Visibility",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Byte"
                }
            ],
            "relationships": [
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "discipline",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Discipline",
                    "column": "DisciplineID"
                },
                {
                    "name": "geoCoordDetails",
                    "type": "zero-to-one",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "GeoCoordDetail",
                    "otherSideName": "locality"
                },
                {
                    "name": "geography",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Geography",
                    "column": "GeographyID",
                    "otherSideName": "localities"
                },
                {
                    "name": "latLonpolygons",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "LatLonPolygon",
                    "otherSideName": "locality"
                },
                {
                    "name": "localityAttachments",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "LocalityAttachment",
                    "otherSideName": "locality"
                },
                {
                    "name": "localityCitations",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "LocalityCitation",
                    "otherSideName": "locality"
                },
                {
                    "name": "localityDetails",
                    "type": "zero-to-one",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "LocalityDetail",
                    "otherSideName": "locality"
                },
                {
                    "name": "localityNameAliass",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "LocalityNameAlias",
                    "otherSideName": "locality"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "visibilitySetBy",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "SpecifyUser",
                    "column": "VisibilitySetByID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.LocalityAttachment",
            "table": "localityattachment",
            "tableId": 115,
            "view": "ObjectAttachment",
            "searchDialog": null,
            "system": false,
            "idColumn": "LocalityAttachmentID",
            "idFieldName": "localityAttachmentId",
            "fields": [
                {
                    "name": "ordinal",
                    "column": "Ordinal",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "attachment",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Attachment",
                    "column": "AttachmentID",
                    "otherSideName": "localityAttachments"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "locality",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Locality",
                    "column": "LocalityID",
                    "otherSideName": "localityAttachments"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.LocalityCitation",
            "table": "localitycitation",
            "tableId": 57,
            "system": false,
            "idColumn": "LocalityCitationID",
            "idFieldName": "localityCitationId",
            "fields": [
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "discipline",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Discipline",
                    "column": "DisciplineID"
                },
                {
                    "name": "locality",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Locality",
                    "column": "LocalityID",
                    "otherSideName": "localityCitations"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "referenceWork",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "ReferenceWork",
                    "column": "ReferenceWorkID",
                    "otherSideName": "localityCitations"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.LocalityDetail",
            "table": "localitydetail",
            "tableId": 124,
            "system": false,
            "idColumn": "LocalityDetailID",
            "idFieldName": "localityDetailId",
            "fields": [
                {
                    "name": "baseMeridian",
                    "column": "BaseMeridian",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "drainage",
                    "column": "Drainage",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "endDepth",
                    "column": "EndDepth",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Double"
                },
                {
                    "name": "endDepthUnit",
                    "column": "EndDepthUnit",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Byte"
                },
                {
                    "name": "endDepthVerbatim",
                    "column": "EndDepthVerbatim",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "gml",
                    "column": "GML",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text"
                },
                {
                    "name": "hucCode",
                    "column": "HucCode",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 16
                },
                {
                    "name": "island",
                    "column": "Island",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "islandGroup",
                    "column": "IslandGroup",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "mgrsZone",
                    "column": "MgrsZone",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 4
                },
                {
                    "name": "nationalParkName",
                    "column": "NationalParkName",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "number1",
                    "column": "Number1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Double"
                },
                {
                    "name": "number2",
                    "column": "Number2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Double"
                },
                {
                    "name": "rangeDesc",
                    "column": "RangeDesc",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "rangeDirection",
                    "column": "RangeDirection",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "section",
                    "column": "Section",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "sectionPart",
                    "column": "SectionPart",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "startDepth",
                    "column": "StartDepth",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Double"
                },
                {
                    "name": "startDepthUnit",
                    "column": "StartDepthUnit",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Byte"
                },
                {
                    "name": "startDepthVerbatim",
                    "column": "StartDepthVerbatim",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "text1",
                    "column": "Text1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 300
                },
                {
                    "name": "text2",
                    "column": "Text2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 300
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "township",
                    "column": "Township",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "townshipDirection",
                    "column": "TownshipDirection",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "utmDatum",
                    "column": "UtmDatum",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "utmEasting",
                    "column": "UtmEasting",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.math.BigDecimal"
                },
                {
                    "name": "utmFalseEasting",
                    "column": "UtmFalseEasting",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "utmFalseNorthing",
                    "column": "UtmFalseNorthing",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "utmNorthing",
                    "column": "UtmNorthing",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.math.BigDecimal"
                },
                {
                    "name": "utmOrigLatitude",
                    "column": "UtmOrigLatitude",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.math.BigDecimal"
                },
                {
                    "name": "utmOrigLongitude",
                    "column": "UtmOrigLongitude",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.math.BigDecimal"
                },
                {
                    "name": "utmScale",
                    "column": "UtmScale",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.math.BigDecimal"
                },
                {
                    "name": "utmZone",
                    "column": "UtmZone",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Short"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "waterBody",
                    "column": "WaterBody",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "yesNo1",
                    "column": "YesNo1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "yesNo2",
                    "column": "YesNo2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                }
            ],
            "relationships": [
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "locality",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Locality",
                    "column": "LocalityID",
                    "otherSideName": "localityDetails"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.LocalityNameAlias",
            "table": "localitynamealias",
            "tableId": 120,
            "system": false,
            "idColumn": "LocalityNameAliasID",
            "idFieldName": "localityNameAliasId",
            "fields": [
                {
                    "name": "name",
                    "column": "Name",
                    "indexed": true,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "source",
                    "column": "Source",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "discipline",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Discipline",
                    "column": "DisciplineID"
                },
                {
                    "name": "locality",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Locality",
                    "column": "LocalityID",
                    "otherSideName": "localityNameAliass"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.MorphBankView",
            "table": "morphbankview",
            "tableId": 138,
            "view": "MorphBankView",
            "searchDialog": "MorphBankViewSearch",
            "system": true,
            "idColumn": "MorphBankViewID",
            "idFieldName": "morphBankViewId",
            "fields": [
                {
                    "name": "developmentState",
                    "column": "DevelopmentState",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 128
                },
                {
                    "name": "form",
                    "column": "Form",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 128
                },
                {
                    "name": "imagingPreparationTechnique",
                    "column": "ImagingPreparationTechnique",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 128
                },
                {
                    "name": "imagingTechnique",
                    "column": "ImagingTechnique",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 128
                },
                {
                    "name": "morphBankExternalViewId",
                    "column": "MorphBankExternalViewID",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "sex",
                    "column": "Sex",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "specimenPart",
                    "column": "SpecimenPart",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 128
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "viewAngle",
                    "column": "ViewAngle",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 128
                },
                {
                    "name": "viewName",
                    "column": "ViewName",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 128
                }
            ],
            "relationships": [
                {
                    "name": "attachmentImageAttributes",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "AttachmentImageAttribute",
                    "otherSideName": "morphBankView"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.OtherIdentifier",
            "table": "otheridentifier",
            "tableId": 61,
            "system": true,
            "idColumn": "OtherIdentifierID",
            "idFieldName": "otherIdentifierId",
            "fields": [
                {
                    "name": "collectionMemberId",
                    "column": "CollectionMemberID",
                    "indexed": true,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "identifier",
                    "column": "Identifier",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "institution",
                    "column": "Institution",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "collectionObject",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "CollectionObject",
                    "column": "CollectionObjectID",
                    "otherSideName": "otherIdentifiers"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.PaleoContext",
            "table": "paleocontext",
            "tableId": 32,
            "view": "PaleoContext",
            "searchDialog": "PaleoContextSearch",
            "system": false,
            "idColumn": "PaleoContextID",
            "idFieldName": "paleoContextId",
            "fields": [
                {
                    "name": "bottomDistance",
                    "column": "BottomDistance",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "collectionMemberId",
                    "column": "CollectionMemberID",
                    "indexed": true,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "direction",
                    "column": "Direction",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "distanceUnits",
                    "column": "DistanceUnits",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 16
                },
                {
                    "name": "positionState",
                    "column": "PositionState",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "text1",
                    "column": "Text1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "text2",
                    "column": "Text2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "topDistance",
                    "column": "TopDistance",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "yesNo1",
                    "column": "YesNo1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "yesNo2",
                    "column": "YesNo2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                }
            ],
            "relationships": [
                {
                    "name": "bioStrat",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "GeologicTimePeriod",
                    "column": "BioStratID",
                    "otherSideName": "bioStratsPaleoContext"
                },
                {
                    "name": "chronosStrat",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "GeologicTimePeriod",
                    "column": "ChronosStratID",
                    "otherSideName": "chronosStratsPaleoContext"
                },
                {
                    "name": "chronosStratEnd",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "GeologicTimePeriod",
                    "column": "ChronosStratEndID"
                },
                {
                    "name": "collectionObjects",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "CollectionObject",
                    "otherSideName": "paleoContext"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "lithoStrat",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "LithoStrat",
                    "column": "LithoStratID",
                    "otherSideName": "paleoContexts"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.Permit",
            "table": "permit",
            "tableId": 6,
            "view": "Permit",
            "searchDialog": "PermitSearch",
            "system": false,
            "idColumn": "PermitID",
            "idFieldName": "permitId",
            "fields": [
                {
                    "name": "endDate",
                    "column": "EndDate",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Calendar"
                },
                {
                    "name": "issuedDate",
                    "column": "IssuedDate",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Calendar"
                },
                {
                    "name": "number1",
                    "column": "Number1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float",
                    "length": 24
                },
                {
                    "name": "number2",
                    "column": "Number2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float",
                    "length": 24
                },
                {
                    "name": "permitNumber",
                    "column": "PermitNumber",
                    "indexed": true,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "renewalDate",
                    "column": "RenewalDate",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Calendar"
                },
                {
                    "name": "startDate",
                    "column": "StartDate",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Calendar"
                },
                {
                    "name": "text1",
                    "column": "Text1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 300
                },
                {
                    "name": "text2",
                    "column": "Text2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 300
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "type",
                    "column": "Type",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "yesNo1",
                    "column": "YesNo1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "yesNo2",
                    "column": "YesNo2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                }
            ],
            "relationships": [
                {
                    "name": "accessionAuthorizations",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "AccessionAuthorization",
                    "otherSideName": "permit"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "institution",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Institution",
                    "column": "InstitutionID"
                },
                {
                    "name": "issuedBy",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "IssuedByID"
                },
                {
                    "name": "issuedTo",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "IssuedToID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "permitAttachments",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "PermitAttachment",
                    "otherSideName": "permit"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.PermitAttachment",
            "table": "permitattachment",
            "tableId": 116,
            "view": "ObjectAttachment",
            "searchDialog": null,
            "system": false,
            "idColumn": "PermitAttachmentID",
            "idFieldName": "permitAttachmentId",
            "fields": [
                {
                    "name": "ordinal",
                    "column": "Ordinal",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "attachment",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Attachment",
                    "column": "AttachmentID",
                    "otherSideName": "permitAttachments"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "permit",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Permit",
                    "column": "PermitID",
                    "otherSideName": "permitAttachments"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.PickList",
            "table": "picklist",
            "tableId": 500,
            "view": "PickList",
            "searchDialog": null,
            "system": true,
            "idColumn": "PickListID",
            "idFieldName": "pickListId",
            "fields": [
                {
                    "name": "fieldName",
                    "column": "FieldName",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "filterFieldName",
                    "column": "FilterFieldName",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "filterValue",
                    "column": "FilterValue",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "formatter",
                    "column": "Formatter",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "isSystem",
                    "column": "IsSystem",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "name",
                    "column": "Name",
                    "indexed": true,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "readOnly",
                    "column": "ReadOnly",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "sizeLimit",
                    "column": "SizeLimit",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer",
                    "length": 10
                },
                {
                    "name": "sortType",
                    "column": "SortType",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Byte"
                },
                {
                    "name": "tableName",
                    "column": "TableName",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "type",
                    "column": "Type",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Byte"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "collection",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Collection",
                    "column": "CollectionID",
                    "otherSideName": "pickLists"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "pickListItems",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "PickListItem",
                    "otherSideName": "pickList"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.PickListItem",
            "table": "picklistitem",
            "tableId": 501,
            "view": "PickListItem",
            "searchDialog": null,
            "system": true,
            "idColumn": "PickListItemID",
            "idFieldName": "pickListItemId",
            "fields": [
                {
                    "name": "ordinal",
                    "column": "Ordinal",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "title",
                    "column": "Title",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "value",
                    "column": "Value",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "pickList",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "PickList",
                    "column": "PickListID",
                    "otherSideName": "pickListItems"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.PrepType",
            "table": "preptype",
            "tableId": 65,
            "view": "PrepType",
            "searchDialog": "PrepTypeSearch",
            "system": false,
            "idColumn": "PrepTypeID",
            "idFieldName": "prepTypeId",
            "fields": [
                {
                    "name": "isLoanable",
                    "column": "IsLoanable",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "name",
                    "column": "Name",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "attributeDefs",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "AttributeDef",
                    "otherSideName": "prepType"
                },
                {
                    "name": "collection",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Collection",
                    "column": "CollectionID",
                    "otherSideName": "prepTypes"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.Preparation",
            "table": "preparation",
            "tableId": 63,
            "view": "Preparation",
            "searchDialog": null,
            "system": false,
            "idColumn": "PreparationID",
            "idFieldName": "preparationId",
            "fields": [
                {
                    "name": "collectionMemberId",
                    "column": "CollectionMemberID",
                    "indexed": true,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "countAmt",
                    "column": "CountAmt",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "description",
                    "column": "Description",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "number1",
                    "column": "Number1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "number2",
                    "column": "Number2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "preparedDate",
                    "column": "PreparedDate",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Calendar"
                },
                {
                    "name": "preparedDatePrecision",
                    "column": "PreparedDatePrecision",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Byte"
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "sampleNumber",
                    "column": "SampleNumber",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "status",
                    "column": "Status",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "storageLocation",
                    "column": "StorageLocation",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "text1",
                    "column": "Text1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 300
                },
                {
                    "name": "text2",
                    "column": "Text2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 300
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "yesNo1",
                    "column": "YesNo1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "yesNo2",
                    "column": "YesNo2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "yesNo3",
                    "column": "YesNo3",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                }
            ],
            "relationships": [
                {
                    "name": "collectionObject",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "CollectionObject",
                    "column": "CollectionObjectID",
                    "otherSideName": "preparations"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "deaccessionPreparations",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "DeaccessionPreparation",
                    "otherSideName": "preparation"
                },
                {
                    "name": "exchangeInPreps",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "ExchangeInPrep",
                    "otherSideName": "preparation"
                },
                {
                    "name": "exchangeOutPreps",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "ExchangeOutPrep",
                    "otherSideName": "preparation"
                },
                {
                    "name": "giftPreparations",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "GiftPreparation",
                    "otherSideName": "preparation"
                },
                {
                    "name": "loanPreparations",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "LoanPreparation",
                    "otherSideName": "preparation"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "prepType",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "PrepType",
                    "column": "PrepTypeID"
                },
                {
                    "name": "preparationAttachments",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "PreparationAttachment",
                    "otherSideName": "preparation"
                },
                {
                    "name": "preparationAttribute",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "PreparationAttribute",
                    "column": "PreparationAttributeID",
                    "otherSideName": "preparations"
                },
                {
                    "name": "preparationAttrs",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "PreparationAttr",
                    "otherSideName": "preparation"
                },
                {
                    "name": "preparedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "PreparedByID"
                },
                {
                    "name": "storage",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Storage",
                    "column": "StorageID",
                    "otherSideName": "preparations"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.PreparationAttachment",
            "table": "preparationattachment",
            "tableId": 117,
            "view": "ObjectAttachment",
            "searchDialog": null,
            "system": false,
            "idColumn": "PreparationAttachmentID",
            "idFieldName": "preparationAttachmentId",
            "fields": [
                {
                    "name": "collectionMemberId",
                    "column": "CollectionMemberID",
                    "indexed": true,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "ordinal",
                    "column": "Ordinal",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "attachment",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Attachment",
                    "column": "AttachmentID",
                    "otherSideName": "preparationAttachments"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "preparation",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Preparation",
                    "column": "PreparationID",
                    "otherSideName": "preparationAttachments"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.PreparationAttr",
            "table": "preparationattr",
            "tableId": 64,
            "system": false,
            "idColumn": "AttrID",
            "idFieldName": "attrId",
            "fields": [
                {
                    "name": "collectionMemberId",
                    "column": "CollectionMemberID",
                    "indexed": true,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "dblValue",
                    "column": "DoubleValue",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Double"
                },
                {
                    "name": "strValue",
                    "column": "StrValue",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "definition",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "AttributeDef",
                    "column": "AttributeDefID",
                    "otherSideName": "preparationAttrs"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "preparation",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Preparation",
                    "column": "PreparationId",
                    "otherSideName": "preparationAttrs"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.PreparationAttribute",
            "table": "preparationattribute",
            "tableId": 91,
            "system": false,
            "idColumn": "PreparationAttributeID",
            "idFieldName": "preparationAttributeId",
            "fields": [
                {
                    "name": "attrDate",
                    "column": "AttrDate",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Date",
                    "length": 10
                },
                {
                    "name": "collectionMemberId",
                    "column": "CollectionMemberID",
                    "indexed": true,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "number1",
                    "column": "Number1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "number2",
                    "column": "Number2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "number3",
                    "column": "Number3",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "number4",
                    "column": "Number4",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "number5",
                    "column": "Number5",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "number6",
                    "column": "Number6",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "number7",
                    "column": "Number7",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "number8",
                    "column": "Number8",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "number9",
                    "column": "Number9",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Short"
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "text1",
                    "column": "Text1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 300
                },
                {
                    "name": "text10",
                    "column": "Text10",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 300
                },
                {
                    "name": "text11",
                    "column": "Text11",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "text12",
                    "column": "Text12",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "text13",
                    "column": "Text13",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "text14",
                    "column": "Text14",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "text15",
                    "column": "Text15",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "text16",
                    "column": "Text16",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "text17",
                    "column": "Text17",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "text18",
                    "column": "Text18",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "text19",
                    "column": "Text19",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "text2",
                    "column": "Text2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 300
                },
                {
                    "name": "text20",
                    "column": "Text20",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "text21",
                    "column": "Text21",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "text22",
                    "column": "Text22",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "text23",
                    "column": "Text23",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "text24",
                    "column": "Text24",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "text25",
                    "column": "Text25",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "text26",
                    "column": "Text26",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "text3",
                    "column": "Text3",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "text4",
                    "column": "Text4",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "text5",
                    "column": "Text5",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "text6",
                    "column": "Text6",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "text7",
                    "column": "Text7",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "text8",
                    "column": "Text8",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "text9",
                    "column": "Text9",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "yesNo1",
                    "column": "YesNo1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "yesNo2",
                    "column": "YesNo2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "yesNo3",
                    "column": "YesNo3",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "yesNo4",
                    "column": "YesNo4",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                }
            ],
            "relationships": [
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "preparations",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Preparation",
                    "otherSideName": "preparationAttribute"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.Project",
            "table": "project",
            "tableId": 66,
            "view": "Project",
            "searchDialog": "ProjectSearch",
            "system": false,
            "idColumn": "ProjectID",
            "idFieldName": "projectId",
            "fields": [
                {
                    "name": "collectionMemberId",
                    "column": "CollectionMemberID",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "endDate",
                    "column": "EndDate",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Calendar"
                },
                {
                    "name": "grantAgency",
                    "column": "GrantAgency",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "grantNumber",
                    "column": "GrantNumber",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "number1",
                    "column": "Number1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float",
                    "length": 24
                },
                {
                    "name": "number2",
                    "column": "Number2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float",
                    "length": 24
                },
                {
                    "name": "projectDescription",
                    "column": "ProjectDescription",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "projectName",
                    "column": "ProjectName",
                    "indexed": true,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 128
                },
                {
                    "name": "projectNumber",
                    "column": "ProjectNumber",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "startDate",
                    "column": "StartDate",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Calendar"
                },
                {
                    "name": "text1",
                    "column": "Text1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 300
                },
                {
                    "name": "text2",
                    "column": "Text2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 300
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "url",
                    "column": "URL",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 1024
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "yesNo1",
                    "column": "YesNo1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "yesNo2",
                    "column": "YesNo2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                }
            ],
            "relationships": [
                {
                    "name": "agent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ProjectAgentID"
                },
                {
                    "name": "collectionObjects",
                    "type": "many-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "CollectionObject",
                    "otherSideName": "projects"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.RecordSet",
            "table": "recordset",
            "tableId": 68,
            "system": true,
            "idColumn": "RecordSetID",
            "idFieldName": "recordSetId",
            "fields": [
                {
                    "name": "allPermissionLevel",
                    "column": "AllPermissionLevel",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "collectionMemberId",
                    "column": "CollectionMemberID",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "dbTableId",
                    "column": "TableID",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "groupPermissionLevel",
                    "column": "GroupPermissionLevel",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "name",
                    "column": "Name",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "ownerPermissionLevel",
                    "column": "OwnerPermissionLevel",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "type",
                    "column": "Type",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Byte"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "group",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "SpPrincipal",
                    "column": "SpPrincipalID"
                },
                {
                    "name": "infoRequest",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "InfoRequest",
                    "column": "InfoRequestID",
                    "otherSideName": "recordSets"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "recordSetItems",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "RecordSetItem",
                    "otherSideName": "recordSet"
                },
                {
                    "name": "specifyUser",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "SpecifyUser",
                    "column": "SpecifyUserID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.RecordSetItem",
            "table": "recordsetitem",
            "tableId": 502,
            "system": true,
            "idColumn": "RecordSetItemID",
            "idFieldName": "recordSetItemId",
            "fields": [
                {
                    "name": "recordId",
                    "column": "RecordId",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "recordSet",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "RecordSet",
                    "column": "RecordSetID",
                    "otherSideName": "recordSetItems"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.ReferenceWork",
            "table": "referencework",
            "tableId": 69,
            "view": "ReferenceWork",
            "searchDialog": "ReferenceWorkSearch",
            "system": false,
            "idColumn": "ReferenceWorkID",
            "idFieldName": "referenceWorkId",
            "fields": [
                {
                    "name": "guid",
                    "column": "GUID",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 128
                },
                {
                    "name": "isPublished",
                    "column": "IsPublished",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "isbn",
                    "column": "ISBN",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 16
                },
                {
                    "name": "libraryNumber",
                    "column": "LibraryNumber",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "number1",
                    "column": "Number1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "number2",
                    "column": "Number2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "pages",
                    "column": "Pages",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "placeOfPublication",
                    "column": "PlaceOfPublication",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "publisher",
                    "column": "Publisher",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "referenceWorkType",
                    "column": "ReferenceWorkType",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Byte"
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "text1",
                    "column": "Text1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 300
                },
                {
                    "name": "text2",
                    "column": "Text2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 300
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "title",
                    "column": "Title",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "url",
                    "column": "URL",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 1024
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "volume",
                    "column": "Volume",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 25
                },
                {
                    "name": "workDate",
                    "column": "WorkDate",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 25
                },
                {
                    "name": "yesNo1",
                    "column": "YesNo1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "yesNo2",
                    "column": "YesNo2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                }
            ],
            "relationships": [
                {
                    "name": "authors",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "Author",
                    "otherSideName": "referenceWork"
                },
                {
                    "name": "collectionObjectCitations",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "CollectionObjectCitation",
                    "otherSideName": "referenceWork"
                },
                {
                    "name": "containedRFParent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "ReferenceWork",
                    "column": "ContainedRFParentID",
                    "otherSideName": "containedReferenceWorks"
                },
                {
                    "name": "containedReferenceWorks",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "ReferenceWork",
                    "otherSideName": "containedRFParent"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "determinationCitations",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "DeterminationCitation",
                    "otherSideName": "referenceWork"
                },
                {
                    "name": "exsiccatae",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Exsiccata",
                    "otherSideName": "referenceWork"
                },
                {
                    "name": "institution",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Institution",
                    "column": "InstitutionID"
                },
                {
                    "name": "journal",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Journal",
                    "column": "JournalID",
                    "otherSideName": "referenceWorks"
                },
                {
                    "name": "localityCitations",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "LocalityCitation",
                    "otherSideName": "referenceWork"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "referenceWorkAttachments",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "ReferenceWorkAttachment",
                    "otherSideName": "referenceWork"
                },
                {
                    "name": "taxonCitations",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "TaxonCitation",
                    "otherSideName": "referenceWork"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.ReferenceWorkAttachment",
            "table": "referenceworkattachment",
            "tableId": 143,
            "view": "ObjectAttachment",
            "searchDialog": null,
            "system": false,
            "idColumn": "ReferenceWorkAttachmentID",
            "idFieldName": "referenceWorkAttachmentId",
            "fields": [
                {
                    "name": "ordinal",
                    "column": "Ordinal",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "attachment",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Attachment",
                    "column": "AttachmentID",
                    "otherSideName": "referenceWorkAttachments"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "referenceWork",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "ReferenceWork",
                    "column": "ReferenceWorkID",
                    "otherSideName": "referenceWorkAttachments"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.RepositoryAgreement",
            "table": "repositoryagreement",
            "tableId": 70,
            "view": "RepositoryAgreement",
            "searchDialog": "RepositoryAgreementSearch",
            "system": false,
            "idColumn": "RepositoryAgreementID",
            "idFieldName": "repositoryAgreementId",
            "fields": [
                {
                    "name": "dateReceived",
                    "column": "DateReceived",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Calendar"
                },
                {
                    "name": "endDate",
                    "column": "EndDate",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Calendar"
                },
                {
                    "name": "number1",
                    "column": "Number1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "number2",
                    "column": "Number2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float"
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "repositoryAgreementNumber",
                    "column": "RepositoryAgreementNumber",
                    "indexed": true,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 60
                },
                {
                    "name": "startDate",
                    "column": "StartDate",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Calendar"
                },
                {
                    "name": "status",
                    "column": "Status",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "text1",
                    "column": "Text1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "text2",
                    "column": "Text2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "text3",
                    "column": "Text3",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "yesNo1",
                    "column": "YesNo1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "yesNo2",
                    "column": "YesNo2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                }
            ],
            "relationships": [
                {
                    "name": "accessions",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Accession",
                    "otherSideName": "repositoryAgreement"
                },
                {
                    "name": "addressOfRecord",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "AddressOfRecord",
                    "column": "AddressOfRecordID",
                    "otherSideName": "repositoryAgreements"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "division",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Division",
                    "column": "DivisionID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "originator",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "AgentID"
                },
                {
                    "name": "repositoryAgreementAgents",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "AccessionAgent",
                    "otherSideName": "repositoryAgreement"
                },
                {
                    "name": "repositoryAgreementAttachments",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "RepositoryAgreementAttachment",
                    "otherSideName": "repositoryAgreement"
                },
                {
                    "name": "repositoryAgreementAuthorizations",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "AccessionAuthorization",
                    "otherSideName": "repositoryAgreement"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.RepositoryAgreementAttachment",
            "table": "repositoryagreementattachment",
            "tableId": 118,
            "view": "ObjectAttachment",
            "searchDialog": null,
            "system": false,
            "idColumn": "RepositoryAgreementAttachmentID",
            "idFieldName": "repositoryAgreementAttachmentId",
            "fields": [
                {
                    "name": "ordinal",
                    "column": "Ordinal",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "attachment",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Attachment",
                    "column": "AttachmentID",
                    "otherSideName": "repositoryAgreementAttachments"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "repositoryAgreement",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "RepositoryAgreement",
                    "column": "RepositoryAgreementID",
                    "otherSideName": "repositoryAgreementAttachments"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.Shipment",
            "table": "shipment",
            "tableId": 71,
            "system": false,
            "idColumn": "ShipmentID",
            "idFieldName": "shipmentId",
            "fields": [
                {
                    "name": "insuredForAmount",
                    "column": "InsuredForAmount",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "number1",
                    "column": "Number1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float",
                    "length": 24
                },
                {
                    "name": "number2",
                    "column": "Number2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float",
                    "length": 24
                },
                {
                    "name": "numberOfPackages",
                    "column": "NumberOfPackages",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Short"
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "shipmentDate",
                    "column": "ShipmentDate",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Calendar"
                },
                {
                    "name": "shipmentMethod",
                    "column": "ShipmentMethod",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "shipmentNumber",
                    "column": "ShipmentNumber",
                    "indexed": true,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "text1",
                    "column": "Text1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 300
                },
                {
                    "name": "text2",
                    "column": "Text2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 300
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "weight",
                    "column": "Weight",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "yesNo1",
                    "column": "YesNo1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "yesNo2",
                    "column": "YesNo2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                }
            ],
            "relationships": [
                {
                    "name": "borrow",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Borrow",
                    "column": "BorrowID",
                    "otherSideName": "shipments"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "discipline",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Discipline",
                    "column": "DisciplineID"
                },
                {
                    "name": "exchangeOut",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "ExchangeOut",
                    "column": "ExchangeOutID",
                    "otherSideName": "shipments"
                },
                {
                    "name": "gift",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Gift",
                    "column": "GiftID",
                    "otherSideName": "shipments"
                },
                {
                    "name": "loan",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Loan",
                    "column": "LoanID",
                    "otherSideName": "shipments"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "shippedBy",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ShippedByID"
                },
                {
                    "name": "shippedTo",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ShippedToID"
                },
                {
                    "name": "shipper",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ShipperID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.SpAppResource",
            "table": "spappresource",
            "tableId": 514,
            "system": true,
            "idColumn": "SpAppResourceID",
            "idFieldName": "spAppResourceId",
            "fields": [
                {
                    "name": "allPermissionLevel",
                    "column": "AllPermissionLevel",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "description",
                    "column": "Description",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "groupPermissionLevel",
                    "column": "GroupPermissionLevel",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "level",
                    "column": "Level",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Short"
                },
                {
                    "name": "metaData",
                    "column": "MetaData",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "mimeType",
                    "column": "MimeType",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "name",
                    "column": "Name",
                    "indexed": true,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "ownerPermissionLevel",
                    "column": "OwnerPermissionLevel",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "group",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "SpPrincipal",
                    "column": "SpPrincipalID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "spAppResourceDatas",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "SpAppResourceData",
                    "otherSideName": "spAppResource"
                },
                {
                    "name": "spAppResourceDir",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "SpAppResourceDir",
                    "column": "SpAppResourceDirID",
                    "otherSideName": "spPersistedAppResources"
                },
                {
                    "name": "spReports",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "SpReport",
                    "otherSideName": "appResource"
                },
                {
                    "name": "specifyUser",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "SpecifyUser",
                    "column": "SpecifyUserID",
                    "otherSideName": "spAppResources"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.SpAppResourceData",
            "table": "spappresourcedata",
            "tableId": 515,
            "system": true,
            "idColumn": "SpAppResourceDataID",
            "idFieldName": "spAppResourceDataId",
            "fields": [
                {
                    "name": "data",
                    "column": "data",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 16000000
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "spAppResource",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "SpAppResource",
                    "column": "SpAppResourceID",
                    "otherSideName": "spAppResourceDatas"
                },
                {
                    "name": "spViewSetObj",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "SpViewSetObj",
                    "column": "SpViewSetObjID",
                    "otherSideName": "spAppResourceDatas"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.SpAppResourceDir",
            "table": "spappresourcedir",
            "tableId": 516,
            "system": true,
            "idColumn": "SpAppResourceDirID",
            "idFieldName": "spAppResourceDirId",
            "fields": [
                {
                    "name": "disciplineType",
                    "column": "DisciplineType",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "isPersonal",
                    "column": "IsPersonal",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "userType",
                    "column": "UserType",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "collection",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Collection",
                    "column": "CollectionID"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "discipline",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Discipline",
                    "column": "DisciplineID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "spPersistedAppResources",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "SpAppResource",
                    "otherSideName": "spAppResourceDir"
                },
                {
                    "name": "spPersistedViewSets",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "SpViewSetObj",
                    "otherSideName": "spAppResourceDir"
                },
                {
                    "name": "specifyUser",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "SpecifyUser",
                    "column": "SpecifyUserID",
                    "otherSideName": "spAppResourceDirs"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.SpAuditLog",
            "table": "spauditlog",
            "tableId": 530,
            "system": true,
            "idColumn": "SpAuditLogID",
            "idFieldName": "spAuditLogId",
            "fields": [
                {
                    "name": "action",
                    "column": "Action",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Byte"
                },
                {
                    "name": "parentRecordId",
                    "column": "ParentRecordId",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "parentTableNum",
                    "column": "ParentTableNum",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Short"
                },
                {
                    "name": "recordId",
                    "column": "RecordId",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "recordVersion",
                    "column": "RecordVersion",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "tableNum",
                    "column": "TableNum",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Short"
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "fields",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "SpAuditLogField",
                    "otherSideName": "spAuditLog"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.SpAuditLogField",
            "table": "spauditlogfield",
            "tableId": 531,
            "system": true,
            "idColumn": "SpAuditLogFieldID",
            "idFieldName": "spAuditLogFieldId",
            "fields": [
                {
                    "name": "fieldName",
                    "column": "FieldName",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "newValue",
                    "column": "NewValue",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "oldValue",
                    "column": "OldValue",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "spAuditLog",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "SpAuditLog",
                    "column": "SpAuditLogID",
                    "otherSideName": "fields"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.SpExportSchema",
            "table": "spexportschema",
            "tableId": 524,
            "system": true,
            "idColumn": "SpExportSchemaID",
            "idFieldName": "spExportSchemaId",
            "fields": [
                {
                    "name": "description",
                    "column": "Description",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "schemaName",
                    "column": "SchemaName",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 80
                },
                {
                    "name": "schemaVersion",
                    "column": "SchemaVersion",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 80
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "discipline",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Discipline",
                    "column": "DisciplineID",
                    "otherSideName": "spExportSchemas"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "spExportSchemaItems",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "SpExportSchemaItem",
                    "otherSideName": "spExportSchema"
                },
                {
                    "name": "spExportSchemaMappings",
                    "type": "many-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "SpExportSchemaMapping",
                    "otherSideName": "spExportSchemas"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.SpExportSchemaItem",
            "table": "spexportschemaitem",
            "tableId": 525,
            "system": true,
            "idColumn": "SpExportSchemaItemID",
            "idFieldName": "spExportSchemaItemId",
            "fields": [
                {
                    "name": "dataType",
                    "column": "DataType",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "description",
                    "column": "Description",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "fieldName",
                    "column": "FieldName",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "formatter",
                    "column": "Formatter",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "spExportSchema",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "SpExportSchema",
                    "column": "SpExportSchemaID",
                    "otherSideName": "spExportSchemaItems"
                },
                {
                    "name": "spLocaleContainerItem",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "SpLocaleContainerItem",
                    "column": "SpLocaleContainerItemID",
                    "otherSideName": "spExportSchemaItems"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.SpExportSchemaItemMapping",
            "table": "spexportschemaitemmapping",
            "tableId": 527,
            "system": true,
            "idColumn": "SpExportSchemaItemMappingID",
            "idFieldName": "spExportSchemaItemMappingId",
            "fields": [
                {
                    "name": "exportedFieldName",
                    "column": "ExportedFieldName",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "exportSchemaItem",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "SpExportSchemaItem",
                    "column": "ExportSchemaItemID"
                },
                {
                    "name": "exportSchemaMapping",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "SpExportSchemaMapping",
                    "column": "SpExportSchemaMappingID",
                    "otherSideName": "mappings"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "queryField",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "SpQueryField",
                    "column": "SpQueryFieldID",
                    "otherSideName": "mappings"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.SpExportSchemaMapping",
            "table": "spexportschemamapping",
            "tableId": 528,
            "system": true,
            "idColumn": "SpExportSchemaMappingID",
            "idFieldName": "spExportSchemaMappingId",
            "fields": [
                {
                    "name": "collectionMemberId",
                    "column": "CollectionMemberID",
                    "indexed": true,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "description",
                    "column": "Description",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "mappingName",
                    "column": "MappingName",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampExported",
                    "column": "TimeStampExported",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "mappings",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "SpExportSchemaItemMapping",
                    "otherSideName": "exportSchemaMapping"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "spExportSchemas",
                    "type": "many-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "SpExportSchema",
                    "otherSideName": "spExportSchemaMappings"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.SpFieldValueDefault",
            "table": "spfieldvaluedefault",
            "tableId": 520,
            "system": true,
            "idColumn": "SpFieldValueDefaultID",
            "idFieldName": "spFieldValueDefaultId",
            "fields": [
                {
                    "name": "collectionMemberId",
                    "column": "CollectionMemberID",
                    "indexed": true,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "fieldName",
                    "column": "FieldName",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "idValue",
                    "column": "IdValue",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "strValue",
                    "column": "StrValue",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "tableName",
                    "column": "TableName",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.SpLocaleContainer",
            "table": "splocalecontainer",
            "tableId": 503,
            "system": true,
            "idColumn": "SpLocaleContainerID",
            "idFieldName": "spLocaleContainerId",
            "fields": [
                {
                    "name": "aggregator",
                    "column": "Aggregator",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "defaultUI",
                    "column": "DefaultUI",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "format",
                    "column": "Format",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "isHidden",
                    "column": "IsHidden",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "isSystem",
                    "column": "IsSystem",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "isUIFormatter",
                    "column": "IsUIFormatter",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "name",
                    "column": "Name",
                    "indexed": true,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "pickListName",
                    "column": "PickListName",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "schemaType",
                    "column": "SchemaType",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Byte"
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "type",
                    "column": "Type",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "descs",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "SpLocaleItemStr",
                    "otherSideName": "containerDesc"
                },
                {
                    "name": "discipline",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Discipline",
                    "column": "DisciplineID",
                    "otherSideName": "spLocaleContainers"
                },
                {
                    "name": "items",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "SpLocaleContainerItem",
                    "otherSideName": "container"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "names",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "SpLocaleItemStr",
                    "otherSideName": "containerName"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.SpLocaleContainerItem",
            "table": "splocalecontaineritem",
            "tableId": 504,
            "system": true,
            "idColumn": "SpLocaleContainerItemID",
            "idFieldName": "spLocaleContainerItemId",
            "fields": [
                {
                    "name": "format",
                    "column": "Format",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "isHidden",
                    "column": "IsHidden",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "isRequired",
                    "column": "IsRequired",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean",
                    "length": 32
                },
                {
                    "name": "isSystem",
                    "column": "IsSystem",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "isUIFormatter",
                    "column": "IsUIFormatter",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "name",
                    "column": "Name",
                    "indexed": true,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "pickListName",
                    "column": "PickListName",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "type",
                    "column": "Type",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "webLinkName",
                    "column": "WebLinkName",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                }
            ],
            "relationships": [
                {
                    "name": "container",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "SpLocaleContainer",
                    "column": "SpLocaleContainerID",
                    "otherSideName": "items"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "descs",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "SpLocaleItemStr",
                    "otherSideName": "itemDesc"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "names",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "SpLocaleItemStr",
                    "otherSideName": "itemName"
                },
                {
                    "name": "spExportSchemaItems",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "SpExportSchemaItem",
                    "otherSideName": "spLocaleContainerItem"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.SpLocaleItemStr",
            "table": "splocaleitemstr",
            "tableId": 505,
            "system": true,
            "idColumn": "SpLocaleItemStrID",
            "idFieldName": "spLocaleItemStrId",
            "fields": [
                {
                    "name": "country",
                    "column": "Country",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 2
                },
                {
                    "name": "language",
                    "column": "Language",
                    "indexed": true,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 2
                },
                {
                    "name": "text",
                    "column": "Text",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "variant",
                    "column": "Variant",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 2
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "containerDesc",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "SpLocaleContainer",
                    "column": "SpLocaleContainerDescID",
                    "otherSideName": "descs"
                },
                {
                    "name": "containerName",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "SpLocaleContainer",
                    "column": "SpLocaleContainerNameID",
                    "otherSideName": "names"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "itemDesc",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "SpLocaleContainerItem",
                    "column": "SpLocaleContainerItemDescID",
                    "otherSideName": "descs"
                },
                {
                    "name": "itemName",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "SpLocaleContainerItem",
                    "column": "SpLocaleContainerItemNameID",
                    "otherSideName": "names"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.SpPermission",
            "table": "sppermission",
            "tableId": 521,
            "system": true,
            "idColumn": "SpPermissionID",
            "idFieldName": "permissionId",
            "fields": [
                {
                    "name": "actions",
                    "column": "Actions",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 256
                },
                {
                    "name": "name",
                    "column": "Name",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "permissionClass",
                    "column": "PermissionClass",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 256
                },
                {
                    "name": "targetId",
                    "column": "TargetId",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "principals",
                    "type": "many-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "SpPrincipal",
                    "otherSideName": "permissions"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.SpPrincipal",
            "table": "spprincipal",
            "tableId": 522,
            "system": true,
            "idColumn": "SpPrincipalID",
            "idFieldName": "userGroupId",
            "fields": [
                {
                    "name": "groupSubClass",
                    "column": "GroupSubClass",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "groupType",
                    "column": "groupType",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "name",
                    "column": "Name",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "priority",
                    "column": "Priority",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Byte"
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text"
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "permissions",
                    "type": "many-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "SpPermission",
                    "otherSideName": "principals"
                },
                {
                    "name": "scope",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "UserGroupScope",
                    "column": "userGroupScopeID",
                    "otherSideName": "userGroups"
                },
                {
                    "name": "specifyUsers",
                    "type": "many-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "SpecifyUser",
                    "otherSideName": "spPrincipals"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.SpQuery",
            "table": "spquery",
            "tableId": 517,
            "system": true,
            "idColumn": "SpQueryID",
            "idFieldName": "spQueryId",
            "fields": [
                {
                    "name": "contextName",
                    "column": "ContextName",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "contextTableId",
                    "column": "ContextTableId",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Short"
                },
                {
                    "name": "countOnly",
                    "column": "CountOnly",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "isFavorite",
                    "column": "IsFavorite",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "name",
                    "column": "Name",
                    "indexed": true,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "ordinal",
                    "column": "Ordinal",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Short"
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "searchSynonymy",
                    "column": "SearchSynonymy",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "selectDistinct",
                    "column": "SelectDistinct",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "sqlStr",
                    "column": "SqlStr",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "fields",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "SpQueryField",
                    "otherSideName": "query"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "reports",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "SpReport",
                    "otherSideName": "query"
                },
                {
                    "name": "specifyUser",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "SpecifyUser",
                    "column": "SpecifyUserID",
                    "otherSideName": "spQuerys"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.SpQueryField",
            "table": "spqueryfield",
            "tableId": 518,
            "system": true,
            "idColumn": "SpQueryFieldID",
            "idFieldName": "spQueryFieldId",
            "fields": [
                {
                    "name": "allowNulls",
                    "column": "AllowNulls",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "alwaysFilter",
                    "column": "AlwaysFilter",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "columnAlias",
                    "column": "ColumnAlias",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "contextTableIdent",
                    "column": "ContextTableIdent",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "endValue",
                    "column": "EndValue",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "fieldName",
                    "column": "FieldName",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "formatName",
                    "column": "FormatName",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "isDisplay",
                    "column": "IsDisplay",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "isNot",
                    "column": "IsNot",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "isPrompt",
                    "column": "IsPrompt",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "isRelFld",
                    "column": "IsRelFld",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "operEnd",
                    "column": "OperEnd",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Byte"
                },
                {
                    "name": "operStart",
                    "column": "OperStart",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Byte"
                },
                {
                    "name": "position",
                    "column": "Position",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Short"
                },
                {
                    "name": "sortType",
                    "column": "SortType",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Byte"
                },
                {
                    "name": "startValue",
                    "column": "StartValue",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "stringId",
                    "column": "StringId",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 500
                },
                {
                    "name": "tableList",
                    "column": "TableList",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 500
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "mappings",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "SpExportSchemaItemMapping",
                    "otherSideName": "queryField"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "query",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "SpQuery",
                    "column": "SpQueryID",
                    "otherSideName": "fields"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.SpReport",
            "table": "spreport",
            "tableId": 519,
            "system": true,
            "idColumn": "SpReportId",
            "idFieldName": "spReportId",
            "fields": [
                {
                    "name": "name",
                    "column": "Name",
                    "indexed": true,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "repeatCount",
                    "column": "RepeatCount",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "repeatField",
                    "column": "RepeatField",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "appResource",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "SpAppResource",
                    "column": "AppResourceID",
                    "otherSideName": "spReports"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "query",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "SpQuery",
                    "column": "SpQueryID",
                    "otherSideName": "reports"
                },
                {
                    "name": "specifyUser",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "SpecifyUser",
                    "column": "SpecifyUserID"
                },
                {
                    "name": "workbenchTemplate",
                    "type": "one-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "WorkbenchTemplate",
                    "column": "WorkbenchTemplateID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.SpTaskSemaphore",
            "table": "sptasksemaphore",
            "tableId": 526,
            "system": true,
            "idColumn": "TaskSemaphoreID",
            "idFieldName": "spTaskSemaphoreId",
            "fields": [
                {
                    "name": "context",
                    "column": "Context",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "isLocked",
                    "column": "IsLocked",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "lockedTime",
                    "column": "LockedTime",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "machineName",
                    "column": "MachineName",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "scope",
                    "column": "Scope",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Byte"
                },
                {
                    "name": "taskName",
                    "column": "TaskName",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "usageCount",
                    "column": "UsageCount",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "collection",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Collection",
                    "column": "CollectionID"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "discipline",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Discipline",
                    "column": "DisciplineID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "owner",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "SpecifyUser",
                    "column": "OwnerID",
                    "otherSideName": "taskSemaphores"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.SpVersion",
            "table": "spversion",
            "tableId": 529,
            "system": true,
            "idColumn": "SpVersionID",
            "idFieldName": "spVersionId",
            "fields": [
                {
                    "name": "appName",
                    "column": "AppName",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "appVersion",
                    "column": "AppVersion",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 16
                },
                {
                    "name": "dbClosedBy",
                    "column": "DbClosedBy",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "isDBClosed",
                    "column": "IsDBClosed",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "schemaVersion",
                    "column": "SchemaVersion",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 16
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "workbenchSchemaVersion",
                    "column": "WorkbenchSchemaVersion",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 16
                }
            ],
            "relationships": [
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.SpViewSetObj",
            "table": "spviewsetobj",
            "tableId": 513,
            "system": true,
            "idColumn": "SpViewSetObjID",
            "idFieldName": "spViewSetObjId",
            "fields": [
                {
                    "name": "description",
                    "column": "Description",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "fileName",
                    "column": "FileName",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "level",
                    "column": "Level",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Short"
                },
                {
                    "name": "metaData",
                    "column": "MetaData",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "name",
                    "column": "Name",
                    "indexed": true,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "spAppResourceDatas",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "SpAppResourceData",
                    "otherSideName": "spViewSetObj"
                },
                {
                    "name": "spAppResourceDir",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "SpAppResourceDir",
                    "column": "SpAppResourceDirID",
                    "otherSideName": "spPersistedViewSets"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.SpVisualQuery",
            "table": "spvisualquery",
            "tableId": 532,
            "system": true,
            "idColumn": "SpVisualQueryID",
            "idFieldName": "spVisualQueryId",
            "fields": [
                {
                    "name": "description",
                    "column": "Description",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "name",
                    "column": "Name",
                    "indexed": true,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "polygons",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "LatLonPolygon",
                    "otherSideName": "visualQuery"
                },
                {
                    "name": "specifyUser",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "SpecifyUser",
                    "column": "SpecifyUserID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.SpecifyUser",
            "table": "specifyuser",
            "tableId": 72,
            "system": true,
            "idColumn": "SpecifyUserID",
            "idFieldName": "specifyUserId",
            "fields": [
                {
                    "name": "accumMinLoggedIn",
                    "column": "AccumMinLoggedIn",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Long"
                },
                {
                    "name": "email",
                    "column": "EMail",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "isLoggedIn",
                    "column": "IsLoggedIn",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "isLoggedInReport",
                    "column": "IsLoggedInReport",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "loginCollectionName",
                    "column": "LoginCollectionName",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "loginDisciplineName",
                    "column": "LoginDisciplineName",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "loginOutTime",
                    "column": "LoginOutTime",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "name",
                    "column": "Name",
                    "indexed": false,
                    "unique": true,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "password",
                    "column": "Password",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "userType",
                    "column": "UserType",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "agents",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "otherSideName": "specifyUser"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "spAppResourceDirs",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "SpAppResourceDir",
                    "otherSideName": "specifyUser"
                },
                {
                    "name": "spAppResources",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "SpAppResource",
                    "otherSideName": "specifyUser"
                },
                {
                    "name": "spPrincipals",
                    "type": "many-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "SpPrincipal",
                    "otherSideName": "specifyUsers"
                },
                {
                    "name": "spQuerys",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "SpQuery",
                    "otherSideName": "specifyUser"
                },
                {
                    "name": "taskSemaphores",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "SpTaskSemaphore",
                    "otherSideName": "owner"
                },
                {
                    "name": "workbenchTemplates",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "WorkbenchTemplate",
                    "otherSideName": "specifyUser"
                },
                {
                    "name": "workbenches",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Workbench",
                    "otherSideName": "specifyUser"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.Storage",
            "table": "storage",
            "tableId": 58,
            "view": "Storage",
            "searchDialog": "StorageSearch",
            "system": false,
            "idColumn": "StorageID",
            "idFieldName": "storageId",
            "fields": [
                {
                    "name": "abbrev",
                    "column": "Abbrev",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 16
                },
                {
                    "name": "fullName",
                    "column": "FullName",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "highestChildNodeNumber",
                    "column": "HighestChildNodeNumber",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "isAccepted",
                    "column": "IsAccepted",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "name",
                    "column": "Name",
                    "indexed": true,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "nodeNumber",
                    "column": "NodeNumber",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "number1",
                    "column": "Number1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "number2",
                    "column": "Number2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "rankId",
                    "column": "RankID",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "text1",
                    "column": "Text1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "text2",
                    "column": "Text2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampVersion",
                    "column": "TimestampVersion",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Date"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "acceptedChildren",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Storage",
                    "otherSideName": "acceptedStorage"
                },
                {
                    "name": "acceptedStorage",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Storage",
                    "column": "AcceptedID",
                    "otherSideName": "acceptedChildren"
                },
                {
                    "name": "children",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Storage",
                    "otherSideName": "parent"
                },
                {
                    "name": "containers",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Container",
                    "otherSideName": "storage"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "definition",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "StorageTreeDef",
                    "column": "StorageTreeDefID",
                    "otherSideName": "treeEntries"
                },
                {
                    "name": "definitionItem",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "StorageTreeDefItem",
                    "column": "StorageTreeDefItemID",
                    "otherSideName": "treeEntries"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "parent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Storage",
                    "column": "ParentID",
                    "otherSideName": "children"
                },
                {
                    "name": "preparations",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Preparation",
                    "otherSideName": "storage"
                }
            ],
            "fieldAliases": [
                {
                    "aname": "acceptedStorage",
                    "vname": "acceptedParent"
                }
            ]
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.StorageTreeDef",
            "table": "storagetreedef",
            "tableId": 59,
            "system": false,
            "idColumn": "StorageTreeDefID",
            "idFieldName": "storageTreeDefId",
            "fields": [
                {
                    "name": "fullNameDirection",
                    "column": "FullNameDirection",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "name",
                    "column": "Name",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "institutions",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Institution",
                    "otherSideName": "storageTreeDef"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "treeDefItems",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "StorageTreeDefItem",
                    "otherSideName": "treeDef"
                },
                {
                    "name": "treeEntries",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Storage",
                    "otherSideName": "definition"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.StorageTreeDefItem",
            "table": "storagetreedefitem",
            "tableId": 60,
            "system": false,
            "idColumn": "StorageTreeDefItemID",
            "idFieldName": "storageTreeDefItemId",
            "fields": [
                {
                    "name": "fullNameSeparator",
                    "column": "FullNameSeparator",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "isEnforced",
                    "column": "IsEnforced",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "isInFullName",
                    "column": "IsInFullName",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "name",
                    "column": "Name",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "rankId",
                    "column": "RankID",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "textAfter",
                    "column": "TextAfter",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "textBefore",
                    "column": "TextBefore",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "title",
                    "column": "Title",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "children",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "StorageTreeDefItem",
                    "otherSideName": "parent"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "parent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "StorageTreeDefItem",
                    "column": "ParentItemID",
                    "otherSideName": "children"
                },
                {
                    "name": "treeDef",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "StorageTreeDef",
                    "column": "StorageTreeDefID",
                    "otherSideName": "treeDefItems"
                },
                {
                    "name": "treeEntries",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Storage",
                    "otherSideName": "definitionItem"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.Taxon",
            "table": "taxon",
            "tableId": 4,
            "view": "Taxon",
            "searchDialog": "TaxonSearch",
            "system": false,
            "idColumn": "TaxonID",
            "idFieldName": "taxonId",
            "fields": [
                {
                    "name": "author",
                    "column": "Author",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 128
                },
                {
                    "name": "citesStatus",
                    "column": "CitesStatus",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "colStatus",
                    "column": "COLStatus",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "commonName",
                    "column": "CommonName",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 128
                },
                {
                    "name": "cultivarName",
                    "column": "CultivarName",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "environmentalProtectionStatus",
                    "column": "EnvironmentalProtectionStatus",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "esaStatus",
                    "column": "EsaStatus",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "fullName",
                    "column": "FullName",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "groupNumber",
                    "column": "GroupNumber",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 20
                },
                {
                    "name": "guid",
                    "column": "GUID",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 128
                },
                {
                    "name": "highestChildNodeNumber",
                    "column": "HighestChildNodeNumber",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "isAccepted",
                    "column": "IsAccepted",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "isHybrid",
                    "column": "IsHybrid",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "isisNumber",
                    "column": "IsisNumber",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 16
                },
                {
                    "name": "labelFormat",
                    "column": "LabelFormat",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "name",
                    "column": "Name",
                    "indexed": true,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "ncbiTaxonNumber",
                    "column": "NcbiTaxonNumber",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 8
                },
                {
                    "name": "nodeNumber",
                    "column": "NodeNumber",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "number1",
                    "column": "Number1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "number2",
                    "column": "Number2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "rankId",
                    "column": "RankID",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "source",
                    "column": "Source",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "taxonomicSerialNumber",
                    "column": "TaxonomicSerialNumber",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "text1",
                    "column": "Text1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "text2",
                    "column": "Text2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "unitInd1",
                    "column": "UnitInd1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "unitInd2",
                    "column": "UnitInd2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "unitInd3",
                    "column": "UnitInd3",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "unitInd4",
                    "column": "UnitInd4",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "unitName1",
                    "column": "UnitName1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "unitName2",
                    "column": "UnitName2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "unitName3",
                    "column": "UnitName3",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "unitName4",
                    "column": "UnitName4",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "usfwsCode",
                    "column": "UsfwsCode",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 16
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "visibility",
                    "column": "Visibility",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Byte"
                }
            ],
            "relationships": [
                {
                    "name": "acceptedChildren",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Taxon",
                    "otherSideName": "acceptedTaxon"
                },
                {
                    "name": "acceptedTaxon",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Taxon",
                    "column": "AcceptedID",
                    "otherSideName": "acceptedChildren"
                },
                {
                    "name": "children",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Taxon",
                    "otherSideName": "parent"
                },
                {
                    "name": "collectingEventAttributes",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "CollectingEventAttribute",
                    "otherSideName": "hostTaxon"
                },
                {
                    "name": "commonNames",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "CommonNameTx",
                    "otherSideName": "taxon"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "definition",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "TaxonTreeDef",
                    "column": "TaxonTreeDefID",
                    "otherSideName": "treeEntries"
                },
                {
                    "name": "definitionItem",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "TaxonTreeDefItem",
                    "column": "TaxonTreeDefItemID",
                    "otherSideName": "treeEntries"
                },
                {
                    "name": "determinations",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Determination",
                    "otherSideName": "taxon"
                },
                {
                    "name": "hybridChildren1",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Taxon",
                    "otherSideName": "hybridParent1"
                },
                {
                    "name": "hybridChildren2",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Taxon",
                    "otherSideName": "hybridParent2"
                },
                {
                    "name": "hybridParent1",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Taxon",
                    "column": "HybridParent1ID",
                    "otherSideName": "hybridChildren1"
                },
                {
                    "name": "hybridParent2",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Taxon",
                    "column": "HybridParent2ID",
                    "otherSideName": "hybridChildren2"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "parent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Taxon",
                    "column": "ParentID",
                    "otherSideName": "children"
                },
                {
                    "name": "taxonAttachments",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "TaxonAttachment",
                    "otherSideName": "taxon"
                },
                {
                    "name": "taxonCitations",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": true,
                    "relatedModelName": "TaxonCitation",
                    "otherSideName": "taxon"
                },
                {
                    "name": "visibilitySetBy",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "SpecifyUser",
                    "column": "VisibilitySetByID"
                }
            ],
            "fieldAliases": [
                {
                    "aname": "acceptedTaxon",
                    "vname": "acceptedParent"
                }
            ]
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.TaxonAttachment",
            "table": "taxonattachment",
            "tableId": 119,
            "view": "ObjectAttachment",
            "searchDialog": null,
            "system": false,
            "idColumn": "TaxonAttachmentID",
            "idFieldName": "taxonAttachmentId",
            "fields": [
                {
                    "name": "ordinal",
                    "column": "Ordinal",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "attachment",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Attachment",
                    "column": "AttachmentID",
                    "otherSideName": "taxonAttachments"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "taxon",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Taxon",
                    "column": "TaxonID",
                    "otherSideName": "taxonAttachments"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.TaxonCitation",
            "table": "taxoncitation",
            "tableId": 75,
            "system": false,
            "idColumn": "TaxonCitationID",
            "idFieldName": "taxonCitationId",
            "fields": [
                {
                    "name": "number1",
                    "column": "Number1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float",
                    "length": 24
                },
                {
                    "name": "number2",
                    "column": "Number2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Float",
                    "length": 24
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "text1",
                    "column": "Text1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 300
                },
                {
                    "name": "text2",
                    "column": "Text2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 300
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "yesNo1",
                    "column": "YesNo1",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "yesNo2",
                    "column": "YesNo2",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                }
            ],
            "relationships": [
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "referenceWork",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "ReferenceWork",
                    "column": "ReferenceWorkID",
                    "otherSideName": "taxonCitations"
                },
                {
                    "name": "taxon",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Taxon",
                    "column": "TaxonID",
                    "otherSideName": "taxonCitations"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.TaxonTreeDef",
            "table": "taxontreedef",
            "tableId": 76,
            "system": false,
            "idColumn": "TaxonTreeDefID",
            "idFieldName": "taxonTreeDefId",
            "fields": [
                {
                    "name": "fullNameDirection",
                    "column": "FullNameDirection",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "name",
                    "column": "Name",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "discipline",
                    "type": "one-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Discipline",
                    "otherSideName": "taxonTreeDef"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "treeDefItems",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "TaxonTreeDefItem",
                    "otherSideName": "treeDef"
                },
                {
                    "name": "treeEntries",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Taxon",
                    "otherSideName": "definition"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.TaxonTreeDefItem",
            "table": "taxontreedefitem",
            "tableId": 77,
            "view": "TaxonTreeDefItem",
            "searchDialog": "TaxonTreeDefItemSearch",
            "system": false,
            "idColumn": "TaxonTreeDefItemID",
            "idFieldName": "taxonTreeDefItemId",
            "fields": [
                {
                    "name": "formatToken",
                    "column": "FormatToken",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "fullNameSeparator",
                    "column": "FullNameSeparator",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "isEnforced",
                    "column": "IsEnforced",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "isInFullName",
                    "column": "IsInFullName",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "name",
                    "column": "Name",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "rankId",
                    "column": "RankID",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "textAfter",
                    "column": "TextAfter",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "textBefore",
                    "column": "TextBefore",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "title",
                    "column": "Title",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "children",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "TaxonTreeDefItem",
                    "otherSideName": "parent"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "parent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "TaxonTreeDefItem",
                    "column": "ParentItemID",
                    "otherSideName": "children"
                },
                {
                    "name": "treeDef",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "TaxonTreeDef",
                    "column": "TaxonTreeDefID",
                    "otherSideName": "treeDefItems"
                },
                {
                    "name": "treeEntries",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Taxon",
                    "otherSideName": "definitionItem"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.TreatmentEvent",
            "table": "treatmentevent",
            "tableId": 122,
            "system": false,
            "idColumn": "TreatmentEventID",
            "idFieldName": "treatmentEventId",
            "fields": [
                {
                    "name": "dateBoxed",
                    "column": "DateBoxed",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Calendar"
                },
                {
                    "name": "dateCleaned",
                    "column": "DateCleaned",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Calendar"
                },
                {
                    "name": "dateCompleted",
                    "column": "DateCompleted",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Calendar"
                },
                {
                    "name": "dateReceived",
                    "column": "DateReceived",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Calendar"
                },
                {
                    "name": "dateToIsolation",
                    "column": "DateToIsolation",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Calendar"
                },
                {
                    "name": "dateTreatmentEnded",
                    "column": "DateTreatmentEnded",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Calendar"
                },
                {
                    "name": "dateTreatmentStarted",
                    "column": "DateTreatmentStarted",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.util.Calendar"
                },
                {
                    "name": "fieldNumber",
                    "column": "FieldNumber",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "location",
                    "column": "Storage",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 2048
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "treatmentNumber",
                    "column": "TreatmentNumber",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "type",
                    "column": "Type",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 32
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "accession",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Accession",
                    "column": "AccessionID",
                    "otherSideName": "treatmentEvents"
                },
                {
                    "name": "collectionObject",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "CollectionObject",
                    "column": "CollectionObjectID",
                    "otherSideName": "treatmentEvents"
                },
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "division",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Division",
                    "column": "DivisionID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.Workbench",
            "table": "workbench",
            "tableId": 79,
            "system": true,
            "idColumn": "WorkbenchID",
            "idFieldName": "workbenchId",
            "fields": [
                {
                    "name": "allPermissionLevel",
                    "column": "AllPermissionLevel",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "dbTableId",
                    "column": "TableID",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "exportInstitutionName",
                    "column": "ExportInstitutionName",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 128
                },
                {
                    "name": "exportedFromTableName",
                    "column": "ExportedFromTableName",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 128
                },
                {
                    "name": "formId",
                    "column": "FormId",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "groupPermissionLevel",
                    "column": "GroupPermissionLevel",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "lockedByUserName",
                    "column": "LockedByUserName",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "name",
                    "column": "Name",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "ownerPermissionLevel",
                    "column": "OwnerPermissionLevel",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "srcFilePath",
                    "column": "SrcFilePath",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "group",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "SpPrincipal",
                    "column": "SpPrincipalID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "specifyUser",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "SpecifyUser",
                    "column": "SpecifyUserID",
                    "otherSideName": "workbenches"
                },
                {
                    "name": "workbenchRows",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "WorkbenchRow",
                    "otherSideName": "workbench"
                },
                {
                    "name": "workbenchTemplate",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "WorkbenchTemplate",
                    "column": "WorkbenchTemplateID",
                    "otherSideName": "workbenches"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.WorkbenchDataItem",
            "table": "workbenchdataitem",
            "tableId": 80,
            "system": true,
            "idColumn": "WorkbenchDataItemID",
            "idFieldName": "workbenchDataItemId",
            "fields": [
                {
                    "name": "cellData",
                    "column": "CellData",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 512
                },
                {
                    "name": "rowNumber",
                    "column": "RowNumber",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Short"
                },
                {
                    "name": "validationStatus",
                    "column": "ValidationStatus",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Short"
                }
            ],
            "relationships": [
                {
                    "name": "workbenchRow",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "WorkbenchRow",
                    "column": "WorkbenchRowID",
                    "otherSideName": "workbenchDataItems"
                },
                {
                    "name": "workbenchTemplateMappingItem",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "WorkbenchTemplateMappingItem",
                    "column": "WorkbenchTemplateMappingItemID",
                    "otherSideName": "workbenchDataItems"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.WorkbenchRow",
            "table": "workbenchrow",
            "tableId": 90,
            "system": true,
            "idColumn": "WorkbenchRowID",
            "idFieldName": "workbenchRowId",
            "fields": [
                {
                    "name": "bioGeomancerResults",
                    "column": "BioGeomancerResults",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 8192
                },
                {
                    "name": "cardImageData",
                    "column": "CardImageData",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 16000000
                },
                {
                    "name": "cardImageFullPath",
                    "column": "CardImageFullPath",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "lat1Text",
                    "column": "Lat1Text",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "lat2Text",
                    "column": "Lat2Text",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "long1Text",
                    "column": "Long1Text",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "long2Text",
                    "column": "Long2Text",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 50
                },
                {
                    "name": "recordId",
                    "column": "RecordID",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "rowNumber",
                    "column": "RowNumber",
                    "indexed": true,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Short"
                },
                {
                    "name": "sgrStatus",
                    "column": "SGRStatus",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Byte"
                },
                {
                    "name": "uploadStatus",
                    "column": "UploadStatus",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Byte"
                }
            ],
            "relationships": [
                {
                    "name": "workbench",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "Workbench",
                    "column": "WorkbenchID",
                    "otherSideName": "workbenchRows"
                },
                {
                    "name": "workbenchDataItems",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "WorkbenchDataItem",
                    "otherSideName": "workbenchRow"
                },
                {
                    "name": "workbenchRowExportedRelationships",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "WorkbenchRowExportedRelationship",
                    "otherSideName": "workbenchRow"
                },
                {
                    "name": "workbenchRowImages",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "WorkbenchRowImage",
                    "otherSideName": "workbenchRow"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.WorkbenchRowExportedRelationship",
            "table": "workbenchrowexportedrelationship",
            "tableId": 126,
            "system": true,
            "idColumn": "WorkbenchRowExportedRelationshipID",
            "idFieldName": "workbenchRowExportedRelationshipId",
            "fields": [
                {
                    "name": "recordId",
                    "column": "RecordID",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "relationshipName",
                    "column": "RelationshipName",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 120
                },
                {
                    "name": "sequence",
                    "column": "Sequence",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "tableName",
                    "column": "TableName",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 120
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "workbenchRow",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "WorkbenchRow",
                    "column": "WorkbenchRowID",
                    "otherSideName": "workbenchRowExportedRelationships"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.WorkbenchRowImage",
            "table": "workbenchrowimage",
            "tableId": 95,
            "system": true,
            "idColumn": "WorkbenchRowImageID",
            "idFieldName": "workbenchRowImageId",
            "fields": [
                {
                    "name": "attachToTableName",
                    "column": "AttachToTableName",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "cardImageData",
                    "column": "CardImageData",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 16000000
                },
                {
                    "name": "cardImageFullPath",
                    "column": "CardImageFullPath",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "imageOrder",
                    "column": "ImageOrder",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "workbenchRow",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "WorkbenchRow",
                    "column": "WorkbenchRowID",
                    "otherSideName": "workbenchRowImages"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.WorkbenchTemplate",
            "table": "workbenchtemplate",
            "tableId": 81,
            "system": true,
            "idColumn": "WorkbenchTemplateID",
            "idFieldName": "workbenchTemplateId",
            "fields": [
                {
                    "name": "name",
                    "column": "Name",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "remarks",
                    "column": "Remarks",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "text",
                    "length": 4096
                },
                {
                    "name": "srcFilePath",
                    "column": "SrcFilePath",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                }
            ],
            "relationships": [
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "specifyUser",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "SpecifyUser",
                    "column": "SpecifyUserID",
                    "otherSideName": "workbenchTemplates"
                },
                {
                    "name": "workbenchTemplateMappingItems",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "WorkbenchTemplateMappingItem",
                    "otherSideName": "workbenchTemplate"
                },
                {
                    "name": "workbenches",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Workbench",
                    "otherSideName": "workbenchTemplate"
                }
            ],
            "fieldAliases": []
        },
        {
            "classname": "edu.ku.brc.specify.datamodel.WorkbenchTemplateMappingItem",
            "table": "workbenchtemplatemappingitem",
            "tableId": 82,
            "system": true,
            "idColumn": "WorkbenchTemplateMappingItemID",
            "idFieldName": "workbenchTemplateMappingItemId",
            "fields": [
                {
                    "name": "caption",
                    "column": "Caption",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "carryForward",
                    "column": "CarryForward",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "dataFieldLength",
                    "column": "DataFieldLength",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Short"
                },
                {
                    "name": "fieldName",
                    "column": "FieldName",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "fieldType",
                    "column": "FieldType",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Short"
                },
                {
                    "name": "importedColName",
                    "column": "ImportedColName",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 255
                },
                {
                    "name": "isEditable",
                    "column": "IsEditable",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "isExportableToContent",
                    "column": "IsExportableToContent",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "isIncludedInTitle",
                    "column": "IsIncludedInTitle",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "isRequired",
                    "column": "IsRequired",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Boolean"
                },
                {
                    "name": "metaData",
                    "column": "MetaData",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 128
                },
                {
                    "name": "origImportColumnIndex",
                    "column": "DataColumnIndex",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Short"
                },
                {
                    "name": "srcTableId",
                    "column": "TableId",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer",
                    "length": 64
                },
                {
                    "name": "tableName",
                    "column": "TableName",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.String",
                    "length": 64
                },
                {
                    "name": "timestampCreated",
                    "column": "TimestampCreated",
                    "indexed": false,
                    "unique": false,
                    "required": true,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "timestampModified",
                    "column": "TimestampModified",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.sql.Timestamp"
                },
                {
                    "name": "version",
                    "column": "Version",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Integer"
                },
                {
                    "name": "viewOrder",
                    "column": "ViewOrder",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Short"
                },
                {
                    "name": "xCoord",
                    "column": "XCoord",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Short"
                },
                {
                    "name": "yCoord",
                    "column": "YCoord",
                    "indexed": false,
                    "unique": false,
                    "required": false,
                    "type": "java.lang.Short"
                }
            ],
            "relationships": [
                {
                    "name": "createdByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "CreatedByAgentID"
                },
                {
                    "name": "modifiedByAgent",
                    "type": "many-to-one",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "Agent",
                    "column": "ModifiedByAgentID"
                },
                {
                    "name": "workbenchDataItems",
                    "type": "one-to-many",
                    "required": false,
                    "dependent": false,
                    "relatedModelName": "WorkbenchDataItem",
                    "otherSideName": "workbenchTemplateMappingItem"
                },
                {
                    "name": "workbenchTemplate",
                    "type": "many-to-one",
                    "required": true,
                    "dependent": false,
                    "relatedModelName": "WorkbenchTemplate",
                    "column": "WorkbenchTemplateID",
                    "otherSideName": "workbenchTemplateMappingItems"
                }
            ],
            "fieldAliases": []
        }
    ];
});

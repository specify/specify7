import { requireContext } from '../../../tests/helpers';
import { ResourceBase } from '../resourceApi';
import { schema } from '../schema';
import { LiteralField } from '../specifyField';

requireContext();

test('literal fields are loaded', () =>
  expect(schema.models.CollectionObject.literalFields).toMatchInlineSnapshot(`
    [
      "[literalField actualTotalCountAmt]",
      "[literalField availability]",
      "[literalField catalogNumber]",
      "[literalField catalogedDate]",
      "[literalField catalogedDatePrecision]",
      "[literalField catalogedDateVerbatim]",
      "[literalField collectionMemberId]",
      "[literalField countAmt]",
      "[literalField reservedText]",
      "[literalField timestampModified]",
      "[literalField date1]",
      "[literalField date1Precision]",
      "[literalField deaccessioned]",
      "[literalField embargoReason]",
      "[literalField embargoReleaseDate]",
      "[literalField embargoReleaseDatePrecision]",
      "[literalField embargoStartDate]",
      "[literalField embargoStartDatePrecision]",
      "[literalField guid]",
      "[literalField integer1]",
      "[literalField integer2]",
      "[literalField text2]",
      "[literalField inventoryDate]",
      "[literalField inventoryDatePrecision]",
      "[literalField modifier]",
      "[literalField name]",
      "[literalField notifications]",
      "[literalField numberOfDuplicates]",
      "[literalField number1]",
      "[literalField number2]",
      "[literalField objectCondition]",
      "[literalField ocr]",
      "[literalField text1]",
      "[literalField altCatalogNumber]",
      "[literalField projectNumber]",
      "[literalField remarks]",
      "[literalField reservedInteger3]",
      "[literalField reservedInteger4]",
      "[literalField reservedText2]",
      "[literalField reservedText3]",
      "[literalField restrictions]",
      "[literalField sgrStatus]",
      "[literalField description]",
      "[literalField text3]",
      "[literalField text4]",
      "[literalField text5]",
      "[literalField text6]",
      "[literalField text7]",
      "[literalField text8]",
      "[literalField timestampCreated]",
      "[literalField totalCountAmt]",
      "[literalField totalValue]",
      "[literalField uniqueIdentifier]",
      "[literalField version]",
      "[literalField visibility]",
      "[literalField fieldNumber]",
      "[literalField yesNo1]",
      "[literalField yesNo2]",
      "[literalField yesNo3]",
      "[literalField yesNo4]",
      "[literalField yesNo5]",
      "[literalField yesNo6]",
    ]
  `));

test('relationships are loaded', () =>
  expect(schema.models.CollectionObject.relationships).toMatchInlineSnapshot(`
    [
      "[relationship accession]",
      "[relationship agent1]",
      "[relationship appraisal]",
      "[relationship cataloger]",
      "[relationship collectionObjectAttribute]",
      "[relationship collection]",
      "[relationship collectionObjectAttachments]",
      "[relationship collectionObjectAttrs]",
      "[relationship collectionObjectCitations]",
      "[relationship collectionObjectProperties]",
      "[relationship conservDescriptions]",
      "[relationship container]",
      "[relationship containerOwner]",
      "[relationship createdByAgent]",
      "[relationship currentDetermination]",
      "[relationship determinations]",
      "[relationship dnaSequences]",
      "[relationship modifiedByAgent]",
      "[relationship embargoAuthority]",
      "[relationship exsiccataItems]",
      "[relationship collectingEvent]",
      "[relationship fieldNotebookPage]",
      "[relationship inventorizedBy]",
      "[relationship leftSideRels]",
      "[relationship otherIdentifiers]",
      "[relationship paleoContext]",
      "[relationship preparations]",
      "[relationship projects]",
      "[relationship rightSideRels]",
      "[relationship treatmentEvents]",
      "[relationship visibilitySetBy]",
      "[relationship voucherRelationships]",
    ]
  `));

test('indexed fields are loaded', () =>
  expect(schema.models.CollectionObject.field).toMatchInlineSnapshot(`
    {
      "accession": "[relationship accession]",
      "actualTotalCountAmt": "[literalField actualTotalCountAmt]",
      "agent1": "[relationship agent1]",
      "altCatalogNumber": "[literalField altCatalogNumber]",
      "appraisal": "[relationship appraisal]",
      "availability": "[literalField availability]",
      "catalogNumber": "[literalField catalogNumber]",
      "catalogedDate": "[literalField catalogedDate]",
      "catalogedDatePrecision": "[literalField catalogedDatePrecision]",
      "catalogedDateVerbatim": "[literalField catalogedDateVerbatim]",
      "cataloger": "[relationship cataloger]",
      "collectingEvent": "[relationship collectingEvent]",
      "collection": "[relationship collection]",
      "collectionMemberId": "[literalField collectionMemberId]",
      "collectionObjectAttachments": "[relationship collectionObjectAttachments]",
      "collectionObjectAttribute": "[relationship collectionObjectAttribute]",
      "collectionObjectAttrs": "[relationship collectionObjectAttrs]",
      "collectionObjectCitations": "[relationship collectionObjectCitations]",
      "collectionObjectProperties": "[relationship collectionObjectProperties]",
      "conservDescriptions": "[relationship conservDescriptions]",
      "container": "[relationship container]",
      "containerOwner": "[relationship containerOwner]",
      "countAmt": "[literalField countAmt]",
      "createdByAgent": "[relationship createdByAgent]",
      "currentDetermination": "[relationship currentDetermination]",
      "date1": "[literalField date1]",
      "date1Precision": "[literalField date1Precision]",
      "deaccessioned": "[literalField deaccessioned]",
      "description": "[literalField description]",
      "determinations": "[relationship determinations]",
      "dnaSequences": "[relationship dnaSequences]",
      "embargoAuthority": "[relationship embargoAuthority]",
      "embargoReason": "[literalField embargoReason]",
      "embargoReleaseDate": "[literalField embargoReleaseDate]",
      "embargoReleaseDatePrecision": "[literalField embargoReleaseDatePrecision]",
      "embargoStartDate": "[literalField embargoStartDate]",
      "embargoStartDatePrecision": "[literalField embargoStartDatePrecision]",
      "exsiccataItems": "[relationship exsiccataItems]",
      "fieldNotebookPage": "[relationship fieldNotebookPage]",
      "fieldNumber": "[literalField fieldNumber]",
      "guid": "[literalField guid]",
      "integer1": "[literalField integer1]",
      "integer2": "[literalField integer2]",
      "inventorizedBy": "[relationship inventorizedBy]",
      "inventoryDate": "[literalField inventoryDate]",
      "inventoryDatePrecision": "[literalField inventoryDatePrecision]",
      "leftSideRels": "[relationship leftSideRels]",
      "modifiedByAgent": "[relationship modifiedByAgent]",
      "modifier": "[literalField modifier]",
      "name": "[literalField name]",
      "notifications": "[literalField notifications]",
      "number1": "[literalField number1]",
      "number2": "[literalField number2]",
      "numberOfDuplicates": "[literalField numberOfDuplicates]",
      "objectCondition": "[literalField objectCondition]",
      "ocr": "[literalField ocr]",
      "otherIdentifiers": "[relationship otherIdentifiers]",
      "paleoContext": "[relationship paleoContext]",
      "preparations": "[relationship preparations]",
      "projectNumber": "[literalField projectNumber]",
      "projects": "[relationship projects]",
      "remarks": "[literalField remarks]",
      "reservedInteger3": "[literalField reservedInteger3]",
      "reservedInteger4": "[literalField reservedInteger4]",
      "reservedText": "[literalField reservedText]",
      "reservedText2": "[literalField reservedText2]",
      "reservedText3": "[literalField reservedText3]",
      "restrictions": "[literalField restrictions]",
      "rightSideRels": "[relationship rightSideRels]",
      "sgrStatus": "[literalField sgrStatus]",
      "text1": "[literalField text1]",
      "text2": "[literalField text2]",
      "text3": "[literalField text3]",
      "text4": "[literalField text4]",
      "text5": "[literalField text5]",
      "text6": "[literalField text6]",
      "text7": "[literalField text7]",
      "text8": "[literalField text8]",
      "timestampCreated": "[literalField timestampCreated]",
      "timestampModified": "[literalField timestampModified]",
      "totalCountAmt": "[literalField totalCountAmt]",
      "totalValue": "[literalField totalValue]",
      "treatmentEvents": "[relationship treatmentEvents]",
      "uniqueIdentifier": "[literalField uniqueIdentifier]",
      "version": "[literalField version]",
      "visibility": "[literalField visibility]",
      "visibilitySetBy": "[relationship visibilitySetBy]",
      "voucherRelationships": "[relationship voucherRelationships]",
      "yesNo1": "[literalField yesNo1]",
      "yesNo2": "[literalField yesNo2]",
      "yesNo3": "[literalField yesNo3]",
      "yesNo4": "[literalField yesNo4]",
      "yesNo5": "[literalField yesNo5]",
      "yesNo6": "[literalField yesNo6]",
    }
  `));

test('fields are loaded', () =>
  expect(schema.models.CollectionObject.fields).toMatchInlineSnapshot(`
    [
      "[literalField actualTotalCountAmt]",
      "[literalField availability]",
      "[literalField catalogNumber]",
      "[literalField catalogedDate]",
      "[literalField catalogedDatePrecision]",
      "[literalField catalogedDateVerbatim]",
      "[literalField collectionMemberId]",
      "[literalField countAmt]",
      "[literalField reservedText]",
      "[literalField timestampModified]",
      "[literalField date1]",
      "[literalField date1Precision]",
      "[literalField deaccessioned]",
      "[literalField embargoReason]",
      "[literalField embargoReleaseDate]",
      "[literalField embargoReleaseDatePrecision]",
      "[literalField embargoStartDate]",
      "[literalField embargoStartDatePrecision]",
      "[literalField guid]",
      "[literalField integer1]",
      "[literalField integer2]",
      "[literalField text2]",
      "[literalField inventoryDate]",
      "[literalField inventoryDatePrecision]",
      "[literalField modifier]",
      "[literalField name]",
      "[literalField notifications]",
      "[literalField numberOfDuplicates]",
      "[literalField number1]",
      "[literalField number2]",
      "[literalField objectCondition]",
      "[literalField ocr]",
      "[literalField text1]",
      "[literalField altCatalogNumber]",
      "[literalField projectNumber]",
      "[literalField remarks]",
      "[literalField reservedInteger3]",
      "[literalField reservedInteger4]",
      "[literalField reservedText2]",
      "[literalField reservedText3]",
      "[literalField restrictions]",
      "[literalField sgrStatus]",
      "[literalField description]",
      "[literalField text3]",
      "[literalField text4]",
      "[literalField text5]",
      "[literalField text6]",
      "[literalField text7]",
      "[literalField text8]",
      "[literalField timestampCreated]",
      "[literalField totalCountAmt]",
      "[literalField totalValue]",
      "[literalField uniqueIdentifier]",
      "[literalField version]",
      "[literalField visibility]",
      "[literalField fieldNumber]",
      "[literalField yesNo1]",
      "[literalField yesNo2]",
      "[literalField yesNo3]",
      "[literalField yesNo4]",
      "[literalField yesNo5]",
      "[literalField yesNo6]",
      "[relationship accession]",
      "[relationship agent1]",
      "[relationship appraisal]",
      "[relationship cataloger]",
      "[relationship collectionObjectAttribute]",
      "[relationship collection]",
      "[relationship collectionObjectAttachments]",
      "[relationship collectionObjectAttrs]",
      "[relationship collectionObjectCitations]",
      "[relationship collectionObjectProperties]",
      "[relationship conservDescriptions]",
      "[relationship container]",
      "[relationship containerOwner]",
      "[relationship createdByAgent]",
      "[relationship currentDetermination]",
      "[relationship determinations]",
      "[relationship dnaSequences]",
      "[relationship modifiedByAgent]",
      "[relationship embargoAuthority]",
      "[relationship exsiccataItems]",
      "[relationship collectingEvent]",
      "[relationship fieldNotebookPage]",
      "[relationship inventorizedBy]",
      "[relationship leftSideRels]",
      "[relationship otherIdentifiers]",
      "[relationship paleoContext]",
      "[relationship preparations]",
      "[relationship projects]",
      "[relationship rightSideRels]",
      "[relationship treatmentEvents]",
      "[relationship visibilitySetBy]",
      "[relationship voucherRelationships]",
    ]
  `));

test('localization is loaded', () =>
  expect(schema.models.CollectionObject.localization).toMatchSnapshot());

test('localization is generated on the fly when empty', () =>
  expect(schema.models.DNASequencingRunAttachment.localization)
    .toMatchInlineSnapshot(`
      {
        "items": {
          "dnasequencingrunattachmentid": {
            "desc": null,
            "format": null,
            "ishidden": true,
            "isrequired": false,
            "name": "ID",
            "picklistname": null,
            "weblinkname": null,
          },
        },
      }
    `));

test('label is extracted from schema localization', () =>
  expect(schema.models.CollectionObject.label).toMatchInlineSnapshot(
    `"Collection Object"`
  ));

test('table name is generated on the fly if needed', () =>
  expect(schema.models.DNASequencingRunAttachment.label).toBe(
    'DNASequencing Run Attachment'
  ));

test('java name can be accessed', () =>
  expect(schema.models.CollectionObject.longName).toMatchInlineSnapshot(
    `"edu.ku.brc.specify.datamodel.CollectionObject"`
  ));

test('name can be accessed', () =>
  expect(schema.models.CollectionObject.name).toMatchInlineSnapshot(
    `"CollectionObject"`
  ));

test('view name is extracted from data model', () =>
  expect(schema.models.CollectionObject.view).toMatchInlineSnapshot(
    `"CollectionObject"`
  ));

test('view name is added on the front-end if missing', () =>
  expect(schema.models.SpQuery.view).toBe('Query'));

test('view name is overwritten for attachments', () =>
  expect(schema.models.Attachment.view).toBe('ObjectAttachment'));

test('model name is used as view name if missing', () =>
  expect(schema.models.AccessionAuthorization.view).toBe(
    schema.models.AccessionAuthorization.name
  ));

test('search dialog name is extracted', () =>
  expect(schema.models.CollectionObject.searchDialog).toMatchInlineSnapshot(
    `"CollectionObjectSearch"`
  ));

test('table id is extracted', () =>
  expect(schema.models.CollectionObject.tableId).toMatchInlineSnapshot(`1`));

test('isSystem flag is set to false for non-system tables', () =>
  expect(schema.models.CollectionObject.isSystem).toBe(false));

test('isSystem flag is set to true for system tables', () =>
  expect(schema.models.SpQuery.isSystem).toBe(true));

test('isHidden flag is set from localization', () =>
  expect(schema.models.CollectingEvent.isHidden).toBe(false));

test('field aliases are loaded when present', () =>
  expect(schema.models.Geography.fieldAliases).toEqual({
    acceptedparent: 'acceptedGeography',
    divisioncbx: 'division',
  }));

test('can create a resource from model', () => {
  const resource = new schema.models.CollectionObject.Resource();
  expect(resource).toBeInstanceOf(ResourceBase);
  expect(resource.specifyModel).toBe(schema.models.CollectionObject);
});

test('id field is created', () => {
  const idField = schema.models.CollectionObject.idField;
  expect(idField).toBeInstanceOf(LiteralField);
  expect(idField.isRequired).toBe(false);
  expect(idField.isHidden).toBe(true);
  expect(idField.isReadOnly).toBe(true);
  expect(idField.label).toBe('ID');
  expect(idField.type).toBe('java.lang.Integer');
  expect(idField.databaseColumn).toBe('collectionObjectId');
  expect(idField.name).toBe('collectionObjectId');
});

describe('Overrides', () => {
  describe('isCommon', () => {
    test('common base tables have isCommon set to true', () =>
      expect(schema.models.Accession.overrides.isCommon).toBe(true));

    test('non-common base tables have isCommon set to false', () =>
      expect(schema.models.AccessionAttachment.overrides.isCommon).toBe(false));
  });

  describe('isSystem', () => {
    test('non-system tables have isSystem override as false', () =>
      expect(schema.models.CollectionObject.overrides.isSystem).toBe(false));

    test('system tables have isSystem override as true', () =>
      expect(schema.models.SpQuery.overrides.isSystem).toBe(true));

    test('front-end override can make a table system', () => {
      expect(schema.models.CollectingEventAttr.isSystem).toBe(false);
      expect(schema.models.CollectingEventAttr.overrides.isSystem).toBe(true);
    });
  });

  describe('isHidden', () => {
    test('non-hidden tables have isHidden override as false', () =>
      expect(schema.models.CollectingEvent.overrides.isHidden).toBe(false));

    test('hidden tables have isHidden override as true', () => {
      expect(schema.models.AgentVariant.isHidden).toBe(true);
      expect(schema.models.AgentVariant.overrides.isHidden).toBe(true);
    });

    test('front-end override can hide a table', () => {
      expect(schema.models.SpSymbiotaInstance.isHidden).toBe(false);
      expect(schema.models.SpSymbiotaInstance.overrides.isHidden).toBe(true);
    });
  });
});

describe('getField', () => {
  test('get direct field', () =>
    expect(schema.models.CollectionObject.getField('date1')?.name).toBe(
      'date1'
    ));
  test('get indirect field', () =>
    expect(
      schema.models.CollectionObject.getField('accession.remarks')?.name
    ).toBe('remarks'));
});

const serialized = (serializable: unknown): unknown =>
  JSON.parse(JSON.stringify(serializable));

describe('getFields', () => {
  test('get direct literal field', () =>
    expect(
      serialized(schema.models.CollectionObject.getFields('date1'))
    ).toEqual(['[literalField date1]']));
  test('get direct relationship', () =>
    expect(
      serialized(schema.models.CollectionObject.getFields('accession'))
    ).toEqual(['[relationship accession]']));
  test('get indirect field', () =>
    expect(
      serialized(schema.models.CollectionObject.getFields('accession.remarks'))
    ).toEqual(['[relationship accession]', '[literalField remarks]']));
  test('get id field', () =>
    expect(
      serialized(schema.models.CollectionObject.getFields('collectionObjectId'))
    ).toEqual(['[literalField collectionObjectId]']));
  test('get id field using alias', () =>
    expect(serialized(schema.models.CollectionObject.getFields('id'))).toEqual([
      '[literalField collectionObjectId]',
    ]));
  test('get unknown field', () =>
    expect(schema.models.CollectionObject.getFields('_a')).toBeUndefined());
  test('handles empty field name case', () =>
    expect(schema.models.CollectionObject.getFields('')).toBeUndefined());
  test('throw on invalid field name', () =>
    expect(() =>
      schema.models.CollectionObject.getFields(false as unknown as string)
    ).toThrow('Invalid field name'));
  test('can get a field using schema alias', () =>
    expect(
      serialized(schema.models.Geography.getFields('acceptedParent'))
    ).toEqual(['[relationship acceptedGeography]']));
  test('can get a field using schemaExtras alias', () =>
    expect(serialized(schema.models.PickList.getFields('fieldsCBX'))).toEqual([
      '[literalField fieldName]',
    ]));
  test('can get a field using global schemaExtras alias', () =>
    expect(
      serialized(schema.models.Accession.getFields('divisionCBX'))
    ).toEqual(['[relationship division]']));
  test('can get a field even if mistakenly provided table name', () =>
    expect(
      serialized(schema.models.Locality.getFields('locality.localityName'))
    ).toEqual(['[literalField localityName]']));
  test('throws when trying to use dot notation on a literal field', () =>
    expect(() =>
      schema.models.CollectionObject.getFields('date1.date1')
    ).toThrow(/is not a relationship/u));
});

describe('strictGetField', () => {
  test('can get a field', () =>
    expect(
      schema.models.CollectionObject.strictGetField('accession.remarks')?.name
    ).toBe('remarks'));
  test('throw if field is not found', () =>
    expect(() =>
      schema.models.CollectionObject.strictGetField('accessions.remarks')
    ).toThrow('Tried to get unknown field'));
});

describe('getLiteralField', () => {
  test('can get a literal field', () =>
    expect(
      schema.models.CollectionObject.getLiteralField('accession.remarks')?.name
    ).toBe('remarks'));
  test('throw if field is a relationship', () => {
    jest.spyOn(console, 'error').mockImplementation();
    expect(() =>
      schema.models.CollectionObject.getLiteralField('accession')
    ).toThrow('is a relationship');
  });
});

describe('strictGetLiteralField', () => {
  test('can get a literal field', () =>
    expect(
      schema.models.CollectionObject.strictGetLiteralField('accession.remarks')
        ?.name
    ).toBe('remarks'));
  test('throw if field is not found', () =>
    expect(() =>
      schema.models.CollectionObject.strictGetLiteralField('abc')
    ).toThrow('Tried to get unknown literal field'));
});

describe('getRelationship', () => {
  test('can get a relationship field', () =>
    expect(
      schema.models.CollectionObject.getRelationship('accession.division')?.name
    ).toBe('division'));
  test('throw if field is not a relationship', () =>
    expect(() =>
      schema.models.CollectionObject.getRelationship('accession.remarks')
    ).toThrow('is not a relationship'));
});

describe('strictGetRelationship', () => {
  test('can get a relationship field', () =>
    expect(
      schema.models.CollectionObject.strictGetRelationship('accession.division')
        ?.name
    ).toBe('division'));
  test('throw if field is not found', () => {
    jest.spyOn(console, 'error').mockImplementation();
    expect(() =>
      schema.models.CollectionObject.strictGetRelationship('accessions')
    ).toThrow('Tried to get unknown relationship field');
  });
});

describe('getFormat', () => {
  test('can get formatter name if defined', () =>
    expect(schema.models.CollectionObject.getFormat()).toBe(
      'CollectionObject'
    ));
  test('returns undefined if formatter is not set', () =>
    expect(schema.models.AccessionAgent.getFormat()).toBeUndefined());
});

describe('getAggregator', () => {
  test('can get aggregator name if defined', () =>
    expect(schema.models.CollectionObject.getAggregator()).toBe(
      'CollectionObject'
    ));
  test('returns undefined if aggregator is not set', () =>
    expect(schema.models.Geography.getAggregator()).toBeUndefined());
});

describe('getScopingRelationship', () => {
  test('can get scoping relationship when scoped to Collection Object', () =>
    expect(schema.models.Determination.getDirectScope()?.name).toBe(
      'collectionObject'
    ));
  test('can get scoping relationship when scoped to Collection', () =>
    expect(schema.models.CollectionObject.getDirectScope()?.name).toBe(
      'collection'
    ));
  test('can get scoping relationship when scoped to Discipline', () =>
    expect(schema.models.CollectingEvent.getDirectScope()?.name).toBe(
      'discipline'
    ));
  test('can get scoping relationship when scoped to Division', () =>
    expect(schema.models.Discipline.getDirectScope()?.name).toBe('division'));
  test('can get scoping relationship when scoped to Institution', () =>
    expect(schema.models.Division.getDirectScope()?.name).toBe('institution'));
  test('returns undefined if table is not scoped', () =>
    expect(schema.models.SpecifyUser.getDirectScope()).toBeUndefined());
});

describe('getScopingPath', () => {
  test('can get scoping path when scoped to Collection Object', () =>
    expect(schema.models.Determination.getScopingPath()).toEqual([
      'institution',
      'division',
      'discipline',
      'collection',
      'collectionobject',
    ]));
  test('can get scoping path when scoped to Collection', () =>
    expect(schema.models.CollectionObject.getScopingPath()).toEqual([
      'institution',
      'division',
      'discipline',
      'collection',
    ]));
  test('can get scoping path when scoped to Discipline', () =>
    expect(schema.models.CollectingEvent.getScopingPath()).toEqual([
      'institution',
      'division',
      'discipline',
    ]));
  test('can get scoping path when scoped to Division', () =>
    expect(schema.models.Discipline.getScopingPath()).toEqual([
      'institution',
      'division',
    ]));
  test('can get scoping path when scoped to Institution', () =>
    expect(schema.models.Division.getScopingPath()).toEqual(['institution']));
  test('returns undefined if table is not scoped', () =>
    expect(schema.models.SpecifyUser.getScopingPath()).toBeUndefined());
});

test('toJSON', () =>
  expect(schema.models.CollectionObject.toJSON()).toBe(
    '[table CollectionObject]'
  ));

test('tableScoping', () =>
  expect(
    Object.fromEntries(
      Object.entries(schema.models).map(([name, table]) => [
        name,
        table
          .getScope()
          ?.map(({ name }) => name)
          .join(' > '),
      ])
    )
  ).toMatchSnapshot());

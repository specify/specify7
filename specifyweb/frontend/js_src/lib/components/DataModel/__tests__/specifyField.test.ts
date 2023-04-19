import { requireContext } from '../../../tests/helpers';
import { getUiFormatters } from '../../FieldFormatters';
import { getField } from '../helpers';
import { schema } from '../schema';
import { FieldBase } from '../specifyField';
import { strictGetTable, tables } from '../tables';

requireContext();

test('LiteralField is not a relationship', () =>
  expect(tables.CollectionObject.literalFields[0].isRelationship).toBe(false));

test('Relationship is a relationship', () =>
  expect(tables.CollectionObject.relationships[0].isRelationship).toBe(true));

test('LiteralField has a type set', () =>
  expect(tables.CollectionObject.getLiteralField('catalogNumber')?.type).toBe(
    'java.lang.String'
  ));

test('Relationship has a type set', () =>
  expect(tables.CollectionObject.getRelationship('accession')?.type).toBe(
    'many-to-one'
  ));

test('field has a table set', () =>
  expect(tables.CollectionObject.fields[0].table).toBe(
    tables.CollectionObject
  ));

test('field has a name', () =>
  expect(tables.CollectionObject.getField('accession')?.name).toBe(
    'accession'
  ));

describe('isReadOnly', () => {
  test('non-readonly field', () =>
    expect(tables.CollectionObject.getField('accession')?.isReadOnly).toBe(
      false
    ));

  test('front-end override can make field readonly', () =>
    expect(
      tables.CollectionObject.getField('timestampCreated')?.isReadOnly
    ).toBe(true));
});

describe('isRequired', () => {
  test('not-required field', () =>
    expect(tables.CollectionObject.getField('catalogNumber')?.isRequired).toBe(
      false
    ));
  test('field required by schema', () =>
    expect(tables.Accession.getField('accessionNumber')?.isRequired).toBe(
      true
    ));
  test('field required by front-end override', () =>
    expect(tables.Taxon.getField('parent')?.isRequired).toBe(true));
  test('field made optional by front-end override', () =>
    expect(tables.Attachment.getField('tableID')?.isRequired).toBe(false));
});

describe('length', () => {
  test('field length is set if available', () =>
    expect(tables.Accession.getField('accessionNumber')?.length).toBe(60));
  test('field length is not set if not provided', () =>
    expect(
      tables.Accession.getField('dateAccessioned')?.length
    ).toBeUndefined());
});

test('databaseColumn is set correctly', () =>
  expect(tables.Accession.getField('accessionNumber')?.databaseColumn).toBe(
    'AccessionNumber'
  ));

test('field localization is retrieved correctly if exists', () =>
  expect(tables.CollectionObject.getField('accession')?.localization)
    .toMatchInlineSnapshot(`
      {
        "desc": "Accession",
        "format": null,
        "ishidden": false,
        "isrequired": false,
        "isuiformatter": false,
        "name": "Accession #",
        "picklistname": null,
        "type": "ManyToOne",
        "weblinkname": null,
      }
    `));

test('field localization is empty when does not exist', () =>
  expect(
    tables.DNASequencingRunAttachment.getField('ordinal')?.localization
  ).toEqual({}));

test('localized label is retrieved correctly', () =>
  expect(tables.CollectionObject.getField('catalogNumber')?.label).toBe(
    'Cat #'
  ));

test('if localization label is missing, generate one on the fly', () =>
  expect(tables.DNASequencingRunAttachment.getField('ordinal')?.label).toBe(
    'Ordinal'
  ));

describe('isHidden', () => {
  test('hidden field is marked as hidden', () =>
    expect(tables.CollectionObject.getField('text1')?.isHidden).toBe(true));

  test('not-hidden field is marked as non-hidden', () =>
    expect(tables.CollectionObject.getField('accession')?.isHidden).toBe(
      false
    ));

  test('front-end can make field hidden', () =>
    expect(tables.SpecifyUser.getField('password')?.isHidden).toBe(true));
});

describe('override', () => {
  describe('isRequired', () => {
    test('field required by schema is marked as required', () =>
      expect(
        tables.Accession.getField('accessionNumber')?.overrides.isRequired
      ).toBe(true));

    test('field with "optional" override is not required', () => {
      const field = getField(tables.Agent, 'agentType');
      expect(field.isRequired).toBe(true);
      expect(field.overrides.isRequired).toBe(false);
    });
  });

  describe('isHidden', () => {
    test('hidden field is marked as hidden', () =>
      expect(
        tables.CollectionObject.getField('text1')?.overrides.isHidden
      ).toBe(true));

    test('field with "hidden" override is not required', () => {
      const field = getField(tables.Determination, 'isCurrent');
      expect(field.isRequired).toBe(true);
      expect(field.overrides.isRequired).toBe(false);
      expect(field.isHidden).toBe(false);
      expect(field.overrides.isHidden).toBe(true);
    });

    test('required field is made not hidden', () => {
      const field = getField(tables.AccessionAttachment, 'ordinal');
      expect(field.isRequired).toBe(true);
      expect(field.overrides.isRequired).toBe(true);
      expect(field.isHidden).toBe(true);
      expect(field.overrides.isHidden).toBe(false);
    });
  });

  describe('isReadOnly', () => {
    test('inherits schema value', () => {
      const field = getField(tables.Accession, 'integer1');
      expect(field.isHidden).toBe(true);
      expect(field.overrides.isHidden).toBe(true);
    });

    test('can be overwritten by the front-end', () => {
      const field = getField(tables.PrepType, 'isLoanable');
      expect(field.isReadOnly).toBe(false);
      expect(field.overrides.isReadOnly).toBe(true);
    });

    // Because https://github.com/specify/specify7/issues/1399
    test('all tree table relationships are readonly', () => {
      const field = getField(tables.Taxon, 'definition');
      expect(field.isReadOnly).toBe(false);
      expect(field.overrides.isReadOnly).toBe(true);
    });

    test('readonly fields are not required', () => {
      const field = getField(tables.SpecifyUser, 'isAdmin');
      expect(field.isReadOnly).toBe(true);
      expect(field.overrides.isReadOnly).toBe(true);
      expect(field.isRequired).toBe(true);
      expect(field.overrides.isRequired).toBe(false);
    });
  });
});

describe('isVirtual', () => {
  test('virtual field', () =>
    expect(getField(tables.Accession, 'actualTotalCountAmt').isVirtual).toBe(
      true
    ));
  test('non virtual field', () =>
    expect(getField(tables.Accession, 'accessionNumber').isVirtual).toBe(
      false
    ));
});

test('getLocalizedDesc', () =>
  expect(
    getField(tables.Deaccession, 'timestampModified').getLocalizedDesc()
  ).toBe('The timestamp the record was last modified.'));

test('getFormat', () =>
  expect(getField(tables.CollectionObject, 'catalogNumber').getFormat()).toBe(
    'CatalogNumberNumeric'
  ));

test('getUiFormatter', () =>
  expect(
    getField(tables.CollectionObject, 'catalogNumber').getUiFormatter()
  ).toBe(getUiFormatters().CatalogNumberNumeric));

describe('getPickList', () => {
  test('can get schema-assigned pick-list', () =>
    expect(getField(tables.AccessionAgent, 'role').getPickList()).toBe(
      'AccessionRole'
    ));
  test('can get front-end only pick list', () =>
    expect(getField(tables.PickList, 'tableName').getPickList()).toBe(
      '_TablesByName'
    ));
});

test('getWebLinkName', () =>
  expect(
    tables.CollectionObject.getField('reservedText')!.getWebLinkName()
  ).toBe('CTScan'));

describe('isTemporal', () => {
  test('true', () =>
    expect(
      tables.CollectionObject.getField('catalogedDate')?.isTemporal()
    ).toBe(true));
  test('false', () =>
    expect(
      tables.CollectionObject.getField('catalogedDatePrecision')?.isTemporal()
    ).toBe(false));
});

describe('toJSON', () => {
  test('field', () =>
    expect(tables.CollectionObject.getField('catalogNumber')?.toJSON()).toBe(
      '[literalField CollectionObject.catalogNumber]'
    ));
  test('relationship', () =>
    expect(
      tables.CollectionObject.getField('accession.division')?.toJSON()
    ).toBe('[relationship Accession.division]'));
});

describe('fromJson', () => {
  test('CollectionObject.catalogNumber', () =>
    expect(
      FieldBase.fromJson('[literalField CollectionObject.catalogNumber]')
    ).toBe(getField(tables.CollectionObject, 'catalogNumber')));
  test('Accession.createdByAgent', () =>
    expect(FieldBase.fromJson('[relationship Accession.createdByAgent]')).toBe(
      getField(tables.Accession, 'createdByAgent')
    ));
  test('Table name typo', () =>
    expect(
      FieldBase.fromJson('[literalField Accessions.createdByAgent]')
    ).toBeUndefined());
  test('Invalid type', () =>
    expect(FieldBase.fromJson('[table Accession.text1]')).toBeUndefined());
  test('Incorrect formatting', () =>
    expect(
      FieldBase.fromJson('table CollectionObject.catalogNumber')
    ).toBeUndefined());
  test('Empty container', () =>
    expect(FieldBase.fromJson('[]')).toBeUndefined());
});

describe('Relationship', () => {
  test('otherSideName is set if provided', () =>
    expect(
      tables.CollectionObject.getRelationship('accession')?.otherSideName
    ).toBe('collectionObjects'));

  test('relatedTable is set', () =>
    expect(
      tables.CollectionObject.getRelationship('accession')?.relatedTable
    ).toBe(tables.Accession));

  test('relationship to system table is made optional', () => {
    const field = getField(tables.Accession, 'division');
    expect(field.relatedTable.overrides.isSystem).toBe(true);
    expect(field.isRequired).toBe(true);
    expect(field.overrides.isRequired).toBe(false);
  });

  describe('relationships to hidden tables are hidden', () => {
    test('base case', () => {
      const field = getField(tables.LithoStrat, 'paleoContexts');
      expect(field.relatedTable.overrides.isHidden).toBe(true);
      expect(field.overrides.isHidden).toBe(true);
    });
    test('unless the relationship is referring to the current table', () => {
      const field = getField(tables.GeologicTimePeriod, 'children');
      expect(field.relatedTable).toBe(field.table);
      expect(field.relatedTable.overrides.isHidden).toBe(true);
      expect(field.overrides.isHidden).toBe(false);
    });
  });

  describe('isDependent', () => {
    test('base case', () =>
      expect(
        tables.Accession.getRelationship('accessionAgents')?.isDependent()
      ).toBe(true));

    test('collectingEvent may be independent', () => {
      const field = getField(tables.CollectionObject, 'collectingEvent');
      expect(field.isDependent()).toBe(schema.embeddedCollectingEvent);
    });

    test('paleoContext may be independent', () => {
      const table = strictGetTable(schema.paleoContextChildTable);
      const field = table.strictGetRelationship('paleoContext');
      expect(field.isDependent()).toBe(schema.embeddedPaleoContext);
    });
  });

  test('getReverse', () => {
    const collectingEvent = getField(
      tables.CollectionObject,
      'collectingEvent'
    );
    const collectionObject = getField(
      tables.CollectingEvent,
      'collectionObjects'
    );
    expect(collectingEvent.getReverse()).toBe(collectionObject);
  });
});

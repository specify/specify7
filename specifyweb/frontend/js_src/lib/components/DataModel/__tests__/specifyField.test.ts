import { requireContext } from '../../../tests/helpers';
import { getUiFormatters } from '../../FieldFormatters';
import { getField } from '../helpers';
import { schema, strictGetModel } from '../schema';

requireContext();

test('LiteralField is not a relationship', () =>
  expect(schema.models.CollectionObject.literalFields[0].isRelationship).toBe(
    false
  ));

test('Relationship is a relationship', () =>
  expect(schema.models.CollectionObject.relationships[0].isRelationship).toBe(
    true
  ));

test('LiteralField has a type set', () =>
  expect(
    schema.models.CollectionObject.getLiteralField('catalogNumber')?.type
  ).toBe('java.lang.String'));

test('Relationship has a type set', () =>
  expect(
    schema.models.CollectionObject.getRelationship('accession')?.type
  ).toBe('many-to-one'));

test('field has a model set', () =>
  expect(schema.models.CollectionObject.fields[0].model).toBe(
    schema.models.CollectionObject
  ));

test('field has a name', () =>
  expect(schema.models.CollectionObject.getField('accession')?.name).toBe(
    'accession'
  ));

describe('isReadOnly', () => {
  test('non-readonly field', () =>
    expect(
      schema.models.CollectionObject.getField('accession')?.isReadOnly
    ).toBe(false));

  test('front-end override can make field readonly', () =>
    expect(
      schema.models.CollectionObject.getField('timestampCreated')?.isReadOnly
    ).toBe(true));
});

describe('isRequired', () => {
  test('not-required field', () =>
    expect(
      schema.models.CollectionObject.getField('catalogNumber')?.isRequired
    ).toBe(false));
  test('field required by schema', () =>
    expect(
      schema.models.Accession.getField('accessionNumber')?.isRequired
    ).toBe(true));
  test('field required by front-end override', () =>
    expect(schema.models.Taxon.getField('parent')?.isRequired).toBe(true));
  test('field made optional by front-end override', () =>
    expect(schema.models.Attachment.getField('tableID')?.isRequired).toBe(
      false
    ));
});

describe('length', () => {
  test('field length is set if available', () =>
    expect(schema.models.Accession.getField('accessionNumber')?.length).toBe(
      60
    ));
  test('field length is not set if not provided', () =>
    expect(
      schema.models.Accession.getField('dateAccessioned')?.length
    ).toBeUndefined());
});

test('databaseColumn is set correctly', () =>
  expect(
    schema.models.Accession.getField('accessionNumber')?.databaseColumn
  ).toBe('AccessionNumber'));

test('field localization is retrieved correctly if exists', () =>
  expect(schema.models.CollectionObject.getField('accession')?.localization)
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
    schema.models.DNASequencingRunAttachment.getField('ordinal')?.localization
  ).toEqual({}));

test('localized label is retrieved correctly', () =>
  expect(schema.models.CollectionObject.getField('catalogNumber')?.label).toBe(
    'Cat #'
  ));

test('if localization label is missing, generate one on the fly', () =>
  expect(
    schema.models.DNASequencingRunAttachment.getField('ordinal')?.label
  ).toBe('Ordinal'));

describe('isHidden', () => {
  test('hidden field is marked as hidden', () =>
    expect(schema.models.CollectionObject.getField('text1')?.isHidden).toBe(
      true
    ));

  test('not-hidden field is marked as non-hidden', () =>
    expect(schema.models.CollectionObject.getField('accession')?.isHidden).toBe(
      false
    ));

  test('front-end can make field hidden', () =>
    expect(schema.models.SpecifyUser.getField('password')?.isHidden).toBe(
      true
    ));
});

describe('override', () => {
  describe('isRequired', () => {
    test('field required by schema is marked as required', () =>
      expect(
        schema.models.Accession.getField('accessionNumber')?.overrides
          .isRequired
      ).toBe(true));

    test('field with "optional" override is not required', () => {
      const field = getField(schema.models.Agent, 'agentType');
      expect(field.isRequired).toBe(true);
      expect(field.overrides.isRequired).toBe(false);
    });
  });

  describe('isHidden', () => {
    test('hidden field is marked as hidden', () =>
      expect(
        schema.models.CollectionObject.getField('text1')?.overrides.isHidden
      ).toBe(true));

    test('field with "hidden" override is not required', () => {
      const field = getField(schema.models.Determination, 'isCurrent');
      expect(field.isRequired).toBe(true);
      expect(field.overrides.isRequired).toBe(false);
      expect(field.isHidden).toBe(false);
      expect(field.overrides.isHidden).toBe(true);
    });

    test('required field is made not hidden', () => {
      const field = getField(schema.models.AccessionAttachment, 'ordinal');
      expect(field.isRequired).toBe(true);
      expect(field.overrides.isRequired).toBe(true);
      expect(field.isHidden).toBe(true);
      expect(field.overrides.isHidden).toBe(false);
    });
  });

  describe('isReadOnly', () => {
    test('inherits schema value', () => {
      const field = getField(schema.models.Accession, 'integer1');
      expect(field.isHidden).toBe(true);
      expect(field.overrides.isHidden).toBe(true);
    });

    test('can be overwritten by the front-end', () => {
      const field = getField(schema.models.PrepType, 'isLoanable');
      expect(field.isReadOnly).toBe(false);
      expect(field.overrides.isReadOnly).toBe(true);
    });

    // Because https://github.com/specify/specify7/issues/1399
    test('all tree table relationships are readonly', () => {
      const field = getField(schema.models.Taxon, 'definition');
      expect(field.isReadOnly).toBe(false);
      expect(field.overrides.isReadOnly).toBe(true);
    });

    test('readonly fields are not required', () => {
      const field = getField(schema.models.SpecifyUser, 'isAdmin');
      expect(field.isReadOnly).toBe(true);
      expect(field.overrides.isReadOnly).toBe(true);
      expect(field.isRequired).toBe(true);
      expect(field.overrides.isRequired).toBe(false);
    });
  });
});

describe('isVirtual', () => {
  test('virtual field', () =>
    expect(
      getField(schema.models.Accession, 'actualTotalCountAmt').isVirtual
    ).toBe(true));
  test('non virtual field', () =>
    expect(getField(schema.models.Accession, 'accessionNumber').isVirtual).toBe(
      false
    ));
});

test('getLocalizedDesc', () =>
  expect(
    getField(schema.models.Deaccession, 'timestampModified').getLocalizedDesc()
  ).toBe('The timestamp the record was last modified.'));

test('getFormat', () =>
  expect(
    getField(schema.models.CollectionObject, 'catalogNumber').getFormat()
  ).toBe('CatalogNumberNumeric'));

test('getUiFormatter', () =>
  expect(
    getField(schema.models.CollectionObject, 'catalogNumber').getUiFormatter()
  ).toBe(getUiFormatters().CatalogNumberNumeric));

describe('getPickList', () => {
  test('can get schema-assigned pick-list', () =>
    expect(getField(schema.models.AccessionAgent, 'role').getPickList()).toBe(
      'AccessionRole'
    ));
  test('can get front-end only pick list', () =>
    expect(getField(schema.models.PickList, 'tableName').getPickList()).toBe(
      '_TablesByName'
    ));
});

test('getWebLinkName', () =>
  expect(
    schema.models.CollectionObject.getField('reservedText')!.getWebLinkName()
  ).toBe('CTScan'));

describe('isTemporal', () => {
  test('true', () =>
    expect(
      schema.models.CollectionObject.getField('catalogedDate')?.isTemporal()
    ).toBe(true));
  test('false', () =>
    expect(
      schema.models.CollectionObject.getField(
        'catalogedDatePrecision'
      )?.isTemporal()
    ).toBe(false));
});

describe('toJSON', () => {
  test('field', () =>
    expect(
      schema.models.CollectionObject.getField('catalogNumber')?.toJSON()
    ).toBe('[literalField catalogNumber]'));
  test('relationship', () =>
    expect(
      schema.models.CollectionObject.getField('accession.division')?.toJSON()
    ).toBe('[relationship division]'));
});

describe('Relationship', () => {
  test('otherSideName is set if provided', () =>
    expect(
      schema.models.CollectionObject.getRelationship('accession')?.otherSideName
    ).toBe('collectionObjects'));

  test('relatedModel is set', () =>
    expect(
      schema.models.CollectionObject.getRelationship('accession')?.relatedModel
    ).toBe(schema.models.Accession));

  test('relationship to system table is made optional', () => {
    const field = getField(schema.models.Accession, 'division');
    expect(field.relatedModel.overrides.isSystem).toBe(true);
    expect(field.isRequired).toBe(true);
    expect(field.overrides.isRequired).toBe(false);
  });

  describe('relationships to hidden models are hidden', () => {
    test('base case', () => {
      const field = getField(schema.models.LithoStrat, 'paleoContexts');
      expect(field.relatedModel.overrides.isHidden).toBe(true);
      expect(field.overrides.isHidden).toBe(true);
    });
    test('unless the relationship is referring to the current table', () => {
      const field = getField(schema.models.GeologicTimePeriod, 'children');
      expect(field.relatedModel).toBe(field.model);
      expect(field.relatedModel.overrides.isHidden).toBe(true);
      expect(field.overrides.isHidden).toBe(false);
    });
  });

  describe('isDependent', () => {
    test('base case', () =>
      expect(
        schema.models.Accession.getRelationship(
          'accessionAgents'
        )?.isDependent()
      ).toBe(true));

    test('collectingEvent may be independent', () => {
      const field = getField(schema.models.CollectionObject, 'collectingEvent');
      expect(field.isDependent()).toBe(schema.embeddedCollectingEvent);
    });

    test('paleoContext may be independent', () => {
      const model = strictGetModel(schema.paleoContextChildTable);
      const field = model.strictGetRelationship('paleoContext');
      expect(field.isDependent()).toBe(schema.embeddedPaleoContext);
    });
  });

  test('getReverse', () => {
    const collectingEvent = getField(
      schema.models.CollectionObject,
      'collectingEvent'
    );
    const collectionObject = getField(
      schema.models.CollectingEvent,
      'collectionObjects'
    );
    expect(collectingEvent.getReverse()).toBe(collectionObject);
  });
});

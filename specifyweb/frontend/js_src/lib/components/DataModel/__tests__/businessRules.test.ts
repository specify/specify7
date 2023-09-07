import { mockTime, requireContext } from '../../../tests/helpers';
import { overwriteReadOnly } from '../../../utils/types';
import { businessRuleDefs } from '../businessRuleDefs';
import { getResourceApiUrl } from '../resource';
import { schema } from '../schema';

mockTime();
requireContext();

describe('uniqueness rules assigned correctly', () => {
  test('otherField uniqueness rule assigned', async () => {
    expect(businessRuleDefs.AccessionAgent?.uniqueIn).toMatchInlineSnapshot(`
      {
        "agent": [
          {
            "field": "accession",
            "otherFields": [
              "role",
            ],
          },
          {
            "field": "repositoryagreement",
            "otherFields": [
              "role",
            ],
          },
        ],
        "role": [
          {
            "field": "accession",
            "otherFields": [
              "agent",
            ],
          },
          {
            "field": "repositoryagreement",
            "otherFields": [
              "agent",
            ],
          },
        ],
      }
    `);
  });

  test('Standard rules assigned correctly', async () => {
    expect(businessRuleDefs.CollectionObject?.uniqueIn).toMatchInlineSnapshot(`
      {
        "catalogNumber": [
          "collection",
        ],
        "guid": [
          undefined,
        ],
        "uniqueIdentifier": [
          undefined,
        ],
      }
    `);
  });

  test('JSON nulls are converted to undefined', async () => {
    expect(businessRuleDefs.Permit?.uniqueIn).toMatchInlineSnapshot(`
      {
        "permitNumber": [
          undefined,
        ],
      }
    `);
  });
});

describe('Borrow Material business rules', () => {
  const borrowMaterialId = 1;
  const borrowMaterialUrl = getResourceApiUrl(
    'BorrowMaterial',
    borrowMaterialId
  );

  const getBaseBorrowMaterial = () =>
    new schema.models.BorrowMaterial.Resource({
      id: borrowMaterialId,
      resource_uri: borrowMaterialUrl,
      quantity: 20,
      quantityreturned: 13,
      quantityresolved: 15,
    });

  test('fieldCheck quantityReturned', async () => {
    const borrowMaterial = getBaseBorrowMaterial();

    borrowMaterial.set('quantityReturned', 30);
    expect(borrowMaterial.get('quantityReturned')).toBe(15);
  });

  test('fieldCheck quantityResolved', async () => {
    const borrowMaterial = getBaseBorrowMaterial();

    borrowMaterial.set('quantityResolved', 30);
    expect(borrowMaterial.get('quantityResolved')).toBe(20);

    borrowMaterial.set('quantityResolved', 5);
    expect(borrowMaterial.get('quantityResolved')).toBe(13);
  });
});

describe('Collection Object business rules', () => {
  const collectionObjectlId = 2;
  const collectionObjectUrl = getResourceApiUrl(
    'CollectionObject',
    collectionObjectlId
  );

  const getBaseCollectionObject = () =>
    new schema.models.CollectionObject.Resource({
      id: collectionObjectlId,
      resource_uri: collectionObjectUrl,
    });

  const orginalEmbeddedCollectingEvent = schema.embeddedCollectingEvent;

  beforeAll(() => {
    overwriteReadOnly(schema, 'embeddedCollectingEvent', true);
  });

  afterAll(() => {
    overwriteReadOnly(
      schema,
      'embeddedCollectingEvent',
      orginalEmbeddedCollectingEvent
    );
  });

  test('CollectionObject customInit', async () => {
    const collectionObject = getBaseCollectionObject();

    expect(collectionObject.get('collectingEvent')).toBeDefined();
  });
});

describe('DNASequence business rules', () => {
  test('fieldCheck geneSequence', async () => {
    const dNASequence = new schema.models.DNASequence.Resource({
      id: 1,
    });
    dNASequence.set('geneSequence', 'aaa  ttttt  gg  c zzzz');

    await dNASequence.businessRuleManager?.checkField('geneSequence');

    expect(dNASequence.get('compA')).toBe(3);
    expect(dNASequence.get('compT')).toBe(5);
    expect(dNASequence.get('compG')).toBe(2);
    expect(dNASequence.get('compC')).toBe(1);
    expect(dNASequence.get('ambiguousResidues')).toBe(4);
  });
});

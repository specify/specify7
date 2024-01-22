import { overrideAjax } from '../../../tests/ajax';
import { mockTime, requireContext } from '../../../tests/helpers';
import { overwriteReadOnly } from '../../../utils/types';
import { getResourceApiUrl } from '../resource';
import { schema } from '../schema';

mockTime();
requireContext();

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

describe('uniqueness rules', () => {
  overrideAjax(
    '/api/specify/collectionobject/?domainfilter=false&catalognumber=000000001&collection=4&offset=0',
    {
      objects: [
        {
          id: 1,
          catalogNumber: '000000001',
          collection: '/api/specify/collection/4/',
        },
      ],
      meta: {
        limit: 20,
        offset: 0,
        total_count: 1,
      },
    }
  );
  test('simple uniqueness rule', async () => {
    const collectionObject = new schema.models.CollectionObject.Resource({
      collection: '/api/specify/collection/4/',
      catalogNumber: '000000001',
    });
    await collectionObject.businessRuleManager?.checkField('catalogNumber');
    expect(collectionObject.saveBlockers?.blockers).toMatchInlineSnapshot(`
      {
        "br-uniqueness-catalognumber": {
          "deferred": false,
          "fieldName": "catalognumber",
          "reason": "Value must be unique to Collection",
          "resource": {
            "_tableName": "CollectionObject",
            "catalognumber": "000000001",
            "collection": "/api/specify/collection/4/",
          },
        },
      }
    `);
  });

  test('rule with local collection', async () => {
    const accessionId = 1;
    const accession = new schema.models.Accession.Resource({
      id: accessionId,
    });

    const accessionAgent1 = new schema.models.AccessionAgent.Resource({
      accession: getResourceApiUrl('Accession', accessionId),
      agent: getResourceApiUrl('Agent', 1),
      role: 'Borrower',
    });
    const accessionAgent2 = new schema.models.AccessionAgent.Resource({
      accession: getResourceApiUrl('Accession', accessionId),
      agent: getResourceApiUrl('Agent', 1),
      role: 'Borrower',
    });

    accession.set('accessionAgents', [accessionAgent1, accessionAgent2]);

    await accessionAgent2.businessRuleManager?.checkField('role');

    expect(accessionAgent2.saveBlockers?.blockers).toMatchInlineSnapshot(`
      {
        "br-uniqueness-role": {
          "deferred": false,
          "fieldName": "role",
          "reason": "Values of Role and Agent must be unique to Accession",
          "resource": {
            "_tableName": "AccessionAgent",
            "accession": "/api/specify/accession/1/",
            "agent": "/api/specify/agent/1/",
            "role": "Borrower",
          },
        },
      }
    `);
  });
});

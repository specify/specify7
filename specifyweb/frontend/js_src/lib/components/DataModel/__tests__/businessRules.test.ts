import { mockTime, requireContext } from '../../../tests/helpers';
import { overwriteReadOnly } from '../../../utils/types';
import { businessRuleDefs } from '../businessRuleDefs';
import type { SerializedRecord } from '../helperTypes';
import { getResourceApiUrl } from '../resource';
import { tables } from '../tables';
import type { Determination } from '../types';

mockTime();
requireContext();

test('uniqueness rules assigned correctly', () =>
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
  `));

const determinationId = 321;
const determinationUrl = getResourceApiUrl('Determination', determinationId);
const determinationResponse: Partial<SerializedRecord<Determination>> = {
  id: determinationId,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  resource_uri: determinationUrl,
};

const collectionObjectId = 220;
const collectionObjectUrl = getResourceApiUrl(
  'CollectionObject',
  collectionObjectId
);
const collectionObjectResponse = {
  id: collectionObjectId,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  resource_uri: collectionObjectUrl,
  catalognumber: '000022002',
  collection: getResourceApiUrl('Collection', 4),
  determinations: determinationUrl,
};

overrideAjax(collectionObjectUrl, collectionObjectResponse);
overrideAjax(determinationUrl, determinationResponse);

describe('business rules', () => {
  test('collectionObject customInit', async () => {
    const resource = new tables.CollectionObject.Resource({
      id: collectionObjectId,
    });
    await resource.fetch();
    expect(resource.get('collectingEvent')).toBeDefined();
    await resource.save();
  });

  describe('determination business rules', () => {
    test('determination customInit', async () => {
      const determination = new tables.Determination.Resource({
        id: determinationId,
      });
      await determination.fetch();
      expect(determination.get('isCurrent')).toBe(true);
    });
    test('only one determination isCurrent', async () => {
      const determination = new tables.Determination.Resource({
        id: determinationId,
      });
      const resource = new tables.CollectionObject.Resource({
        id: collectionObjectId,
      });
      await resource.rgetCollection('determinations').then((collection) => {
        collection.add(new tables.Determination.Resource());
      });
      expect(determination.get('isCurrent')).toBe(false);
    });
    test('determination taxon field check', () => {
      const determination = new tables.Determination.Resource({
        id: determinationId,
      });
      const taxonId = 19_345;
      const taxonUrl = getResourceApiUrl('Taxon', taxonId);
      const taxonResponse = {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        resource_uri: getResourceApiUrl('Taxon', taxonUrl),
        id: taxonId,
        name: 'melas',
        fullName: 'Ameiurus melas',
      };
      overrideAjax(taxonUrl, taxonResponse);
      determination.set(
        'taxon',
        new tables.Taxon.Resource({
          id: taxonId,
        })
      );
      expect(determination.get('preferredTaxon')).toBe(taxonUrl);
    });

  const orginalEmbeddedCollectingEvent = schema.embeddedCollectingEvent;

  beforeAll(() => {
    overwriteReadOnly(schema, 'embeddedCollectingEvent', true);
  });

  test('dnaSequence genesequence fieldCheck', () => {
    const dnaSequence = new tables.DNASequence.Resource({
      id: 1,
    });
    dNASequence.set('geneSequence', 'aaa  ttttt  gg  c zzzz');

    expect(dnaSequence.get('totalResidues')).toBe(10);
    expect(dnaSequence.get('compA')).toBe(3);
    expect(dnaSequence.get('ambiguousResidues')).toBe(4);
  });
});

describe('uniquenessRules', () => {
  const permitOneId = 1;
  const permitOneUrl = '/api/specify/permit/1/';
  const permitOneResponse = {
    id: permitOneId,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    resource_uri: permitOneUrl,
    permitNumber: '20',
  };
  overrideAjax(permitOneUrl, permitOneResponse);

  const permitTwoId = 2;
  const permitTwoUrl = getResourceApiUrl('Permit', permitTwoId);
  const permitTwoResponse = {
    id: permitTwoId,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    resource_uri: permitTwoUrl,
    permitNumber: '20',
  };
  overrideAjax(permitTwoUrl, permitTwoResponse);

  overrideAjax(getResourceApiUrl('CollectionObject', 221), {
    id: 221,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    resource_uri: getResourceApiUrl('CollectionObject', 221),
    catalogNumber: '000022002',
  });

  test('global uniquenessRule', async () => {
    const testPermit = new tables.Permit.Resource({
      id: permitOneId,
      permitNumber: '20',
    });
    await testPermit.save();

    const duplicatePermit = new tables.Permit.Resource({
      id: permitTwoId,
      permitNumber: '20',
    });
    await expect(
      duplicatePermit
        .fetch()
        .then((permit) =>
          permit.businessRuleManager?.checkField('permitNumber')
        )
    ).resolves.toBe({
      key: 'br-uniqueness-permitnumber',
      valid: false,
      reason: 'Value must be unique to Database',
    });
  });

  test('scoped uniqueness rule', async () => {
    const resource = new tables.CollectionObject.Resource({
      id: 221,
      catalogNumber: '000022002',
    });
    await expect(
      resource
        .fetch()
        .then((collectionObject) =>
          collectionObject.businessRuleManager?.checkField('catalogNumber')
        )
    ).resolves.toBe({
      key: 'br-uniqueness-catalognumber',
      valid: false,
      reason: 'Value must be unique to Collection',
    });
  });
});

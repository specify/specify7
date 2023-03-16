import { overrideAjax } from '../../../tests/ajax';
import { mockTime, requireContext } from '../../../tests/helpers';
import { businessRuleDefs } from '../businessRuleDefs';
import { SerializedModel } from '../helperTypes';
import { getResourceApiUrl } from '../resource';
import { schema } from '../schema';
import { Determination } from '../types';

mockTime();
requireContext();

test('uniqueness rules assigned correctly', async () => {
  const accessionAgentUniquenessRules = {
    role: [
      {
        field: 'accession',
        otherFields: ['agent'],
      },
      {
        field: 'repositoryagreement',
        otherFields: ['agent'],
      },
    ],
    agent: [
      {
        field: 'accession',
        otherFields: ['role'],
      },
      {
        field: 'repositoryagreement',
        otherFields: ['role'],
      },
    ],
  };
  expect(businessRuleDefs.AccessionAgent?.uniqueIn).toBe(
    accessionAgentUniquenessRules
  );
});

const determinationId = 321;
const determinationUrl = getResourceApiUrl('Determination', determinationId);
const determinationResponse: Partial<SerializedModel<Determination>> = {
  resource_uri: determinationUrl,
  id: determinationId,
};

const collectionObjectId = 220;
const collectionObjectUrl = getResourceApiUrl(
  'CollectionObject',
  collectionObjectId
);
const collectionObjectResponse = {
  id: collectionObjectId,
  resource_uri: collectionObjectUrl,
  catalognumber: '000022002',
  collection: getResourceApiUrl('Collection', 4),
  determinations: [determinationResponse],
};

overrideAjax(collectionObjectUrl, collectionObjectResponse);
overrideAjax(determinationUrl, determinationResponse);

test('collectionObject customInit', async () => {
  const resource = new schema.models.CollectionObject.Resource({
    id: collectionObjectId,
  });
  await resource.fetch();
  expect(resource.get('collectingEvent')).toBeDefined();
  resource.save();
});

describe('determination business rules', () => {
  const resource = new schema.models.CollectionObject.Resource({
    id: collectionObjectId,
  });
  const determination = new schema.models.Determination.Resource({
    id: determinationId,
  });
  test('determination customInit', async () => {
    await determination.fetch();
    expect(determination.get('isCurrent')).toBe(true);
  });
  test('only one determination isCurrent', async () => {
    await resource.rgetCollection('determinations').then((collection) => {
      collection.add(new schema.models.Determination.Resource());
    });
    expect(determination.get('isCurrent')).toBe(false);
  });
  test('determination taxon field check', async () => {
    const taxonId = 19345;
    const taxonUrl = getResourceApiUrl('Taxon', taxonId);
    const taxonResponse = {
      resource_uri: getResourceApiUrl('Taxon', taxonUrl),
      id: taxonId,
      name: 'melas',
      fullName: 'Ameiurus melas',
    };
    overrideAjax(taxonUrl, taxonResponse);
    determination.set(
      'taxon',
      new schema.models.Taxon.Resource({
        id: taxonId,
      })
    );
    expect(determination.get('preferredTaxon')).toBe(taxonUrl);
  });
});

test('dnaSequence genesequence fieldCheck', async () => {
  const dnaSequence = new schema.models.DNASequence.Resource({
    id: 1,
  });
  dnaSequence.set('geneSequence', 'cat123gaaz');

  expect(dnaSequence.get('totalResidues')).toBe(10);
  expect(dnaSequence.get('compA')).toBe(3);
  expect(dnaSequence.get('ambiguousResidues')).toBe(4);
});

test('global uniquenessRule', async () => {
  const testPermit = new schema.models.Permit.Resource({
    id: 1,
    permitNumber: '20',
  });
  await testPermit.save();
  const duplicatePermit = new schema.models.Permit.Resource({
    id: 2,
    permitNumber: '20',
  });
  expect(
    duplicatePermit
      .fetch()
      .then((permit) => permit.businessRuleManager?.checkField('permitNumber'))
  ).resolves.toBe({
    key: 'br-uniqueness-permitnumber',
    valid: false,
    reason: 'Value must be unique to Database',
  });
});

test('scoped uniqueness rule', async () => {
  const resource = new schema.models.CollectionObject.Resource({
    id: 221,
    catalogNumber: '000022002',
  });
  expect(
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

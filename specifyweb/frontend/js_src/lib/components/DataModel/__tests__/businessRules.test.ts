import { act, renderHook } from '@testing-library/react';

import { resourcesText } from '../../../localization/resources';
import { overrideAjax } from '../../../tests/ajax';
import { mockTime, requireContext } from '../../../tests/helpers';
import type { RA } from '../../../utils/types';
import { overwriteReadOnly } from '../../../utils/types';
import { getPref } from '../../InitialContext/remotePrefs';
import { cogTypes } from '../helpers';
import type { SerializedResource } from '../helperTypes';
import type { SpecifyResource } from '../legacyTypes';
import { getResourceApiUrl } from '../resource';
import { useSaveBlockers } from '../saveBlockers';
import { schema } from '../schema';
import { tables } from '../tables';
import type {
  CollectionObjectType,
  Collector,
  Taxon,
  TaxonTreeDefItem,
} from '../types';

mockTime();
requireContext();

describe('Borrow Material business rules', () => {
  const borrowMaterialId = 1;
  const borrowMaterialUrl = getResourceApiUrl(
    'BorrowMaterial',
    borrowMaterialId
  );

  const getBaseBorrowMaterial = () =>
    new tables.BorrowMaterial.Resource({
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
  const collectionObjectTypeUrl = getResourceApiUrl('CollectionObjectType', 1);
  const collectionObjectType: Partial<
    SerializedResource<CollectionObjectType>
  > = {
    id: 1,
    name: 'Entomology',
    taxonTreeDef: getResourceApiUrl('TaxonTreeDef', 1),
    resource_uri: collectionObjectTypeUrl,
  };
  overrideAjax(collectionObjectTypeUrl, collectionObjectType);

  const otherTaxonId = 1;
  const otherTaxon: Partial<SerializedResource<Taxon>> = {
    id: otherTaxonId,
    isAccepted: true,
    rankId: 10,
    definition: getResourceApiUrl('TaxonTreeDef', 2),
    resource_uri: getResourceApiUrl('Taxon', otherTaxonId),
  };

  overrideAjax(getResourceApiUrl('Taxon', otherTaxonId), otherTaxon);

  const collectionObjectlId = 2;
  const collectionObjectUrl = getResourceApiUrl(
    'CollectionObject',
    collectionObjectlId
  );

  const getBaseCollectionObject = () =>
    new tables.CollectionObject.Resource({
      id: collectionObjectlId,
      determinations: [
        {
          taxon: getResourceApiUrl('Taxon', otherTaxonId),
          preferredTaxon: getResourceApiUrl('Taxon', otherTaxonId),
          isCurrent: true,
        },
      ],
      resource_uri: collectionObjectUrl,
      description: 'Base collection object',
      catalogNumber: '123',
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
    expect(collectionObject.get('collectionObjectType')).toEqual(
      schema.defaultCollectionObjectType
    );
  });

  const otherCollectionObjectTypeUrl = getResourceApiUrl(
    'CollectionObjectType',
    2
  );
  const otherCollectionObjectType: Partial<
    SerializedResource<CollectionObjectType>
  > = {
    id: 2,
    name: 'Fossil',
    taxonTreeDef: getResourceApiUrl('TaxonTreeDef', 2),
    resource_uri: otherCollectionObjectTypeUrl,
  };
  overrideAjax(otherCollectionObjectTypeUrl, otherCollectionObjectType);

  test('CollectionObject -> determinations: Save blocked when a determination does not belong to COT tree', async () => {
    const collectionObject = getBaseCollectionObject();
    collectionObject.set(
      'collectionObjectType',
      getResourceApiUrl('CollectionObjectType', 1)
    );

    const determination =
      collectionObject.getDependentResource('determinations')?.models[0];

    const { result } = renderHook(() =>
      useSaveBlockers(determination, tables.Determination.getField('Taxon'))
    );

    await act(async () => {
      await collectionObject?.businessRuleManager?.checkField(
        'collectionObjectType'
      );
    });
    expect(result.current[0]).toStrictEqual([
      resourcesText.invalidDeterminationTaxon(),
    ]);

    collectionObject.set(
      'collectionObjectType',
      getResourceApiUrl('CollectionObjectType', 2)
    );
    await act(async () => {
      await collectionObject?.businessRuleManager?.checkField(
        'collectionObjectType'
      );
    });
    expect(result.current[0]).toStrictEqual([]);
  });

  // Uniqueness rule check
  overrideAjax(
    '/api/specify/collectionobject/?domainfilter=false&catalognumber=2022-%23%23%23%23%23%23&collection=4&offset=0',
    {
      objects: [],
      meta: {
        limit: 20,
        offset: 0,
        total_count: 0,
      },
    }
  );

  test('CollectionObject -> catalogNumber is reset whenever new CollectionObject -> collectionObjectType changes', async () => {
    const collectionObject = new tables.CollectionObject.Resource();
    expect(collectionObject.get('catalogNumber')).toBeUndefined();
    collectionObject.set(
      'collectionObjectType',
      getResourceApiUrl('CollectionObjectType', 2)
    );
    expect(collectionObject.get('catalogNumber')).toBe('2022-######');
    // Wait for any pending promise to complete before test finishes
    await collectionObject.businessRuleManager?.pendingPromise;
  });

  test('CollectionObject -> catalogNumber is not reset whenever existing CollectionObject -> collectionObjectType changes', async () => {
    const collectionObject = getBaseCollectionObject();
    const expectedCatNumber = '123';
    expect(collectionObject.get('catalogNumber')).toBe(expectedCatNumber);
    collectionObject.set(
      'collectionObjectType',
      getResourceApiUrl('CollectionObjectType', 2)
    );
    expect(collectionObject.get('catalogNumber')).toBe(expectedCatNumber);
    // Wait for any pending promise to complete before test finishes
    await collectionObject.businessRuleManager?.pendingPromise;
  });

  test('CollectionObject -> determinations: determinations on initializtion is current by default', () => {
    // We don't directly use the base because the determination is marked as current by default
    const collectionObject = new tables.CollectionObject.Resource({
      determinations: [
        {
          /*
           * We don't directly use IDs because then the determinations will not be 'new' and the
           * businessrule not executed
           */
          guid: '1',
        },
      ],
    });
    const determinations =
      collectionObject.getDependentResource('determinations');
    expect(determinations?.length).toBe(1);
    expect(determinations?.models[0].get('isCurrent')).toBe(true);
  });

  test('CollectionObject -> determinations: multiple determinations on intialization handled', () => {
    const collectionObject = new tables.CollectionObject.Resource({
      determinations: [
        {
          guid: '1',
        },
        {
          guid: '2',
        },
      ],
    });
    const determinations =
      collectionObject.getDependentResource('determinations');
    expect(determinations?.length).toBe(2);
    expect(determinations?.models[0]?.get('isCurrent')).toBe(false);
    expect(determinations?.models[1]?.get('isCurrent')).toBe(true);
  });

  test('CollectionObject -> determinations: Newly added determinations are current by default', async () => {
    const collectionObject = getBaseCollectionObject();
    const determinations =
      collectionObject.getDependentResource('determinations');

    determinations?.add(new tables.Determination.Resource());

    // Old determination gets unchecked as current
    expect(determinations?.models[0].get('isCurrent')).toBe(false);
    // New determination becomes current by default
    expect(determinations?.models[1].get('isCurrent')).toBe(true);
  });

  test('CollectionObject -> determinations: Save blocked when no current determinations exist', async () => {
    const collectionObject = getBaseCollectionObject();
    const determination =
      collectionObject.getDependentResource('determinations')?.models[0];

    determination?.set('isCurrent', false);

    const { result } = renderHook(() =>
      useSaveBlockers(
        collectionObject,
        tables.Determination.getField('isCurrent')
      )
    );

    await act(async () => {
      await determination?.businessRuleManager?.checkField('isCurrent');
    });

    expect(result.current[0]).toStrictEqual([
      'A current determination is required.',
    ]);
  });

  test('CollectionObject -> determinations: Save is not blocked when all determinations are deleted', async () => {
    const collectionObject = getBaseCollectionObject();
    const determinations =
      collectionObject.getDependentResource('determinations');
    const determination = determinations?.models[0];

    determinations?.remove(determination!);

    const { result } = renderHook(() =>
      useSaveBlockers(
        collectionObject,
        tables.Determination.getField('isCurrent')
      )
    );

    await act(async () => {
      await determination?.businessRuleManager?.checkField('isCurrent');
    });

    expect(result.current[0]).toStrictEqual([]);
  });
});

describe('CollectionObjectGroup business rules', () => {
  overrideAjax(getResourceApiUrl('CollectionObjectGroupType', 1), {
    name: 'Discrete type',
    type: cogTypes.DISCRETE,
  });

  overrideAjax(getResourceApiUrl('CollectionObjectGroupType', 2), {
    name: 'Consolidated type',
    type: cogTypes.CONSOLIDATED,
  });

  const getBaseCog = () => {
    const cog = new tables.CollectionObjectGroup.Resource({
      id: 1,
      cogType: getResourceApiUrl('CollectionObjectGroupType', 1),
      resource_uri: getResourceApiUrl('CollectionObjectGroup', 1),
    });

    const cojo1 = new tables.CollectionObjectGroupJoin.Resource({
      isPrimary: false,
      isSubstrate: true,
      childCo: getResourceApiUrl('CollectionObject', 1),
      parentCog: getResourceApiUrl('CollectionObjectGroup', 1),
    });
    const cojo2 = new tables.CollectionObjectGroupJoin.Resource({
      isPrimary: true,
      isSubstrate: false,
      childCo: getResourceApiUrl('CollectionObject', 2),
      parentCog: getResourceApiUrl('CollectionObjectGroup', 1),
    });

    cog.set('children', [cojo1, cojo2]);
    return { cog, cojo1, cojo2 };
  };

  test('Only one CO COJO can be primary', () => {
    const { cojo1, cojo2 } = getBaseCog();
    cojo1.set('isPrimary', true);

    expect(cojo1.get('isPrimary')).toBe(true);
    expect(cojo2.get('isPrimary')).toBe(false);
  });

  test('Only one CO COJO can be substrate', () => {
    const { cojo1, cojo2 } = getBaseCog();
    cojo2.set('isSubstrate', true);

    expect(cojo1.get('isSubstrate')).toBe(false);
    expect(cojo2.get('isSubstrate')).toBe(true);
  });

  test('Save blocked when a Consolidated COG has no primary CO child', async () => {
    const { cog, cojo2 } = getBaseCog();
    cog.set('cogType', getResourceApiUrl('CollectionObjectGroupType', 2));

    const { result } = renderHook(() =>
      useSaveBlockers(cog, tables.CollectionObjectGroupJoin.field.isPrimary)
    );

    await act(async () => {
      await cog?.businessRuleManager?.checkField('cogType');
    });

    // Save not blocked initially
    expect(result.current[0]).toStrictEqual([]);

    cojo2.set('isPrimary', false);
    await act(async () => {
      await cog?.businessRuleManager?.checkField('cogType');
    });

    // Save blocked after second child is marked as not primary
    expect(result.current[0]).toStrictEqual([
      resourcesText.primaryCogChildRequired(),
    ]);
  });
});

describe('Collecting Event', () => {
  test('Adding sole Collector sets isPrimary', () => {
    const collectingEvent = new tables.CollectingEvent.Resource();
    const collector = new tables.Collector.Resource();
    expect(collector.get('isPrimary')).toBeUndefined();
    collectingEvent.set('collectors', [collector]);
    expect(collector.get('isPrimary')).toBe(true);
    expect(
      collectingEvent
        .getDependentResource('collectors')
        ?.models[0]?.get('isPrimary')
    ).toBe(true);
  });
  test('Collector isPrimary set on initailization', () => {
    const collectingEvent = new tables.CollectingEvent.Resource({
      collectors: [
        {
          agent: getResourceApiUrl('Agent', 1),
        },
      ],
    });
    const collectors = collectingEvent.getDependentResource('collectors');
    expect(collectors?.length).toBe(1);
    expect(collectors?.models[0].get('isPrimary')).toBe(true);
  });
  test('Adding Collector to existing Collection does not override isPrimary', () => {
    const collectors: RA<SpecifyResource<Collector>> = [
      new tables.Collector.Resource({
        _tableName: 'Collector',
        agent: getResourceApiUrl('Agent', 1),
      }),
      new tables.Collector.Resource({
        _tableName: 'Collector',
        agent: getResourceApiUrl('Agent', 2),
      }),
    ];
    const collectingEvent = new tables.CollectingEvent.Resource({
      collectors: [collectors[0]],
    });
    collectingEvent.set('collectors', collectors);
    expect(collectors[0].get('isPrimary')).toBe(true);
    expect(
      collectingEvent
        .getDependentResource('collectors')
        ?.models[0]?.get('isPrimary')
    ).toBe(true);
    expect(collectors[1].get('isPrimary')).toBe(false);
    expect(
      collectingEvent
        .getDependentResource('collectors')
        ?.models[1]?.get('isPrimary')
    ).toBe(false);
  });
  test('Removing Collector sets first Collector as primary', () => {
    const collectingEvent = new tables.CollectingEvent.Resource({
      collectors: [
        {
          isPrimary: false,
          agent: getResourceApiUrl('Agent', 1),
        },
        {
          isPrimary: true,
          agent: getResourceApiUrl('Agent', 2),
        },
        {
          isPrimary: false,
          agent: getResourceApiUrl('Agent', 3),
        },
      ],
    });
    const collectors = collectingEvent.getDependentResource('collectors');
    const collectorToRemove = collectors?.models.find(
      (collector) => collector.get('agent') === getResourceApiUrl('Agent', 2)
    );
    expect(collectorToRemove).toBeDefined();
    collectors?.remove(collectorToRemove!);
    expect(collectors?.length).toBe(2);
    const firstCollector = collectors?.models.find(
      (collector) => collector.get('agent') === getResourceApiUrl('Agent', 1)
    );
    expect(firstCollector?.get('isPrimary')).toBe(true);
  });
});

describe('DNASequence business rules', () => {
  test('fieldCheck geneSequence', async () => {
    const dNASequence = new tables.DNASequence.Resource({
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

describe('Address business rules', () => {
  test('isPrimary being automatically set', () => {
    const agent = new tables.Agent.Resource();
    const address = new tables.Address.Resource();
    // Doing this initializes the DependentCollection
    agent.set('addresses', []);
    agent.getDependentResource('addresses')?.add(address);
    expect(address.get('isPrimary')).toBe(true);
  });
  test('only one isPrimary', () => {
    const agent = new tables.Agent.Resource();

    const address1 = new tables.Address.Resource({
      isPrimary: true,
    });
    const address2 = new tables.Address.Resource();

    agent.set('addresses', [address1, address2]);
    address2.set('isPrimary', true);

    expect(address1.get('isPrimary')).toBe(false);
    expect(address2.get('isPrimary')).toBe(true);
  });
});

describe('Determiner business rules', () => {
  test('isPrimary being automatically set', () => {
    const determination = new tables.Determination.Resource();
    const determiner = new tables.Determiner.Resource();
    // Doing this initializes the DependentCollection
    determination.set('determiners', []);
    determination.getDependentResource('determiners')?.add(determiner);

    expect(determiner.get('isPrimary')).toBe(true);
  });
  test('Only one is primary', () => {
    const determination = new tables.Determination.Resource();

    const determiner1 = new tables.Determiner.Resource({
      isPrimary: true,
    });
    const determiner2 = new tables.Determiner.Resource();

    determination.set('determiners', [determiner1, determiner2]);
    determiner2.set('isPrimary', true);

    expect(determiner1.get('isPrimary')).toBe(false);
    expect(determiner2.get('isPrimary')).toBe(true);
  });
});

describe('Funding Agent business rules', () => {
  test('isPrimary being automatically set', () => {
    const collectingTrip = new tables.CollectingTrip.Resource();
    const fundingAgent = new tables.FundingAgent.Resource();
    // Doing this initializes the DependentCollection
    collectingTrip.set('fundingAgents', []);

    collectingTrip.getDependentResource('fundingAgents')?.add(fundingAgent);

    expect(fundingAgent.get('isPrimary')).toBe(true);
  });
  test('Only one is primary', () => {
    const collectingTrip = new tables.CollectingTrip.Resource();

    const fundingAgent1 = new tables.FundingAgent.Resource({
      isPrimary: true,
    });
    const fundingAgent2 = new tables.FundingAgent.Resource();

    collectingTrip.set('fundingAgents', [fundingAgent1, fundingAgent2]);
    fundingAgent2.set('isPrimary', true);

    expect(fundingAgent1.get('isPrimary')).toBe(false);
    expect(fundingAgent2.get('isPrimary')).toBe(true);
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
    const collectionObject = new tables.CollectionObject.Resource({
      collection: '/api/specify/collection/4/',
      catalogNumber: '000000001',
    });
    await collectionObject.businessRuleManager?.checkField('catalogNumber');

    const { result } = renderHook(() =>
      useSaveBlockers(
        collectionObject,
        tables.CollectionObject.getField('catalogNumber')
      )
    );

    expect(result.current[0]).toStrictEqual([
      'Value must be unique to Collection',
    ]);
  });

  overrideAjax(getResourceApiUrl('Agent', 1), {
    id: 1,
    resource_uri: getResourceApiUrl('Agent', 1),
  });

  test('rule with local collection', async () => {
    const accessionId = 1;
    const accession = new tables.Accession.Resource({
      id: accessionId,
    });

    const accessionAgent1 = new tables.AccessionAgent.Resource({
      accession: getResourceApiUrl('Accession', accessionId),
      agent: getResourceApiUrl('Agent', 1),
      role: 'Borrower',
    });
    const accessionAgent2 = new tables.AccessionAgent.Resource({
      accession: getResourceApiUrl('Accession', accessionId),
      agent: getResourceApiUrl('Agent', 1),
      role: 'Borrower',
    });

    accession.set('accessionAgents', [accessionAgent1, accessionAgent2]);

    await accessionAgent2.businessRuleManager?.checkField('role');

    const { result } = renderHook(() =>
      useSaveBlockers(accessionAgent2, tables.AccessionAgent.getField('role'))
    );

    expect(result.current[0]).toStrictEqual([
      'Values of Role and Agent must be unique to Accession',
    ]);
  });
});

describe('treeBusinessRules', () => {
  const animaliaResponse: Partial<SerializedResource<Taxon>> = {
    _tableName: 'Taxon',
    id: 2,
    fullName: 'Animalia',
    parent: '/api/specify/taxon/1/',
    definition: '/api/specify/taxontreedef/1/',
    definitionItem: '/api/specify/taxontreedefitem/21/',
    rankId: 10,
  };
  const acipenserResponse: Partial<SerializedResource<Taxon>> = {
    _tableName: 'Taxon',
    id: 3,
    name: 'Acipenser',
    isAccepted: true,
    rankId: 180,
    definition: '/api/specify/taxontreedef/1/',
    definitionItem: '/api/specify/taxontreedefitem/9/',
    parent: '/api/specify/taxon/2/',
  };

  const husoResponse: Partial<SerializedResource<Taxon>> = {
    _tableName: 'Taxon',
    id: 6,
    name: 'Huso',
    isAccepted: false,
    rankId: 180,
    definition: '/api/specify/taxontreedef/1/',
    definitionItem: '/api/specify/taxontreedefitem/9/',
    parent: '/api/specify/taxon/2/',
  };

  const oxyrinchusSpeciesResponse: Partial<SerializedResource<Taxon>> = {
    _tableName: 'Taxon',
    id: 4,
    name: 'oxyrinchus',
    isAccepted: true,
    rankId: 220,
    definition: '/api/specify/taxontreedef/1/',
    definitionItem: '/api/specify/taxontreedefitem/2/',
    parent: '/api/specify/taxon/3/',
  };

  const oxyrinchusSubSpeciesResponse: Partial<SerializedResource<Taxon>> = {
    _tableName: 'Taxon',
    id: 5,
    rankId: 230,
    name: 'oxyrinchus',
    isAccepted: true,
    definition: '/api/specify/taxontreedef/1/',
    definitionItem: '/api/specify/taxontreedefitem/22/',
  };

  const genusResponse: Partial<SerializedResource<TaxonTreeDefItem>> = {
    _tableName: 'TaxonTreeDefItem',
    id: 9,
    fullNameSeparator: ' ',
    isEnforced: true,
    isInFullName: true,
    name: 'Genus',
    rankId: 180,
    title: 'Genus',
    parent: '/api/specify/taxontreedefitem/8/',
    treeDef: '/api/specify/taxontreedef/1/',
    resource_uri: '/api/specify/taxontreedefitem/9/',
  };

  const speciesResponse: Partial<SerializedResource<TaxonTreeDefItem>> = {
    id: 2,
    fullNameSeparator: ' ',
    isEnforced: false,
    isInFullName: true,
    name: 'Species',
    rankId: 220,
    title: null,
    version: 2,
    parent: '/api/specify/taxontreedefitem/15/',
    treeDef: '/api/specify/taxontreedef/1/',
    resource_uri: '/api/specify/taxontreedefitem/2/',
  };

  const subSpeciesResponse: Partial<SerializedResource<TaxonTreeDefItem>> = {
    id: 22,
    fullNameSeparator: ' ',
    isEnforced: false,
    isInFullName: true,
    name: 'Subspecies',
    rankId: 230,
    title: null,
    version: 0,
    parent: '/api/specify/taxontreedefitem/2/',
    treeDef: '/api/specify/taxontreedef/1/',
    resource_uri: '/api/specify/taxontreedefitem/22/',
  };

  const oxyrinchusFullNameResponse = 'Acipenser oxyrinchus';
  const dauricusFullNameResponse = 'Huso dauricus';

  overrideAjax('/api/specify/taxon/2/', animaliaResponse);
  overrideAjax('/api/specify/taxon/3/', acipenserResponse);
  overrideAjax('/api/specify/taxon/6/', husoResponse);
  overrideAjax('/api/specify/taxon/4/', oxyrinchusSpeciesResponse);
  overrideAjax('/api/specify/taxon/5/', oxyrinchusSubSpeciesResponse);
  overrideAjax('/api/specify/taxontreedefitem/9/', genusResponse);
  overrideAjax('/api/specify/taxontreedefitem/2/', speciesResponse);
  overrideAjax('/api/specify/taxontreedefitem/22/', subSpeciesResponse);
  overrideAjax(
    '/api/specify_tree/taxon/3/predict_fullname/?name=oxyrinchus&treedefitemid=2',
    oxyrinchusFullNameResponse
  );
  overrideAjax(
    '/api/specify_tree/taxon/6/predict_fullname/?name=dauricus&treedefitemid=2',
    dauricusFullNameResponse
  );
  overrideAjax('/api/specify/taxon/?limit=1&parent=4&orderby=rankid', {
    objects: [oxyrinchusSubSpeciesResponse],
    meta: {
      limit: 1,
      offset: 0,
      total_count: 1,
    },
  });

  test('fullName being set', async () => {
    const oxyrinchus = new tables.Taxon.Resource({
      _tableName: 'Taxon',
      id: 4,
    });
    await oxyrinchus.fetch();
    await oxyrinchus.businessRuleManager?.checkField('parent');
    expect(oxyrinchus.get('fullName')).toBe('Acipenser oxyrinchus');
  });

  test('parent blocking on invalid rank', async () => {
    const taxon = new tables.Taxon.Resource({
      name: 'Ameiurus',
      parent: '/api/specify/taxon/3/',
      rankid: 180,
      definition: '/api/specify/taxontreedef/1/',
      definitionitem: '/api/specify/taxontreedefitem/9/',
    });

    await taxon.businessRuleManager?.checkField('parent');

    const { result } = renderHook(() =>
      useSaveBlockers(taxon, tables.Taxon.getField('parent'))
    );
    expect(result.current[0]).toStrictEqual(['Bad tree structure.']);
  });

  test('parent blocking on invalid parent', async () => {
    const taxon = new tables.Taxon.Resource({
      name: 'Ameiurus',
      parent: '/api/specify/taxon/5/',
      rankid: 180,
      definition: '/api/specify/taxontreedef/1/',
      definitionitem: '/api/specify/taxontreedefitem/9/',
    });

    await taxon.businessRuleManager?.checkField('parent');

    const { result } = renderHook(() =>
      useSaveBlockers(taxon, tables.Taxon.getField('parent'))
    );
    expect(result.current[0]).toStrictEqual(['Bad tree structure.']);
  });
  test('saveBlocker on synonymized parent', async () => {
    const taxon = new tables.Taxon.Resource({
      name: 'dauricus',
      parent: '/api/specify/taxon/6/',
      rankId: 220,
      definition: '/api/specify/taxontreedef/1/',
      definitionItem: '/api/specify/taxontreedefitem/2/',
    });

    await taxon.businessRuleManager?.checkField('parent');

    const { result } = renderHook(() =>
      useSaveBlockers(taxon, tables.Taxon.getField('parent'))
    );
    expect(result.current[0]).toStrictEqual(['Bad tree structure.']);

    await taxon.businessRuleManager?.checkField('integer1');

    const { result: fieldChangeResult } = renderHook(() =>
      useSaveBlockers(taxon, tables.Taxon.getField('parent'))
    );
    expect(fieldChangeResult.current[0]).toStrictEqual(['Bad tree structure.']);
  });
  test('saveBlocker not on synonymized parent w/preference', async () => {
    const remotePrefs = await import('../../InitialContext/remotePrefs');
    jest
      .spyOn(remotePrefs, 'getPref')
      .mockImplementation((key) =>
        key === 'sp7.allow_adding_child_to_synonymized_parent.Taxon'
          ? true
          : getPref(key)
      );

    const taxon = new tables.Taxon.Resource({
      name: 'dauricus',
      parent: '/api/specify/taxon/6/',
      rankId: 220,
      definition: '/api/specify/taxontreedef/1/',
      definitionItem: '/api/specify/taxontreedefitem/2/',
    });

    await taxon.businessRuleManager?.checkField('parent');

    const { result } = renderHook(() =>
      useSaveBlockers(taxon, tables.Taxon.getField('parent'))
    );
    expect(result.current[0]).toStrictEqual([]);
  });
});

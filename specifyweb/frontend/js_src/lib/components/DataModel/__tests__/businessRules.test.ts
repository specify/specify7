import { act, renderHook } from '@testing-library/react';

import { overrideAjax } from '../../../tests/ajax';
import { mockTime, requireContext } from '../../../tests/helpers';
import { overwriteReadOnly } from '../../../utils/types';
import { getPref } from '../../InitialContext/remotePrefs';
import type { SerializedResource } from '../helperTypes';
import { getResourceApiUrl } from '../resource';
import { useSaveBlockers } from '../saveBlockers';
import { schema } from '../schema';
import { tables } from '../tables';
import type {
  CollectionObjectType,
  Determination,
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
    taxonTreeDef: getResourceApiUrl('Taxon', 1),
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
      collectionobjecttype: collectionObjectTypeUrl,
      determinations: [
        {
          taxon: getResourceApiUrl('Taxon', otherTaxonId),
          preferredTaxon: getResourceApiUrl('Taxon', otherTaxonId),
        } as SerializedResource<Determination>,
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
  });

  test('Save blocked when CollectionObjectType of a CollectionObject does not have same tree definition as its associated Determination -> taxon', async () => {
    const collectionObject = getBaseCollectionObject();

    const determination =
      collectionObject.getDependentResource('determinations')?.models[0];

    const { result } = renderHook(() =>
      useSaveBlockers(determination, tables.Determination.getField('taxon'))
    );

    await act(async () => {
      await determination?.businessRuleManager?.checkField('taxon');
    });

    expect(result.current[0]).toStrictEqual([
      'Taxon does not belong to the same tree as this Object Type',
    ]);
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
    taxonTreeDef: getResourceApiUrl('Taxon', 2),
    resource_uri: otherCollectionObjectTypeUrl,
  };
  overrideAjax(otherCollectionObjectTypeUrl, otherCollectionObjectType);

  test('CollectionObject determinations clear when CollectionObjectType changes', async () => {
    const collectionObject = getBaseCollectionObject();
    collectionObject.set('collectionObjectType', otherCollectionObjectTypeUrl);

    const determinations =
      collectionObject.getDependentResource('determinations');

    expect(determinations?.models.length).toBe(0);
  });

  test('CollectionObject simple fields clear when CollectionObjectType changes', async () => {
    const collectionObject = getBaseCollectionObject();
    collectionObject.set('collectionObjectType', otherCollectionObjectTypeUrl);

    // Catalog Number must get ignored when clearing
    expect(collectionObject.get('catalogNumber')).toBeDefined();
    expect(collectionObject.get('description')).toBeNull();
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

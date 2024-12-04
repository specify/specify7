import { requireContext } from '../../../tests/helpers';
import { fetchContext } from '../schema';

requireContext();

test('domain data is fetched and parsed correctly', async () =>
  expect(fetchContext).resolves.toEqual({
    catalogNumFormatName: 'CatalogNumberNumeric',
    collectionObjectTypeCatalogNumberFormats: {
      '/api/specify/collectionobjecttype/1/': null,
    },
    domainLevelIds: {
      collection: 4,
      discipline: 3,
      division: 2,
      institution: 1,
    },
    embeddedCollectingEvent: false,
    embeddedPaleoContext: true,
    defaultCollectionObjectType: '/api/specify/collectionobjecttype/1/',
    fieldPartSeparator: '-',
    orgHierarchy: [
      'CollectionObject',
      'Collection',
      'Discipline',
      'Division',
      'Institution',
    ],
    paleoContextChildTable: 'collectionobject',
    referenceSymbol: '#',
    treeRankSymbol: '$',
    treeDefinitionSymbol: '%',
  }));

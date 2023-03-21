import { requireContext } from '../../../tests/helpers';
import { removeKey } from '../../../utils/utils';
import { fetchContext } from '../schemaBase';

requireContext();

test('domain data is fetched and parsed correctly', async () => {
  const schema = await fetchContext;
  expect(removeKey(schema, 'models')).toEqual({
    catalogNumFormatName: 'CatalogNumberNumeric',
    domainLevelIds: {
      collection: 4,
      discipline: 3,
      division: 2,
      institution: 1,
    },
    embeddedCollectingEvent: false,
    embeddedPaleoContext: true,
    fieldPartSeparator: '-',
    orgHierarchy: [
      'CollectionObject',
      'Collection',
      'Discipline',
      'Division',
      'Institution',
    ],
    paleoContextChildTable: 'collectionobject',
    pathJoinSymbol: '.',
    referenceSymbol: '#',
    treeSymbol: '$',
  });
});

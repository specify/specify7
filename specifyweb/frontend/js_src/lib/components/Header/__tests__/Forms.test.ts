import { requireContext } from '../../../tests/helpers';
import { exportsForTests } from '../Forms';

const { fetchLegacyForms } = exportsForTests;

requireContext();

test('fetches and parses list of data entry forms', async () =>
  expect(fetchLegacyForms()).resolves.toEqual([
    {
      iconName: 'CollectionObject',
      table: 'CollectionObject',
      title: 'Collection Object',
    },
    {
      iconName: 'CollectingEvent',
      table: 'CollectingEvent',
      title: 'Collecting Event',
    },
    {
      iconName: 'Locality',
      table: 'Locality',
      title: 'Locality',
    },
    {
      iconName: 'Taxon',
      table: 'Taxon',
      title: 'Taxon',
    },
    {
      iconName: 'Agent',
      table: 'Agent',
      title: 'Agent',
    },
    {
      iconName: 'Geography',
      table: 'Geography',
      title: 'Geography',
    },
    {
      iconName: 'dnasequence',
      table: 'DNASequence',
      title: 'DNA Sequence',
    },
    {
      iconName: 'referencework',
      table: 'ReferenceWork',
      title: 'Reference Work',
    },
  ]));

import { requireContext } from '../../../tests/helpers';
import { exportsForTests } from '../fetch';

const { fetchLegacyForms } = exportsForTests;

requireContext();

test('fetches and parses list of data entry forms', async () =>
  expect(
    fetchLegacyForms().then((forms) => JSON.parse(JSON.stringify(forms)))
  ).resolves.toEqual([
    {
      icon: 'CollectionObject',
      table: '[table CollectionObject]',
      title: 'Collection Object',
    },
    {
      icon: 'CollectingEvent',
      table: '[table CollectingEvent]',
      title: 'Collecting Event',
    },
    {
      icon: 'Locality',
      table: '[table Locality]',
      title: 'Locality',
    },
    {
      icon: 'Taxon',
      table: '[table Taxon]',
      title: 'Taxon',
    },
    {
      icon: 'Agent',
      table: '[table Agent]',
      title: 'Agent',
    },
    {
      icon: 'Geography',
      table: '[table Geography]',
      title: 'Geography',
    },
    {
      icon: 'dnasequence',
      table: '[table DNASequence]',
      title: 'DNA Sequence',
    },
    {
      icon: 'referencework',
      table: '[table ReferenceWork]',
      title: 'Reference Work',
    },
  ]));

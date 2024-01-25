import { requireContext } from '../../../tests/helpers';
import { exportsForTests } from '../fetch';

const { fetchLegacyForms } = exportsForTests;

requireContext();

test('fetches and parses list of data entry forms', async () =>
  expect(
    fetchLegacyForms().then((forms) => forms.map(({ name }) => name))
  ).resolves.toEqual([
    'CollectionObject',
    'CollectingEvent',
    'Locality',
    'Taxon',
    'Agent',
    'Geography',
    'DNASequence',
    'ReferenceWork',
  ]));

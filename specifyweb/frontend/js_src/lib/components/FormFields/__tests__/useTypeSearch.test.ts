import { requireContext } from '../../../tests/helpers';
import { schema } from '../../DataModel/schema';
import { exportsForTests } from '../useTypeSearch';

requireContext();

const { parseTypeSearch } = exportsForTests;

test('parseTypeSearch', async () => {
  const parsed = await parseTypeSearch(schema.models.Accession, 'AccessionCO');
  const jsonParsed = JSON.parse(JSON.stringify(parsed));
  expect(jsonParsed).toEqual({
    dataObjectFormatter: undefined,
    relatedModel: '[table Accession]',
    searchFields: [['[literalField accessionNumber]']],
    title: 'Searched fields: Accession #',
  });
});

import { requireContext } from '../../../tests/helpers';
import { typeSearches } from '../useTypeSearch';

requireContext();

test('type searches are fetched and parsed correctly', async () =>
  expect(
    typeSearches.then((result) =>
      // Remove symbols
      JSON.parse(JSON.stringify(result))
    )
  ).resolves.toMatchSnapshot());

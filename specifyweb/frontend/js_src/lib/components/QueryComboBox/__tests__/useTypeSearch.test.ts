import { requireContext } from '../../../tests/helpers';
import { typeSearchesCustom } from '../useTypeSearch';

requireContext();

test('type searches are fetched and parsed correctly', async () =>
  expect(
    typeSearchesCustom.then((result) =>
      // Remove symbols
      JSON.parse(JSON.stringify(result))
    )
  ).resolves.toMatchSnapshot());

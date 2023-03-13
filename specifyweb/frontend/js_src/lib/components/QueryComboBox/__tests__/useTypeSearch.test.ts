import { requireContext } from '../../../tests/helpers';
import { typeSearches } from '../useTypeSearch';

requireContext();

test('type searches are fetched and parsed correctly', async () =>
  expect(typeSearches).resolves.toMatchSnapshot());

import { requireContext } from '../../../tests/helpers';
import { fetchFormatters } from '../dataObjFormatters';

requireContext();

test('formatters are fetched and parsed correctly', async () =>
  expect(fetchFormatters).resolves.toMatchSnapshot());

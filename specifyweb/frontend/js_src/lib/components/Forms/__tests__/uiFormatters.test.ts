import { requireContext } from '../../../tests/helpers';
import { fetchContext } from '../uiFormatters';

requireContext();

test('formatters are fetched and parsed correctly', async () =>
  expect(fetchContext).resolves.toMatchSnapshot());

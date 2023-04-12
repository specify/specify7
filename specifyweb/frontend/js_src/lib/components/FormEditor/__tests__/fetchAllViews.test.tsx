import { requireContext } from '../../../tests/helpers';
import { fetchAllViews } from '../fetchAllViews';

requireContext();

test('fetchAllViews', async () =>
  expect(fetchAllViews('Accession')).resolves.toMatchSnapshot());

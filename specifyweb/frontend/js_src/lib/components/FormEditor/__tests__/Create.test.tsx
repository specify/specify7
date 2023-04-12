import { fetchAllViews } from '../Create';

test('fetchAllViews', async () =>
  expect(fetchAllViews('CollectionObject')).resolves.toMatchSnapshot());

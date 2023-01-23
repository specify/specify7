import { requireContext } from '../../../tests/helpers';
import { searchDialogDefinitions } from '../index';

requireContext();

test('search dialog definitions are fetched and parsed correctly', async () =>
  expect(searchDialogDefinitions).resolves.toMatchSnapshot());

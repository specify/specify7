import { requireContext } from '../../../tests/helpers';
import { webLinks } from '../index';

requireContext();

test('weblinks are fetched and parsed correctly', async () =>
  expect(webLinks).resolves.toMatchSnapshot());

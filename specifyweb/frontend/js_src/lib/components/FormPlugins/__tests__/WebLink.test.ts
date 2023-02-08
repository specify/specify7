import { requireContext } from '../../../tests/helpers';
import { parseWebLink, webLinks } from '../WebLink';

requireContext();

test('weblinks are fetched and parsed correctly', async () => {
  const links = await webLinks;
  const parsed = Object.fromEntries(
    Object.entries(links).map(([name, definition]) => [
      name,
      parseWebLink(definition),
    ])
  );
  expect(parsed).toMatchSnapshot();
});

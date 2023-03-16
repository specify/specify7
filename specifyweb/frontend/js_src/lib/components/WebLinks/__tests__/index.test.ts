import { requireContext } from '../../../tests/helpers';
import { webLinks } from '../index';

requireContext();

test('weblinks are fetched and parsed correctly', async () =>
  expect(
    webLinks.then((webLinks) =>
      Object.fromEntries(
        webLinks.map((webLink) => [webLink.name, webLink] as const)
      )
    )
  ).resolves.toMatchSnapshot());

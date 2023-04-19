import { requireContext } from '../../../tests/helpers';
import { webLinks } from '../index';

requireContext();

test('weblinks are fetched and parsed correctly', async () =>
  expect(
    webLinks.then((webLinks) =>
      Object.fromEntries(
        webLinks.map(
          (webLink) =>
            [
              webLink.name,
              // Get rid of symbols
              JSON.parse(JSON.stringify(webLink)),
            ] as const
        )
      )
    )
  ).resolves.toMatchSnapshot());

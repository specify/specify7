import '../../tests/__mocks__/fonts';

import { getAvailableFonts } from '../fonts';

test('Unavailable fonts are filterd out', () => {
  expect(getAvailableFonts()).toMatchSnapshot();
});

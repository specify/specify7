import { requireContext } from '../../../tests/helpers';
import { theories } from '../../../tests/utils';
import { getIcon } from '../icons';

requireContext();

theories(getIcon, [
  {
    in: ['CollectionObject'],
    out: '/images/datamodel/collection_object.png',
  },
  {
    in: ['Reports'],
    out: '/images/Reports32x32.png',
  },
  {
    in: ['Reports32x32.png'],
    out: '/images/Reports32x32.png',
  },
]);

test('Unknown icon', () => {
  const consoleWarn = jest.fn();
  jest.spyOn(console, 'warn').mockImplementation(consoleWarn);
  expect(getIcon('unknownIcon')).toBeUndefined();
});

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
    in: ['unknownIcon'],
    out: undefined,
  },
]);

import { theories } from '../../../tests/utils';

import { applyStatBackendResponse } from '../hooks';
import { defaultLayoutTest } from './layout.tests';
import { f } from '../../../utils/functools';
import { formatNumber } from '../../Atoms/Internationalization';

const backEndResponse = {
  '/statistics/collection/preparations/': {
    'C&S': {
      lots: 1826,
      total: 8430,
    },
    EtOH: {
      lots: 41176,
      total: 525985,
    },
    Skel: {
      lots: 905,
      total: 1489,
    },
    Tissue: {
      lots: 10,
      total: 10,
    },
    'X-Ray': {
      lots: 460,
      total: 460,
    },
  },
  '/statistics/collection/type_specimens/': {
    Holotype: 19,
    Neotype: 1,
  },
};

export const statsPageTest = () => {
  theories(applyStatBackendResponse, [
    {
      in: [
        backEndResponse,
        defaultLayoutTest[0].categories[3].items,
        'collection',
        'type_specimens',
        'collection',
        (rawNumber: number | undefined) => f.maybe(rawNumber, formatNumber),
      ],
      out: [
        {
          type: 'DefaultStat',
          itemType: 'BackEndStat',
          pageName: 'collection',
          categoryName: 'type_specimens',
          itemName: 'phantomItem',
          label: 'Holotype',
          itemValue: 19,
          pathToValue: 'Holotype',
        },
        {
          type: 'DefaultStat',
          itemType: 'BackEndStat',
          pageName: 'collection',
          categoryName: 'type_specimens',
          itemName: 'phantomItem',
          label: 'Neotype',
          itemValue: 1,
          pathToValue: 'Neotype',
        },
      ],
    },
  ]);
};
